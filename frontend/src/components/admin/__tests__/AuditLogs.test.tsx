import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AuditLogs from '../AuditLogs';
import api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock MUI date picker components
jest.mock('@mui/x-date-pickers/DatePicker', () => {
  return {
    DatePicker: ({ label, value, onChange }: any) => {
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        onChange(date);
      };
      
      return (
        <input
          data-testid={`date-picker-${label}`}
          type="date"
          value={value ? value.toISOString().split('T')[0] : ''}
          onChange={handleChange}
          aria-label={label}
        />
      );
    },
  };
});

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => {
  return {
    LocalizationProvider: ({ children }: any) => children,
  };
});

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => {
  return {
    AdapterDateFns: jest.fn(),
  };
});

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>,
  );
};

const mockAuditLog = {
  id: 1,
  admin_user: {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
  },
  target_user: {
    id: 2,
    name: 'Target User',
    email: 'target@example.com',
  },
  action: 'update_attendance',
  change_data: {
    clock_in_time: ['09:00', '08:30'],
    clock_out_time: ['17:00', '17:30'],
  },
  reason: 'Employee requested time correction',
  created_at: '2024-01-15T10:00:00Z',
};

const mockAuditLogs = [mockAuditLog];

const mockUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  },
  {
    id: 2,
    name: 'Target User',
    email: 'target@example.com',
    role: 'employee',
  },
];

describe('AuditLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders audit logs component', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { users: mockUsers } })
      .mockResolvedValueOnce({ data: { audit_logs: mockAuditLogs } });

    renderWithTheme(<AuditLogs />);

    expect(screen.getByText('監査ログ')).toBeInTheDocument();
    expect(screen.getByText('検索')).toBeInTheDocument();
  });

  it('loads and displays audit log data', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { users: mockUsers } })
      .mockResolvedValueOnce({ data: { audit_logs: mockAuditLogs } });

    renderWithTheme(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    expect(screen.getByText('Target User')).toBeInTheDocument();
    expect(screen.getByText('update_attendance')).toBeInTheDocument();
    expect(screen.getByText('Employee requested time correction')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('API Error'));

    renderWithTheme(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('監査ログの取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('displays no data message when audit logs array is empty', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { users: mockUsers } })
      .mockResolvedValueOnce({ data: { audit_logs: [] } });

    renderWithTheme(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('指定された条件の監査ログがありません。')).toBeInTheDocument();
    });
  });
});