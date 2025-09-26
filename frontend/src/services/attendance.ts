import api, { apiCall } from './api';
import notificationService from './notificationService';
import { Attendance, TodayAttendanceResponse, AttendanceActionResponse } from '../types';

export class AttendanceService {
    // Get user's attendance history
    static async getAttendances(startDate?: string, endDate?: string): Promise<{ attendances: Attendance[] }> {
        const params: Record<string, string> = {};
        if (startDate) {
            params.start_date = startDate;
        }
        if (endDate) {
            params.end_date = endDate;
        }

        return apiCall(
            () => api.get('/attendances', { params }),
            'Get attendances',
        );
    }

    // Get specific attendance record
    static async getAttendance(id: number): Promise<{ attendance: Attendance }> {
        return apiCall(
            () => api.get(`/attendances/${id}`),
            'Get attendance record',
        );
    }

    // Get today's attendance status
    static async getTodayAttendance(): Promise<TodayAttendanceResponse> {
        return apiCall(
            () => api.get('/attendances/today'),
            'Get today attendance',
            false, // Don't show error notification for this call
        );
    }

    // Clock in
    static async clockIn(): Promise<AttendanceActionResponse> {
        const result = await apiCall(
            () => api.post('/attendances/clock_in'),
            'Clock in',
        );
        
        notificationService.attendanceSuccess('clock_in');
        return result;
    }

    // Clock out
    static async clockOut(): Promise<AttendanceActionResponse> {
        const result = await apiCall(
            () => api.post('/attendances/clock_out'),
            'Clock out',
        );
        
        notificationService.attendanceSuccess('clock_out');
        return result;
    }

    // Start break
    static async startBreak(): Promise<AttendanceActionResponse> {
        const result = await apiCall(
            () => api.post('/attendances/break_start'),
            'Start break',
        );
        
        notificationService.attendanceSuccess('break_start');
        return result;
    }

    // End break
    static async endBreak(): Promise<AttendanceActionResponse> {
        const result = await apiCall(
            () => api.post('/attendances/break_end'),
            'End break',
        );
        
        notificationService.attendanceSuccess('break_end');
        return result;
    }

    // Get statistics for date range
    static async getStatistics(startDate: string, endDate: string): Promise<{ date_range_statistics: import('../types').DateRangeStatistics }> {
        return apiCall(
            () => api.get('/attendances/statistics', {
                params: { start_date: startDate, end_date: endDate },
            }),
            'Get date range statistics',
        );
    }

    // Get monthly statistics
    static async getMonthlyStatistics(year: number, month: number): Promise<{ monthly_statistics: import('../types').MonthlyStatistics }> {
        return apiCall(
            () => api.get('/attendances/statistics', {
                params: { year: year.toString(), month: month.toString() },
            }),
            'Get monthly statistics',
        );
    }

    // Get monthly attendance data with statistics
    static async getMonthlyAttendances(year: number, month: number): Promise<import('../types').MonthlyAttendanceResponse> {
        return apiCall(
            () => api.get(`/attendances/monthly/${year}/${month}`),
            'Get monthly attendances',
        );
    }
}

export default AttendanceService;