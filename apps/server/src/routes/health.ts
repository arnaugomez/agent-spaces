import { Hono } from 'hono';
import { isDockerAvailable } from '@agent-spaces/sandbox';
import type { AppVariables } from '../types';

const health = new Hono<{ Variables: AppVariables }>();

/**
 * GET /health
 * Health check endpoint.
 */
health.get('/', async (c) => {
  const dockerAvailable = await isDockerAvailable();

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      docker: dockerAvailable ? 'ok' : 'unavailable',
    },
  });
});

/**
 * GET /health/ready
 * Readiness check - is the service ready to accept requests?
 */
health.get('/ready', async (c) => {
  const dockerAvailable = await isDockerAvailable();

  if (!dockerAvailable) {
    return c.json(
      {
        status: 'not_ready',
        reason: 'Docker is not available',
      },
      503
    );
  }

  return c.json({
    status: 'ready',
  });
});

export { health };

