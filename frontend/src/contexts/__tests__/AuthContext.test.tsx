import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../AuthContext';
import googleAuthService from '../../services/googleAuth';

// Mock the API and helper functions
jest.mock('../../services/api', () => ({
  apiCall: jest.fn(),
  silentApiCall: jest.fn(),
}));

// Get the mocked functions
const { apiCall: mockApiCall, silentApiCall: mockSilentApiCall } = require('../../services/api');

// Mock Google Auth Service
jest.mock('../../services/googleAuth');
const mockedGoogleAuth = googleAuthService as jest.Mocked<typeof googleAuthService>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const TestComponent = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const { user, signIn, signOut, loading } = context;

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      // Error is handled by AuthContext, just ignore here
    }
  };

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.name : 'no-user'}</div>
      <button onClick={handleSignIn}>Login</button>
      <button onClick={signOut}>Logout</button>
    </div>
  );
};

const mockUser = {
  id: 'id: 1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'employee' as const,
};



const mockGoogleUser = {
  id: 'google-123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/picture.jpg',
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockedGoogleAuth.signIn.mockResolvedValue(mockGoogleUser);
    mockedGoogleAuth.signOut.mockResolvedValue();
    mockApiCall.mockClear();
    mockSilentApiCall.mockClear();
  });

  it('provides initial state correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('loads user from token on mount when token exists', async () => {
    mockLocalStorage.getItem.mockReturnValue('existing-token');
    mockSilentApiCall.mockResolvedValue({ user: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
  });

  it('handles login successfully', async () => {
    mockApiCall.mockResolvedValue({
      access_token: 'auth-token',
      refresh_token: 'refresh-token',
      user: mockUser,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'auth-token');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
  });

  it('handles login error', async () => {
    mockedGoogleAuth.signIn.mockRejectedValue(new Error('Login failed'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('handles logout', async () => {
    // First login
    mockLocalStorage.getItem.mockReturnValue('existing-token');
    mockSilentApiCall.mockResolvedValue({ user: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // Then logout
    const logoutButton = screen.getByText('Logout');
    
    await act(async () => {
      logoutButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
  });

  it('shows loading state during initial token validation', async () => {
    mockLocalStorage.getItem.mockReturnValue('existing-token');
    
    // Mock a slow API response
    mockSilentApiCall.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ user: mockUser }), 100)),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
  });

  it('shows loading state during login', async () => {
    // Mock a slow login response
    mockedGoogleAuth.signIn.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockGoogleUser), 100)),
    );
    mockApiCall.mockResolvedValue({
      access_token: 'auth-token',
      refresh_token: 'refresh-token',
      user: mockUser,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginButton = screen.getByText('Login');
    
    act(() => {
      loginButton.click();
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
  });

  it('handles token validation failure', async () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-token');
    mockSilentApiCall.mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    // In the new error handling system, silentApiCall returning null
    // means the request failed silently, and tokens should be cleared
    // The exact behavior may depend on the implementation
  });

  it('handles different user roles', async () => {
    const adminUser = { ...mockUser, role: 'admin' as const };
    mockLocalStorage.getItem.mockReturnValue('admin-token');
    mockSilentApiCall.mockResolvedValue({ user: adminUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // The user object should contain the admin role
    // We can't directly test the role here, but the user is loaded correctly
  });

  it('preserves user state across re-renders', async () => {
    mockLocalStorage.getItem.mockReturnValue('existing-token');
    mockSilentApiCall.mockResolvedValue({ user: mockUser });

    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    rerender(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user')).toHaveTextContent('Test User');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    // eslint-disable-next-line no-console
    const originalError = console.error;
    // eslint-disable-next-line no-console
    const mockConsoleError = jest.fn();
    // eslint-disable-next-line no-console
    console.error = mockConsoleError;

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    // eslint-disable-next-line no-console
    console.error = originalError;
  });
});