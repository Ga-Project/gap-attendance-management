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

// Attendance types (for future use)
export interface AttendanceRecord {
    id: string;
    user_id: string;
    date: string;
    clock_in_time?: string;
    clock_out_time?: string;
    total_work_minutes: number;
    total_break_minutes: number;
    status: 'not_started' | 'clocked_in' | 'on_break' | 'clocked_out';
    created_at: string;
    updated_at: string;
}