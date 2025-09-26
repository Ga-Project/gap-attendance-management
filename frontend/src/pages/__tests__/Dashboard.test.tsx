import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from '../Dashboard';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the TimeClockWidget component
jest.mock('../../components/TimeClockWidget', () => {
  const mockReact = require('react');
  return function MockTimeClockWidget({ onAttendanceUpdate }: any) {
    mockReact.useEffect(() => {
      if (onAttendanceUpdate) {
        onAttendanceUpdate({
          attendance: {
            id: 1,
            date: '2025-01-15',
            status: 'clocked_in',
            clock_in_time: '2025-01-15T09:00:00Z',
            total_work_minutes: 120,
            formatted_work_time: '02:00',
          },
          can_clock_in: false,
          can_clock_out: true,
        });
      }
    }, [onAttendanceUpdate]);

    return <div data-testid="time-clock-widget">TimeClockWidget</div>;
  };
});

// Mock the AttendanceHistory component
jest.mock('../../components/AttendanceHistory', () => {
  return function MockAttendanceHistory() {
    return <div data-testid="attendance-history">AttendanceHistory</div>;
  };
});

const theme = createTheme();

describe('Dashboard', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'employee' as const,
  };

  const mockAuthContextValue = {
    user: mockUser,
    signIn: jest.fn(),
    signOut: jest.fn(),
    loading: false,
    isAuthenticated: true,
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard correctly', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('ようこそ、Test Userさん')).toBeInTheDocument();
    expect(screen.getByText('権限: 従業員')).toBeInTheDocument();
  });

  it('displays TimeClockWidget', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByTestId('time-clock-widget')).toBeInTheDocument();
  });

  it('displays user name in header', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('displays additional features section', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('その他の機能')).toBeInTheDocument();
    expect(screen.getByText('実績確認')).toBeInTheDocument();
    expect(screen.getByText('月次レポート')).toBeInTheDocument();
  });

  it('shows admin button for admin users', () => {
    const adminUser = { ...mockUser, role: 'admin' as const };
    const adminContext = { ...mockAuthContextValue, user: adminUser };

    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthContext.Provider value={adminContext}>
            <Dashboard />
          </AuthContext.Provider>
        </ThemeProvider>
      </BrowserRouter>,
    );

    expect(screen.getByText('管理者画面')).toBeInTheDocument();
    expect(screen.getByText('権限: 管理者')).toBeInTheDocument();
  });

  it('does not show admin button for regular users', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.queryByText('管理者画面')).not.toBeInTheDocument();
  });

  it('toggles attendance history when button is clicked', () => {
    renderWithProviders(<Dashboard />);

    const attendanceButton = screen.getByText('実績確認');
    
    // Initially, attendance history should not be visible
    expect(screen.queryByTestId('attendance-history')).not.toBeInTheDocument();
    
    // Click the button to show attendance history
    fireEvent.click(attendanceButton);
    
    // Now attendance history should be visible
    expect(screen.getByTestId('attendance-history')).toBeInTheDocument();
  });

  it('handles sign out correctly', async () => {
    renderWithProviders(<Dashboard />);

    // Click on the user avatar to open menu
    const avatarButtons = screen.getAllByRole('button');
    const avatarButton = avatarButtons.find(button => button.textContent?.includes('T'));
    expect(avatarButton).toBeInTheDocument();
    fireEvent.click(avatarButton!);

    // Click sign out
    const signOutButton = screen.getByText('サインアウト');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockAuthContextValue.signOut).toHaveBeenCalled();
    });
  });
});