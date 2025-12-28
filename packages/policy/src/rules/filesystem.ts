import type { FilesystemPolicy, PolicyEvaluation } from '../types';

/**
 * Check if a path matches a pattern (simple glob support).
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Simple glob matching: * matches any characters
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*'); // Convert * to .*
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Check if a path matches any pattern in a list.
 */
function matchesAnyPattern(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(path, pattern));
}

/**
 * Evaluate filesystem policy for a path.
 */
export function evaluateFilesystemPolicy(
  policy: FilesystemPolicy,
  path: string,
  isWrite: boolean
): PolicyEvaluation {
  // Check if filesystem is enabled
  if (!policy.enabled) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Filesystem access is disabled',
      policy: 'filesystem.enabled',
    };
  }

  // Check read-only for write operations
  if (isWrite && policy.readOnly) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Filesystem is read-only',
      suggestion: 'Use a policy that allows write access',
      policy: 'filesystem.readOnly',
    };
  }

  // Check blocked paths
  if (policy.blockedPaths && matchesAnyPattern(path, policy.blockedPaths)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Path "${path}" is blocked by policy`,
      policy: 'filesystem.blockedPaths',
    };
  }

  // Check allowed paths (if specified, path must match)
  if (
    policy.allowedPaths &&
    policy.allowedPaths.length > 0 &&
    !matchesAnyPattern(path, policy.allowedPaths)
  ) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Path "${path}" is not in allowed paths`,
      policy: 'filesystem.allowedPaths',
    };
  }

  return {
    allowed: true,
    requiresApproval: false,
  };
}

/**
 * Evaluate file size against policy.
 */
export function evaluateFileSize(
  policy: FilesystemPolicy,
  size: number
): PolicyEvaluation {
  if (size > policy.maxFileSize) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `File size (${size} bytes) exceeds limit (${policy.maxFileSize} bytes)`,
      policy: 'filesystem.maxFileSize',
    };
  }

  return {
    allowed: true,
    requiresApproval: false,
  };
}



