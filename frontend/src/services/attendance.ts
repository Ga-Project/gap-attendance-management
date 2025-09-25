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
}

export default AttendanceService;