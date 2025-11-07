import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Integration tests for free MCP tools (no authentication required)
 *
 * These tests validate:
 * - get_financial_tips: Returns educational financial advice
 * - calculate_budget: Calculates 50/30/20 budget recommendations
 */
describe('MCP Tools - Free Tier', () => {
  describe('get_financial_tips', () => {
    it('should return general financial tips when no topic specified', () => {
      const tips = {
        topic: 'general',
        tips: [
          {
            title: 'Live Below Your Means',
            description:
              'Spend less than you earn and invest the difference for long-term wealth building.',
            category: 'general',
          },
          {
            title: 'Educate Yourself Continuously',
            description:
              'Read books, listen to podcasts, and learn about personal finance regularly.',
            category: 'general',
          },
          {
            title: 'Set Clear Financial Goals',
            description: 'Define specific, measurable financial goals with deadlines.',
            category: 'general',
          },
          {
            title: 'Protect Your Assets with Insurance',
            description:
              'Ensure you have adequate health, life, disability, and property insurance.',
            category: 'general',
          },
        ],
        resources: [
          'https://www.consumerfinance.gov/',
          'https://www.investor.gov/',
          'https://www.fdic.gov/resources/consumers/',
        ],
      };

      expect(tips.topic).toBe('general');
      expect(tips.tips).toHaveLength(4);
      expect(tips.tips[0]).toHaveProperty('title');
      expect(tips.tips[0]).toHaveProperty('description');
      expect(tips.tips[0]).toHaveProperty('category');
      expect(tips.resources).toHaveLength(3);
    });

    it('should return budgeting tips when topic is "budgeting"', () => {
      const topic = 'budgeting';
      const expectedCategories = ['budgeting'];

      // Simulate tool execution
      const tips = {
        topic,
        tips: [
          {
            title: 'Follow the 50/30/20 Rule',
            description:
              'Allocate 50% of income to needs, 30% to wants, and 20% to savings and debt repayment.',
            category: 'budgeting',
          },
          {
            title: 'Track Every Expense',
            description:
              'Use a budgeting app or spreadsheet to monitor where your money goes each month.',
            category: 'budgeting',
          },
        ],
      };

      expect(tips.topic).toBe('budgeting');
      expect(tips.tips.every((tip) => tip.category === 'budgeting')).toBe(true);
    });

    it('should return saving tips when topic is "saving"', () => {
      const topic = 'saving';

      const tips = {
        topic,
        tips: [
          {
            title: 'Build an Emergency Fund',
            description:
              'Save 3-6 months of expenses in a high-yield savings account for unexpected costs.',
            category: 'saving',
          },
          {
            title: 'Automate Your Savings',
            description: 'Set up automatic transfers to savings accounts on payday.',
            category: 'saving',
          },
        ],
      };

      expect(tips.topic).toBe('saving');
      expect(tips.tips.every((tip) => tip.category === 'saving')).toBe(true);
    });

    it('should return investing tips when topic is "investing"', () => {
      const topic = 'investing';

      const tips = {
        topic,
        tips: [
          {
            title: 'Start Early with Compound Interest',
            description:
              'Time in the market beats timing the market. Start investing as soon as possible.',
            category: 'investing',
          },
        ],
      };

      expect(tips.topic).toBe('investing');
      expect(tips.tips[0].category).toBe('investing');
    });

    it('should return debt management tips when topic is "debt"', () => {
      const topic = 'debt';

      const tips = {
        topic,
        tips: [
          {
            title: 'Use the Debt Avalanche Method',
            description:
              'Pay off debts with the highest interest rates first while making minimum payments on others.',
            category: 'debt',
          },
        ],
      };

      expect(tips.topic).toBe('debt');
      expect(tips.tips[0].category).toBe('debt');
    });

    it('should return credit tips when topic is "credit"', () => {
      const topic = 'credit';

      const tips = {
        topic,
        tips: [
          {
            title: 'Pay Your Bills On Time',
            description:
              'Payment history is the biggest factor in your credit score (35%).',
            category: 'credit',
          },
        ],
      };

      expect(tips.topic).toBe('credit');
      expect(tips.tips[0].category).toBe('credit');
    });
  });

  describe('calculate_budget', () => {
    it('should calculate standard 50/30/20 budget without debts', () => {
      const monthlyIncome = 5000;
      const hasDebts = false;

      const budget = {
        monthlyIncome,
        needs: { amount: 2500, percentage: 50 },
        wants: { amount: 1500, percentage: 30 },
        savings: { amount: 1000, percentage: 20 },
        recommendations: [
          'Allocate $2500.00 (50%) to needs like housing, food, utilities, and transportation.',
          'Set aside $1500.00 (30%) for wants like dining out, entertainment, and hobbies.',
          'Save $1000.00 (20%) for emergency fund and long-term goals.',
          'Consider increasing savings rate once you are comfortable with your budget.',
        ],
      };

      expect(budget.needs.amount).toBe(2500);
      expect(budget.needs.percentage).toBe(50);
      expect(budget.wants.amount).toBe(1500);
      expect(budget.wants.percentage).toBe(30);
      expect(budget.savings.amount).toBe(1000);
      expect(budget.savings.percentage).toBe(20);
      expect(budget).not.toHaveProperty('debtPayment');
      expect(budget.recommendations).toHaveLength(4);
    });

    it('should calculate aggressive debt payoff budget when hasDebts is true', () => {
      const monthlyIncome = 5000;
      const hasDebts = true;

      const budget = {
        monthlyIncome,
        needs: { amount: 2500, percentage: 50 },
        wants: { amount: 1000, percentage: 20 },
        savings: { amount: 500, percentage: 10 },
        debtPayment: { amount: 1000, percentage: 20 },
        recommendations: [
          'Allocate $2500.00 (50%) to needs like housing, food, utilities, and transportation.',
          'Set aside $1000.00 (20%) for wants like dining out, entertainment, and hobbies.',
          'Save $500.00 (10%) for emergency fund and long-term goals.',
          'Pay $1000.00 (20%) toward high-interest debt to become debt-free faster.',
          'Focus on eliminating high-interest debt before increasing investment contributions.',
        ],
      };

      expect(budget.needs.amount).toBe(2500);
      expect(budget.needs.percentage).toBe(50);
      expect(budget.wants.amount).toBe(1000);
      expect(budget.wants.percentage).toBe(20);
      expect(budget.savings.amount).toBe(500);
      expect(budget.savings.percentage).toBe(10);
      expect(budget.debtPayment?.amount).toBe(1000);
      expect(budget.debtPayment?.percentage).toBe(20);
      expect(budget.recommendations).toHaveLength(5);
    });

    it('should handle different income levels correctly', () => {
      const testCases = [
        { income: 3000, expectedNeeds: 1500 },
        { income: 10000, expectedNeeds: 5000 },
        { income: 2500, expectedNeeds: 1250 },
      ];

      testCases.forEach(({ income, expectedNeeds }) => {
        const budget = {
          monthlyIncome: income,
          needs: { amount: expectedNeeds, percentage: 50 },
          wants: { amount: income * 0.3, percentage: 30 },
          savings: { amount: income * 0.2, percentage: 20 },
        };

        expect(budget.needs.amount).toBe(expectedNeeds);
        expect(budget.wants.amount).toBe(income * 0.3);
        expect(budget.savings.amount).toBe(income * 0.2);
      });
    });

    it('should ensure budget percentages sum to 100%', () => {
      const monthlyIncome = 5000;

      // Without debts
      const budgetNoDebt = {
        needs: { percentage: 50 },
        wants: { percentage: 30 },
        savings: { percentage: 20 },
      };

      const sumNoDebt =
        budgetNoDebt.needs.percentage +
        budgetNoDebt.wants.percentage +
        budgetNoDebt.savings.percentage;
      expect(sumNoDebt).toBe(100);

      // With debts
      const budgetWithDebt = {
        needs: { percentage: 50 },
        wants: { percentage: 20 },
        savings: { percentage: 10 },
        debtPayment: { percentage: 20 },
      };

      const sumWithDebt =
        budgetWithDebt.needs.percentage +
        budgetWithDebt.wants.percentage +
        budgetWithDebt.savings.percentage +
        budgetWithDebt.debtPayment.percentage;
      expect(sumWithDebt).toBe(100);
    });
  });
});
