// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Suppress React act() warnings and DOM nesting warnings in tests
// eslint-disable-next-line no-console
const originalError = console.error;
beforeAll(() => {
  // eslint-disable-next-line no-console
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: `ReactDOMTestUtils.act`') ||
       args[0].includes('Warning: validateDOMNesting') ||
       args[0].includes('The above error occurred in the'))
    ) {
      return;
    }
    // Allow intentional test error messages to pass through
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  // eslint-disable-next-line no-console
  console.error = originalError;
});

// Mock URL.createObjectURL and revokeObjectURL for file download tests
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock gapi-script for testing
jest.mock('gapi-script', () => ({
    gapi: {
        load: jest.fn((api: string, options: any) => {
            if (options.callback) {
                options.callback();
            }
        }),
        auth2: {
            init: jest.fn(() => Promise.resolve()),
            getAuthInstance: jest.fn(() => ({
                isSignedIn: {
                    get: jest.fn(() => false),
                },
                signIn: jest.fn(() => Promise.resolve({
                    getBasicProfile: () => ({
                        getId: () => 'test-id',
                        getEmail: () => 'test@example.com',
                        getName: () => 'Test User',
                        getImageUrl: () => 'test-image-url',
                    }),
                })),
                signOut: jest.fn(() => Promise.resolve()),
                currentUser: {
                    get: jest.fn(() => ({
                        getBasicProfile: () => ({
                            getId: () => 'test-id',
                            getEmail: () => 'test@example.com',
                            getName: () => 'Test User',
                            getImageUrl: () => 'test-image-url',
                        }),
                    })),
                },
            })),
        },
    },
}));