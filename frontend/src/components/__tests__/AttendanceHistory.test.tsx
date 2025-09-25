import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AttendanceHistory from '../AttendanceHistory';
import AttendanceService from '../../services/attendance';
import { Attendance, MonthlyAttendanceResponse, DateRangeStatistics } from '../../types';

// Mock the AttendanceService
jest.mock('../../services/attendance');
const mockedAttendanceService = AttendanceService as jest.Mocked<typeof AttendanceService>;

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

const mockAttendances: Attendance[] = [
    {
        id: 1,
        date: '2024-01-15',
        status: 'clocked_out',
        clock_in_time: '2024-01-15T09:00:00Z',
        clock_out_time: '2024-01-15T18:00:00Z',
        total_work_minutes: 480,
        total_break_minutes: 60,
        formatted_work_time: '08:00',
        formatted_break_time: '01:00',
        formatted_total_office_time: '09:00',
        complete: true,
        in_progress: false,
        records: [],
    },
    {
        id: 2,
        date: '2024-01-16',
        status: 'clocked_out',
        clock_in_time: '2024-01-16T09:30:00Z',
        clock_out_time: '2024-01-16T17:30:00Z',
        total_work_minutes: 450,
        total_break_minutes: 30,
        formatted_work_time: '07:30',
        formatted_break_time: '00:30',
        formatted_total_office_time: '08:00',
        complete: true,
        in_progress: false,
        records: [],
    },
];

const mockDateRangeStatistics: DateRangeStatistics = {
    start_date: '2024-01-15',
    end_date: '2024-01-16',
    total_days: 2,
    working_days: 2,
    total_work_minutes: 930,
    total_break_minutes: 90,
    formatted_total_work_time: '15:30',
    formatted_total_break_time: '01:30',
    average_work_minutes_per_day: 465,
    formatted_average_work_time_per_day: '07:45',
};

const mockMonthlyData: MonthlyAttendanceResponse = {
    attendances: mockAttendances,
    statistics: {
        year: 2024,
        month: 1,
        working_days: 2,
        total_work_minutes: 930,
        total_break_minutes: 90,
        formatted_total_work_time: '15:30',
        formatted_total_break_time: '01:30',
        average_work_minutes_per_day: 465,
        formatted_average_work_time_per_day: '07:45',
    },
};

describe('AttendanceHistory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedAttendanceService.getAttendances.mockResolvedValue({ attendances: mockAttendances });
        mockedAttendanceService.getStatistics.mockResolvedValue({ date_range_statistics: mockDateRangeStatistics });
        mockedAttendanceService.getMonthlyAttendances.mockResolvedValue(mockMonthlyData);
    });

    it('renders attendance history component', () => {
        render(<AttendanceHistory />);
        
        expect(screen.getByText('勤怠実績')).toBeInTheDocument();
        expect(screen.getByText('期間指定')).toBeInTheDocument();
        expect(screen.getByText('月次表示')).toBeInTheDocument();
    });

    it('displays date range tab by default and loads data', async () => {
        render(<AttendanceHistory />);
        
        // Wait for data to load
        await waitFor(() => {
            expect(mockedAttendanceService.getAttendances).toHaveBeenCalled();
        });
        
        await waitFor(() => {
            expect(mockedAttendanceService.getStatistics).toHaveBeenCalled();
        });

        // Wait for statistics to appear
        await waitFor(() => {
            expect(screen.getByText('統計情報')).toBeInTheDocument();
        });
        
        // Check individual elements
        expect(screen.getByText('2日')).toBeInTheDocument(); // working days
        expect(screen.getByText('15:30')).toBeInTheDocument(); // total work time
    });

    it('displays attendance table with data', async () => {
        render(<AttendanceHistory />);
        
        // Wait for data to load and table to appear
        await waitFor(() => {
            expect(screen.getByText('日付')).toBeInTheDocument();
        });

        // Check table headers
        expect(screen.getByText('状態')).toBeInTheDocument();
        expect(screen.getByText('出勤時刻')).toBeInTheDocument();
        expect(screen.getByText('退勤時刻')).toBeInTheDocument();
        expect(screen.getByText('勤務時間')).toBeInTheDocument();
        expect(screen.getByText('休憩時間')).toBeInTheDocument();

        // Wait for attendance data to appear
        await waitFor(() => {
            expect(screen.getAllByText('退勤済み')).toHaveLength(2); // Both records have this status
        });
        
        // Check individual elements
        expect(screen.getAllByText('08:00')).toHaveLength(2); // Work time appears twice
        expect(screen.getByText('07:30')).toBeInTheDocument();
    });

    it('switches to monthly tab and loads monthly data', async () => {
        render(<AttendanceHistory />);
        
        // Click on monthly tab
        fireEvent.click(screen.getByText('月次表示'));
        
        await waitFor(() => {
            expect(mockedAttendanceService.getMonthlyAttendances).toHaveBeenCalledWith(
                new Date().getFullYear(),
                new Date().getMonth() + 1,
            );
        });

        // Check if year and month selectors are present by their display text
        expect(screen.getByText('2025年')).toBeInTheDocument();
        expect(screen.getByText('9月')).toBeInTheDocument();
    });

    it('displays no data message when attendances array is empty', async () => {
        mockedAttendanceService.getAttendances.mockResolvedValue({ attendances: [] });
        mockedAttendanceService.getStatistics.mockResolvedValue({ date_range_statistics: mockDateRangeStatistics });
        
        render(<AttendanceHistory />);
        
        await waitFor(() => {
            expect(screen.getByText('データがありません')).toBeInTheDocument();
        });
    });

    it('displays error message when API call fails', async () => {
        mockedAttendanceService.getAttendances.mockRejectedValue(new Error('API Error'));
        mockedAttendanceService.getStatistics.mockRejectedValue(new Error('API Error'));
        
        render(<AttendanceHistory />);
        
        await waitFor(() => {
            expect(screen.getByText('データの取得に失敗しました。')).toBeInTheDocument();
        });
    });

    it('handles date range search', async () => {
        render(<AttendanceHistory />);
        
        // Find and click the search button
        const searchButton = screen.getByText('検索');
        fireEvent.click(searchButton);
        
        await waitFor(() => {
            expect(mockedAttendanceService.getAttendances).toHaveBeenCalled();
        });
        
        await waitFor(() => {
            expect(mockedAttendanceService.getStatistics).toHaveBeenCalled();
        });
    });

    it('formats status text correctly', async () => {
        const attendanceWithDifferentStatus: Attendance = {
            ...mockAttendances[0],
            status: 'clocked_in',
        };
        
        mockedAttendanceService.getAttendances.mockResolvedValue({ 
            attendances: [attendanceWithDifferentStatus], 
        });
        
        render(<AttendanceHistory />);
        
        await waitFor(() => {
            expect(screen.getByText('出勤中')).toBeInTheDocument();
        });
    });

    it('formats time correctly', async () => {
        render(<AttendanceHistory />);
        
        await waitFor(() => {
            expect(screen.getAllByText('09:00')).toHaveLength(2); // clock in time appears twice (for both records)
        });
        
        // Check individual elements
        expect(screen.getByText('18:00')).toBeInTheDocument(); // clock out time
    });
});