/**
 * Centralized error handling utilities providing custom error classes and handlers.
 * Standardizes error handling across the application with consistent logging and user messages.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

/**
 * Global error handler for consistent error logging and message extraction
 * @param error - Error object or unknown error type to handle
 * @param context - Optional context string for debugging
 * @returns User-friendly error message string
 */
export const handleError = (error: unknown, context?: string): string => {
  const timestamp = new Date().toISOString();
  const contextMsg = context ? ` [${context}]` : '';
  
  if (error instanceof AppError) {
    console.error(`${timestamp}${contextMsg} ${error.name}: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    });
    return error.message;
  }
  
  if (error instanceof Error) {
    console.error(`${timestamp}${contextMsg} Error: ${error.message}`, {
      stack: error.stack
    });
    return error.message;
  }
  
  const errorMsg = String(error);
  console.error(`${timestamp}${contextMsg} Unknown error: ${errorMsg}`);
  return 'An unexpected error occurred';
};

/**
 * Format user-friendly error messages based on error type
 * @param error - Error object to format
 * @returns User-appropriate error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  if (error instanceof AuthError) {
    return 'Authentication failed. Please try logging in again.';
  }
  
  if (error instanceof NetworkError) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (error instanceof AppError) {
    return error.message;
  }
  
  return 'Something went wrong. Please try again.';
};