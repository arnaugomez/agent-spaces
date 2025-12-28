import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requestIdMiddleware, authMiddleware, errorHandler } from './middleware';
import { health, spaces, runs, files } from './routes';
import { config } from './config';
import type { AppVariables } from './types';

// Create Hono app
const app = new Hono<{ Variables: AppVariables }>();

// Global middleware
app.use('*', cors());
app.use('*', logger());
app.use('*', requestIdMiddleware);

// Error handler
app.onError(errorHandler);

// Health endpoints (no auth)
app.route('/health', health);

// API v1 routes
const v1 = new Hono<{ Variables: AppVariables }>();

// Auth middleware for API routes
v1.use('*', authMiddleware);

// Mount routes
v1.route('/spaces', spaces);
v1.route('/spaces/:spaceId/runs', runs);
v1.route('/spaces/:spaceId/files', files);

// Root endpoint
v1.get('/', (c) => {
  return c.json({
    name: 'Agent Spaces API',
    version: config.apiVersion,
    documentation: '/v1/docs',
  });
});

// Mount v1 under /v1
app.route('/v1', v1);

// Root redirect
app.get('/', (c) => {
  return c.redirect('/v1');
});

export { app };

