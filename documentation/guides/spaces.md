# Working with Spaces

A Space is an isolated execution environment for AI agents. This guide covers everything you need to know about creating, managing, and configuring spaces.

## Creating Spaces

### Basic Creation

```typescript
import { AgentSpaces } from '@agent-spaces/sdk';

const client = new AgentSpaces();

const space = await client.spaces.create({
  name: 'my-space',
});
```

### With Configuration

```typescript
const space = await client.spaces.create({
  name: 'configured-space',
  description: 'A space for data processing',
  policy: 'standard',
  capabilities: ['weather', 'mcp-filesystem'],
  env: {
    API_KEY: 'my-api-key',
  },
  metadata: {
    userId: 'user123',
    projectId: 'proj456',
  },
  ttlSeconds: 3600, // 1 hour
});
```

## Space Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier (e.g., `spc_abc123`) |
| `name` | string | Human-readable name |
| `description` | string | Optional description |
| `status` | string | Current status |
| `policy` | string | Security policy name |
| `capabilities` | string[] | Enabled capabilities |
| `createdAt` | string | ISO timestamp |
| `expiresAt` | string | Expiration timestamp |

## Space Status

| Status | Description |
|--------|-------------|
| `creating` | Space is being initialized |
| `ready` | Space is ready for operations |
| `running` | Operations are executing |
| `paused` | Awaiting approval |
| `destroyed` | Space has been deleted |

## Managing Spaces

### Get a Space

```typescript
const space = await client.spaces.get('spc_abc123');
console.log(space.name, space.status);
```

### List Spaces

```typescript
const spaces = await client.spaces.list({
  status: 'ready',
  limit: 10,
});

for (const space of spaces) {
  console.log(space.id, space.name);
}
```

### Update a Space

```typescript
await space.update({
  name: 'new-name',
  metadata: { updated: true },
});
```

### Extend TTL

```typescript
await space.extend({
  duration: 3600, // Add 1 hour
});
```

### Destroy a Space

```typescript
await space.destroy();
```

## Running Operations

### Basic Run

```typescript
const run = await space.run({
  operations: [
    { type: 'shell', command: 'echo "hello"' },
  ],
});
```

### Multiple Operations

```typescript
const run = await space.run({
  operations: [
    { type: 'createFile', path: 'data.json', content: '{"key": "value"}' },
    { type: 'shell', command: 'cat data.json | jq .key' },
    { type: 'deleteFile', path: 'data.json' },
  ],
});
```

### Handling Results

```typescript
const run = await space.run({ operations });

for (const event of run.events) {
  switch (event.type) {
    case 'createFile':
      console.log(`Created ${event.path}: ${event.success}`);
      break;
    case 'shell':
      console.log(`Command: ${event.command}`);
      console.log(`Output: ${event.stdout}`);
      break;
    case 'policyDenied':
      console.log(`Denied: ${event.reason}`);
      break;
  }
}
```

## Working with Files

### Direct File Access

```typescript
// Write a file
await space.files.write('config.json', JSON.stringify({ key: 'value' }));

// Read a file
const { content } = await space.files.read('config.json');
console.log(JSON.parse(content));

// List files
const files = await space.files.list({ recursive: true });
for (const file of files) {
  console.log(`${file.type}: ${file.path}`);
}

// Delete a file
await space.files.delete('config.json');
```

### Binary Files

```typescript
// Write binary file (base64 encoded)
const imageBase64 = fs.readFileSync('image.png', 'base64');
await space.files.write('image.png', imageBase64, 'base64');

// Read binary file
const { content } = await space.files.read('image.png', 'base64');
const buffer = Buffer.from(content, 'base64');
```

## Handling Approvals

When an operation requires approval:

```typescript
const run = await space.run({
  operations: [
    { type: 'shell', command: 'rm -rf temp/', id: 'rm-op' },
  ],
});

if (run.status === 'awaiting_approval') {
  console.log(`Approval needed: ${run.pendingApproval?.reason}`);
  
  // Approve
  await run.approve({
    operationId: 'rm-op',
    reason: 'User confirmed deletion',
  });
  
  // Or deny
  await run.deny({
    operationId: 'rm-op',
    reason: 'User cancelled',
  });
}
```

## Best Practices

1. **Always destroy spaces when done** - Use try/finally to ensure cleanup
2. **Set appropriate TTL** - Don't leave spaces running indefinitely
3. **Use metadata for tracking** - Store user IDs, project IDs, etc.
4. **Handle approvals** - Check run status after execution
5. **Choose the right policy** - Start restrictive, loosen as needed

