import { vi } from 'vitest';

/**
 * Create a mock MCP session for testing
 */
export const createMockMcpSession = (
  userId: string,
  overrides?: Record<string, unknown>
) => ({
  userId,
  sessionId: 'session_test_123',
  expiresAt: new Date(Date.now() + 3600000),
  createdAt: new Date(),
  ...overrides,
});

/**
 * Create a mock request object for testing
 */
export const createMockRequest = (options: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
} = {}) => {
  const {
    method = 'POST',
    url = 'http://localhost:3000/mcp',
    body = {},
    headers = {},
  } = options;

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  });
};

/**
 * Wait for async operations to complete
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract structured content from MCP response
 */
export const extractStructuredContent = (response: unknown): unknown => {
  if (
    response &&
    typeof response === 'object' &&
    'structuredContent' in response
  ) {
    return response.structuredContent;
  }
  return null;
};

/**
 * Extract error message from MCP response
 */
export const extractErrorMessage = (response: unknown): string | null => {
  if (
    response &&
    typeof response === 'object' &&
    'content' in response &&
    Array.isArray(response.content)
  ) {
    const textContent = response.content.find((c: any) => c.type === 'text');
    return textContent?.text || null;
  }
  return null;
};

/**
 * Mock environment variable for a test
 */
export const withEnvVar = (
  key: string,
  value: string,
  fn: () => void | Promise<void>
) => {
  const original = process.env[key];
  process.env[key] = value;
  try {
    return fn();
  } finally {
    if (original !== undefined) {
      process.env[key] = original;
    } else {
      delete process.env[key];
    }
  }
};

/**
 * Create a date range for testing (last N days)
 */
export const createDateRange = (
  daysAgo: number
): { start: string; end: string } => {
  const end = new Date();
  const start = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};
