import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SpaceService } from '@agent-spaces/core';
import { config } from '../config';
import type { AppVariables } from '../types';

const spaces = new Hono<{ Variables: AppVariables }>();

// Shared space service instance
const spaceService = new SpaceService(config.workspaceBaseDir);

// Request schemas
const createSpaceSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  policy: z.enum(['restrictive', 'standard', 'permissive']).optional(),
  policyOverrides: z.record(z.string(), z.unknown()).optional(),
  capabilities: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ttlSeconds: z.number().int().positive().optional(),
});

const updateSpaceSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const extendSpaceSchema = z.object({
  duration: z.number().int().positive(),
});

/**
 * POST /spaces
 * Create a new space.
 */
spaces.post('/', zValidator('json', createSpaceSchema), async (c) => {
  const body = c.req.valid('json');
  const requestId = c.get('requestId');

  const space = await spaceService.create({
    name: body.name,
    description: body.description,
    policy: body.policy,
    policyOverrides: body.policyOverrides,
    capabilities: body.capabilities,
    env: body.env,
    metadata: body.metadata,
    ttlSeconds: body.ttlSeconds,
  });

  return c.json(
    {
      data: {
        id: space.id,
        name: space.name,
        description: space.description,
        status: space.status,
        policy: space.policy,
        capabilities: space.capabilities,
        createdAt: space.createdAt?.toISOString(),
        expiresAt: space.expiresAt?.toISOString(),
        metadata: space.metadata,
      },
      meta: { requestId },
    },
    201
  );
});

/**
 * GET /spaces
 * List all spaces.
 */
spaces.get('/', async (c) => {
  const requestId = c.get('requestId');
  const status = c.req.query('status');
  const limit = Number(c.req.query('limit')) || 20;
  const offset = Number(c.req.query('offset')) || 0;

  const spaceList = await spaceService.list({ status, limit, offset });

  return c.json({
    data: spaceList.map((space) => ({
      id: space.id,
      name: space.name,
      status: space.status,
      createdAt: space.createdAt?.toISOString(),
    })),
    meta: {
      requestId,
      hasMore: spaceList.length === limit,
    },
  });
});

/**
 * GET /spaces/:id
 * Get a space by ID.
 */
spaces.get('/:id', async (c) => {
  const id = c.req.param('id');
  const requestId = c.get('requestId');

  const space = await spaceService.get(id);

  if (!space) {
    return c.json(
      {
        error: {
          code: 'SPACE_NOT_FOUND',
          message: `Space ${id} not found`,
        },
        meta: { requestId },
      },
      404
    );
  }

  return c.json({
    data: {
      id: space.id,
      name: space.name,
      description: space.description,
      status: space.status,
      policy: space.policy,
      capabilities: space.capabilities,
      createdAt: space.createdAt?.toISOString(),
      expiresAt: space.expiresAt?.toISOString(),
      metadata: space.metadata,
    },
    meta: { requestId },
  });
});

/**
 * PATCH /spaces/:id
 * Update a space.
 */
spaces.patch('/:id', zValidator('json', updateSpaceSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const requestId = c.get('requestId');

  const space = await spaceService.update(id, body);

  if (!space) {
    return c.json(
      {
        error: {
          code: 'SPACE_NOT_FOUND',
          message: `Space ${id} not found`,
        },
        meta: { requestId },
      },
      404
    );
  }

  return c.json({
    data: {
      id: space.id,
      name: space.name,
      description: space.description,
      status: space.status,
      metadata: space.metadata,
    },
    meta: { requestId },
  });
});

/**
 * DELETE /spaces/:id
 * Delete a space.
 */
spaces.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const requestId = c.get('requestId');

  await spaceService.destroy(id);

  return c.json({
    data: {
      id,
      status: 'destroyed',
      destroyedAt: new Date().toISOString(),
    },
    meta: { requestId },
  });
});

/**
 * POST /spaces/:id/extend
 * Extend the TTL of a space.
 */
spaces.post('/:id/extend', zValidator('json', extendSpaceSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const requestId = c.get('requestId');

  const space = await spaceService.extend(id, body.duration);

  if (!space) {
    return c.json(
      {
        error: {
          code: 'SPACE_NOT_FOUND',
          message: `Space ${id} not found`,
        },
        meta: { requestId },
      },
      404
    );
  }

  return c.json({
    data: {
      id: space.id,
      expiresAt: space.expiresAt?.toISOString(),
    },
    meta: { requestId },
  });
});

export { spaces, spaceService };

