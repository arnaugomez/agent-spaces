/**
 * Testing utilities for Agent Spaces SDK.
 */

import type { SpaceData, RunData } from '../resources';

/**
 * Create a mock space for testing.
 */
export function createMockSpace(
  overrides: Partial<SpaceData> = {}
): SpaceData {
  return {
    id: 'spc_test123',
    name: 'Test Space',
    status: 'ready',
    policy: 'standard',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock run for testing.
 */
export function createMockRun(overrides: Partial<RunData> = {}): RunData {
  return {
    id: 'run_test123',
    spaceId: 'spc_test123',
    status: 'completed',
    protocolVersion: '1.0',
    events: [],
    startedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock fetch implementation for testing.
 */
export function createMockFetch(
  responses: Map<string, { status: number; data: unknown }>
): (input: string | URL | Request, init?: RequestInit) => Promise<Response> {
  return async (input: string | URL | Request, _init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    for (const [pattern, response] of responses) {
      if (url.includes(pattern)) {
        return new Response(JSON.stringify(response.data), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(
      JSON.stringify({
        error: { code: 'NOT_FOUND', message: 'Not found' },
        meta: { requestId: 'mock_req' },
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };
}

