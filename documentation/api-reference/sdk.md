# TypeScript SDK Reference

Complete reference for the Agent Spaces TypeScript SDK.

## Installation

```bash
npm install @agent-spaces/sdk
# or
bun add @agent-spaces/sdk
```

## Quick Start

```typescript
import { AgentSpaces } from '@agent-spaces/sdk';

const client = new AgentSpaces({
  apiKey: process.env.AGENT_SPACES_API_KEY,
  baseUrl: 'http://localhost:3000',
});

const space = await client.spaces.create({ name: 'my-space' });
```

---

## AgentSpaces

Main client class.

### Constructor

```typescript
new AgentSpaces(config?: AgentSpacesConfig)
```

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | `AGENT_SPACES_API_KEY` env | API key |
| `baseUrl` | string | `http://localhost:3000` | Server URL |
| `timeout` | number | `30000` | Request timeout (ms) |
| `maxRetries` | number | `3` | Retry attempts |
| `retryDelay` | number | `1000` | Initial retry delay (ms) |
| `fetch` | function | `globalThis.fetch` | Custom fetch |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `spaces` | SpacesResource | Spaces API |

---

## SpacesResource

### spaces.create()

Create a new space.

```typescript
const space = await client.spaces.create({
  name: 'my-space',
  description: 'Optional description',
  policy: 'standard', // 'restrictive' | 'standard' | 'permissive'
  policyOverrides: { ... },
  capabilities: ['weather'],
  env: { API_KEY: 'value' },
  metadata: { userId: '123' },
  ttlSeconds: 3600,
});
```

Returns: `Promise<Space>`

### spaces.get()

Get a space by ID.

```typescript
const space = await client.spaces.get('spc_abc123');
```

Returns: `Promise<Space>`

### spaces.list()

List all spaces.

```typescript
const spaces = await client.spaces.list({
  status: 'ready',
  limit: 20,
});
```

Returns: `Promise<Space[]>`

### spaces.delete()

Delete a space.

```typescript
await client.spaces.delete('spc_abc123');
```

---

## Space

Represents an isolated execution environment.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Space ID |
| `name` | string | Space name |
| `status` | string | Current status |
| `data` | SpaceData | Full space data |
| `files` | SpaceFiles | Files API |
| `runs` | SpaceRuns | Runs API |

### space.run()

Execute operations.

```typescript
const run = await space.run({
  operations: [
    { type: 'createFile', path: 'test.ts', content: 'code' },
    { type: 'shell', command: 'bun run test.ts' },
  ],
});
```

Returns: `Promise<Run>`

### space.update()

Update space properties.

```typescript
await space.update({
  name: 'new-name',
  metadata: { updated: true },
});
```

### space.extend()

Extend the TTL.

```typescript
await space.extend({ duration: 3600 });
```

### space.destroy()

Delete the space.

```typescript
await space.destroy();
```

### space.refresh()

Refresh space data from server.

```typescript
await space.refresh();
console.log(space.status);
```

---

## Run

Represents an execution session.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Run ID |
| `status` | string | `completed` \| `awaiting_approval` \| `error` |
| `events` | Event[] | Result events |
| `pendingApproval` | object | Pending approval info |

### run.approve()

Approve a pending operation.

```typescript
await run.approve({
  operationId: 'shell-1',
  reason: 'User approved',
});
```

### run.deny()

Deny a pending operation.

```typescript
await run.deny({
  operationId: 'shell-1',
  reason: 'User declined',
});
```

### run.cancel()

Cancel the run.

```typescript
await run.cancel();
```

---

## SpaceFiles

File operations for a space.

### files.read()

Read a file.

```typescript
const { content, size } = await space.files.read('config.json');
const { content } = await space.files.read('image.png', 'base64');
```

### files.write()

Write a file.

```typescript
await space.files.write('data.json', JSON.stringify(data));
await space.files.write('image.png', base64Data, 'base64');
```

### files.delete()

Delete a file.

```typescript
await space.files.delete('temp.txt');
```

### files.list()

List files.

```typescript
const files = await space.files.list({
  path: 'src',
  recursive: true,
});
```

---

## Types

### Operation Types

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
```

### Event Types

```typescript
import type {
  Event,
  CreateFileEvent,
  ReadFileEvent,
  ShellEvent,
  ApprovalRequiredEvent,
  PolicyDeniedEvent,
} from '@agent-spaces/sdk';
```

---

## Errors

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
```

### AgentSpacesError

Base error class.

| Property | Type | Description |
|----------|------|-------------|
| `code` | string | Error code |
| `statusCode` | number | HTTP status |
| `requestId` | string | Request ID |
| `details` | unknown | Additional info |

### Handling Errors

```typescript
try {
  await space.run({ operations });
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error('Space not found');
  } else if (error instanceof PolicyDeniedError) {
    console.error('Blocked by policy:', error.reason);
  } else if (error instanceof ValidationError) {
    console.error('Invalid request:', error.issues);
  }
}
```

---

## Testing Utilities

```typescript
import {
  createMockSpace,
  createMockRun,
  createMockFetch,
} from '@agent-spaces/sdk/testing';

const mockFetch = createMockFetch(new Map([
  ['/spaces', { status: 200, data: { data: createMockSpace() } }],
]));

const client = new AgentSpaces({
  fetch: mockFetch,
});
```

