# Code Execution Protocol Specification

This document provides the detailed technical specification for the **operations/events protocol** used by Agent Spaces.

## Table of Contents

1. [Overview](#overview)
2. [Protocol Version](#protocol-version)
3. [Message Format](#message-format)
4. [Operation Types](#operation-types)
5. [Event Types](#event-types)
6. [Execution Semantics](#execution-semantics)
7. [Error Handling](#error-handling)
8. [Approval Flow](#approval-flow)
9. [Examples](#examples)
10. [Validation Rules](#validation-rules)

---

## Overview

The protocol defines a simple, fixed contract between AI agents and the Agent Spaces runtime:

```
┌─────────────┐                    ┌─────────────┐
│   AI Agent  │ ──operations[]──→  │   Runtime   │
│             │ ←──events[]─────── │             │
└─────────────┘                    └─────────────┘
```

**Key principles:**
- **Fixed operation set**: Only 6 operation types, no extensions
- **Deterministic execution**: Operations execute in order
- **Every operation produces an event**: Success or failure
- **Extensibility through code**: New capabilities come from code execution, not new operation types

---

## Protocol Version

```json
{
  "protocolVersion": "1.0"
}
```

The protocol version follows semantic versioning:
- **Major version**: Breaking changes to operation/event structure
- **Minor version**: Additive, backwards-compatible changes

All messages should include the protocol version for compatibility checking.

---

## Message Format

### Operations Message (Agent → Runtime)

```typescript
interface OperationsMessage {
  protocolVersion: "1.0";
  operations: Operation[];
}
```

### Events Message (Runtime → Agent)

```typescript
interface EventsMessage {
  protocolVersion: "1.0";
  runId: string;
  events: Event[];
  status: "completed" | "awaiting_approval" | "error";
}
```

---

## Operation Types

The protocol defines exactly **6 operation types**:

### 1. `message`

Communicate intent or progress to the user. Non-executing; does not produce side effects.

```typescript
interface MessageOperation {
  type: "message";
  id?: string;           // Optional correlation ID
  content: string;       // Human-readable message
}
```

**Example:**
```json
{
  "type": "message",
  "id": "msg-1",
  "content": "I'm going to create a script to fetch the train schedule."
}
```

### 2. `createFile`

Create a new file in the workspace.

```typescript
interface CreateFileOperation {
  type: "createFile";
  id?: string;           // Optional correlation ID
  path: string;          // Relative path within workspace
  content: string;       // File content
  encoding?: "utf-8" | "base64";  // Default: utf-8
  overwrite?: boolean;   // Default: false
}
```

**Example:**
```json
{
  "type": "createFile",
  "id": "file-1",
  "path": "scripts/fetch-schedule.ts",
  "content": "const trips = await fetch('https://api.trains.com/schedule');\nconsole.log(trips);",
  "overwrite": false
}
```

**Behavior:**
- Path must be relative (no leading `/` or `..` escapes)
- Parent directories are created automatically
- If `overwrite: false` and file exists, operation fails
- If `overwrite: true`, existing file is replaced

### 3. `readFile`

Request the content of a file.

```typescript
interface ReadFileOperation {
  type: "readFile";
  id?: string;           // Optional correlation ID
  path: string;          // Relative path within workspace
  encoding?: "utf-8" | "base64";  // Default: utf-8
}
```

**Example:**
```json
{
  "type": "readFile",
  "id": "read-1",
  "path": "config/settings.json"
}
```

### 4. `editFile`

Apply an edit to an existing file.

```typescript
interface EditFileOperation {
  type: "editFile";
  id?: string;           // Optional correlation ID
  path: string;          // Relative path within workspace
  edits: FileEdit[];     // List of edits to apply
}

interface FileEdit {
  // Search and replace style
  oldContent: string;    // Content to find
  newContent: string;    // Content to replace with
}
```

**Example:**
```json
{
  "type": "editFile",
  "id": "edit-1",
  "path": "scripts/fetch-schedule.ts",
  "edits": [
    {
      "oldContent": "console.log(trips);",
      "newContent": "console.log(JSON.stringify(trips, null, 2));"
    }
  ]
}
```

**Behavior:**
- Edits are applied in order
- If `oldContent` is not found, the edit fails
- If `oldContent` appears multiple times, only the first occurrence is replaced
- All edits must succeed for the operation to succeed

### 5. `deleteFile`

Delete a file from the workspace.

```typescript
interface DeleteFileOperation {
  type: "deleteFile";
  id?: string;           // Optional correlation ID
  path: string;          // Relative path within workspace
}
```

**Example:**
```json
{
  "type": "deleteFile",
  "id": "del-1",
  "path": "temp/scratch.txt"
}
```

**Behavior:**
- Fails if file does not exist
- Cannot delete directories (only files)

### 6. `shell`

Execute a shell command.

```typescript
interface ShellOperation {
  type: "shell";
  id?: string;           // Optional correlation ID
  command: string;       // Command to execute
  cwd?: string;          // Working directory (relative path)
  timeout?: number;      // Timeout in milliseconds (default: 30000)
  env?: Record<string, string>;  // Additional environment variables
}
```

**Example:**
```json
{
  "type": "shell",
  "id": "shell-1",
  "command": "bun run scripts/fetch-schedule.ts",
  "timeout": 60000
}
```

**Behavior:**
- Command is executed in the sandbox shell
- Subject to policy restrictions (allowed commands, blocked patterns)
- stdout and stderr are captured
- Exit code is returned
- Command may require approval based on policy

---

## Event Types

The protocol defines exactly **6 event types** (plus the initial user message):

### 1. `userMessage`

User-provided input (initial message or continuation).

```typescript
interface UserMessageEvent {
  type: "userMessage";
  timestamp: string;     // ISO 8601 timestamp
  content: string;       // User's message
}
```

### 2. `message`

Acknowledgment of a message operation.

```typescript
interface MessageEvent {
  type: "message";
  operationId?: string;  // Correlation to operation
  timestamp: string;
  success: true;
}
```

### 3. `createFile`

Result of a createFile operation.

```typescript
interface CreateFileEvent {
  type: "createFile";
  operationId?: string;
  timestamp: string;
  path: string;
  success: boolean;
  error?: string;        // Present if success: false
  bytesWritten?: number; // Present if success: true
}
```

### 4. `readFile`

Result of a readFile operation.

```typescript
interface ReadFileEvent {
  type: "readFile";
  operationId?: string;
  timestamp: string;
  path: string;
  success: boolean;
  content?: string;      // Present if success: true
  encoding?: "utf-8" | "base64";
  size?: number;         // File size in bytes
  error?: string;        // Present if success: false
}
```

### 5. `editFile`

Result of an editFile operation.

```typescript
interface EditFileEvent {
  type: "editFile";
  operationId?: string;
  timestamp: string;
  path: string;
  success: boolean;
  editsApplied?: number; // Number of edits applied
  error?: string;
}
```

### 6. `deleteFile`

Result of a deleteFile operation.

```typescript
interface DeleteFileEvent {
  type: "deleteFile";
  operationId?: string;
  timestamp: string;
  path: string;
  success: boolean;
  error?: string;
}
```

### 7. `shell`

Result of a shell operation.

```typescript
interface ShellEvent {
  type: "shell";
  operationId?: string;
  timestamp: string;
  command: string;
  success: boolean;
  exitCode?: number;     // Process exit code
  stdout?: string;       // Standard output
  stderr?: string;       // Standard error
  durationMs?: number;   // Execution time
  error?: string;        // System error (not command failure)
  timedOut?: boolean;    // True if command timed out
}
```

### 8. `approvalRequired` (Special Event)

Indicates execution is paused awaiting approval.

```typescript
interface ApprovalRequiredEvent {
  type: "approvalRequired";
  timestamp: string;
  operationId: string;   // Operation requiring approval
  operationType: string; // e.g., "shell"
  reason: string;        // Why approval is needed
  details: {
    command?: string;    // For shell operations
    path?: string;       // For file operations
    policy?: string;     // Policy that triggered approval
  };
}
```

### 9. `policyDenied` (Special Event)

Indicates an operation was denied by policy.

```typescript
interface PolicyDeniedEvent {
  type: "policyDenied";
  operationId?: string;
  timestamp: string;
  operationType: string;
  reason: string;
  suggestion?: string;   // How to resolve (if applicable)
}
```

---

## Execution Semantics

### Operation Ordering

Operations are executed **sequentially in list order**:

```json
{
  "operations": [
    { "type": "createFile", "path": "a.ts", "content": "..." },  // 1st
    { "type": "shell", "command": "bun run a.ts" },              // 2nd
    { "type": "readFile", "path": "output.txt" }                 // 3rd
  ]
}
```

The runtime guarantees:
1. Operation N completes before Operation N+1 starts
2. Events are returned in operation order
3. If operation N fails, operations N+1... still execute (unless the space is in an error state)

### Partial Failure Handling

One failed operation does **not** invalidate the entire batch:

```json
{
  "operations": [
    { "type": "createFile", "path": "a.ts", "content": "..." },
    { "type": "readFile", "path": "nonexistent.txt" },  // Will fail
    { "type": "shell", "command": "echo hello" }        // Still executes
  ]
}
```

Events:
```json
{
  "events": [
    { "type": "createFile", "path": "a.ts", "success": true },
    { "type": "readFile", "path": "nonexistent.txt", "success": false, "error": "File not found" },
    { "type": "shell", "command": "echo hello", "success": true, "stdout": "hello\n" }
  ]
}
```

### Iterative Execution

The protocol supports multi-turn execution:

```
Turn 1:
  Agent → [createFile, shell]
  Runtime → [createFile event, shell event]

Turn 2:
  Agent → [readFile, editFile, message]
  Runtime → [readFile event, editFile event, message event]

Turn 3:
  Agent → [message] (final summary)
  Runtime → [message event]
```

Each turn is a complete operations → events cycle.

---

## Error Handling

### Error Categories

| Category | Description | Example |
|----------|-------------|---------|
| **Validation Error** | Malformed operation | Missing required field |
| **Policy Denied** | Blocked by policy | Command not in allowlist |
| **Execution Error** | Runtime failure | File not found |
| **Timeout** | Operation exceeded limit | Command ran too long |
| **System Error** | Infrastructure failure | Disk full |

### Error Response Format

```typescript
interface ErrorEvent {
  type: "error";
  operationId?: string;
  timestamp: string;
  category: "validation" | "policy" | "execution" | "timeout" | "system";
  message: string;
  details?: Record<string, unknown>;
}
```

### Graceful Degradation

The runtime should continue processing operations when possible:

| Error Type | Behavior |
|------------|----------|
| Single operation fails | Continue with remaining operations |
| Validation error (malformed) | Skip operation, continue |
| Policy denial | Return denial event, continue |
| System error | May halt run, return error status |

---

## Approval Flow

When an operation requires approval:

### 1. Runtime Pauses and Returns

```json
{
  "status": "awaiting_approval",
  "events": [
    { "type": "createFile", "success": true },
    { 
      "type": "approvalRequired",
      "operationId": "shell-1",
      "operationType": "shell",
      "reason": "Command requires elevated permissions",
      "details": {
        "command": "rm -rf temp/",
        "policy": "destructive_commands"
      }
    }
  ]
}
```

### 2. User Provides Approval Decision

Via API call or userMessage:

```json
{
  "type": "userMessage",
  "content": "approved"
}
```

Or structured approval:

```json
{
  "approval": {
    "operationId": "shell-1",
    "decision": "approved",   // or "denied"
    "reason": "User approved file cleanup"
  }
}
```

### 3. Runtime Resumes

If approved: Execute the operation and return event
If denied: Return policyDenied event and continue

---

## Examples

### Example 1: Simple Script Execution

**User Message:**
```json
{
  "events": [
    {
      "type": "userMessage",
      "content": "Create a script that prints the current date"
    }
  ]
}
```

**Agent Operations:**
```json
{
  "protocolVersion": "1.0",
  "operations": [
    {
      "type": "message",
      "content": "I'll create a simple script to print the current date."
    },
    {
      "type": "createFile",
      "path": "date-script.ts",
      "content": "console.log(new Date().toISOString());"
    },
    {
      "type": "shell",
      "command": "bun run date-script.ts"
    }
  ]
}
```

**Runtime Events:**
```json
{
  "protocolVersion": "1.0",
  "runId": "run_abc123",
  "status": "completed",
  "events": [
    {
      "type": "message",
      "operationId": null,
      "timestamp": "2025-01-15T10:30:00Z",
      "success": true
    },
    {
      "type": "createFile",
      "timestamp": "2025-01-15T10:30:01Z",
      "path": "date-script.ts",
      "success": true,
      "bytesWritten": 42
    },
    {
      "type": "shell",
      "timestamp": "2025-01-15T10:30:02Z",
      "command": "bun run date-script.ts",
      "success": true,
      "exitCode": 0,
      "stdout": "2025-01-15T10:30:02.123Z\n",
      "stderr": "",
      "durationMs": 156
    }
  ]
}
```

### Example 2: Train Schedule (From Original Essay)

**User Message:**
```json
{
  "events": [
    {
      "type": "userMessage",
      "content": "Create a train schedule reminder for the 8am trip"
    },
    {
      "type": "readFile",
      "path": "rules.txt",
      "content": "Use the getTrainSchedule function from @company/sdk to get the train schedule. Use createNote to create reminders.",
      "success": true
    }
  ]
}
```

**Agent Operations:**
```json
{
  "protocolVersion": "1.0",
  "operations": [
    {
      "type": "message",
      "content": "I'm going to create a train schedule reminder for the 8am trip."
    },
    {
      "type": "createFile",
      "path": "reminder.ts",
      "content": "import { getTrainSchedule, createNote } from '@company/sdk';\n\nconst trips = await getTrainSchedule();\nconst trip = trips.find(t => t.hour === 8);\nif (trip) {\n  await createNote(`Train at ${trip.hour}:00 - ${trip.destination}`);\n  console.log('Reminder created');\n} else {\n  console.log('No 8am trip found');\n}"
    },
    {
      "type": "shell",
      "command": "bun run reminder.ts"
    }
  ]
}
```

**Runtime Events:**
```json
{
  "protocolVersion": "1.0",
  "runId": "run_xyz789",
  "status": "completed",
  "events": [
    {
      "type": "message",
      "timestamp": "2025-01-15T10:35:00Z",
      "success": true
    },
    {
      "type": "createFile",
      "timestamp": "2025-01-15T10:35:01Z",
      "path": "reminder.ts",
      "success": true,
      "bytesWritten": 312
    },
    {
      "type": "shell",
      "timestamp": "2025-01-15T10:35:03Z",
      "command": "bun run reminder.ts",
      "success": true,
      "exitCode": 0,
      "stdout": "Reminder created\n",
      "stderr": "",
      "durationMs": 1823
    }
  ]
}
```

**Agent Final Response:**
```json
{
  "protocolVersion": "1.0",
  "operations": [
    {
      "type": "message",
      "content": "Done! I created a reminder for the 8am train trip."
    }
  ]
}
```

### Example 3: Sensitive Operation with Approval

**Agent Operations:**
```json
{
  "protocolVersion": "1.0",
  "operations": [
    {
      "type": "message",
      "content": "I need to clean up the temp directory."
    },
    {
      "type": "shell",
      "id": "cleanup-1",
      "command": "rm -rf temp/*"
    }
  ]
}
```

**Runtime Events (Paused):**
```json
{
  "protocolVersion": "1.0",
  "runId": "run_del456",
  "status": "awaiting_approval",
  "events": [
    {
      "type": "message",
      "timestamp": "2025-01-15T10:40:00Z",
      "success": true
    },
    {
      "type": "approvalRequired",
      "timestamp": "2025-01-15T10:40:01Z",
      "operationId": "cleanup-1",
      "operationType": "shell",
      "reason": "Destructive command requires approval",
      "details": {
        "command": "rm -rf temp/*",
        "policy": "destructive_commands_approval"
      }
    }
  ]
}
```

**User Approval:**
```json
{
  "approval": {
    "operationId": "cleanup-1",
    "decision": "approved"
  }
}
```

**Runtime Resumes:**
```json
{
  "protocolVersion": "1.0",
  "runId": "run_del456",
  "status": "completed",
  "events": [
    {
      "type": "shell",
      "operationId": "cleanup-1",
      "timestamp": "2025-01-15T10:41:00Z",
      "command": "rm -rf temp/*",
      "success": true,
      "exitCode": 0,
      "stdout": "",
      "stderr": "",
      "durationMs": 45
    }
  ]
}
```

---

## Validation Rules

### Operation Validation

| Field | Rule |
|-------|------|
| `type` | Must be one of: message, createFile, readFile, editFile, deleteFile, shell |
| `path` | Must be relative, no `..` or leading `/`, max 255 chars |
| `content` | Max 10MB for files |
| `command` | Max 4096 chars |
| `timeout` | Min 1000ms, max 3600000ms (1 hour) |

### Path Validation

```typescript
function isValidPath(path: string): boolean {
  // No absolute paths
  if (path.startsWith('/')) return false;
  
  // No parent directory traversal
  if (path.includes('..')) return false;
  
  // No null bytes
  if (path.includes('\0')) return false;
  
  // Reasonable length
  if (path.length > 255) return false;
  
  return true;
}
```

### Content Encoding

- `utf-8`: Default for text files
- `base64`: For binary files (images, compiled assets)

---

## JSON Schema

For validation, here is the complete JSON schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "Operation": {
      "oneOf": [
        { "$ref": "#/definitions/MessageOperation" },
        { "$ref": "#/definitions/CreateFileOperation" },
        { "$ref": "#/definitions/ReadFileOperation" },
        { "$ref": "#/definitions/EditFileOperation" },
        { "$ref": "#/definitions/DeleteFileOperation" },
        { "$ref": "#/definitions/ShellOperation" }
      ]
    },
    "MessageOperation": {
      "type": "object",
      "properties": {
        "type": { "const": "message" },
        "id": { "type": "string" },
        "content": { "type": "string", "maxLength": 100000 }
      },
      "required": ["type", "content"]
    },
    "CreateFileOperation": {
      "type": "object",
      "properties": {
        "type": { "const": "createFile" },
        "id": { "type": "string" },
        "path": { "type": "string", "maxLength": 255 },
        "content": { "type": "string" },
        "encoding": { "enum": ["utf-8", "base64"] },
        "overwrite": { "type": "boolean" }
      },
      "required": ["type", "path", "content"]
    },
    "ReadFileOperation": {
      "type": "object",
      "properties": {
        "type": { "const": "readFile" },
        "id": { "type": "string" },
        "path": { "type": "string", "maxLength": 255 },
        "encoding": { "enum": ["utf-8", "base64"] }
      },
      "required": ["type", "path"]
    },
    "EditFileOperation": {
      "type": "object",
      "properties": {
        "type": { "const": "editFile" },
        "id": { "type": "string" },
        "path": { "type": "string", "maxLength": 255 },
        "edits": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "oldContent": { "type": "string" },
              "newContent": { "type": "string" }
            },
            "required": ["oldContent", "newContent"]
          }
        }
      },
      "required": ["type", "path", "edits"]
    },
    "DeleteFileOperation": {
      "type": "object",
      "properties": {
        "type": { "const": "deleteFile" },
        "id": { "type": "string" },
        "path": { "type": "string", "maxLength": 255 }
      },
      "required": ["type", "path"]
    },
    "ShellOperation": {
      "type": "object",
      "properties": {
        "type": { "const": "shell" },
        "id": { "type": "string" },
        "command": { "type": "string", "maxLength": 4096 },
        "cwd": { "type": "string", "maxLength": 255 },
        "timeout": { "type": "integer", "minimum": 1000, "maximum": 3600000 },
        "env": { "type": "object", "additionalProperties": { "type": "string" } }
      },
      "required": ["type", "command"]
    }
  },
  "type": "object",
  "properties": {
    "protocolVersion": { "const": "1.0" },
    "operations": {
      "type": "array",
      "items": { "$ref": "#/definitions/Operation" }
    }
  },
  "required": ["protocolVersion", "operations"]
}
```

---

## Related Documents

- [Protocol PRD](../requirements/protocol-prd.md): Product requirements
- [REST API Spec](./rest-api-spec.md): API endpoints for protocol execution
- [TypeScript SDK Spec](./typescript-sdk-spec.md): SDK implementation

