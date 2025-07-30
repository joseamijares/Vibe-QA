import { useState } from 'react';

// Hook to manually trigger async errors
export function useAsyncError() {
  const [, setError] = useState();

  return (error: Error) => {
    setError(() => {
      throw error;
    });
  };
}
