import type { Operation, Event } from '@agent-spaces/protocol';

/**
 * Expected behavior pattern for an operation.
 */
export interface ExpectedBehavior {
  type: string;
  pathPattern?: RegExp;
  commandPattern?: RegExp;
  contentPattern?: RegExp;
}

/**
 * Eval definition.
 */
export interface EvalDefinition {
  /** Unique name for the eval */
  name: string;
  /** Description of what the eval tests */
  description?: string;
  /** Prompt to send to the LLM */
  prompt: string;
  /** Expected operation patterns */
  expectedBehavior?: ExpectedBehavior[];
  /** Function to check if the eval succeeded */
  successCriteria: (events: Event[]) => boolean;
  /** Maximum number of turns */
  maxTurns?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Eval result.
 */
export interface EvalResult {
  name: string;
  passed: boolean;
  turns: number;
  operations: Operation[];
  events: Event[];
  durationMs: number;
  error?: string;
}

/**
 * Define an eval.
 */
export function defineEval(definition: EvalDefinition): EvalDefinition {
  return {
    maxTurns: 5,
    timeout: 60000,
    ...definition,
  };
}

/**
 * Check if operations match expected behavior patterns.
 */
export function checkExpectedBehavior(
  operations: Operation[],
  expected: ExpectedBehavior[]
): boolean {
  for (const exp of expected) {
    const found = operations.some((op) => {
      if (op.type !== exp.type) return false;

      if (exp.pathPattern && 'path' in op) {
        if (!exp.pathPattern.test(op.path)) return false;
      }

      if (exp.commandPattern && op.type === 'shell') {
        if (!exp.commandPattern.test(op.command)) return false;
      }

      if (exp.contentPattern && 'content' in op) {
        if (!exp.contentPattern.test(op.content as string)) return false;
      }

      return true;
    });

    if (!found) return false;
  }

  return true;
}

