import type { ZodError } from 'zod';
import {
  operationSchema,
  operationsMessageSchema,
  type OperationsMessageInput,
} from '../operations/schemas';
import {
  eventSchema,
  eventsMessageSchema,
  type EventsMessageInput,
} from '../events/schemas';
import type { Operation } from '../operations/types';
import type { Event } from '../events/types';
import {
  OperationValidationError,
  EventValidationError,
  PathValidationError,
} from './errors';

/**
 * Result of a validation operation
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: ZodError;
}

/**
 * Validate a single operation
 */
export function validateOperation(
  input: unknown
): ValidationResult<Operation> {
  const result = operationSchema.safeParse(input);
  return result.success
    ? { success: true, data: result.data as Operation }
    : { success: false, error: result.error };
}

/**
 * Validate an operations message
 */
export function validateOperationsMessage(
  input: unknown
): ValidationResult<OperationsMessageInput> {
  const result = operationsMessageSchema.safeParse(input);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

/**
 * Validate a single event
 */
export function validateEvent(input: unknown): ValidationResult<Event> {
  const result = eventSchema.safeParse(input);
  return result.success
    ? { success: true, data: result.data as Event }
    : { success: false, error: result.error };
}

/**
 * Validate an events message
 */
export function validateEventsMessage(
  input: unknown
): ValidationResult<EventsMessageInput> {
  const result = eventsMessageSchema.safeParse(input);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

/**
 * Validate a file path
 */
export function validatePath(path: string): void {
  if (path.startsWith('/')) {
    throw new PathValidationError(
      'Path must be relative (no leading /)',
      path
    );
  }
  if (path.includes('..')) {
    throw new PathValidationError(
      'Path cannot contain parent directory traversal (..)',
      path
    );
  }
  if (path.includes('\0')) {
    throw new PathValidationError('Path cannot contain null bytes', path);
  }
  if (path.length > 255) {
    throw new PathValidationError(
      'Path exceeds maximum length of 255 characters',
      path
    );
  }
}

/**
 * Check if a path is valid (returns boolean instead of throwing)
 */
export function isValidPath(path: string): boolean {
  try {
    validatePath(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse and validate an operation, throwing on error
 */
export function parseOperation(input: unknown): Operation {
  const result = operationSchema.safeParse(input);
  if (!result.success) {
    throw new OperationValidationError(
      'Invalid operation',
      result.error
    );
  }
  return result.data as Operation;
}

/**
 * Parse and validate an event, throwing on error
 */
export function parseEvent(input: unknown): Event {
  const result = eventSchema.safeParse(input);
  if (!result.success) {
    throw new EventValidationError('Invalid event', result.error);
  }
  return result.data as Event;
}

