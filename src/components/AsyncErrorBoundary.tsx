import { useState, useEffect, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export { useAsyncError } from '@/hooks/useAsyncError';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface AsyncError {
  message: string;
  code?: string;
  statusCode?: number;
}

export function AsyncErrorBoundary({ children, fallback, onError }: AsyncErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Reset error when children change
    setError(null);
  }, [children]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      const error = new Error(event.reason?.message || 'An unexpected error occurred');
      setError(error);
      if (onError) {
        onError(error);
      }
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  const retry = () => {
    setError(null);
  };

  if (error) {
    if (fallback) {
      return <>{fallback(error, retry)}</>;
    }

    return <AsyncErrorFallback error={error} retry={retry} />;
  }

  return <>{children}</>;
}

interface AsyncErrorFallbackProps {
  error: Error;
  retry: () => void;
}

function AsyncErrorFallback({ error, retry }: AsyncErrorFallbackProps) {
  const getErrorDetails = (error: Error): AsyncError => {
    // Parse common error patterns
    if (error.message.includes('Failed to fetch')) {
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
      };
    }

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return {
        message: 'Authentication error. Please log in again.',
        code: 'AUTH_ERROR',
        statusCode: 401,
      };
    }

    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return {
        message: "You don't have permission to perform this action.",
        code: 'PERMISSION_ERROR',
        statusCode: 403,
      };
    }

    if (error.message.includes('404') || error.message.includes('Not found')) {
      return {
        message: 'The requested resource was not found.',
        code: 'NOT_FOUND',
        statusCode: 404,
      };
    }

    if (error.message.includes('500') || error.message.includes('Server error')) {
      return {
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        statusCode: 500,
      };
    }

    return {
      message: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
    };
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="p-4">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{errorDetails.message}</p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">Technical details</summary>
                  <pre className="mt-1 text-xs whitespace-pre-wrap bg-red-100 p-2 rounded">
                    {error.stack || error.toString()}
                  </pre>
                </details>
              )}
            </div>
            <div className="mt-4">
              <Button
                onClick={retry}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
