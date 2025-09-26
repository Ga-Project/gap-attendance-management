import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoginPage from '../LoginPage';
import { AuthContext } from '../../contexts/AuthContext';

const theme = createTheme();

const mockAuthContextValue = {
  user: null,
  signIn: jest.fn(),
  signOut: jest.fn(),
  loading: false,
  isAuthenticated: false,
      error: null,
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={mockAuthContextValue}>
          {component}
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>,
  );
};

// Mock gapi-script
const mockGapi = {
  load: jest.fn(),
  auth2: {
    init: jest.fn(() => Promise.resolve()),
    getAuthInstance: jest.fn(() => ({
      signIn: jest.fn(() => Promise.resolve({
        getAuthResponse: () => ({
          id_token: 'mock-id-token',
        }),
      })),
    })),
  },
};

// Mock the gapi global
(global as any).gapi = mockGapi;

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login page correctly', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText('勤怠管理システム')).toBeInTheDocument();
    expect(screen.getByText('ログイン')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /googleでサインイン/i })).toBeInTheDocument();
  });

  it('shows loading state when authentication is loading', () => {
    const loadingContext = {
      ...mockAuthContextValue,
      loading: true,
    };

    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthContext.Provider value={loadingContext}>
            <LoginPage />
          </AuthContext.Provider>
        </ThemeProvider>
      </BrowserRouter>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles Google sign in button click', async () => {
    mockGapi.load.mockImplementation((api: string, options: any) => {
      if (options.callback) {
        options.callback();
      }
    });

    mockGapi.auth2.getAuthInstance.mockReturnValue({
      signIn: jest.fn(() => Promise.resolve({
        getAuthResponse: () => ({
          id_token: 'mock-id-token',
        }),
      })),
    });

    renderWithProviders(<LoginPage />);

    const signInButton = screen.getByRole('button', { name: /googleでサインイン/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockAuthContextValue.signIn).toHaveBeenCalled();
    });
  });

  it('handles Google sign in error', async () => {
    const errorContext = {
      ...mockAuthContextValue,
      signIn: jest.fn().mockRejectedValue(new Error('Sign in failed')),
    };

    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthContext.Provider value={errorContext}>
            <LoginPage />
          </AuthContext.Provider>
        </ThemeProvider>
      </BrowserRouter>,
    );

    const signInButton = screen.getByRole('button', { name: /googleでサインイン/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('ログインに失敗しました。もう一度お試しください。')).toBeInTheDocument();
    });
  });



  it('disables sign in button while signing in', async () => {
    mockGapi.load.mockImplementation((api: string, options: any) => {
      if (options.callback) {
        options.callback();
      }
    });

    // Mock a slow sign in process
    mockGapi.auth2.getAuthInstance.mockReturnValue({
      signIn: jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000))),
    });

    renderWithProviders(<LoginPage />);

    const signInButton = screen.getByRole('button', { name: /googleでサインイン/i });
    fireEvent.click(signInButton);

    // Button should be disabled while signing in
    expect(signInButton).toBeDisabled();
    expect(screen.getByText('サインイン中...')).toBeInTheDocument();
  });

  it('redirects authenticated user', () => {
    const authenticatedContext = {
      ...mockAuthContextValue,
      user: {
        id: 'id: 1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'employee' as const,
      },
      isAuthenticated: true,
      error: null,
    };

    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthContext.Provider value={authenticatedContext}>
            <LoginPage />
          </AuthContext.Provider>
        </ThemeProvider>
      </BrowserRouter>,
    );

    // Should not render login content for authenticated users
    expect(screen.queryByText('ログイン')).not.toBeInTheDocument();
  });

  it('displays Googleアカウントを使用してサインインしてください message', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText('Googleアカウントを使用してサインインしてください')).toBeInTheDocument();
  });
});