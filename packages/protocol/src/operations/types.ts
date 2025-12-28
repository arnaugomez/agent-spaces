/**
 * Operation types for the Agent Spaces protocol.
 * These are instructions emitted by the agent for the runtime to perform.
 */

/** Base operation interface with optional correlation ID */
export interface BaseOperation {
  /** Optional correlation ID for tracking */
  id?: string;
}

/** Communicate intent or progress to the user (non-executing) */
export interface MessageOperation extends BaseOperation {
  type: 'message';
  /** Human-readable message content */
  content: string;
}

/** Create a new file in the workspace */
export interface CreateFileOperation extends BaseOperation {
  type: 'createFile';
  /** Relative path within workspace */
  path: string;
  /** File content */
  content: string;
  /** Content encoding (default: utf-8) */
  encoding?: 'utf-8' | 'base64';
  /** Whether to overwrite existing file (default: false) */
  overwrite?: boolean;
}

/** Request the content of a file */
export interface ReadFileOperation extends BaseOperation {
  type: 'readFile';
  /** Relative path within workspace */
  path: string;
  /** Content encoding (default: utf-8) */
  encoding?: 'utf-8' | 'base64';
}

/** File edit specification */
export interface FileEdit {
  /** Content to find */
  oldContent: string;
  /** Content to replace with */
  newContent: string;
}

/** Apply edits to an existing file */
export interface EditFileOperation extends BaseOperation {
  type: 'editFile';
  /** Relative path within workspace */
  path: string;
  /** List of edits to apply */
  edits: FileEdit[];
}

/** Delete a file from the workspace */
export interface DeleteFileOperation extends BaseOperation {
  type: 'deleteFile';
  /** Relative path within workspace */
  path: string;
}

/** Execute a shell command */
export interface ShellOperation extends BaseOperation {
  type: 'shell';
  /** Command to execute */
  command: string;
  /** Working directory (relative path) */
  cwd?: string;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Additional environment variables */
  env?: Record<string, string>;
}

/** Union of all operation types */
export type Operation =
  | MessageOperation
  | CreateFileOperation
  | ReadFileOperation
  | EditFileOperation
  | DeleteFileOperation
  | ShellOperation;

/** Operation type literal union */
export type OperationType = Operation['type'];



