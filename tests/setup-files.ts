import '@testing-library/jest-dom';

// Filter out console warnings in tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args: any[]) => {
    // Filter out harmless warnings
    const message = args.join(' ');
    if (
      message.includes('permission denied') ||
      message.includes('does not exist') ||
      message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: ReactDOMTestUtils.act is deprecated')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    // Filter out harmless errors
    const message = args.join(' ');
    if (
      message.includes('permission denied') ||
      message.includes('does not exist') ||
      message.includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});




