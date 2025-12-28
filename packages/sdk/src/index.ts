/**
 * @agent-spaces/sdk
 *
 * TypeScript SDK for Agent Spaces.
 */

// Main client
export { AgentSpaces } from './client';
export type { AgentSpacesConfig } from './config';

// Resources
export {
  Space,
  Run,
  SpaceFiles,
  SpaceRuns,
  type SpaceData,
  type RunData,
  type CreateSpaceOptions,
  type RunOptions,
} from './resources';

// Errors
export {
  AgentSpacesError,
  ValidationError,
  NotFoundError,
  PolicyDeniedError,
  ApprovalRequiredError,
  RateLimitError,
  NetworkError,
} from './errors';

// Types (re-exported from protocol)
export * from './types';

