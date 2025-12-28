import type { Context, Next } from 'hono';
import { nanoid } from 'nanoid';

/**
 * Add a unique request ID to each request.
 */
export async function requestIdMiddleware(c: Context, next: Next) {
  const requestId = c.req.header('X-Request-ID') || `req_${nanoid(12)}`;
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
}

