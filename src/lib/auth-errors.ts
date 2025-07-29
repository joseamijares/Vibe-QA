// Auth error message mapping for better UX
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred';

  const errorCode = error.code || error.message || '';

  // Supabase auth error codes
  const errorMap: Record<string, string> = {
    // Sign in errors
    invalid_credentials: 'Invalid email or password. Please try again.',
    user_not_found: 'No account found with this email address.',
    email_not_confirmed: 'Please verify your email before signing in.',
    user_banned: 'This account has been suspended. Please contact support.',

    // Sign up errors
    user_already_registered: 'An account with this email already exists.',
    weak_password: 'Password is too weak. Please use at least 6 characters.',
    over_email_send_rate_limit: 'Too many attempts. Please try again later.',
    invalid_email: 'Please enter a valid email address.',

    // Password reset errors
    same_password: 'New password must be different from the old password.',
    password_mismatch: 'Passwords do not match.',

    // OAuth errors
    oauth_error: 'Failed to sign in with provider. Please try again.',
    provider_email_needs_verification: 'Please verify your email with the provider first.',

    // Session errors
    session_not_found: 'Your session has expired. Please sign in again.',
    refresh_token_not_found: 'Your session has expired. Please sign in again.',
    invalid_refresh_token: 'Your session has expired. Please sign in again.',

    // Network errors
    network_error: 'Network error. Please check your connection and try again.',
    timeout: 'Request timed out. Please try again.',

    // Rate limiting
    rate_limit_exceeded: 'Too many attempts. Please wait a few minutes and try again.',

    // Generic errors
    unexpected_failure: 'An unexpected error occurred. Please try again.',
  };

  // Check for specific error messages in the error object
  if (typeof error === 'string') {
    return error;
  }

  // Check error code
  if (errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  // Check error message for common patterns
  const errorMessage = error.message?.toLowerCase() || '';

  if (errorMessage.includes('invalid login')) {
    return errorMap['invalid_credentials'];
  }

  if (errorMessage.includes('email not confirmed')) {
    return errorMap['email_not_confirmed'];
  }

  if (errorMessage.includes('network')) {
    return errorMap['network_error'];
  }

  if (errorMessage.includes('rate limit')) {
    return errorMap['rate_limit_exceeded'];
  }

  // Return the original error message if no mapping found
  return error.message || 'An unexpected error occurred. Please try again.';
}

// Helper to check if error is due to network issues
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  const message = (error.message || '').toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    error.code === 'network_error' ||
    error.code === 'timeout'
  );
}

// Helper to check if error is due to invalid credentials
export function isAuthenticationError(error: any): boolean {
  if (!error) return false;

  const code = error.code || '';
  const message = (error.message || '').toLowerCase();

  return (
    code === 'invalid_credentials' ||
    code === 'user_not_found' ||
    message.includes('invalid login') ||
    message.includes('invalid password') ||
    message.includes('user not found')
  );
}
