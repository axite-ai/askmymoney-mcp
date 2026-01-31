import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@askmymoney.app";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const BASE_STYLES = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    h1 { margin: 0; font-size: 28px; }
    h2 { color: #111827; font-size: 22px; margin-top: 0; }`;

/**
 * Wrap email body content in the shared HTML template structure.
 */
function emailTemplate(
  heading: string,
  body: string,
  footerNote: string,
  extraStyles?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${BASE_STYLES}${extraStyles ? `\n${extraStyles}` : ''}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${heading}</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>${footerNote}</p>
      <p>&copy; ${new Date().getFullYear()} AskMyMoney. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

const SIGN_OFF = `
      <p style="margin-top: 30px;">
        Best regards,<br>
        The AskMyMoney Team
      </p>`;

export type ItemAttentionType = 'error' | 'expiring' | 'pending_disconnect' | 'new_accounts';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const EmailService = {
  /**
   * Send an email using Resend
   */
  async sendEmail({ to, subject, html }: SendEmailOptions) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping email send");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });

      if (error) {
        console.error("Failed to send email:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Email service error:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmation(
    email: string,
    userName: string,
    planName: string
  ) {
    const subject = "Welcome to AskMyMoney! 🎉";

    const body = `
      <h2>Hi ${escapeHtml(userName)}! 👋</h2>
      <p>Thank you for subscribing to the <strong>${escapeHtml(planName)}</strong> plan. We're excited to help you take control of your finances with AI-powered insights.</p>

      <div class="next-steps">
        <h3 style="margin-top: 0;">Next Steps:</h3>
        <ol>
          <li><strong>Connect Your Bank Account</strong> - Link your financial accounts securely through Plaid to start getting insights</li>
          <li><strong>Ask Financial Questions</strong> - Use ChatGPT to ask about your balances, transactions, spending patterns, and more</li>
          <li><strong>Get Personalized Insights</strong> - Receive AI-powered recommendations to optimize your finances</li>
        </ol>
      </div>

      <p>When you return to your ChatGPT conversation, simply try using any financial tool and you'll be prompted to connect your bank account.</p>

      <p>If you have any questions or need assistance, just reply to this email - we're here to help!</p>
      ${SIGN_OFF}`;

    const extraStyles = `
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .next-steps { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .next-steps li { margin: 10px 0; }`;

    const html = emailTemplate(
      "Welcome to AskMyMoney!",
      body,
      "You're receiving this email because you subscribed to AskMyMoney.",
      extraStyles
    );

    return this.sendEmail({ to: email, subject, html });
  },

  /**
   * Send bank connection confirmation email
   */
  async sendBankConnectionConfirmation(
    email: string,
    userName: string,
    institutionName: string,
    isFirstAccount: boolean
  ) {
    const subject = isFirstAccount
      ? "Bank Account Connected Successfully! 🏦"
      : "New Bank Account Added! 🏦";

    const firstAccountSection = `
      <div class="features">
        <h3 style="margin-top: 0;">What You Can Do Now:</h3>
        <ul>
          <li><strong>Check Balances</strong> - Ask ChatGPT "What are my account balances?"</li>
          <li><strong>View Transactions</strong> - Ask "Show me my recent transactions"</li>
          <li><strong>Analyze Spending</strong> - Ask "What are my spending insights?"</li>
          <li><strong>Health Check</strong> - Ask "Check my account health"</li>
          <li><strong>Get Financial Tips</strong> - Ask for personalized advice</li>
        </ul>
      </div>`;

    const additionalAccountSection = `
      <p>You now have multiple accounts connected, giving you a more complete view of your financial picture across all your institutions.</p>`;

    const body = `
      <h2>Hi ${escapeHtml(userName)}! 👋</h2>
      <div class="success-badge">✓ Successfully Connected</div>
      <p><strong>${escapeHtml(institutionName)}</strong> has been ${isFirstAccount ? "connected" : "added"} to your AskMyMoney account.</p>

      ${isFirstAccount ? firstAccountSection : additionalAccountSection}

      <p>Your financial data is securely encrypted and only accessible by you. We use bank-level security to protect your information.</p>

      <p style="margin-top: 30px;">
        Ready to start?<br>
        Head back to ChatGPT and start asking questions about your finances!
      </p>
      ${SIGN_OFF}`;

    const extraStyles = `
    .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
    .features { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .features li { margin: 10px 0; }`;

    const html = emailTemplate(
      isFirstAccount ? "You're All Set!" : "Account Added!",
      body,
      "You're receiving this email because you connected a bank account to AskMyMoney.",
      extraStyles
    );

    return this.sendEmail({ to: email, subject, html });
  },

  /**
   * Send additional account added notification
   */
  async sendAdditionalAccountNotification(
    email: string,
    userName: string,
    institutionName: string
  ) {
    return this.sendBankConnectionConfirmation(
      email,
      userName,
      institutionName,
      false
    );
  },

  /**
   * Send email notification when a bank connection needs user attention
   */
  async sendItemAttentionEmail(
    email: string,
    userName: string,
    institutionName: string,
    attentionType: ItemAttentionType,
    details?: string
  ) {
    const safeInstitution = escapeHtml(institutionName);
    const safeDetails = details ? escapeHtml(details) : undefined;

    const typeConfig = {
      error: {
        subject: "Action Required: Bank Connection Issue",
        heading: "Connection Issue Detected",
        description: `We've detected an issue with your <strong>${safeInstitution}</strong> connection. Your bank requires you to sign in again to restore access.`,
        actionText: "Re-authenticate",
        badgeColor: "#ef4444",
        badgeText: "Action Required",
      },
      expiring: {
        subject: "Reminder: Bank Connection Expiring Soon",
        heading: "Connection Expiring Soon",
        description: `Your connection to <strong>${safeInstitution}</strong> will expire soon. Without renewal, we can no longer sync your financial data.`,
        actionText: "Renew Access",
        badgeColor: "#f59e0b",
        badgeText: "Expiring Soon",
      },
      pending_disconnect: {
        subject: "Notice: Bank Connection Will Disconnect",
        heading: "Connection Will Disconnect",
        description: `Your <strong>${safeInstitution}</strong> connection will be disconnected within the next 7 days${safeDetails ? ` (reason: ${safeDetails})` : ''}. Please renew your access to maintain your financial data.`,
        actionText: "Renew Access",
        badgeColor: "#f59e0b",
        badgeText: "Disconnecting Soon",
      },
      new_accounts: {
        subject: "New Accounts Available at Your Bank",
        heading: "New Accounts Detected",
        description: `We've detected new accounts at <strong>${safeInstitution}</strong> that you can add to AskMyMoney.`,
        actionText: "Add Accounts",
        badgeColor: "#3b82f6",
        badgeText: "New Accounts",
      },
    };

    const config = typeConfig[attentionType];

    const body = `
      <h2>Hi ${escapeHtml(userName)}! </h2>
      <div class="badge" style="background: ${config.badgeColor};">${config.badgeText}</div>
      <p style="margin-top: 16px;">${config.description}</p>

      <div class="steps">
        <h3 style="margin-top: 0;">How to fix this:</h3>
        <ol>
          <li>Open ChatGPT and start a conversation with AskMyMoney</li>
          <li>Type "manage my connected accounts" or ask about your finances</li>
          <li>Look for the <strong>${config.badgeText}</strong> badge on your ${safeInstitution} connection</li>
          <li>Click <strong>"${config.actionText}"</strong> to fix the issue</li>
        </ol>
      </div>

      <p>The process uses Plaid's secure authentication and only takes a moment.</p>
      ${SIGN_OFF}`;

    const extraStyles = `
    .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; color: white; font-size: 14px; font-weight: 600; }
    .steps { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .steps li { margin: 10px 0; }`;

    const html = emailTemplate(
      config.heading,
      body,
      "You're receiving this email because your bank connection needs attention.",
      extraStyles
    );

    return this.sendEmail({ to: email, subject: config.subject, html });
  },

  /**
   * Send a positive notification when a bank login has been repaired externally
   */
  async sendLoginRepairedEmail(
    email: string,
    userName: string,
    institutionName: string
  ) {
    const subject = "Good News: Bank Connection Restored";

    const body = `
      <h2>Hi ${escapeHtml(userName)}!</h2>
      <div class="badge" style="background: #10b981;">Connection Restored</div>
      <p style="margin-top: 16px;">Your <strong>${escapeHtml(institutionName)}</strong> connection is working again. No action needed &mdash; your financial data is syncing normally.</p>

      <p>If you previously received an alert about this connection, you can disregard it.</p>
      ${SIGN_OFF}`;

    const extraStyles = `
    .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; color: white; font-size: 14px; font-weight: 600; }`;

    const html = emailTemplate(
      "Connection Restored",
      body,
      "You're receiving this email because a previously reported bank connection issue has been resolved.",
      extraStyles
    );

    return this.sendEmail({ to: email, subject, html });
  },
};
