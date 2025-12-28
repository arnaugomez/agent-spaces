/**
 * Base error class for Agent Spaces SDK.
 */
export class AgentSpacesError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly requestId?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AgentSpacesError';
  }
}

/**
 * Error thrown for validation failures.
 */
export class ValidationError extends AgentSpacesError {
  constructor(
    message: string,
    public readonly issues: Array<{ path: string; message: string }>,
    requestId?: string
  ) {
    super(message, 'VALIDATION_ERROR', 400, requestId, { issues });
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when a resource is not found.
 */
export class NotFoundError extends AgentSpacesError {
  constructor(
    public readonly resourceType: string,
    public readonly resourceId: string,
    requestId?: string
  ) {
    super(
      `${resourceType} '${resourceId}' not found`,
      'NOT_FOUND',
      404,
      requestId
    );
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when an operation is denied by policy.
 */
export class PolicyDeniedError extends AgentSpacesError {
  constructor(
    message: string,
    public readonly reason: string,
    public readonly suggestion?: string,
    requestId?: string
  ) {
    super(message, 'POLICY_DENIED', 403, requestId, { reason, suggestion });
    this.name = 'PolicyDeniedError';
  }
}

/**
 * Error thrown when approval is required.
 */
export class ApprovalRequiredError extends AgentSpacesError {
  constructor(
    public readonly approval: {
      operationId: string;
      operationType: string;
      reason: string;
      details: Record<string, unknown>;
    },
    requestId?: string
  ) {
    super('Approval required', 'APPROVAL_REQUIRED', 200, requestId, approval);
    this.name = 'ApprovalRequiredError';
  }
}

/**
 * Error thrown when rate limited.
 */
export class RateLimitError extends AgentSpacesError {
  constructor(
    public readonly retryAfter: number,
    requestId?: string
  ) {
    super(
      `Rate limited. Retry after ${retryAfter} seconds`,
      'RATE_LIMITED',
      429,
      requestId,
      { retryAfter }
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Error thrown for network errors.
 */
export class NetworkError extends AgentSpacesError {
  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', 0, undefined, { cause: cause?.message });
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/**
 * Parse an error response from the API.
 */
export function parseApiError(
  response: {
    error: { code: string; message: string; details?: unknown };
    meta?: { requestId?: string };
  },
  statusCode: number
): AgentSpacesError {
  const { error, meta } = response;
  const requestId = meta?.requestId;

  switch (error.code) {
    case 'VALIDATION_ERROR':
      return new ValidationError(
        error.message,
        (error.details as { issues: Array<{ path: string; message: string }> })
          ?.issues || [],
        requestId
      );
    case 'NOT_FOUND':
    case 'SPACE_NOT_FOUND':
    case 'RUN_NOT_FOUND':
      return new NotFoundError(
        error.code.replace('_NOT_FOUND', '').toLowerCase(),
        'unknown',
        requestId
      );
    case 'POLICY_DENIED':
      return new PolicyDeniedError(
        error.message,
        (error.details as { reason?: string })?.reason || error.message,
        (error.details as { suggestion?: string })?.suggestion,
        requestId
      );
    case 'RATE_LIMITED':
      return new RateLimitError(
        (error.details as { retryAfter?: number })?.retryAfter || 60,
        requestId
      );
    default:
      return new AgentSpacesError(
        error.message,
        error.code,
        statusCode,
        requestId,
        error.details
      );
  }
}

