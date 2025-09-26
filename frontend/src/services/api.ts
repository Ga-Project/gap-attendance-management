import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import errorHandler from './errorHandler';
import notificationService from './notificationService';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token and handle request errors
api.interceptors.request.use(
    (config: AxiosRequestConfig) => {
        const token = localStorage.getItem('authToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        const appError = errorHandler.parseError(error);
        errorHandler.logError(appError, 'API Request');
        return Promise.reject(appError);
    },
);

// Response interceptor for comprehensive error handling
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // Log successful responses in development
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
        console.log(`API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
    },
    (error: AxiosError) => {
        const appError = errorHandler.parseError(error);
        errorHandler.logError(appError, 'API Response');

        // Handle authentication errors
        if (errorHandler.shouldLogout(appError)) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            
            // Don't redirect if already on login page
            if (!window.location.pathname.includes('/login')) {
                notificationService.error(
                    'セッションが期限切れです。再度ログインしてください。',
                    '認証エラー',
                    false,
                    [{
                        label: 'ログインページへ',
                        action: () => window.location.href = '/login',
                        variant: 'contained',
                    }],
                );
                
                // Redirect after a short delay to allow notification to show
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            }
        }

        return Promise.reject(appError);
    },
);

// Helper function to handle API calls with consistent error handling
export const apiCall = async <T>(
    apiFunction: () => Promise<AxiosResponse<T>>,
    context?: string,
    showErrorNotification = true,
): Promise<T> => {
    try {
        const response = await apiFunction();
        return response.data;
    } catch (error) {
        const appError = errorHandler.parseError(error);
        
        if (showErrorNotification) {
            notificationService.handleError(appError, context);
        }
        
        throw appError;
    }
};

// Helper function for silent API calls (no error notifications)
export const silentApiCall = async <T>(
    apiFunction: () => Promise<AxiosResponse<T>>,
    context?: string,
): Promise<T> => {
    return apiCall(apiFunction, context, false);
};

export default api;