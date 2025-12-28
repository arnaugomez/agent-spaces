import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { RunService } from '@agent-spaces/core';
import { operationsMessageSchema } from '@agent-spaces/protocol';
import { PROTOCOL_VERSION } from '@agent-spaces/protocol';
import { spaceService } from './spaces';
import type { AppVariables } from '../types';

const runs = new Hono<{ Variables: AppVariables }>();

// Shared run service instance
const runService = new RunService(spaceService);

// Request schemas
const createRunSchema = z.object({
  protocolVersion: z.literal(PROTOCOL_VERSION),
  operations: z.array(z.record(z.string(), z.unknown())),
  context: z
    .object({
      files: z.array(z.string()).optional(),
    })
    .optional(),
});

const resumeRunSchema = z.object({
  approval: z.object({
    operationId: z.string(),
    decision: z.enum(['approved', 'denied']),
    reason: z.string().optional(),
  }),
});

/**
 * POST /spaces/:spaceId/runs
 * Execute operations in a space.
 */
runs.post('/', zValidator('json', createRunSchema), async (c) => {
  const spaceId = c.req.param('spaceId') || '';
  const body = c.req.valid('json');
  const requestId = c.get('requestId') || 'unknown';

  // Validate operations using protocol schema
  const validatedMessage = operationsMessageSchema.safeParse({
    protocolVersion: body.protocolVersion,
    operations: body.operations,
  });

  if (!validatedMessage.success) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid operations',
          details: validatedMessage.error.issues,
        },
        meta: { requestId },
      },
      400
    );
  }

  try {
    const { result, ...run } = await runService.create({
      spaceId,
      operations: validatedMessage.data.operations,
    });

    return c.json(
      {
        data: {
          id: run.id,
          spaceId: run.spaceId,
          status: run.status,
          protocolVersion: PROTOCOL_VERSION,
          events: result.events,
          pendingApproval: result.pendingApproval,
          startedAt: run.startedAt?.toISOString(),
          completedAt: run.completedAt?.toISOString(),
        },
        meta: { requestId: requestId || 'unknown' },
      },
      run.status === 'awaiting_approval' ? 200 : 201
    );
  } catch (error) {
    return c.json(
      {
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        meta: { requestId },
      },
      500
    );
  }
});

/**
 * GET /spaces/:spaceId/runs
 * List runs for a space.
 */
runs.get('/', async (c) => {
  const spaceId = c.req.param('spaceId') || '';
  const requestId = c.get('requestId') || 'unknown';
  const status = c.req.query('status');
  const limit = Number(c.req.query('limit')) || 20;
  const offset = Number(c.req.query('offset')) || 0;

  const runList = await runService.list(spaceId, { status, limit, offset });

  return c.json({
    data: runList.map((run) => ({
      id: run.id,
      spaceId: run.spaceId,
      status: run.status,
      startedAt: run.startedAt?.toISOString(),
      completedAt: run.completedAt?.toISOString(),
    })),
    meta: {
      requestId,
      hasMore: runList.length === limit,
    },
  });
});

/**
 * GET /spaces/:spaceId/runs/:runId
 * Get a run by ID.
 */
runs.get('/:runId', async (c) => {
  const runId = c.req.param('runId') || '';
  const requestId = c.get('requestId') || 'unknown';

  const run = await runService.get(runId);

  if (!run) {
    return c.json(
      {
        error: {
          code: 'RUN_NOT_FOUND',
          message: `Run ${runId} not found`,
        },
        meta: { requestId },
      },
      404
    );
  }

  return c.json({
    data: {
      id: run.id,
      spaceId: run.spaceId,
      status: run.status,
      protocolVersion: PROTOCOL_VERSION,
      events: run.events,
      pendingApproval: run.pendingApproval,
      startedAt: run.startedAt?.toISOString(),
      completedAt: run.completedAt?.toISOString(),
    },
    meta: { requestId },
  });
});

/**
 * POST /spaces/:spaceId/runs/:runId/resume
 * Resume a run after approval.
 */
runs.post('/:runId/resume', zValidator('json', resumeRunSchema), async (c) => {
  const runId = c.req.param('runId') || '';
  const body = c.req.valid('json');
  const requestId = c.get('requestId') || 'unknown';

  try {
    const { result, ...run } = await runService.resume(runId, body.approval);

    return c.json({
      data: {
        id: run.id,
        spaceId: run.spaceId,
        status: run.status,
        protocolVersion: PROTOCOL_VERSION,
        events: result.events,
        pendingApproval: run.pendingApproval,
        startedAt: run.startedAt?.toISOString(),
        completedAt: run.completedAt?.toISOString(),
      },
      meta: { requestId },
    });
  } catch (error) {
    return c.json(
      {
        error: {
          code: 'RESUME_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        meta: { requestId },
      },
      400
    );
  }
});

/**
 * POST /spaces/:spaceId/runs/:runId/cancel
 * Cancel a run.
 */
runs.post('/:runId/cancel', async (c) => {
  const runId = c.req.param('runId') || '';
  const requestId = c.get('requestId') || 'unknown';

  const run = await runService.cancel(runId);

  if (!run) {
    return c.json(
      {
        error: {
          code: 'RUN_NOT_FOUND',
          message: `Run ${runId} not found`,
        },
        meta: { requestId },
      },
      404
    );
  }

  return c.json({
    data: {
      id: run.id,
      status: run.status,
      cancelledAt: new Date().toISOString(),
    },
    meta: { requestId },
  });
});

export { runs, runService };

