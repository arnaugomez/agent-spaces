import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

/**
 * Error response structure.
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId: string;
  };
}

/**
 * Map errors to HTTP status codes.
 */
function getStatusCode(error: Error): number {
  if (error instanceof HTTPException) {
    return error.status;
  }
  if (error instanceof ZodError) {
    return 400;
  }
  if (error.message.includes('not found')) {
    return 404;
  }
  return 500;
}

/**
 * Map errors to error codes.
 */
function getErrorCode(error: Error): string {
  if (error instanceof ZodError) {
    return 'VALIDATION_ERROR';
  }
  if (error.message.includes('not found')) {
    return 'NOT_FOUND';
  }
  if (error instanceof HTTPException) {
    if (error.status === 401) return 'UNAUTHORIZED';
    if (error.status === 403) return 'FORBIDDEN';
    if (error.status === 429) return 'RATE_LIMITED';
  }
  return 'INTERNAL_ERROR';
}

/**
 * Global error handler.
 */
export function errorHandler(error: Error, c: Context): Response {
  const requestId = c.get('requestId') || 'unknown';
  const statusCode = getStatusCode(error);
  const errorCode = getErrorCode(error);

  const response: ErrorResponse = {
    error: {
      code: errorCode,
      message: error.message,
    },
    meta: {
      requestId,
    },
  };

  // Add validation details for Zod errors
  if (error instanceof ZodError) {
    response.error.details = {
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  // Log errors (except 4xx)
  if (statusCode >= 500) {
    console.error(`[${requestId}] Error:`, error);
  }

  return c.json(response, statusCode as 400);
}

