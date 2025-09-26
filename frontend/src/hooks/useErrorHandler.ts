import { useCallback } from 'react';
import errorHandler, { AppError } from '../services/errorHandler';
import notificationService from '../services/notificationService';

interface UseErrorHandlerReturn {
  handleError: (error: unknown, context?: string, showNotification?: boolean) => AppError;
  handleAsyncError: <T>(
    asyncFunction: () => Promise<T>,
    context?: string,
    showNotification?: boolean
  ) => Promise<T | null>;
}

/**
 * Custom hook for consistent error handling across components
 */
export const useErrorHandler = (): UseErrorHandlerReturn => {
  const handleError = useCallback((
    error: unknown,
    context?: string,
    showNotification = true,
  ): AppError => {
    const appError = errorHandler.parseError(error);
    errorHandler.logError(appError, context);

    if (showNotification) {
      notificationService.handleError(appError, context);
    }

    return appError;
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    context?: string,
    showNotification = true,
  ): Promise<T | null> => {
    try {
      return await asyncFunction();
    } catch (error) {
      handleError(error, context, showNotification);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
};

export default useErrorHandler;