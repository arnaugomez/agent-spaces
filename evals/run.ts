#!/usr/bin/env bun
/**
 * Run Agent Spaces evals.
 */

import { AgentSpaces } from '@agent-spaces/sdk';
import { getLLMConfig, generateOperations } from './lib/llm';
import { checkExpectedBehavior, type EvalDefinition, type EvalResult } from './lib/runner';
import type { Event } from '@agent-spaces/protocol';

// Import eval scenarios
import fileOperations from './scenarios/file-operations.eval';
import shellExecution from './scenarios/shell-execution.eval';
import capabilities from './scenarios/capabilities.eval';

const EVALS: EvalDefinition[] = [fileOperations, shellExecution, capabilities];

/**
 * Run a single eval.
 */
async function runEval(
  client: AgentSpaces,
  llmConfig: ReturnType<typeof getLLMConfig>,
  eval_: EvalDefinition
): Promise<EvalResult> {
  const startTime = Date.now();
  const allOperations: unknown[] = [];
  const allEvents: Event[] = [];

  try {
    // Create a space for this eval
    const space = await client.spaces.create({
      name: `eval-${eval_.name}`,
      policy: 'standard',
    });

    let turns = 0;
    let events: Event[] = [];

    while (turns < (eval_.maxTurns || 5)) {
      turns++;

      // Generate operations from LLM
      const operations = await generateOperations(llmConfig, eval_.prompt, events);
      allOperations.push(...operations);

      if (operations.length === 0) {
        break;
      }

      // Execute operations
      const run = await space.run({ operations });
      events = run.events;
      allEvents.push(...events);

      // Check if we're done
      if (run.status === 'completed') {
        // Check success criteria
        const passed = eval_.successCriteria(allEvents);

        // Check expected behavior if specified
        if (passed && eval_.expectedBehavior) {
          const behaviorOk = checkExpectedBehavior(operations, eval_.expectedBehavior);
          if (!behaviorOk) {
            await space.destroy();
            return {
              name: eval_.name,
              passed: false,
              turns,
              operations: allOperations as never[],
              events: allEvents,
              durationMs: Date.now() - startTime,
              error: 'Expected behavior not matched',
            };
          }
        }

        await space.destroy();
        return {
          name: eval_.name,
          passed,
          turns,
          operations: allOperations as never[],
          events: allEvents,
          durationMs: Date.now() - startTime,
        };
      }

      // Handle approval required (auto-approve for evals)
      if (run.status === 'awaiting_approval' && run.pendingApproval) {
        await run.approve({
          operationId: run.pendingApproval.operationId,
          reason: 'Auto-approved for eval',
        });
      }
    }

    await space.destroy();
    return {
      name: eval_.name,
      passed: false,
      turns,
      operations: allOperations as never[],
      events: allEvents,
      durationMs: Date.now() - startTime,
      error: 'Max turns exceeded',
    };
  } catch (error) {
    return {
      name: eval_.name,
      passed: false,
      turns: 0,
      operations: allOperations as never[],
      events: allEvents,
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main entry point.
 */
async function main() {
  console.log('Agent Spaces Evals\n');

  // Get LLM config
  let llmConfig: ReturnType<typeof getLLMConfig>;
  try {
    llmConfig = getLLMConfig();
    console.log(`Using ${llmConfig.provider} (${llmConfig.model})\n`);
  } catch (error) {
    console.error((error as Error).message);
    console.log('\nSet OPENAI_API_KEY or ANTHROPIC_API_KEY to run evals.');
    process.exit(1);
  }

  // Create SDK client
  const client = new AgentSpaces({
    baseUrl: process.env.AGENT_SPACES_URL || 'http://localhost:3000',
  });

  // Run evals
  const results: EvalResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const eval_ of EVALS) {
    process.stdout.write(`Running: ${eval_.name}... `);

    const result = await runEval(client, llmConfig, eval_);
    results.push(result);

    if (result.passed) {
      passed++;
      console.log(`✓ passed (${result.durationMs}ms)`);
    } else {
      failed++;
      console.log(`✗ failed: ${result.error || 'criteria not met'}`);
    }
  }

  // Summary
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);

