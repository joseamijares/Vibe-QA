import { ErrorInfo } from 'react';

// Hook for functional components to track errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);

    // Log to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error reporting service integration
      // logErrorToService(error, errorInfo);
    }

    // Optionally show a toast notification
    // toast.error('An unexpected error occurred');

    throw error; // Re-throw to be caught by ErrorBoundary
  };
}
