import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TimeClockWidget from '../TimeClockWidget';
import AttendanceService from '../../services/attendance';
import { TodayAttendanceResponse } from '../../types';

// Mock the AttendanceService
jest.mock('../../services/attendance');
const mockAttendanceService = AttendanceService as jest.Mocked<typeof AttendanceService>;

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>,
    );
};

const mockTodayAttendanceNotStarted: TodayAttendanceResponse = {
    attendance: {
        id: 'id: 1',
        date: '2025-01-15',
        status: 'not_started',
        clock_in_time: undefined,
        clock_out_time: undefined,
        total_work_minutes: 0,
        total_break_minutes: 0,
        formatted_work_time: '00:00',
        formatted_break_time: '00:00',
        formatted_total_office_time: '00:00',
        complete: false,
        in_progress: false,
        records: [],
    },
    can_clock_in: true,
    can_clock_out: false,
    can_start_break: false,
    can_end_break: false,
};

const mockTodayAttendanceClockedIn: TodayAttendanceResponse = {
    attendance: {
        id: 'id: 1',
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
        records: [
            {
                id: 'id: 1',
                record_type: 'clock_in',
                timestamp: '2025-01-15T09:00:00Z',
            },
        ],
    },
    can_clock_in: false,
    can_clock_out: true,
    can_start_break: true,
    can_end_break: false,
};

const mockTodayAttendanceOnBreak: TodayAttendanceResponse = {
    attendance: {
        id: 'id: 1',
        date: '2025-01-15',
        status: 'on_break',
        clock_in_time: '2025-01-15T09:00:00Z',
        clock_out_time: undefined,
        total_work_minutes: 120,
        total_break_minutes: 15,
        formatted_work_time: '02:00',
        formatted_break_time: '00:15',
        formatted_total_office_time: '02:15',
        complete: false,
        in_progress: true,
        records: [
            {
                id: 'id: 1',
                record_type: 'clock_in',
                timestamp: '2025-01-15T09:00:00Z',
            },
            {
                id: 'id: 2',
                record_type: 'break_start',
                timestamp: '2025-01-15T11:00:00Z',
            },
        ],
    },
    can_clock_in: false,
    can_clock_out: true,
    can_start_break: false,
    can_end_break: true,
};

