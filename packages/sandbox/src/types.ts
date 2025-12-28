/**
 * Sandbox types for Agent Spaces.
 */

/** Sandbox configuration */
export interface SandboxConfig {
  /** Unique sandbox ID */
  id: string;
  /** Base Docker image */
  baseImage: string;
  /** Working directory in container */
  workDir: string;
  /** Host path for workspace */
  workspacePath: string;
  /** Environment variables */
  env: Record<string, string>;
  /** Default timeout for commands (ms) */
  timeout: number;
  /** Memory limit in bytes */
  memoryLimit?: number;
  /** CPU limit (number of CPUs) */
  cpuLimit?: number;
}

/** Sandbox status */
export type SandboxStatus =
  | 'creating'
  | 'ready'
  | 'running'
  | 'stopped'
  | 'error';

/** File info in workspace */
export interface FileInfo {
  path: string;
  size: number;
  isDirectory: boolean;
  modifiedAt: Date;
}

/** Result of a file operation */
export interface FileResult {
  success: boolean;
  path: string;
  content?: string;
  size?: number;
  error?: string;
}

/** Result of a shell command */
export interface ShellResult {
  success: boolean;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

/** Sandbox execution context */
export interface ExecutionContext {
  /** Current working directory */
  cwd: string;
  /** Environment variables */
  env: Record<string, string>;
  /** Timeout for this execution */
  timeout: number;
}

