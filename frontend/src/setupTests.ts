// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

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