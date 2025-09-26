import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AttendanceManagement from '../AttendanceManagement';
import api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock MUI date picker components
jest.mock('@mui/x-date-pickers/DatePicker', () => {
  return {
    DatePicker: ({ label }: any) => (
      <input data-testid={`date-picker-${label}`} aria-label={label} />
    ),
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

const mockAttendances = [
  {
    id: 'id: 1',
    user: {
      id: 'id: 1',
      name: 'Test User',
      email: 'test@example.com',
    },
    date: '2024-01-15',
    clock_in_time: '2024-01-15T09:00:00Z',
    clock_out_time: '2024-01-15T17:00:00Z',
    total_work_minutes: 480,
    total_break_minutes: 60,
    status: 'clocked_out',
    formatted_work_time: '08:00',
    formatted_break_time: '01:00',
  },
];

describe('AttendanceManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders attendance management component', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { users: [] } })
      .mockResolvedValueOnce({ data: { attendances: mockAttendances } });

    renderWithTheme(<AttendanceManagement />);

    expect(screen.getByText('勤怠管理')).toBeInTheDocument();
    expect(screen.getByText('検索')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { users: [] } })
      .mockRejectedValueOnce(new Error('API Error'));

    renderWithTheme(<AttendanceManagement />);

    await waitFor(() => {
      expect(screen.getByText('勤怠データの取得に失敗しました')).toBeInTheDocument();
    });
  });
});