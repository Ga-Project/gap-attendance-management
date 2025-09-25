import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from '../Dashboard';
import { AuthContext } from '../../contexts/AuthContext';
import AttendanceService from '../../services/attendance';

// Mock the AttendanceService
jest.mock('../../services/attendance');
const mockAttendanceService = AttendanceService as jest.Mocked<typeof AttendanceService>;

// Mock the TimeClockWidget component
jest.mock('../../components/TimeClockWidget', () => {
  return function MockTimeClockWidget({ onAttendanceUpdate }: any) {
    React.useEffect(() => {
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

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'employee' as const,
};

const mockAuthContextValue = {
  user: mockUser,
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

const mockTodayAttendance = {
  attendance: {
    id: 1,
    date: '2025-01-15',
    status: 'clocked_in',
    clock_in_time: '2025-01-15T09:00:00Z',
    clock_out_time: undefined,
    total_work_minutes: 120,
    total_break_minutes: 0,
    formatted_work_time: '02:00',
    formatted_break_time: '00:00',
    formatted_total_office_time: '02:00',
    complete: false,
    in_progress: true,
    records: [],
  },
  can_clock_in: false,
  can_clock_out: true,
  can_start_break: true,
  can_end_break: false,
};

const mockRecentAttendances = [
  {
    id: 1,
    date: '2025-01-14',
    status: 'clocked_out',
    clock_in_time: '2025-01-14T09:00:00Z',
    clock_out_time: '2025-01-14T17:00:00Z',
    total_work_minutes: 480,
    total_break_minutes: 60,
    formatted_work_time: '08:00',
    formatted_break_time: '01:00',
    formatted_total_office_time: '09:00',
    complete: true,
    in_progress: false,
    records: [],
  },
];

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAttendanceService.getTodayAttendance.mockResolvedValue(mockTodayAttendance);
    mockAttendanceService.getAttendances.mockResolvedValue({
      attendances: mockRecentAttendances,
    });
  });

  it('renders dashboard correctly', async () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('Test User さん、お疲れ様です！')).toBeInTheDocument();
    expect(screen.getByTestId('time-clock-widget')).toBeInTheDocument();
  });

  it('displays current status based on attendance data', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('現在の状況')).toBeInTheDocument();
    });

    expect(screen.getByText('勤務中')).toBeInTheDocument();
    expect(screen.getByText('出勤時刻: 09:00')).toBeInTheDocument();
    expect(screen.getByText('勤務時間: 02:00')).toBeInTheDocument();
  });

  it('displays recent attendance history', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('最近の勤怠履歴')).toBeInTheDocument();
    });

    expect(screen.getByText('2025-01-14')).toBeInTheDocument();
    expect(screen.getByText('退勤済み')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument(); // work time
  });

  it('shows view all link for attendance history', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('すべて表示')).toBeInTheDocument();
    });

    const viewAllLink = screen.getByText('すべて表示');
    expect(viewAllLink).toHaveAttribute('href', '/attendance-history');
  });

  it('handles different attendance statuses', async () => {
    const notStartedAttendance = {
      ...mockTodayAttendance,
      attendance: {
        ...mockTodayAttendance.attendance,
        status: 'not_started',
        clock_in_time: undefined,
        total_work_minutes: 0,
        formatted_work_time: '00:00',
        in_progress: false,
      },
    };

    mockAttendanceService.getTodayAttendance.mockResolvedValue(notStartedAttendance);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('未出勤')).toBeInTheDocument();
    });

    expect(screen.getByText('出勤時刻: --:--')).toBeInTheDocument();
  });

  it('handles on break status', async () => {
    const onBreakAttendance = {
      ...mockTodayAttendance,
      attendance: {
        ...mockTodayAttendance.attendance,
        status: 'on_break',
        total_break_minutes: 30,
        formatted_break_time: '00:30',
      },
    };

    mockAttendanceService.getTodayAttendance.mockResolvedValue(onBreakAttendance);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('休憩中')).toBeInTheDocument();
    });

    expect(screen.getByText('休憩時間: 00:30')).toBeInTheDocument();
  });

  it('handles clocked out status', async () => {
    const clockedOutAttendance = {
      ...mockTodayAttendance,
      attendance: {
        ...mockTodayAttendance.attendance,
        status: 'clocked_out',
        clock_out_time: '2025-01-15T17:00:00Z',
        total_work_minutes: 480,
        formatted_work_time: '08:00',
        complete: true,
        in_progress: false,
      },
    };

    mockAttendanceService.getTodayAttendance.mockResolvedValue(clockedOutAttendance);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('退勤済み')).toBeInTheDocument();
    });

    expect(screen.getByText('退勤時刻: 17:00')).toBeInTheDocument();
  });

  it('displays error message when today attendance fails to load', async () => {
    mockAttendanceService.getTodayAttendance.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('本日の勤怠データを取得できませんでした')).toBeInTheDocument();
    });
  });

  it('displays error message when recent attendances fail to load', async () => {
    mockAttendanceService.getAttendances.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('最近の勤怠履歴を取得できませんでした')).toBeInTheDocument();
    });
  });

  it('displays no recent data message when no attendances exist', async () => {
    mockAttendanceService.getAttendances.mockResolvedValue({
      attendances: [],
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('最近のデータがありません')).toBeInTheDocument();
    });
  });

  it('updates current status when attendance changes', async () => {
    renderWithProviders(<Dashboard />);

    // Initial status should be displayed
    await waitFor(() => {
      expect(screen.getByText('勤務中')).toBeInTheDocument();
    });

    // The TimeClockWidget mock will trigger onAttendanceUpdate
    // which should update the current status display
    expect(screen.getByText('出勤時刻: 09:00')).toBeInTheDocument();
  });

  it('formats time correctly', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('出勤時刻: 09:00')).toBeInTheDocument();
    });

    expect(screen.getByText('勤務時間: 02:00')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    // Mock slow API calls
    mockAttendanceService.getTodayAttendance.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    renderWithProviders(<Dashboard />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });
});