/**
 * Event types for the Agent Spaces protocol.
 * These are records emitted by the runtime describing outcomes.
 */

/** Base event interface */
export interface BaseEvent {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Correlation to operation ID */
  operationId?: string;
}

/** User-provided input event */
export interface UserMessageEvent extends BaseEvent {
  type: 'userMessage';
  /** User's message content */
  content: string;
}

/** Acknowledgment of a message operation */
export interface MessageEvent extends BaseEvent {
  type: 'message';
  success: true;
}

/** Result of a createFile operation */
export interface CreateFileEvent extends BaseEvent {
  type: 'createFile';
  path: string;
  success: boolean;
  /** Present if success: true */
  bytesWritten?: number;
  /** Present if success: false */
  error?: string;
}

/** Result of a readFile operation */
export interface ReadFileEvent extends BaseEvent {
  type: 'readFile';
  path: string;
  success: boolean;
  /** Present if success: true */
  content?: string;
  encoding?: 'utf-8' | 'base64';
  size?: number;
  /** Present if success: false */
  error?: string;
}

/** Result of an editFile operation */
export interface EditFileEvent extends BaseEvent {
  type: 'editFile';
  path: string;
  success: boolean;
  /** Number of edits applied */
  editsApplied?: number;
  error?: string;
}

/** Result of a deleteFile operation */
export interface DeleteFileEvent extends BaseEvent {
  type: 'deleteFile';
  path: string;
  success: boolean;
  error?: string;
}

/** Result of a shell operation */
export interface ShellEvent extends BaseEvent {
  type: 'shell';
  command: string;
  success: boolean;
  /** Process exit code */
  exitCode?: number;
  /** Standard output */
  stdout?: string;
  /** Standard error */
  stderr?: string;
  /** Execution time in ms */
  durationMs?: number;
  /** System error (not command failure) */
  error?: string;
  /** True if command timed out */
  timedOut?: boolean;
}

/** Indicates execution is paused awaiting approval */
export interface ApprovalRequiredEvent extends BaseEvent {
  type: 'approvalRequired';
  /** Operation type requiring approval */
  operationType: string;
  /** Why approval is needed */
  reason: string;
  /** Additional details */
  details: {
    command?: string;
    path?: string;
    policy?: string;
  };
}

/** Indicates an operation was denied by policy */
export interface PolicyDeniedEvent extends BaseEvent {
  type: 'policyDenied';
  operationType: string;
  reason: string;
  /** How to resolve (if applicable) */
  suggestion?: string;
}

/** General error event */
export interface ErrorEvent extends BaseEvent {
  type: 'error';
  category: 'validation' | 'policy' | 'execution' | 'timeout' | 'system';
  message: string;
  details?: Record<string, unknown>;
}

/** Union of all event types */
export type Event =
  | UserMessageEvent
  | MessageEvent
  | CreateFileEvent
  | ReadFileEvent
  | EditFileEvent
  | DeleteFileEvent
  | ShellEvent
  | ApprovalRequiredEvent
  | PolicyDeniedEvent
  | ErrorEvent;

/** Event type literal union */
export type EventType = Event['type'];

/** Run status */
export type RunStatus = 'completed' | 'awaiting_approval' | 'error';

