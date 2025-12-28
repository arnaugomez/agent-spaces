/**
 * SDK configuration options.
 */
export interface AgentSpacesConfig {
  /** API key for authentication */
  apiKey?: string;

  /** Base URL for the API (default: http://localhost:3000) */
  baseUrl?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;

  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelay?: number;

  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

/**
 * Resolved configuration with defaults applied.
 */
export interface ResolvedConfig {
  apiKey: string | undefined;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  fetch: typeof fetch;
}

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG: Omit<ResolvedConfig, 'apiKey'> = {
  baseUrl: process.env.AGENT_SPACES_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  fetch: globalThis.fetch,
};

/**
 * Resolve configuration with defaults.
 */
export function resolveConfig(config: AgentSpacesConfig = {}): ResolvedConfig {
  return {
    apiKey: config.apiKey || process.env.AGENT_SPACES_API_KEY,
    baseUrl: config.baseUrl || DEFAULT_CONFIG.baseUrl,
    timeout: config.timeout || DEFAULT_CONFIG.timeout,
    maxRetries: config.maxRetries ?? DEFAULT_CONFIG.maxRetries,
    retryDelay: config.retryDelay || DEFAULT_CONFIG.retryDelay,
    fetch: config.fetch || DEFAULT_CONFIG.fetch,
  };
}



