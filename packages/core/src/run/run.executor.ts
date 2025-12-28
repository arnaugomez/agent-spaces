import type { Operation, Event } from '@agent-spaces/protocol';
import { Sandbox } from '@agent-spaces/sandbox';
import { PolicyEngine } from '@agent-spaces/policy';
import type { RunStatus } from '@agent-spaces/protocol';

/**
 * Options for executing a run.
 */
export interface ExecuteRunOptions {
  operations: Operation[];
  sandbox: Sandbox;
  policyEngine: PolicyEngine;
}

/**
 * Result of a run execution.
 */
export interface ExecuteRunResult {
  events: Event[];
  status: RunStatus;
  pendingApproval?: {
    operationId: string;
    operationType: string;
    reason: string;
    details: Record<string, unknown>;
  };
}

/**
 * Execute a list of operations in a sandbox.
 */
export async function executeRun(
  options: ExecuteRunOptions
): Promise<ExecuteRunResult> {
  const { operations, sandbox, policyEngine } = options;
  const events: Event[] = [];

  for (const operation of operations) {
    // Check policy
    const policyResult = policyEngine.evaluate(operation);

    if (!policyResult.allowed) {
      // Policy denied
      events.push({
        type: 'policyDenied',
        timestamp: new Date().toISOString(),
        operationId: operation.id,
        operationType: operation.type,
        reason: policyResult.reason || 'Operation denied by policy',
        suggestion: policyResult.suggestion,
      });
      continue;
    }

    if (policyResult.requiresApproval) {
      // Pause for approval
      const details: Record<string, unknown> = { policy: policyResult.policy };
      if (operation.type === 'shell') {
        details.command = operation.command;
      } else if ('path' in operation) {
        details.path = operation.path;
      }

      events.push({
        type: 'approvalRequired',
        timestamp: new Date().toISOString(),
        operationId: operation.id || '',
        operationType: operation.type,
        reason: policyResult.reason || 'Operation requires approval',
        details,
      });

      return {
        events,
        status: 'awaiting_approval',
        pendingApproval: {
          operationId: operation.id || '',
          operationType: operation.type,
          reason: policyResult.reason || 'Operation requires approval',
          details,
        },
      };
    }

    // Execute the operation
    const event = await executeOperation(operation, sandbox);
    events.push(event);
  }

  return {
    events,
    status: 'completed',
  };
}

/**
 * Execute a single operation.
 */
async function executeOperation(
  operation: Operation,
  sandbox: Sandbox
): Promise<Event> {
  const timestamp = new Date().toISOString();

  switch (operation.type) {
    case 'message':
      return {
        type: 'message',
        timestamp,
        operationId: operation.id,
        success: true,
      };

    case 'createFile': {
      const result = await sandbox.createFile(operation.path, operation.content, {
        overwrite: operation.overwrite,
        encoding: operation.encoding,
      });

      return {
        type: 'createFile',
        timestamp,
        operationId: operation.id,
        path: operation.path,
        success: result.success,
        bytesWritten: result.size,
        error: result.error,
      };
    }

    case 'readFile': {
      const result = await sandbox.readFile(operation.path, operation.encoding);

      return {
        type: 'readFile',
        timestamp,
        operationId: operation.id,
        path: operation.path,
        success: result.success,
        content: result.content,
        encoding: operation.encoding,
        size: result.size,
        error: result.error,
      };
    }

    case 'editFile': {
      const result = await sandbox.editFile(operation.path, operation.edits);

      return {
        type: 'editFile',
        timestamp,
        operationId: operation.id,
        path: operation.path,
        success: result.success,
        editsApplied: result.editsApplied,
        error: result.error,
      };
    }

    case 'deleteFile': {
      const result = await sandbox.deleteFile(operation.path);

      return {
        type: 'deleteFile',
        timestamp,
        operationId: operation.id,
        path: operation.path,
        success: result.success,
        error: result.error,
      };
    }

    case 'shell': {
      const result = await sandbox.exec(operation.command, {
        cwd: operation.cwd,
        env: operation.env,
        timeout: operation.timeout,
      });

      return {
        type: 'shell',
        timestamp,
        operationId: operation.id,
        command: operation.command,
        success: result.success,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs,
        timedOut: result.timedOut,
      };
    }

    default:
      return {
        type: 'error',
        timestamp,
        category: 'validation',
        message: `Unknown operation type: ${(operation as Operation).type}`,
      };
  }
}



