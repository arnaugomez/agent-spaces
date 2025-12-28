/**
 * @agent-spaces/core
 *
 * Core business logic for Agent Spaces.
 */

// Database
export { getDatabase, closeDatabase } from './db';
export * from './db/schema';

// Space management
export { SpaceService, type CreateSpaceOptions } from './space';

// Run management
export { RunService, type CreateRunOptions, executeRun, type ExecuteRunOptions, type ExecuteRunResult } from './run';

