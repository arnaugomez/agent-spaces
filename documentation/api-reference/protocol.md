# Protocol Reference

The Agent Spaces protocol defines how agents communicate with the runtime. This is the complete specification.

## Overview

The protocol uses JSON messages with a fixed set of operations and events.

- **Operations**: Instructions from the agent to the runtime
- **Events**: Results from the runtime to the agent

## Protocol Version

Current version: `1.0`

All messages must include the protocol version:

```json
{
  "protocolVersion": "1.0",
  "operations": [...]
}
```

---

## Operations Message

Sent from agent to runtime.

```json
{
  "protocolVersion": "1.0",
  "operations": [
    { "type": "message", "content": "Starting..." },
    { "type": "createFile", "path": "app.ts", "content": "..." },
    { "type": "shell", "command": "bun run app.ts" }
  ]
}
```

---

## Operation Types

### message

Communicate intent or progress. Does not execute anything.

```json
{
  "type": "message",
  "id": "msg-1",
  "content": "Processing data..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"message"` | Yes | |
| `id` | string | No | Correlation ID |
| `content` | string | Yes | Message text |

### createFile

Create a file in the workspace.

```json
{
  "type": "createFile",
  "id": "file-1",
  "path": "src/utils.ts",
  "content": "export const helper = () => {};",
  "encoding": "utf-8",
  "overwrite": false
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `path` | string | Yes | | Relative path |
| `content` | string | Yes | | File content |
| `encoding` | `"utf-8"` \| `"base64"` | No | `"utf-8"` | Content encoding |
| `overwrite` | boolean | No | `false` | Overwrite existing |

### readFile

Read a file from the workspace.

```json
{
  "type": "readFile",
  "id": "read-1",
  "path": "config.json",
  "encoding": "utf-8"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `path` | string | Yes | | Relative path |
| `encoding` | `"utf-8"` \| `"base64"` | No | `"utf-8"` | Response encoding |

### editFile

Apply edits to an existing file.

```json
{
  "type": "editFile",
  "id": "edit-1",
  "path": "src/app.ts",
  "edits": [
    {
      "oldContent": "const x = 1;",
      "newContent": "const x = 42;"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Relative path |
| `edits` | Edit[] | Yes | List of edits |

**Edit object:**

| Field | Type | Description |
|-------|------|-------------|
| `oldContent` | string | Content to find |
| `newContent` | string | Replacement content |

### deleteFile

Delete a file from the workspace.

```json
{
  "type": "deleteFile",
  "id": "del-1",
  "path": "temp.txt"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Relative path |

### shell

Execute a shell command.

```json
{
  "type": "shell",
  "id": "shell-1",
  "command": "bun run test.ts",
  "cwd": "src",
  "timeout": 30000,
  "env": {
    "DEBUG": "true"
  }
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `command` | string | Yes | | Command to run |
| `cwd` | string | No | Workspace root | Working directory |
| `timeout` | number | No | 30000 | Timeout (ms) |
| `env` | object | No | | Extra env vars |

---

## Events Message

Sent from runtime to agent.

```json
{
  "protocolVersion": "1.0",
  "runId": "run_abc123",
  "status": "completed",
  "events": [...]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `protocolVersion` | string | Protocol version |
| `runId` | string | Run identifier |
| `status` | `"completed"` \| `"awaiting_approval"` \| `"error"` | Run status |
| `events` | Event[] | Result events |

---

## Event Types

### message (acknowledgment)

```json
{
  "type": "message",
  "timestamp": "2024-01-15T10:30:00Z",
  "operationId": "msg-1",
  "success": true
}
```

### createFile

```json
{
  "type": "createFile",
  "timestamp": "2024-01-15T10:30:00Z",
  "operationId": "file-1",
  "path": "src/utils.ts",
  "success": true,
  "bytesWritten": 31
}
```

On failure:

```json
{
  "type": "createFile",
  "path": "src/utils.ts",
  "success": false,
  "error": "File already exists"
}
```

### readFile

```json
{
  "type": "readFile",
  "timestamp": "2024-01-15T10:30:00Z",
  "operationId": "read-1",
  "path": "config.json",
  "success": true,
  "content": "{\"key\": \"value\"}",
  "encoding": "utf-8",
  "size": 16
}
```

### editFile

```json
{
  "type": "editFile",
  "timestamp": "2024-01-15T10:30:00Z",
  "operationId": "edit-1",
  "path": "src/app.ts",
  "success": true,
  "editsApplied": 1
}
```

### deleteFile

```json
{
  "type": "deleteFile",
  "timestamp": "2024-01-15T10:30:00Z",
  "operationId": "del-1",
  "path": "temp.txt",
  "success": true
}
```

### shell

```json
{
  "type": "shell",
  "timestamp": "2024-01-15T10:30:00Z",
  "operationId": "shell-1",
  "command": "bun run test.ts",
  "success": true,
  "exitCode": 0,
  "stdout": "All tests passed!\n",
  "stderr": "",
  "durationMs": 1234
}
```

On timeout:

```json
{
  "type": "shell",
  "command": "sleep 1000",
  "success": false,
  "timedOut": true,
  "exitCode": 124,
  "durationMs": 30000
}
```

### approvalRequired

Execution paused awaiting approval.

```json
{
  "type": "approvalRequired",
  "timestamp": "2024-01-15T10:30:00Z",
  "operationId": "shell-1",
  "operationType": "shell",
  "reason": "Destructive command requires approval",
  "details": {
    "command": "rm -rf data/",
    "policy": "shell.approvalRequired"
  }
}
```

### policyDenied

Operation blocked by policy.

```json
{
  "type": "policyDenied",
  "timestamp": "2024-01-15T10:30:00Z",
  "operationType": "shell",
  "reason": "Command 'sudo' is blocked",
  "suggestion": "Remove sudo from command"
}
```

### error

General error event.

```json
{
  "type": "error",
  "timestamp": "2024-01-15T10:30:00Z",
  "category": "execution",
  "message": "Docker container not available",
  "details": {}
}
```

| Category | Description |
|----------|-------------|
| `validation` | Invalid operation format |
| `policy` | Policy violation |
| `execution` | Execution failure |
| `timeout` | Operation timed out |
| `system` | System-level error |

---

## Path Validation

All file paths must:

- Be relative (no leading `/`)
- Not contain `..` (parent traversal)
- Not contain null bytes
- Be at most 255 characters

---

## Validation

Use the protocol package for validation:

```typescript
import {
  validateOperation,
  validateOperationsMessage,
  parseOperation,
} from '@agent-spaces/protocol';

// Returns { success: boolean, data?, error? }
const result = validateOperation(input);

// Throws on invalid input
const operation = parseOperation(input);
```

