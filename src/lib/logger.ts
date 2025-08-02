/**
 * Production-safe logger utility
 * Allows console logs in development but suppresses them in production
 * Always logs errors for monitoring
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    } else {
      // In production, you might want to send warnings to a monitoring service
      // Example: sendToMonitoring('warning', args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);

    // In production, send to error monitoring service
    if (!isDevelopment) {
      // TODO: Integrate with Sentry or similar
      // Example: Sentry.captureException(args[0]);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  // Helper to log with context
  withContext: (context: string) => ({
    log: (...args: any[]) => logger.log(`[${context}]`, ...args),
    info: (...args: any[]) => logger.info(`[${context}]`, ...args),
    warn: (...args: any[]) => logger.warn(`[${context}]`, ...args),
    error: (...args: any[]) => logger.error(`[${context}]`, ...args),
    debug: (...args: any[]) => logger.debug(`[${context}]`, ...args),
  }),

  // Helper for performance logging
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
};

// Export a default instance
export default logger;
