import { AxiosError } from 'axios';

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// Standardized error interface
export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  statusCode?: number;
  timestamp: string;
}

// User-friendly error messages in Japanese
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'ネットワーク接続に問題があります。インターネット接続を確認してください。',
  [ErrorType.AUTHENTICATION]: 'ログインが必要です。再度ログインしてください。',
  [ErrorType.AUTHORIZATION]: 'この操作を実行する権限がありません。',
  [ErrorType.VALIDATION]: '入力内容に問題があります。入力内容を確認してください。',
  [ErrorType.BUSINESS_LOGIC]: '操作を完了できませんでした。',
  [ErrorType.SERVER]: 'サーバーエラーが発生しました。しばらく待ってから再試行してください。',
  [ErrorType.UNKNOWN]: '予期しないエラーが発生しました。',
};

// Specific error messages for common scenarios
const SPECIFIC_ERROR_MESSAGES: Record<string, string> = {
  'Already clocked in today': '既に出勤済みです。',
  'Cannot clock out. Must be clocked in first': '出勤していないため退勤できません。',
  'Cannot start break. Must be clocked in first': '出勤していないため休憩を開始できません。',
  'Cannot end break. Must be on break first': '休憩中でないため休憩を終了できません。',
  'Invalid Google ID token': 'Googleログインに失敗しました。再度お試しください。',
  'Authentication failed': '認証に失敗しました。再度ログインしてください。',
  'User not found': 'ユーザーが見つかりません。',
  'Token has expired': 'セッションが期限切れです。再度ログインしてください。',
  'Admin access required': '管理者権限が必要です。',
  'Resource not found': '要求されたデータが見つかりません。',
  'Google service unavailable': 'Googleサービスに接続できません。しばらく待ってから再試行してください。',
};

class ErrorHandlerService {
  // Parse and categorize errors
  parseError(error: unknown): AppError {
    const timestamp = new Date().toISOString();

    // Handle Axios errors (API responses)
    if (this.isAxiosError(error)) {
      return this.parseAxiosError(error, timestamp);
    }

    // Handle standard JavaScript errors
    if (error instanceof Error) {
      return {
        type: ErrorType.UNKNOWN,
        message: ERROR_MESSAGES[ErrorType.UNKNOWN],
        details: error.message,
        timestamp,
      };
    }

    // Handle unknown error types
    return {
      type: ErrorType.UNKNOWN,
      message: ERROR_MESSAGES[ErrorType.UNKNOWN],
      details: String(error),
      timestamp,
    };
  }

  // Check if error is an Axios error
  private isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError)?.isAxiosError === true;
  }

  // Parse Axios errors from API responses
  private parseAxiosError(error: AxiosError, timestamp: string): AppError {
    const statusCode = error.response?.status;
    const responseData = error.response?.data as any;

    // Handle network errors
    if (!error.response) {
      return {
        type: ErrorType.NETWORK,
        message: ERROR_MESSAGES[ErrorType.NETWORK],
        details: error.message,
        timestamp,
      };
    }

    // Categorize by status code
    const errorType = this.categorizeByStatusCode(statusCode);
    let message = ERROR_MESSAGES[errorType];
    let details: string | undefined;

    // Extract error message from response
    if (responseData?.error) {
      const serverMessage = responseData.error.message || responseData.error;
      
      // Use specific message if available
      if (SPECIFIC_ERROR_MESSAGES[serverMessage]) {
        message = SPECIFIC_ERROR_MESSAGES[serverMessage];
      } else {
        message = serverMessage;
      }

      // Add details if available
      if (responseData.error.details) {
        details = Array.isArray(responseData.error.details)
          ? responseData.error.details.join(', ')
          : responseData.error.details;
      }
    }

    return {
      type: errorType,
      message,
      details,
      statusCode,
      timestamp,
    };
  }

  // Categorize errors by HTTP status code
  private categorizeByStatusCode(statusCode?: number): ErrorType {
    if (!statusCode) {
return ErrorType.NETWORK;
}

    switch (true) {
      case statusCode === 401:
        return ErrorType.AUTHENTICATION;
      case statusCode === 403:
        return ErrorType.AUTHORIZATION;
      case statusCode === 404:
        return ErrorType.BUSINESS_LOGIC;
      case statusCode >= 400 && statusCode < 500:
        return ErrorType.VALIDATION;
      case statusCode >= 500:
        return ErrorType.SERVER;
      default:
        return ErrorType.UNKNOWN;
    }
  }

  // Log errors (can be extended to send to external services)
  logError(error: AppError, context?: string): void {
    const logData = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // eslint-disable-next-line no-console
    console.error('Application Error:', logData);

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      // Sentry.captureException(new Error(error.message), { extra: logData });
    }
  }

  // Get user-friendly error message
  getUserMessage(error: AppError): string {
    return error.message;
  }

  // Check if error should trigger logout
  shouldLogout(error: AppError): boolean {
    return error.type === ErrorType.AUTHENTICATION && 
           (error.statusCode === 401 || error.message.includes('expired'));
  }

  // Check if error should be retried
  canRetry(error: AppError): boolean {
    return error.type === ErrorType.NETWORK || error.type === ErrorType.SERVER;
  }
}

export const errorHandler = new ErrorHandlerService();
export default errorHandler;