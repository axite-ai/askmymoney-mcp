/**
 * Item Deletion Service
 *
 * Handles Plaid item deletion with rate limiting (1 deletion per user per month).
 * Implements soft delete strategy and maintains audit trail.
 */

import { db } from '@/lib/db';
import { plaidItems, plaidItemDeletions, user } from '@/lib/db/schema';
import { eq, and, gte, desc, inArray, ne } from 'drizzle-orm';
import { logger } from './logger-service';
import { plaidClient } from './plaid-service';
import { EncryptionService } from './encryption-service';
import { EmailService } from './email-service';

const DELETION_RATE_LIMIT_DAYS = 30;

export interface DeletionInfo {
  canDelete: boolean;
  lastDeletionDate?: string;
  daysUntilNext?: number;
}

export class ItemDeletionService {
  /**
   * Check if user can delete an item (rate limit: 1 deletion per 30 days)
   */
  public static async canUserDeleteItem(userId: string): Promise<boolean> {
    const thirtyDaysAgo = new Date(Date.now() - DELETION_RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000);

    const recentDeletions = await db
      .select()
      .from(plaidItemDeletions)
      .where(
        and(
          eq(plaidItemDeletions.userId, userId),
          gte(plaidItemDeletions.deletedAt, thirtyDaysAgo)
        )
      );

    return recentDeletions.length === 0;
  }

