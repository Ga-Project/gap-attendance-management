import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AdminDashboard from '../AdminDashboard';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the admin components
jest.mock('../../components/admin/UserList', () => {
  return function MockUserList() {
    return <div data-testid="user-list">UserList Component</div>;
  };
});

jest.mock('../../components/admin/AttendanceManagement', () => {
  return function MockAttendanceManagement() {
    return <div data-testid="attendance-management">AttendanceManagement Component</div>;
  };
});

jest.mock('../../components/admin/AuditLogs', () => {
  return function MockAuditLogs() {
    return <div data-testid="audit-logs">AuditLogs Component</div>;
  };
});

const theme = createTheme();

const mockAdminUser = {
  id: 'id: 1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin' as const,
};

const mockAuthContextValue = {
  user: mockAdminUser,
  signIn: jest.fn(),
  signOut: jest.fn(),
  loading: false,
  isAuthenticated: true,
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

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin dashboard correctly', () => {
    renderWithProviders(<AdminDashboard />);

    expect(screen.getByText('管理者ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('Admin User (管理者)')).toBeInTheDocument();
  });

  it('displays all tab options', () => {
    renderWithProviders(<AdminDashboard />);

    expect(screen.getByText('社員一覧')).toBeInTheDocument();
    expect(screen.getByText('勤怠管理')).toBeInTheDocument();
    expect(screen.getByText('監査ログ')).toBeInTheDocument();
  });

  it('shows user list tab by default', () => {
    renderWithProviders(<AdminDashboard />);

    expect(screen.getByTestId('user-list')).toBeInTheDocument();
    expect(screen.queryByTestId('attendance-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('audit-logs')).not.toBeInTheDocument();
  });

  it('switches to attendance management tab when clicked', () => {
    renderWithProviders(<AdminDashboard />);

    const attendanceTab = screen.getByText('勤怠管理');
    fireEvent.click(attendanceTab);

    expect(screen.getByTestId('attendance-management')).toBeInTheDocument();
    expect(screen.queryByTestId('user-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('audit-logs')).not.toBeInTheDocument();
  });

  it('switches to audit logs tab when clicked', () => {
    renderWithProviders(<AdminDashboard />);

    const auditLogsTab = screen.getByText('監査ログ');
    fireEvent.click(auditLogsTab);

    expect(screen.getByTestId('audit-logs')).toBeInTheDocument();
    expect(screen.queryByTestId('user-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('attendance-management')).not.toBeInTheDocument();
  });

  it('maintains tab selection state', () => {
    renderWithProviders(<AdminDashboard />);

    // Switch to attendance management
    const attendanceTab = screen.getByText('勤怠管理');
    fireEvent.click(attendanceTab);

    expect(screen.getByTestId('attendance-management')).toBeInTheDocument();

    // Switch to audit logs
    const auditLogsTab = screen.getByText('監査ログ');
    fireEvent.click(auditLogsTab);

    expect(screen.getByTestId('audit-logs')).toBeInTheDocument();

    // Switch back to user list
    const userListTab = screen.getByText('社員一覧');
    fireEvent.click(userListTab);

    expect(screen.getByTestId('user-list')).toBeInTheDocument();
  });

  it('displays admin user name correctly', () => {
    const customAdminUser = {
      ...mockAdminUser,
      name: 'Custom Admin Name',
    };

    const customContext = {
      ...mockAuthContextValue,
      user: customAdminUser,
    };

    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthContext.Provider value={customContext}>
            <AdminDashboard />
          </AuthContext.Provider>
        </ThemeProvider>
      </BrowserRouter>,
    );

    expect(screen.getByText('Custom Admin Name (管理者)')).toBeInTheDocument();
  });

  it('has proper tab styling and accessibility', () => {
    renderWithProviders(<AdminDashboard />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);

    // Check that tabs have proper labels
    expect(screen.getByRole('tab', { name: '社員一覧' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '勤怠管理' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '監査ログ' })).toBeInTheDocument();
  });

  it('renders with proper layout structure', () => {
    renderWithProviders(<AdminDashboard />);

    // Check for tab panel
    const tabPanel = screen.getByRole('tabpanel');
    expect(tabPanel).toBeInTheDocument();
  });
});