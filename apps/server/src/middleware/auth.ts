import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { config } from '../config';

/**
 * API key authentication middleware.
 */
export async function authMiddleware(c: Context, next: Next) {
  // Skip auth if disabled (development mode)
  if (config.authDisabled) {
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    throw new HTTPException(401, {
      message: 'Missing Authorization header',
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Invalid Authorization header format. Expected: Bearer <token>',
    });
  }

  const token = authHeader.slice(7);

  // Validate token
  if (!isValidApiKey(token)) {
    throw new HTTPException(401, {
      message: 'Invalid API key',
    });
  }

  // Store API key info in context
  c.set('apiKey', token);

  await next();
}

/**
 * Validate an API key.
 * In a real implementation, this would verify against a database.
 */
function isValidApiKey(key: string): boolean {
  // Simple validation: check prefix and length
  return (
    (key.startsWith('as_live_') || key.startsWith('as_test_')) &&
    key.length > 20
  );
}



