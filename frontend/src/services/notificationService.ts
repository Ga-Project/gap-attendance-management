import { AppError, ErrorType } from './errorHandler';

// Notification types
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// Notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'text' | 'outlined' | 'contained';
}

// Notification event listeners
type NotificationListener = (notification: Notification) => void;

class NotificationService {
  private listeners: NotificationListener[] = [];
  private notificationCounter = 0;

  // Subscribe to notifications
  subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Emit notification to all listeners
  private emit(notification: Notification): void {
    this.listeners.forEach(listener => listener(notification));
  }

  // Generate unique notification ID
  private generateId(): string {
    return `notification-${++this.notificationCounter}-${Date.now()}`;
  }

  // Show success notification
  success(message: string, title = '成功', duration = 5000): void {
    this.emit({
      id: this.generateId(),
      type: NotificationType.SUCCESS,
      title,
      message,
      duration,
    });
  }

  // Show error notification
  error(message: string, title = 'エラー', persistent = false, actions?: NotificationAction[]): void {
    this.emit({
      id: this.generateId(),
      type: NotificationType.ERROR,
      title,
      message,
      persistent,
      actions,
    });
  }

  // Show warning notification
  warning(message: string, title = '警告', duration = 7000): void {
    this.emit({
      id: this.generateId(),
      type: NotificationType.WARNING,
      title,
      message,
      duration,
    });
  }

  // Show info notification
  info(message: string, title = '情報', duration = 5000): void {
    this.emit({
      id: this.generateId(),
      type: NotificationType.INFO,
      title,
      message,
      duration,
    });
  }

  // Handle application errors
  handleError(error: AppError, context?: string): void {
    const actions: NotificationAction[] = [];

    // Add retry action for retryable errors
    if (this.canRetry(error)) {
      actions.push({
        label: '再試行',
        action: () => window.location.reload(),
        variant: 'outlined',
      });
    }

    // Add login action for authentication errors
    if (error.type === ErrorType.AUTHENTICATION) {
      actions.push({
        label: 'ログイン',
        action: () => window.location.href = '/login',
        variant: 'contained',
      });
    }

    // Determine if error should be persistent
    const persistent = error.type === ErrorType.AUTHENTICATION || 
                      error.type === ErrorType.AUTHORIZATION ||
                      error.type === ErrorType.SERVER;

    this.error(
      error.message,
      this.getErrorTitle(error.type),
      persistent,
      actions.length > 0 ? actions : undefined,
    );

    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error(`Error in ${context || 'unknown context'}:`, error);
  }

  // Get appropriate title for error type
  private getErrorTitle(errorType: ErrorType): string {
    switch (errorType) {
      case ErrorType.NETWORK:
        return 'ネットワークエラー';
      case ErrorType.AUTHENTICATION:
        return '認証エラー';
      case ErrorType.AUTHORIZATION:
        return '権限エラー';
      case ErrorType.VALIDATION:
        return '入力エラー';
      case ErrorType.BUSINESS_LOGIC:
        return '操作エラー';
      case ErrorType.SERVER:
        return 'サーバーエラー';
      default:
        return 'エラー';
    }
  }

  // Check if error can be retried
  private canRetry(error: AppError): boolean {
    return error.type === ErrorType.NETWORK || error.type === ErrorType.SERVER;
  }

  // Show attendance-specific success messages
  attendanceSuccess(action: string): void {
    const messages: Record<string, string> = {
      'clock_in': '出勤を記録しました',
      'clock_out': '退勤を記録しました',
      'break_start': '休憩を開始しました',
      'break_end': '休憩を終了しました',
    };

    this.success(messages[action] || '操作が完了しました');
  }

  // Show authentication success messages
  authSuccess(action: string): void {
    const messages: Record<string, string> = {
      'login': 'ログインしました',
      'logout': 'ログアウトしました',
    };

    this.success(messages[action] || '認証が完了しました');
  }
}

export const notificationService = new NotificationService();
export default notificationService;