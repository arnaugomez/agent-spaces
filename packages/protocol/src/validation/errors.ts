import type { ZodError } from 'zod';

/**
 * Base class for protocol validation errors
 */
export class ProtocolValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ProtocolValidationError';
  }
}

/**
 * Error thrown when an operation fails validation
 */
export class OperationValidationError extends ProtocolValidationError {
  constructor(
    message: string,
    public readonly zodError: ZodError
  ) {
    super(message, 'OPERATION_INVALID', {
      issues: zodError.issues,
    });
    this.name = 'OperationValidationError';
  }

  /**
   * Get a formatted list of validation issues
   */
  getIssues(): string[] {
    return this.zodError.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });
  }
}

/**
 * Error thrown when an event fails validation
 */
export class EventValidationError extends ProtocolValidationError {
  constructor(
    message: string,
    public readonly zodError: ZodError
  ) {
    super(message, 'EVENT_INVALID', {
      issues: zodError.issues,
    });
    this.name = 'EventValidationError';
  }
}

/**
 * Error thrown when a path is invalid
 */
export class PathValidationError extends ProtocolValidationError {
  constructor(
    message: string,
    public readonly path: string
  ) {
    super(message, 'PATH_INVALID', { path });
    this.name = 'PathValidationError';
  }
}