  /**
   * Get deletion information for a user
   */
  public static async getDeletionInfo(userId: string): Promise<DeletionInfo> {
    const thirtyDaysAgo = new Date(Date.now() - DELETION_RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000);

    const [lastDeletion] = await db
      .select()
      .from(plaidItemDeletions)
      .where(eq(plaidItemDeletions.userId, userId))
      .orderBy(desc(plaidItemDeletions.deletedAt))
      .limit(1);

    if (!lastDeletion || lastDeletion.deletedAt < thirtyDaysAgo) {
      return { canDelete: true };
    }

    const nextAllowedDate = new Date(lastDeletion.deletedAt);
    nextAllowedDate.setDate(nextAllowedDate.getDate() + DELETION_RATE_LIMIT_DAYS);

    const daysUntilNext = Math.ceil(
      (nextAllowedDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );

    return {
      canDelete: false,
      lastDeletionDate: lastDeletion.deletedAt.toISOString(),
      daysUntilNext,
    };
  }

  /**
   * Record deletion in audit log
   */
  private static async recordDeletion(
    userId: string,
    itemId: string,
    institutionId: string | null,
    institutionName: string | null,
    reason: string = 'user_initiated'
  ): Promise<void> {
    await db.insert(plaidItemDeletions).values({
      userId,
      itemId,
      institutionId,
      institutionName,
      deletedAt: new Date(),
      reason,
    });

    logger.info('[ItemDeletion] Recorded deletion', {
      userId,
      itemId,
      institutionName,
      reason,
    });
  }

  /**
   * Delete item with rate limit check
   * Implements soft delete and calls Plaid /item/remove API
   */
  public static async deleteItemWithRateLimit(
    userId: string,
    itemDbId: string
  ): Promise<void> {
    // 1. Check rate limit
    const canDelete = await this.canUserDeleteItem(userId);
    if (!canDelete) {
      const info = await this.getDeletionInfo(userId);
      throw new Error(
        `Deletion rate limit exceeded. You can delete another item in ${info.daysUntilNext} days.`
      );
    }

    // 2. Get item details for audit log
    const [item] = await db
      .select()
      .from(plaidItems)
      .where(and(eq(plaidItems.userId, userId), eq(plaidItems.id, itemDbId)))
      .limit(1);

    if (!item) {
      throw new Error('Item not found or does not belong to user');
    }

    // Check if item is already deleted
    if (item.status === 'deleted') {
      throw new Error('Item is already deleted');
    }

    // 3. Call Plaid /item/remove API
    try {
      const accessToken = EncryptionService.decrypt(item.accessToken);
      await plaidClient.itemRemove({ access_token: accessToken });
      logger.info('[ItemDeletion] Plaid item removed via API', {
        userId,
        itemId: item.itemId,
      });
    } catch (error) {
      // Log but continue - item may already be removed or access revoked
      logger.warn('[ItemDeletion] Plaid item removal failed (continuing with soft delete)', {
        userId,
        itemId: item.itemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // 4. Soft delete in DB (set status to 'deleted', record deletedAt)
    await db
      .update(plaidItems)
      .set({
        status: 'deleted',
        deletedAt: new Date(),
      })
      .where(eq(plaidItems.id, itemDbId));

    // 5. Record in audit log
    await this.recordDeletion(
      userId,
      item.itemId,
      item.institutionId,
      item.institutionName,
      'user_initiated'
    );

    logger.info('[ItemDeletion] Item soft deleted successfully', {
      userId,
      itemId: item.itemId,
      institutionName: item.institutionName,
    });

    // 6. Send disconnection email notification (non-blocking)
    if (item.institutionName) {
      this.sendDisconnectionEmail(userId, item.institutionName).catch(() => {});
    }

    // 7. Webhook WEBHOOK_UPDATE_ACKNOWLEDGED will be received to confirm deletion
  }

  /**
   * Send a disconnection confirmation email to the user (best-effort).
   */
  private static async sendDisconnectionEmail(
    userId: string,
    institutionName: string
  ): Promise<void> {
    const [userDetails] = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userDetails?.email) return;

    try {
      await EmailService.sendBankDisconnectionConfirmation(
        userDetails.email,
        userDetails.name || 'there',
        institutionName
      );
    } catch (error) {
      logger.warn('[ItemDeletion] Failed to send disconnection email', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete all items for a user (bulk offboarding).
   * Calls Plaid /item/remove on each, soft deletes in DB, records audit entries.
   * Skips rate limiting since this is system-initiated.
   */
  public static async deleteAllUserItems(
    userId: string,
    reason: string
  ): Promise<{ processed: number; failures: string[] }> {
    // 1. Get all non-deleted items
    const items = await db
      .select()
      .from(plaidItems)
      .where(
        and(
          eq(plaidItems.userId, userId),
          ne(plaidItems.status, 'deleted')
        )
      );

    if (items.length === 0) {
      return { processed: 0, failures: [] };
    }

    const failures: string[] = [];

    // 2. Call Plaid /item/remove for each item
    for (const item of items) {
      try {
        const accessToken = EncryptionService.decrypt(item.accessToken);
        await plaidClient.itemRemove({ access_token: accessToken });
        logger.info('[ItemDeletion] Plaid item removed (bulk)', {
          userId,
          itemId: item.itemId,
        });
      } catch (error) {
        // Log and continue - don't let one failure block the rest
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('[ItemDeletion] Plaid item removal failed (bulk, continuing)', {
          userId,
          itemId: item.itemId,
          error: msg,
        });
        failures.push(`${item.institutionName || item.itemId}: ${msg}`);
      }
    }

    // 3. Soft delete all items in one DB update
    const itemIds = items.map(i => i.id);
    await db
      .update(plaidItems)
      .set({
        status: 'deleted',
        deletedAt: new Date(),
      })
      .where(inArray(plaidItems.id, itemIds));

    // 4. Record audit entries in batch
    await db.insert(plaidItemDeletions).values(
      items.map(item => ({
        userId,
        itemId: item.itemId,
        institutionId: item.institutionId,
        institutionName: item.institutionName,
        deletedAt: new Date(),
        reason,
      }))
    );

    logger.info('[ItemDeletion] Bulk deletion complete', {
      userId,
      processed: items.length,
      failures: failures.length,
      reason,
    });

    return { processed: items.length, failures };
  }

  /**
   * Get all deleted items for a user (for audit purposes)
   */
  public static async getUserDeletedItems(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(plaidItemDeletions)
      .where(eq(plaidItemDeletions.userId, userId))
      .orderBy(desc(plaidItemDeletions.deletedAt));
  }

  /**
   * Get deletion count for a user in the last N days
   */
  public static async getDeletionCount(userId: string, days: number = 30): Promise<number> {
    const nDaysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const deletions = await db
      .select()
      .from(plaidItemDeletions)
      .where(
        and(
          eq(plaidItemDeletions.userId, userId),
          gte(plaidItemDeletions.deletedAt, nDaysAgo)
        )
      );

    return deletions.length;
  }
}
