/**
 * Server configuration from environment variables.
 */
export const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Database
  databaseUrl: process.env.DATABASE_URL || './data/agent-spaces.db',

  // Sandbox
  workspaceBaseDir: process.env.WORKSPACE_BASE_DIR || './data/workspaces',
  sandboxBaseImage: process.env.SANDBOX_BASE_IMAGE || 'oven/bun:1',
  sandboxTimeout: Number(process.env.SANDBOX_TIMEOUT) || 30000,

  // Auth
  apiKeySecret: process.env.API_KEY_SECRET || 'development-secret',
  authDisabled: process.env.AUTH_DISABLED === 'true',

  // API
  apiVersion: 'v1',
};

export type Config = typeof config;

