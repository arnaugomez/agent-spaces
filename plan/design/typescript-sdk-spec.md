# TypeScript SDK Specification

This document specifies the TypeScript SDK for **Agent Spaces**, which provides an ergonomic wrapper around the REST API.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Client Configuration](#client-configuration)
5. [Spaces API](#spaces-api)
6. [Runs API](#runs-api)
7. [Files API](#files-api)
8. [Approvals API](#approvals-api)
9. [Streaming](#streaming)
10. [Error Handling](#error-handling)
11. [Type Definitions](#type-definitions)
12. [Advanced Usage](#advanced-usage)

---

## Overview

The SDK provides:

- **Type-safe API**: Full TypeScript types for all operations and events
- **Fluent interface**: Chainable, intuitive method calls
- **Streaming support**: Real-time event streaming via SSE and WebSocket
- **Error handling**: Typed errors with helpful messages
- **Retries**: Automatic retry with exponential backoff
- **Logging**: Optional request/response logging

---

## Installation

```bash
# Using bun (recommended)
bun add @agent-spaces/sdk

# Using npm
npm install @agent-spaces/sdk

# Using pnpm
pnpm add @agent-spaces/sdk
```

---

## Quick Start

```typescript
import { AgentSpaces } from '@agent-spaces/sdk';

// Initialize client
const client = new AgentSpaces({
  apiKey: process.env.AGENT_SPACES_API_KEY,
});

// Create a space
const space = await client.spaces.create({
  name: 'my-agent-space',
  policy: 'standard',
});

// Execute operations
const run = await space.run({
  operations: [
    {
      type: 'createFile',
      path: 'hello.ts',
      content: 'console.log("Hello, Agent Spaces!");',
    },
    {
      type: 'shell',
      command: 'bun run hello.ts',
    },
  ],
});

// Check results
console.log(run.events);
// [
//   { type: 'createFile', success: true, path: 'hello.ts' },
//   { type: 'shell', success: true, stdout: 'Hello, Agent Spaces!\n' }
// ]

// Cleanup
await space.destroy();
```

---

## Client Configuration

### AgentSpaces Constructor

```typescript
import { AgentSpaces, type AgentSpacesConfig } from '@agent-spaces/sdk';

const config: AgentSpacesConfig = {
  // Required
  apiKey: 'as_live_xxxxxxxxxxxx',
  
  // Optional - for self-hosted deployments
  baseUrl: 'https://api.agentspaces.io/v1',
  
  // Optional - request configuration
  timeout: 30000,           // Request timeout in ms (default: 30000)
  maxRetries: 3,            // Max retry attempts (default: 3)
  retryDelay: 1000,         // Initial retry delay in ms (default: 1000)
  
  // Optional - logging
  logger: console,          // Custom logger (default: none)
  logLevel: 'info',         // 'debug' | 'info' | 'warn' | 'error'
  
  // Optional - custom fetch implementation
  fetch: globalThis.fetch,
};

const client = new AgentSpaces(config);
```

### Environment Variables

The SDK automatically reads from environment variables:

```bash
AGENT_SPACES_API_KEY=as_live_xxxx
AGENT_SPACES_BASE_URL=https://api.agentspaces.io/v1
```

```typescript
// Reads from environment automatically
const client = new AgentSpaces();
```

---

## Spaces API

### Create Space

```typescript
const space = await client.spaces.create({
  name: 'my-space',
  description: 'Space for data processing',
  policy: 'standard',
  policyOverrides: {
    shell: {
      allowedCommands: ['bun', 'node'],
      timeout: 60000,
    },
  },
  capabilities: ['@company/sdk'],
  env: {
    NODE_ENV: 'production',
  },
  secrets: ['DATABASE_URL'],
  metadata: {
    projectId: 'proj_123',
  },
});

console.log(space.id);       // 'spc_a1b2c3d4'
console.log(space.status);   // 'ready'
```

### Get Space

```typescript
const space = await client.spaces.get('spc_a1b2c3d4');

// Or refresh an existing space object
await space.refresh();
```

### List Spaces

```typescript
// List all spaces
const spaces = await client.spaces.list();

// With filters
const readySpaces = await client.spaces.list({
  status: 'ready',
  limit: 10,
});

// Pagination
for await (const space of client.spaces.listAll()) {
  console.log(space.name);
}
```

### Update Space

```typescript
await space.update({
  name: 'renamed-space',
  policyOverrides: {
    shell: { timeout: 120000 },
  },
});
```

### Delete Space

```typescript
await space.destroy();
// or
await client.spaces.delete('spc_a1b2c3d4');
```

### Extend Space TTL

```typescript
await space.extend({ duration: 3600 }); // Add 1 hour
```

---

## Runs API

### Execute Operations (Simple)

```typescript
const run = await space.run({
  operations: [
    { type: 'message', content: 'Starting task...' },
    { type: 'createFile', path: 'script.ts', content: '...' },
    { type: 'shell', command: 'bun run script.ts' },
  ],
});

if (run.status === 'completed') {
  for (const event of run.events) {
    console.log(event.type, event.success);
  }
}
```

### Execute with Context

Include file contents in the response:

```typescript
const run = await space.run({
  operations: [
    { type: 'readFile', path: 'config.json' },
    { type: 'shell', command: 'bun run process.ts' },
  ],
  context: {
    files: ['output.json'],  // Include these files in response
  },
});
```

### Handle Approvals

```typescript
const run = await space.run({
  operations: [
    { type: 'shell', id: 'cleanup', command: 'rm -rf temp/' },
  ],
});

if (run.status === 'awaiting_approval') {
  console.log('Approval needed:', run.pendingApproval);
  
  // Approve and continue
  const resumed = await run.approve({
    operationId: 'cleanup',
    decision: 'approved',
    reason: 'User confirmed cleanup',
  });
  
  console.log(resumed.events);
}
```

### Streaming Execution

Stream events as they happen:

```typescript
const stream = await space.runStream({
  operations: [
    { type: 'shell', command: 'bun run long-task.ts' },
  ],
});

for await (const event of stream) {
  switch (event.type) {
    case 'operation.started':
      console.log('Started:', event.operationId);
      break;
    case 'stdout':
      process.stdout.write(event.chunk);
      break;
    case 'stderr':
      process.stderr.write(event.chunk);
      break;
    case 'event':
      console.log('Completed:', event.data);
      break;
  }
}

const result = await stream.result();
console.log('Final status:', result.status);
```

### Get Run

```typescript
const run = await space.runs.get('run_x1y2z3');
// or
const run = await client.runs.get('spc_a1b2c3d4', 'run_x1y2z3');
```

### List Runs

```typescript
const runs = await space.runs.list({ limit: 10 });

for await (const run of space.runs.listAll()) {
  console.log(run.id, run.status);
}
```

### Cancel Run

```typescript
await run.cancel();
```

---

## Files API

### Read File

```typescript
const file = await space.files.read('config.json');

console.log(file.content);    // File contents as string
console.log(file.size);       // Size in bytes
console.log(file.encoding);   // 'utf-8' or 'base64'
```

### Write File

```typescript
await space.files.write('output.txt', 'Hello, World!');

// With options
await space.files.write('data.json', JSON.stringify(data), {
  encoding: 'utf-8',
});

// Binary files
await space.files.write('image.png', base64Data, {
  encoding: 'base64',
});
```

### Delete File

```typescript
await space.files.delete('temp.txt');
```

### List Files

```typescript
const listing = await space.files.list();

for (const entry of listing.files) {
  console.log(entry.path, entry.type, entry.size);
}

// List specific directory
const srcFiles = await space.files.list({
  path: 'src/',
  recursive: true,
});
```

### Upload Files

```typescript
// From buffer
await space.files.upload('data.csv', buffer);

// From file path (Node.js/Bun)
await space.files.uploadFromPath('local/file.txt', 'remote/file.txt');

// Multiple files
await space.files.uploadMany([
  { path: 'a.txt', content: 'content a' },
  { path: 'b.txt', content: 'content b' },
]);
```

### Download Workspace

```typescript
const archive = await space.files.downloadArchive();

// Save to disk (Bun)
await Bun.write('workspace.zip', archive);

// Or as buffer
const buffer = await archive.arrayBuffer();
```

---

## Approvals API

### List Pending Approvals

```typescript
const approvals = await client.approvals.list({
  status: 'pending',
});

for (const approval of approvals) {
  console.log(approval.id, approval.operationType, approval.details);
}
```

### Approve or Deny

```typescript
await client.approvals.resolve('apr_abc123', {
  decision: 'approved',
  reason: 'Verified by operator',
});

// Or deny
await client.approvals.resolve('apr_abc123', {
  decision: 'denied',
  reason: 'Suspicious command pattern',
});
```

### Watch for Approvals (WebSocket)

```typescript
const watcher = client.approvals.watch();

watcher.on('approval.required', async (approval) => {
  console.log('New approval needed:', approval);
  
  // Auto-approve certain patterns
  if (approval.operationType === 'shell' && 
      approval.details.command.startsWith('npm test')) {
    await approval.approve({ reason: 'Auto-approved test command' });
  }
});

watcher.on('error', (error) => {
  console.error('Watch error:', error);
});

// Stop watching
watcher.close();
```

---

## Streaming

### Server-Sent Events (SSE)

```typescript
const stream = await space.runStream({ operations });

for await (const event of stream) {
  // Handle events
}
```

### WebSocket Connection

```typescript
const ws = client.connect();

ws.subscribe('space', space.id);

ws.on('run.started', (event) => {
  console.log('Run started:', event.runId);
});

ws.on('run.output', (event) => {
  console.log(event.stream, event.chunk);
});

ws.on('run.completed', (event) => {
  console.log('Completed:', event.status);
});

// Cleanup
ws.close();
```

---

## Error Handling

### Error Types

```typescript
import {
  AgentSpacesError,
  ValidationError,
  NotFoundError,
  PolicyDeniedError,
  ApprovalRequiredError,
  RateLimitError,
  NetworkError,
} from '@agent-spaces/sdk';

try {
  await space.run({ operations });
} catch (error) {
  if (error instanceof PolicyDeniedError) {
    console.log('Blocked by policy:', error.reason);
    console.log('Suggestion:', error.suggestion);
  } else if (error instanceof ApprovalRequiredError) {
    console.log('Needs approval:', error.approval);
    // Handle approval flow
  } else if (error instanceof RateLimitError) {
    console.log('Rate limited. Retry after:', error.retryAfter);
  } else if (error instanceof NotFoundError) {
    console.log('Resource not found:', error.resourceType, error.resourceId);
  } else if (error instanceof NetworkError) {
    console.log('Network error:', error.message);
  } else {
    throw error;
  }
}
```

### Error Properties

```typescript
interface AgentSpacesError extends Error {
  code: string;           // Error code (e.g., 'POLICY_DENIED')
  statusCode: number;     // HTTP status code
  requestId: string;      // Request ID for debugging
  details?: unknown;      // Additional error details
}
```

---

## Type Definitions

### Operations

```typescript
import type {
  Operation,
  MessageOperation,
  CreateFileOperation,
  ReadFileOperation,
  EditFileOperation,
  DeleteFileOperation,
  ShellOperation,
} from '@agent-spaces/sdk';

const ops: Operation[] = [
  { type: 'message', content: 'Hello' },
  { type: 'createFile', path: 'test.ts', content: '...' },
  { type: 'shell', command: 'bun run test.ts' },
];
```

### Events

```typescript
import type {
  Event,
  MessageEvent,
  CreateFileEvent,
  ReadFileEvent,
  EditFileEvent,
  DeleteFileEvent,
  ShellEvent,
  ApprovalRequiredEvent,
  PolicyDeniedEvent,
} from '@agent-spaces/sdk';

function handleEvent(event: Event) {
  switch (event.type) {
    case 'shell':
      console.log('Exit code:', event.exitCode);
      console.log('Stdout:', event.stdout);
      break;
    case 'createFile':
      console.log('Created:', event.path);
      break;
    // ...
  }
}
```

### Space Configuration

```typescript
import type {
  SpaceConfig,
  PolicyPreset,
  PolicyOverrides,
  ShellPolicy,
  FilesystemPolicy,
  NetworkPolicy,
} from '@agent-spaces/sdk';

const config: SpaceConfig = {
  name: 'my-space',
  policy: 'standard',
  policyOverrides: {
    shell: {
      allowedCommands: ['bun', 'node'],
      blockedPatterns: ['rm -rf'],
      timeout: 60000,
    },
    filesystem: {
      maxFileSize: 10 * 1024 * 1024,
      blockedPaths: ['.env'],
    },
  },
};
```

---

## Advanced Usage

### Custom HTTP Client

```typescript
import { AgentSpaces } from '@agent-spaces/sdk';

const client = new AgentSpaces({
  apiKey: '...',
  fetch: async (url, init) => {
    // Custom fetch implementation
    console.log('Request:', url);
    const response = await fetch(url, init);
    console.log('Response:', response.status);
    return response;
  },
});
```

### Request Hooks

```typescript
const client = new AgentSpaces({
  apiKey: '...',
  hooks: {
    beforeRequest: async (request) => {
      // Modify request before sending
      request.headers.set('X-Custom-Header', 'value');
      return request;
    },
    afterResponse: async (response) => {
      // Process response
      console.log('Request ID:', response.headers.get('X-Request-Id'));
      return response;
    },
    onError: async (error) => {
      // Handle errors globally
      console.error('API Error:', error);
      throw error;
    },
  },
});
```

### Retries Configuration

```typescript
const client = new AgentSpaces({
  apiKey: '...',
  maxRetries: 5,
  retryDelay: 1000,
  retryOn: [429, 500, 502, 503, 504],
  retryCondition: (error, attempt) => {
    // Custom retry logic
    if (error.code === 'RATE_LIMITED') {
      return attempt < 3;
    }
    return false;
  },
});
```

### Middleware Pattern

```typescript
import { AgentSpaces, withLogging, withMetrics } from '@agent-spaces/sdk';

const client = new AgentSpaces({ apiKey: '...' })
  .use(withLogging({ level: 'debug' }))
  .use(withMetrics({ prefix: 'agent_spaces' }));
```

### Testing Utilities

```typescript
import { createMockClient, MockSpace } from '@agent-spaces/sdk/testing';

// Create a mock client for testing
const mockClient = createMockClient();

// Configure mock responses
mockClient.spaces.create.mockResolvedValue(
  new MockSpace({ id: 'spc_test', status: 'ready' })
);

// Use in tests
const space = await mockClient.spaces.create({ name: 'test' });
expect(space.id).toBe('spc_test');
```

---

## Package Exports

```typescript
// Main client
export { AgentSpaces } from '@agent-spaces/sdk';
export type { AgentSpacesConfig } from '@agent-spaces/sdk';

// Types
export type {
  Space,
  Run,
  Operation,
  Event,
  Approval,
  // ... all type definitions
} from '@agent-spaces/sdk';

// Errors
export {
  AgentSpacesError,
  ValidationError,
  NotFoundError,
  PolicyDeniedError,
  ApprovalRequiredError,
  RateLimitError,
  NetworkError,
} from '@agent-spaces/sdk';

// Testing utilities
export {
  createMockClient,
  MockSpace,
  MockRun,
} from '@agent-spaces/sdk/testing';
```

---

## Related Documents

- [REST API Spec](./rest-api-spec.md): Underlying API specification
- [Protocol Spec](./protocol-spec.md): Operations and events format
- [Project Structure](./project-structure.md): SDK package structure

