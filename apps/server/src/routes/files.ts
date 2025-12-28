import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { spaceService } from './spaces';
import type { AppVariables } from '../types';

const files = new Hono<{ Variables: AppVariables }>();

// Request schemas
const writeFileSchema = z.object({
  content: z.string(),
  encoding: z.enum(['utf-8', 'base64']).optional(),
});

/**
 * GET /spaces/:spaceId/files/*
 * Read a file from the workspace.
 */
files.get('/*', async (c) => {
  const spaceId = c.req.param('spaceId') || '';
  const path = c.req.path.replace(`/v1/spaces/${spaceId}/files/`, '');
  const requestId = c.get('requestId') || 'unknown';

  const sandbox = spaceService.getSandbox(spaceId);

  if (!sandbox) {
    return c.json(
      {
        error: {
          code: 'SPACE_NOT_FOUND',
          message: `Space ${spaceId} not found`,
        },
        meta: { requestId },
      },
      404
    );
  }

  // If path is empty or ends with /, list directory
  if (!path || path.endsWith('/')) {
    const dirPath = path.slice(0, -1) || '';
    const recursive = c.req.query('recursive') === 'true';
    const fileList = await sandbox.listFiles(dirPath, recursive);

    return c.json({
      data: {
        path: dirPath || '/',
        files: fileList.map((f) => ({
          name: f.path.split('/').pop(),
          path: f.path,
          type: f.isDirectory ? 'directory' : 'file',
          size: f.size,
          modifiedAt: f.modifiedAt.toISOString(),
        })),
      },
      meta: { requestId },
    });
  }

  // Read file
  const encoding = (c.req.query('encoding') as 'utf-8' | 'base64') || 'utf-8';
  const result = await sandbox.readFile(path, encoding);

  if (!result.success) {
    return c.json(
      {
        error: {
          code: 'FILE_NOT_FOUND',
          message: result.error || `File ${path} not found`,
        },
        meta: { requestId },
      },
      404
    );
  }

  return c.json({
    data: {
      path,
      content: result.content,
      size: result.size,
      encoding,
    },
    meta: { requestId },
  });
});

/**
 * PUT /spaces/:spaceId/files/*
 * Write a file to the workspace.
 */
files.put('/*', zValidator('json', writeFileSchema), async (c) => {
  const spaceId = c.req.param('spaceId') || '';
  const path = c.req.path.replace(`/v1/spaces/${spaceId}/files/`, '');
  const body = c.req.valid('json');
  const requestId = c.get('requestId') || 'unknown';

  const sandbox = spaceService.getSandbox(spaceId);

  if (!sandbox) {
    return c.json(
      {
        error: {
          code: 'SPACE_NOT_FOUND',
          message: `Space ${spaceId} not found`,
        },
        meta: { requestId },
      },
      404
    );
  }

  const result = await sandbox.createFile(path, body.content, {
    overwrite: true,
    encoding: body.encoding,
  });

  if (!result.success) {
    return c.json(
      {
        error: {
          code: 'WRITE_ERROR',
          message: result.error || 'Failed to write file',
        },
        meta: { requestId },
      },
      400
    );
  }

  return c.json({
    data: {
      path,
      size: result.size,
    },
    meta: { requestId },
  });
});

/**
 * DELETE /spaces/:spaceId/files/*
 * Delete a file from the workspace.
 */
files.delete('/*', async (c) => {
  const spaceId = c.req.param('spaceId') || '';
  const path = c.req.path.replace(`/v1/spaces/${spaceId}/files/`, '');
  const requestId = c.get('requestId') || 'unknown';

  const sandbox = spaceService.getSandbox(spaceId);

  if (!sandbox) {
    return c.json(
      {
        error: {
          code: 'SPACE_NOT_FOUND',
          message: `Space ${spaceId} not found`,
        },
        meta: { requestId },
      },
      404
    );
  }

  const result = await sandbox.deleteFile(path);

  if (!result.success) {
    return c.json(
      {
        error: {
          code: 'DELETE_ERROR',
          message: result.error || 'Failed to delete file',
        },
        meta: { requestId },
      },
      400
    );
  }

  return c.json({
    data: {
      path,
      deleted: true,
    },
    meta: { requestId },
  });
});

export { files };

