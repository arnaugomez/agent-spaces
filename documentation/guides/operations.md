# Protocol Operations

Agent Spaces uses a simple, fixed protocol for operations. This guide covers all available operations and their usage.

## Operation Types

| Type | Description |
|------|-------------|
| `message` | Send a message to the user |
| `createFile` | Create a new file |
| `readFile` | Read file contents |
| `editFile` | Edit an existing file |
| `deleteFile` | Delete a file |
| `shell` | Execute a shell command |

## Common Properties

All operations support:

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Optional correlation ID |
| `type` | string | Operation type (required) |

## Message Operation

Send a message to communicate intent or progress:

```typescript
{
  type: 'message',
  content: 'Starting data processing...'
}
```

## CreateFile Operation

Create a new file in the workspace:

```typescript
{
  type: 'createFile',
  path: 'src/utils.ts',
  content: 'export const helper = () => {};',
  overwrite: false,        // Optional, default: false
  encoding: 'utf-8'        // Optional, 'utf-8' or 'base64'
}
```

### Response Event

```typescript
{
  type: 'createFile',
  path: 'src/utils.ts',
  success: true,
  bytesWritten: 31
}
```

## ReadFile Operation

Read the contents of a file:

```typescript
{
  type: 'readFile',
  path: 'config.json',
  encoding: 'utf-8'  // Optional, 'utf-8' or 'base64'
}
```

### Response Event

```typescript
{
  type: 'readFile',
  path: 'config.json',
  success: true,
  content: '{"key": "value"}',
  size: 16,
  encoding: 'utf-8'
}
```

## EditFile Operation

Apply edits to an existing file:

```typescript
{
  type: 'editFile',
  path: 'src/app.ts',
  edits: [
    {
      oldContent: 'const x = 1;',
      newContent: 'const x = 42;'
    },
    {
      oldContent: 'console.log(x)',
      newContent: 'console.log("Value:", x)'
    }
  ]
}
```

### Response Event

```typescript
{
  type: 'editFile',
  path: 'src/app.ts',
  success: true,
  editsApplied: 2
}
```

## DeleteFile Operation

Delete a file from the workspace:

```typescript
{
  type: 'deleteFile',
  path: 'temp/cache.json'
}
```

### Response Event

```typescript
{
  type: 'deleteFile',
  path: 'temp/cache.json',
  success: true
}
```

## Shell Operation

Execute a shell command:

```typescript
{
  type: 'shell',
  command: 'bun run test.ts',
  cwd: 'src',              // Optional, working directory
  timeout: 30000,          // Optional, timeout in ms
  env: {                   // Optional, extra env vars
    DEBUG: 'true'
  }
}
```

### Response Event

```typescript
{
  type: 'shell',
  command: 'bun run test.ts',
  success: true,
  exitCode: 0,
  stdout: 'All tests passed!\n',
  stderr: '',
  durationMs: 1234
}
```

### Timeout Event

```typescript
{
  type: 'shell',
  command: 'sleep 1000',
  success: false,
  timedOut: true,
  exitCode: 124,
  durationMs: 30000
}
```

## Special Events

### Approval Required

When an operation needs user approval:

```typescript
{
  type: 'approvalRequired',
  operationId: 'shell-1',
  operationType: 'shell',
  reason: 'Destructive command requires approval',
  details: {
    command: 'rm -rf data/',
    policy: 'shell.approvalRequired'
  }
}
```

### Policy Denied

When an operation is blocked by policy:

```typescript
{
  type: 'policyDenied',
  operationType: 'shell',
  reason: 'Command not in allowed list',
  suggestion: 'Allowed commands: bun, node, npm, npx'
}
```

## Path Validation

All file paths must be:

- Relative (no leading `/`)
- No parent traversal (`..`)
- No null bytes
- Maximum 255 characters

Valid paths:
- `file.ts`
- `src/utils/helper.ts`
- `data/2024/report.json`

Invalid paths:
- `/etc/passwd` (absolute)
- `../outside.txt` (traversal)
- `file\0.txt` (null byte)

## Batching Operations

Operations execute sequentially:

```typescript
const run = await space.run({
  operations: [
    { type: 'message', content: 'Step 1: Creating file' },
    { type: 'createFile', path: 'app.ts', content: code },
    { type: 'message', content: 'Step 2: Running tests' },
    { type: 'shell', command: 'bun test' },
    { type: 'message', content: 'Done!' }
  ]
});
```

If any operation requires approval, execution pauses. After approval, remaining operations continue.

## Error Handling

```typescript
for (const event of run.events) {
  if ('success' in event && !event.success) {
    console.error(`Failed: ${event.type} - ${event.error}`);
  }
}
```

