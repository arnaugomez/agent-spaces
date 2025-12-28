import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Operation, Event } from '@agent-spaces/protocol';
import { getDatabase, runs, type Run, type NewRun } from '../db';
import { SpaceService } from '../space/space.service';
import { executeRun, type ExecuteRunResult } from './run.executor';

/**
 * Options for creating a run.
 */
export interface CreateRunOptions {
  spaceId: string;
  operations: Operation[];
}

/**
 * Service for managing runs.
 */
export class RunService {
  constructor(private spaceService: SpaceService) {}

  /**
   * Create and execute a new run.
   */
  async create(options: CreateRunOptions): Promise<Run & { result: ExecuteRunResult }> {
    const db = getDatabase();
    const { spaceId, operations } = options;

    // Get sandbox and policy engine
    const sandbox = this.spaceService.getSandbox(spaceId);
    const policyEngine = this.spaceService.getPolicyEngine(spaceId);

    if (!sandbox || !policyEngine) {
      throw new Error(`Space ${spaceId} not found or not initialized`);
    }

    const id = `run_${nanoid(12)}`;
    const startedAt = new Date();

    // Execute the run
    const result = await executeRun({
      operations,
      sandbox,
      policyEngine,
    });

    // Create run record
    const newRun: NewRun = {
      id,
      spaceId,
      status: result.status,
      operations: operations as unknown as string,
      events: result.events as unknown as string,
      pendingApproval: result.pendingApproval || null,
      startedAt,
      completedAt: result.status === 'completed' ? new Date() : undefined,
    };

    await db.insert(runs).values(newRun);

    return {
      ...(newRun as Run),
      result,
    };
  }

  /**
   * Get a run by ID.
   */
  async get(id: string): Promise<Run | null> {
    const db = getDatabase();
    const result = await db.select().from(runs).where(eq(runs.id, id));
    return result[0] || null;
  }

  /**
   * List runs for a space.
   */
  async list(
    spaceId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<Run[]> {
    const db = getDatabase();

    if (options.status) {
      const result = await db
        .select()
        .from(runs)
        .where(
          and(
            eq(runs.spaceId, spaceId),
            eq(runs.status, options.status as Run['status'])
          )
        )
        .limit(options.limit || 20)
        .offset(options.offset || 0);
      return result;
    }

    const result = await db
      .select()
      .from(runs)
      .where(eq(runs.spaceId, spaceId))
      .limit(options.limit || 20)
      .offset(options.offset || 0);
    return result;
  }

  /**
   * Resume a run after approval.
   */
  async resume(
    runId: string,
    approval: { operationId: string; decision: 'approved' | 'denied'; reason?: string }
  ): Promise<Run & { result: ExecuteRunResult }> {
    const run = await this.get(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    if (run.status !== 'awaiting_approval') {
      throw new Error(`Run ${runId} is not awaiting approval`);
    }

    const db = getDatabase();
    const sandbox = this.spaceService.getSandbox(run.spaceId);
    const policyEngine = this.spaceService.getPolicyEngine(run.spaceId);

    if (!sandbox || !policyEngine) {
      throw new Error(`Space ${run.spaceId} not found or not initialized`);
    }

    // Get operations that were pending
    const operations = run.operations as unknown as Operation[];
    const events = run.events as unknown as Event[];

    // Find the index of the pending operation
    const pendingIndex = operations.findIndex(
      (op) => op.id === approval.operationId
    );

    if (pendingIndex === -1) {
      throw new Error(`Operation ${approval.operationId} not found in run`);
    }

    let newEvents: Event[] = [];
    let status: Run['status'] = 'completed';
    let pendingApproval = null;

    if (approval.decision === 'denied') {
      // Add denial event
      newEvents.push({
        type: 'policyDenied',
        timestamp: new Date().toISOString(),
        operationId: approval.operationId,
        operationType: operations[pendingIndex].type,
        reason: approval.reason || 'Approval denied by user',
      });
    } else {
      // Execute remaining operations starting from the pending one
      const remainingOperations = operations.slice(pendingIndex);
      const result = await executeRun({
        operations: remainingOperations,
        sandbox,
        policyEngine,
      });

      newEvents = result.events;
      status = result.status;
      pendingApproval = result.pendingApproval || null;
    }

    // Update run
    const allEvents = [...events, ...newEvents];

    await db
      .update(runs)
      .set({
        status,
        events: allEvents as unknown as string,
        pendingApproval,
        completedAt: status === 'completed' ? new Date() : undefined,
      })
      .where(eq(runs.id, runId));

    const updatedRun = await this.get(runId);

    return {
      ...updatedRun!,
      result: { events: newEvents, status },
    };
  }

  /**
   * Cancel a run.
   */
  async cancel(runId: string): Promise<Run | null> {
    const db = getDatabase();

    await db
      .update(runs)
      .set({
        status: 'cancelled',
        completedAt: new Date(),
      })
      .where(eq(runs.id, runId));

    return this.get(runId);
  }
}

