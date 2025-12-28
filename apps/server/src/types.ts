import type { Context } from 'hono';

/**
 * Custom context variables for Agent Spaces.
 */
export interface AppVariables {
  requestId: string;
  apiKey?: string;
}

/**
 * Application context type with custom variables.
 */
export type AppContext = Context<{ Variables: AppVariables }>;



