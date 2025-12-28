/**
 * Policy types for Agent Spaces access control.
 */

/** Policy preset names */
export type PolicyPreset = 'restrictive' | 'standard' | 'permissive';

/** Filesystem policy configuration */
export interface FilesystemPolicy {
  /** Whether filesystem access is enabled */
  enabled: boolean;
  /** Whether the filesystem is read-only */
  readOnly: boolean;
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Allowed file patterns (glob) */
  allowedPaths?: string[];
  /** Blocked file patterns (glob) */
  blockedPaths?: string[];
}

/** Shell policy configuration */
export interface ShellPolicy {
  /** Whether shell execution is enabled */
  enabled: boolean;
  /** Allowed commands (exact match or regex) */
  allowedCommands?: string[];
  /** Blocked command patterns */
  blockedPatterns?: string[];
  /** Default timeout in milliseconds */
  timeout: number;
  /** Commands that require approval */
  approvalRequired?: string[];
}

/** Network policy configuration */
export interface NetworkPolicy {
  /** Whether network access is enabled */
  enabled: boolean;
  /** Allowed domains */
  allowedDomains?: string[];
  /** Blocked domains */
  blockedDomains?: string[];
}

/** Complete policy configuration */
export interface Policy {
  /** Policy name/preset */
  name: string;
  /** Description */
  description?: string;
  /** Filesystem rules */
  filesystem: FilesystemPolicy;
  /** Shell rules */
  shell: ShellPolicy;
  /** Network rules */
  network: NetworkPolicy;
}

/** Policy evaluation result */
export interface PolicyEvaluation {
  /** Whether the operation is allowed */
  allowed: boolean;
  /** Whether approval is required */
  requiresApproval: boolean;
  /** Reason for denial (if not allowed) */
  reason?: string;
  /** Suggestion for resolving denial */
  suggestion?: string;
  /** Policy that triggered the decision */
  policy?: string;
}

/** Policy context for evaluation */
export interface PolicyContext {
  /** Operation type being evaluated */
  operationType: string;
  /** File path (if applicable) */
  path?: string;
  /** Shell command (if applicable) */
  command?: string;
  /** Domain (if applicable) */
  domain?: string;
}