describe('TimeClockWidget', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders loading state initially', () => {
        mockAttendanceService.getTodayAttendance.mockImplementation(
            () => new Promise(() => { }), // Never resolves
        );

        renderWithTheme(<TimeClockWidget />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders not started state correctly', async () => {
        mockAttendanceService.getTodayAttendance.mockResolvedValue(mockTodayAttendanceNotStarted);

        renderWithTheme(<TimeClockWidget />);

        await waitFor(() => {
            expect(screen.getByText('勤怠打刻')).toBeInTheDocument();
        });

        expect(screen.getByText('未出勤')).toBeInTheDocument();
        expect(screen.getAllByText('--:--')).toHaveLength(2); // Clock in and clock out time
        expect(screen.getAllByText('00:00')).toHaveLength(2); // Work time and break time

        // Check button states
        const clockInButton = screen.getByRole('button', { name: /出勤/ });
        const clockOutButton = screen.getByRole('button', { name: /退勤/ });
        const breakStartButton = screen.getByRole('button', { name: /休憩開始/ });
        const breakEndButton = screen.getByRole('button', { name: /休憩終了/ });

        expect(clockInButton).not.toBeDisabled();
        expect(clockOutButton).toBeDisabled();
        expect(breakStartButton).toBeDisabled();
        expect(breakEndButton).toBeDisabled();
    });

    it('renders clocked in state correctly', async () => {
        mockAttendanceService.getTodayAttendance.mockResolvedValue(mockTodayAttendanceClockedIn);

        renderWithTheme(<TimeClockWidget />);

        await waitFor(() => {
            expect(screen.getByText('勤務中')).toBeInTheDocument();
        });

        expect(screen.getByText('09:00')).toBeInTheDocument(); // Clock in time (formatted)
        expect(screen.getByText('02:00')).toBeInTheDocument(); // Work time
        expect(screen.getByText('本日の在社時間: 02:00')).toBeInTheDocument();

        // Check button states
        const clockInButton = screen.getByRole('button', { name: /出勤/ });
        const clockOutButton = screen.getByRole('button', { name: /退勤/ });
        const breakStartButton = screen.getByRole('button', { name: /休憩開始/ });
        const breakEndButton = screen.getByRole('button', { name: /休憩終了/ });

        expect(clockInButton).toBeDisabled();
        expect(clockOutButton).not.toBeDisabled();
        expect(breakStartButton).not.toBeDisabled();
        expect(breakEndButton).toBeDisabled();
    });

    it('renders on break state correctly', async () => {
        mockAttendanceService.getTodayAttendance.mockResolvedValue(mockTodayAttendanceOnBreak);

        renderWithTheme(<TimeClockWidget />);

        await waitFor(() => {
            expect(screen.getByText('休憩中')).toBeInTheDocument();
        });

        expect(screen.getByText('00:15')).toBeInTheDocument(); // Break time

        // Check button states
        const clockInButton = screen.getByRole('button', { name: /出勤/ });
        const clockOutButton = screen.getByRole('button', { name: /退勤/ });
        const breakStartButton = screen.getByRole('button', { name: /休憩開始/ });
        const breakEndButton = screen.getByRole('button', { name: /休憩終了/ });

        expect(clockInButton).toBeDisabled();
        expect(clockOutButton).not.toBeDisabled();
        expect(breakStartButton).toBeDisabled();
        expect(breakEndButton).not.toBeDisabled();
    });

    it('handles clock in action successfully', async () => {
        mockAttendanceService.getTodayAttendance.mockResolvedValue(mockTodayAttendanceNotStarted);
        mockAttendanceService.clockIn.mockResolvedValue({
            message: 'Successfully clocked in',
            attendance: mockTodayAttendanceClockedIn.attendance,
        });

        // Mock the second call after clock in
        mockAttendanceService.getTodayAttendance
            .mockResolvedValueOnce(mockTodayAttendanceNotStarted)
            .mockResolvedValueOnce(mockTodayAttendanceClockedIn);

        renderWithTheme(<TimeClockWidget />);

        await waitFor(() => {
            expect(screen.getByText('未出勤')).toBeInTheDocument();
        });

        const clockInButton = screen.getByRole('button', { name: /出勤/ });
        fireEvent.click(clockInButton);

        await waitFor(() => {
            expect(mockAttendanceService.clockIn).toHaveBeenCalledTimes(1);
        });

        // The component should handle the successful response
        // and update the UI accordingly
    });

    it('handles clock out action successfully', async () => {
        mockAttendanceService.getTodayAttendance.mockResolvedValue(mockTodayAttendanceClockedIn);
        mockAttendanceService.clockOut.mockResolvedValue({
            message: 'Successfully clocked out',
            attendance: {
                ...mockTodayAttendanceClockedIn.attendance,
                status: 'clocked_out',
                clock_out_time: '2025-01-15T17:00:00Z',
            },
        });

        renderWithTheme(<TimeClockWidget />);

        await waitFor(() => {
            expect(screen.getByText('勤務中')).toBeInTheDocument();
        });

        const clockOutButton = screen.getByRole('button', { name: /退勤/ });
        fireEvent.click(clockOutButton);

        await waitFor(() => {
            expect(mockAttendanceService.clockOut).toHaveBeenCalledTimes(1);
        });
    });

    it('handles break start action successfully', async () => {
        mockAttendanceService.getTodayAttendance.mockResolvedValue(mockTodayAttendanceClockedIn);
        mockAttendanceService.startBreak.mockResolvedValue({
            message: 'Break started',
            attendance: mockTodayAttendanceOnBreak.attendance,
        });

        renderWithTheme(<TimeClockWidget />);

        await waitFor(() => {
            expect(screen.getByText('勤務中')).toBeInTheDocument();
        });

        const breakStartButton = screen.getByRole('button', { name: /休憩開始/ });
        fireEvent.click(breakStartButton);

        await waitFor(() => {
            expect(mockAttendanceService.startBreak).toHaveBeenCalledTimes(1);
        });
    });

    it('handles break end action successfully', async () => {
        mockAttendanceService.getTodayAttendance.mockResolvedValue(mockTodayAttendanceOnBreak);
        mockAttendanceService.endBreak.mockResolvedValue({
            message: 'Break ended',
            attendance: mockTodayAttendanceClockedIn.attendance,
        });

        renderWithTheme(<TimeClockWidget />);

        await waitFor(() => {
            expect(screen.getByText('休憩中')).toBeInTheDocument();
        });

        const breakEndButton = screen.getByRole('button', { name: /休憩終了/ });
        fireEvent.click(breakEndButton);

        await waitFor(() => {
            expect(mockAttendanceService.endBreak).toHaveBeenCalledTimes(1);
        });
    });

    it('handles API errors gracefully', async () => {
        mockAttendanceService.getTodayAttendance.mockResolvedValue(mockTodayAttendanceNotStarted);
        // In the new error handling system, failed API calls return null
        mockAttendanceService.clockIn.mockResolvedValue(null);

        renderWithTheme(<TimeClockWidget />);

        await waitFor(() => {
            expect(screen.getByText('未出勤')).toBeInTheDocument();
        });

        const clockInButton = screen.getByRole('button', { name: /出勤/ });
        fireEvent.click(clockInButton);

        await waitFor(() => {
            expect(mockAttendanceService.clockIn).toHaveBeenCalledTimes(1);
        });

        // The component should handle the null response gracefully
        // and not crash or show unexpected error messages
    });

    it('calls onAttendanceUpdate callback when provided', async () => {
        const mockCallback = jest.fn();
        mockAttendanceService.getTodayAttendance.mockResolvedValue(mockTodayAttendanceNotStarted);

        renderWithTheme(<TimeClockWidget onAttendanceUpdate={mockCallback} />);

        await waitFor(() => {
            expect(mockCallback).toHaveBeenCalledWith(mockTodayAttendanceNotStarted);
        });
    });

    it('shows error when attendance data fails to load', async () => {
        // In the new error handling system, failed API calls return null
        mockAttendanceService.getTodayAttendance.mockResolvedValue(null);

        renderWithTheme(<TimeClockWidget />);

        await waitFor(() => {
            expect(screen.getByText('勤怠データを読み込めませんでした')).toBeInTheDocument();
        });
    });
});