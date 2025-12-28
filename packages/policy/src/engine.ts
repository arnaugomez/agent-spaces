import type { Operation } from '@agent-spaces/protocol';
import type { Policy, PolicyEvaluation } from './types';
import {
  evaluateFilesystemPolicy,
  evaluateFileSize,
} from './rules/filesystem';
import { evaluateShellPolicy, getShellTimeout } from './rules/shell';
import { getPreset } from './presets';
import type { PolicyPreset } from './types';

/**
 * Policy engine for evaluating operations against policies.
 */
export class PolicyEngine {
  constructor(private policy: Policy) {}

  /**
   * Create a policy engine from a preset name.
   */
  static fromPreset(preset: PolicyPreset): PolicyEngine {
    return new PolicyEngine(getPreset(preset));
  }

  /**
   * Create a policy engine from a preset with overrides.
   */
  static fromPresetWithOverrides(
    preset: PolicyPreset,
    overrides: Partial<Policy>
  ): PolicyEngine {
    const basePolicy = getPreset(preset);
    const mergedPolicy: Policy = {
      ...basePolicy,
      ...overrides,
      filesystem: { ...basePolicy.filesystem, ...overrides.filesystem },
      shell: { ...basePolicy.shell, ...overrides.shell },
      network: { ...basePolicy.network, ...overrides.network },
    };
    return new PolicyEngine(mergedPolicy);
  }

  /**
   * Get the current policy configuration.
   */
  getPolicy(): Policy {
    return this.policy;
  }

  /**
   * Evaluate an operation against the policy.
   */
  evaluate(operation: Operation): PolicyEvaluation {
    switch (operation.type) {
      case 'message':
        // Messages are always allowed
        return { allowed: true, requiresApproval: false };

      case 'createFile':
        return this.evaluateCreateFile(operation.path, operation.content);

      case 'readFile':
        return this.evaluateReadFile(operation.path);

      case 'editFile':
        return this.evaluateEditFile(operation.path);

      case 'deleteFile':
        return this.evaluateDeleteFile(operation.path);

      case 'shell':
        return this.evaluateShell(operation.command);

      default:
        return {
          allowed: false,
          requiresApproval: false,
          reason: 'Unknown operation type',
        };
    }
  }

  /**
   * Evaluate a createFile operation.
   */
  private evaluateCreateFile(
    path: string,
    content: string
  ): PolicyEvaluation {
    // Check path access
    const pathEval = evaluateFilesystemPolicy(
      this.policy.filesystem,
      path,
      true
    );
    if (!pathEval.allowed) {
      return pathEval;
    }

    // Check file size
    const sizeEval = evaluateFileSize(
      this.policy.filesystem,
      content.length
    );
    if (!sizeEval.allowed) {
      return sizeEval;
    }

    return { allowed: true, requiresApproval: false };
  }

  /**
   * Evaluate a readFile operation.
   */
  private evaluateReadFile(path: string): PolicyEvaluation {
    return evaluateFilesystemPolicy(this.policy.filesystem, path, false);
  }

  /**
   * Evaluate an editFile operation.
   */
  private evaluateEditFile(path: string): PolicyEvaluation {
    return evaluateFilesystemPolicy(this.policy.filesystem, path, true);
  }

  /**
   * Evaluate a deleteFile operation.
   */
  private evaluateDeleteFile(path: string): PolicyEvaluation {
    return evaluateFilesystemPolicy(this.policy.filesystem, path, true);
  }

  /**
   * Evaluate a shell operation.
   */
  private evaluateShell(command: string): PolicyEvaluation {
    return evaluateShellPolicy(this.policy.shell, command);
  }

  /**
   * Get the effective timeout for a shell command.
   */
  getShellTimeout(requestedTimeout?: number): number {
    return getShellTimeout(this.policy.shell, requestedTimeout);
  }

  /**
   * Check if network access is allowed for a domain.
   */
  isNetworkAllowed(domain: string): PolicyEvaluation {
    const { evaluateNetworkPolicy } = require('./rules/network');
    return evaluateNetworkPolicy(this.policy.network, domain);
  }
}

