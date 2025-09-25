import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoginPage from '../LoginPage';
import { AuthContext } from '../../contexts/AuthContext';

const theme = createTheme();

const mockAuthContextValue = {
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
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
    expect(screen.getByText('Googleアカウントでログイン')).toBeInTheDocument();
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
      expect(mockAuthContextValue.login).toHaveBeenCalledWith('mock-id-token');
    });
  });

  it('handles Google sign in error', async () => {
    mockGapi.load.mockImplementation((api: string, options: any) => {
      if (options.callback) {
        options.callback();
      }
    });

    mockGapi.auth2.getAuthInstance.mockReturnValue({
      signIn: jest.fn(() => Promise.reject(new Error('Sign in failed'))),
    });

    renderWithProviders(<LoginPage />);

    const signInButton = screen.getByRole('button', { name: /googleでサインイン/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('ログインに失敗しました。再度お試しください。')).toBeInTheDocument();
    });
  });

  it('shows error message when gapi fails to load', async () => {
    mockGapi.load.mockImplementation((api: string, options: any) => {
      if (options.onerror) {
        options.onerror();
      }
    });

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Google認証の初期化に失敗しました。')).toBeInTheDocument();
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
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'employee' as const,
      },
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
    expect(screen.queryByText('Googleアカウントでログイン')).not.toBeInTheDocument();
  });

  it('displays system features', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText('出勤・退勤・休憩の打刻')).toBeInTheDocument();
    expect(screen.getByText('個人勤怠実績の確認')).toBeInTheDocument();
    expect(screen.getByText('管理者による勤怠管理')).toBeInTheDocument();
  });
});