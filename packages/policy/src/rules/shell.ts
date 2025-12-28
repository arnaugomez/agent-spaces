import type { ShellPolicy, PolicyEvaluation } from '../types';

/**
 * Extract the base command from a shell command string.
 */
function extractBaseCommand(command: string): string {
  const trimmed = command.trim();
  const firstSpace = trimmed.indexOf(' ');
  return firstSpace === -1 ? trimmed : trimmed.substring(0, firstSpace);
}

/**
 * Check if a command matches any pattern in a list.
 */
function matchesAnyPattern(command: string, patterns: string[]): boolean {
  return patterns.some((pattern) => command.includes(pattern));
}

/**
 * Evaluate shell policy for a command.
 */
export function evaluateShellPolicy(
  policy: ShellPolicy,
  command: string
): PolicyEvaluation {
  // Check if shell is enabled
  if (!policy.enabled) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Shell execution is disabled',
      suggestion: 'Use a policy that allows shell execution',
      policy: 'shell.enabled',
    };
  }

  // Check blocked patterns first (security priority)
  if (
    policy.blockedPatterns &&
    matchesAnyPattern(command, policy.blockedPatterns)
  ) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Command contains blocked pattern`,
      policy: 'shell.blockedPatterns',
    };
  }

  // Check allowed commands (if specified)
  if (policy.allowedCommands && policy.allowedCommands.length > 0) {
    const baseCommand = extractBaseCommand(command);
    if (!policy.allowedCommands.includes(baseCommand)) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Command "${baseCommand}" is not in allowed commands`,
        suggestion: `Allowed commands: ${policy.allowedCommands.join(', ')}`,
        policy: 'shell.allowedCommands',
      };
    }
  }

  // Check if approval is required
  if (
    policy.approvalRequired &&
    matchesAnyPattern(command, policy.approvalRequired)
  ) {
    return {
      allowed: true,
      requiresApproval: true,
      reason: 'Command requires approval',
      policy: 'shell.approvalRequired',
    };
  }

  return {
    allowed: true,
    requiresApproval: false,
  };
}

/**
 * Get the effective timeout for a command.
 */
export function getShellTimeout(
  policy: ShellPolicy,
  requestedTimeout?: number
): number {
  if (requestedTimeout && requestedTimeout < policy.timeout) {
    return requestedTimeout;
  }
  return policy.timeout;
}



