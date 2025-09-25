// User types
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'employee' | 'admin';
    picture?: string;
    google_id: string;
    created_at: string;
    updated_at: string;
}

// Authentication types
export interface AuthResponse {
    token: string;
    user: User;
}

export interface GoogleUserProfile {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

// API Response types
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success: boolean;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    status: number;
}

// Attendance types
export interface AttendanceRecord {
    id: number;
    record_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
    timestamp: string;
}

export interface Attendance {
    id: number;
    date: string;
    status: 'not_started' | 'clocked_in' | 'on_break' | 'clocked_out';
    clock_in_time?: string;
    clock_out_time?: string;
    total_work_minutes: number;
    total_break_minutes: number;
    formatted_work_time: string;
    formatted_break_time: string;
    formatted_total_office_time: string;
    complete: boolean;
    in_progress: boolean;
    records: AttendanceRecord[];
}

export interface TodayAttendanceResponse {
    attendance: Attendance;
    can_clock_in: boolean;
    can_clock_out: boolean;
    can_start_break: boolean;
    can_end_break: boolean;
}

export interface AttendanceActionResponse {
    message: string;
    attendance: Attendance;
}

// Statistics types
export interface AttendanceStatistics {
    working_days: number;
    total_work_minutes: number;
    total_break_minutes: number;
    formatted_total_work_time: string;
    formatted_total_break_time: string;
    average_work_minutes_per_day: number;
    formatted_average_work_time_per_day: string;
}

export interface MonthlyStatistics extends AttendanceStatistics {
    year: number;
    month: number;
}

export interface DateRangeStatistics extends AttendanceStatistics {
    start_date: string;
    end_date: string;
    total_days: number;
}

export interface MonthlyAttendanceResponse {
    attendances: Attendance[];
    statistics: MonthlyStatistics;
}

export interface StatisticsResponse {
    monthly_statistics?: MonthlyStatistics;
    date_range_statistics?: DateRangeStatistics;
}