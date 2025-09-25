import api from './api';
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

        const response = await api.get('/v1/attendances', { params });
        return response.data;
    }

    // Get specific attendance record
    static async getAttendance(id: number): Promise<{ attendance: Attendance }> {
        const response = await api.get(`/v1/attendances/${id}`);
        return response.data;
    }

    // Get today's attendance status
    static async getTodayAttendance(): Promise<TodayAttendanceResponse> {
        const response = await api.get('/v1/attendances/today');
        return response.data;
    }

    // Clock in
    static async clockIn(): Promise<AttendanceActionResponse> {
        const response = await api.post('/v1/attendances/clock_in');
        return response.data;
    }

    // Clock out
    static async clockOut(): Promise<AttendanceActionResponse> {
        const response = await api.post('/v1/attendances/clock_out');
        return response.data;
    }

    // Start break
    static async startBreak(): Promise<AttendanceActionResponse> {
        const response = await api.post('/v1/attendances/break_start');
        return response.data;
    }

    // End break
    static async endBreak(): Promise<AttendanceActionResponse> {
        const response = await api.post('/v1/attendances/break_end');
        return response.data;
    }

    // Get statistics for date range
    static async getStatistics(startDate: string, endDate: string): Promise<{ date_range_statistics: import('../types').DateRangeStatistics }> {
        const response = await api.get('/v1/attendances/statistics', {
            params: { start_date: startDate, end_date: endDate },
        });
        return response.data;
    }

    // Get monthly statistics
    static async getMonthlyStatistics(year: number, month: number): Promise<{ monthly_statistics: import('../types').MonthlyStatistics }> {
        const response = await api.get('/v1/attendances/statistics', {
            params: { year: year.toString(), month: month.toString() },
        });
        return response.data;
    }

    // Get monthly attendance data with statistics
    static async getMonthlyAttendances(year: number, month: number): Promise<import('../types').MonthlyAttendanceResponse> {
        const response = await api.get(`/v1/attendances/monthly/${year}/${month}`);
        return response.data;
    }
}

export default AttendanceService;