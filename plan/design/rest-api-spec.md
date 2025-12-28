# REST API Specification

This document provides the complete REST API specification for **Agent Spaces**.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Versioning](#base-url--versioning)
4. [Common Patterns](#common-patterns)
5. [Spaces API](#spaces-api)
6. [Runs API](#runs-api)
7. [Files API](#files-api)
8. [Approvals API](#approvals-api)
9. [Policies API](#policies-api)
10. [WebSocket Events](#websocket-events)
11. [Error Codes](#error-codes)
12. [Rate Limits](#rate-limits)

---

## Overview

The Agent Spaces REST API provides programmatic access to:

- **Spaces**: Create, configure, and manage isolated execution environments
- **Runs**: Execute operations and receive events
- **Files**: Direct file manipulation within workspaces
- **Approvals**: Handle human-in-the-loop approval workflows
- **Policies**: Configure access control policies

---

## Authentication

### API Keys

All requests require an API key in the `Authorization` header:

```http
Authorization: Bearer as_live_xxxxxxxxxxxx
```

**Key types:**
- `as_live_*`: Production keys with full access
- `as_test_*`: Test keys with limited access (local development)

### Key Management

API keys are created via the CLI or management API (not covered in this spec).

---

## Base URL & Versioning

### Base URL

```
https://api.agentspaces.io/v1
```

For self-hosted deployments:
```
https://your-domain.com/api/v1
```

### API Version

The API version is included in the URL path. The current version is `v1`.

```http
GET /v1/spaces
```

---

## Common Patterns

### Request Format

- Content-Type: `application/json`
- Accept: `application/json`

### Response Format

All responses follow this structure:

**Success:**
```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "SPACE_NOT_FOUND",
    "message": "Space with ID 'spc_xyz' not found",
    "details": { ... }
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

### Pagination

List endpoints support cursor-based pagination:

```http
GET /v1/spaces?limit=20&cursor=cur_abc123
```

Response:
```json
{
  "data": [...],
  "meta": {
    "hasMore": true,
    "nextCursor": "cur_def456"
  }
}
```

### Idempotency

For POST requests, include an idempotency key:

```http
Idempotency-Key: idem_unique_request_id
```

---

## Spaces API

### Create Space

Create a new isolated execution environment.

```http
POST /v1/spaces
```

**Request body:**
```json
{
  "name": "my-agent-space",
  "description": "Space for data processing tasks",
  "policy": "standard",
  "policyOverrides": {
    "shell": {
      "allowedCommands": ["bun", "node", "npm"],
      "timeout": 60000
    },
    "filesystem": {
      "maxFileSize": 10485760
    }
  },
  "capabilities": ["@company/sdk"],
  "env": {
    "NODE_ENV": "production"
  },
  "secrets": ["DATABASE_URL", "API_KEY"],
  "metadata": {
    "projectId": "proj_123",
    "userId": "user_456"
  }
}
```

**Request fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Human-readable name (auto-generated if omitted) |
| `description` | string | No | Description of the space |
| `policy` | string | No | Policy preset: "restrictive", "standard", "permissive" |
| `policyOverrides` | object | No | Custom policy overrides |
| `capabilities` | string[] | No | Capabilities to load (SDKs, tools) |
| `env` | object | No | Environment variables |
| `secrets` | string[] | No | Secret names to inject from secret store |
| `metadata` | object | No | Custom metadata for tracking |

**Response:**
```json
{
  "data": {
    "id": "spc_a1b2c3d4",
    "name": "my-agent-space",
    "description": "Space for data processing tasks",
    "status": "ready",
    "policy": "standard",
    "capabilities": ["@company/sdk"],
    "createdAt": "2025-01-15T10:00:00Z",
    "expiresAt": "2025-01-15T22:00:00Z",
    "metadata": {
      "projectId": "proj_123",
      "userId": "user_456"
    }
  }
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique space identifier |
| `status` | string | "creating", "ready", "running", "paused", "destroyed" |
| `createdAt` | string | ISO 8601 creation timestamp |
| `expiresAt` | string | ISO 8601 expiration timestamp |

---

### Get Space

Retrieve space details.

```http
GET /v1/spaces/{spaceId}
```

**Response:**
```json
{
  "data": {
    "id": "spc_a1b2c3d4",
    "name": "my-agent-space",
    "status": "ready",
    "policy": "standard",
    "capabilities": ["@company/sdk"],
    "workspace": {
      "fileCount": 12,
      "totalSize": 45678
    },
    "runs": {
      "total": 5,
      "lastRunAt": "2025-01-15T11:30:00Z"
    },
    "createdAt": "2025-01-15T10:00:00Z",
    "expiresAt": "2025-01-15T22:00:00Z"
  }
}
```

---

### List Spaces

List all spaces.

```http
GET /v1/spaces?status=ready&limit=20
```

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `limit` | number | Max items to return (default: 20, max: 100) |
| `cursor` | string | Pagination cursor |

**Response:**
```json
{
  "data": [
    {
      "id": "spc_a1b2c3d4",
      "name": "my-agent-space",
      "status": "ready",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "hasMore": false
  }
}
```

---

### Update Space

Update space configuration.

```http
PATCH /v1/spaces/{spaceId}
```

**Request body:**
```json
{
  "name": "renamed-space",
  "policyOverrides": {
    "shell": {
      "timeout": 120000
    }
  },
  "metadata": {
    "stage": "production"
  }
}
```

**Response:** Updated space object.

---

### Delete Space

Destroy a space and its workspace.

```http
DELETE /v1/spaces/{spaceId}
```

**Response:**
```json
{
  "data": {
    "id": "spc_a1b2c3d4",
    "status": "destroyed",
    "destroyedAt": "2025-01-15T12:00:00Z"
  }
}
```

---

### Extend Space TTL

Extend the expiration time of a space.

```http
POST /v1/spaces/{spaceId}/extend
```

**Request body:**
```json
{
  "duration": 3600
}
```

| Field | Type | Description |
|-------|------|-------------|
| `duration` | number | Additional seconds to add |

---

## Runs API

### Create Run (Execute Operations)

Execute a batch of operations in a space.

```http
POST /v1/spaces/{spaceId}/runs
```

**Request body:**
```json
{
  "protocolVersion": "1.0",
  "operations": [
    {
      "type": "message",
      "content": "Creating a data processing script"
    },
    {
      "type": "createFile",
      "id": "file-1",
      "path": "process.ts",
      "content": "const data = await Bun.file('input.json').json();\nconsole.log(data.length);"
    },
    {
      "type": "shell",
      "id": "run-1",
      "command": "bun run process.ts",
      "timeout": 30000
    }
  ],
  "context": {
    "files": ["input.json"]
  }
}
```

**Request fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `protocolVersion` | string | Yes | Protocol version ("1.0") |
| `operations` | Operation[] | Yes | List of operations to execute |
| `context.files` | string[] | No | Files to read and include in response |

**Response (completed):**
```json
{
  "data": {
    "id": "run_x1y2z3",
    "spaceId": "spc_a1b2c3d4",
    "status": "completed",
    "protocolVersion": "1.0",
    "events": [
      {
        "type": "message",
        "timestamp": "2025-01-15T10:30:00Z",
        "success": true
      },
      {
        "type": "createFile",
        "operationId": "file-1",
        "timestamp": "2025-01-15T10:30:01Z",
        "path": "process.ts",
        "success": true,
        "bytesWritten": 89
      },
      {
        "type": "shell",
        "operationId": "run-1",
        "timestamp": "2025-01-15T10:30:02Z",
        "command": "bun run process.ts",
        "success": true,
        "exitCode": 0,
        "stdout": "42\n",
        "stderr": "",
        "durationMs": 234
      }
    ],
    "startedAt": "2025-01-15T10:30:00Z",
    "completedAt": "2025-01-15T10:30:02Z",
    "durationMs": 2345
  }
}
```

**Response (awaiting approval):**
```json
{
  "data": {
    "id": "run_x1y2z3",
    "spaceId": "spc_a1b2c3d4",
    "status": "awaiting_approval",
    "protocolVersion": "1.0",
    "events": [
      {
        "type": "createFile",
        "success": true
      },
      {
        "type": "approvalRequired",
        "operationId": "run-1",
        "operationType": "shell",
        "reason": "Command requires approval",
        "details": {
          "command": "rm -rf temp/",
          "policy": "destructive_commands"
        }
      }
    ],
    "pendingApproval": {
      "operationId": "run-1",
      "operationType": "shell",
      "reason": "Command requires approval"
    }
  }
}
```

---

### Get Run

Retrieve run details.

```http
GET /v1/spaces/{spaceId}/runs/{runId}
```

**Response:** Full run object with all events.

---

### List Runs

List runs for a space.

```http
GET /v1/spaces/{spaceId}/runs?status=completed&limit=10
```

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `limit` | number | Max items (default: 20) |
| `cursor` | string | Pagination cursor |

---

### Resume Run (After Approval)

Continue a paused run after approval decision.

```http
POST /v1/spaces/{spaceId}/runs/{runId}/resume
```

**Request body:**
```json
{
  "approval": {
    "operationId": "run-1",
    "decision": "approved",
    "reason": "User approved the cleanup operation"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `approval.operationId` | string | Operation awaiting approval |
| `approval.decision` | string | "approved" or "denied" |
| `approval.reason` | string | Reason for decision (audit log) |

**Response:** Updated run with remaining events.

---

### Cancel Run

Cancel a running or paused run.

```http
POST /v1/spaces/{spaceId}/runs/{runId}/cancel
```

**Response:**
```json
{
  "data": {
    "id": "run_x1y2z3",
    "status": "cancelled",
    "cancelledAt": "2025-01-15T10:35:00Z"
  }
}
```

---

### Stream Run (SSE)

Stream run events in real-time.

```http
GET /v1/spaces/{spaceId}/runs/{runId}/stream
Accept: text/event-stream
```

**Event stream:**
```
event: operation
data: {"type":"createFile","operationId":"file-1","status":"started"}

event: event
data: {"type":"createFile","operationId":"file-1","success":true}

event: operation
data: {"type":"shell","operationId":"run-1","status":"started"}

event: stdout
data: {"operationId":"run-1","chunk":"Processing..."}

event: event
data: {"type":"shell","operationId":"run-1","success":true,"exitCode":0}

event: complete
data: {"runId":"run_x1y2z3","status":"completed"}
```

---

## Files API

Direct file operations without using the protocol.

### Read File

```http
GET /v1/spaces/{spaceId}/files/{path}
```

**Path encoding:** URL-encode the file path.

```http
GET /v1/spaces/spc_abc/files/src%2Findex.ts
```

**Response:**
```json
{
  "data": {
    "path": "src/index.ts",
    "content": "console.log('hello');",
    "size": 21,
    "encoding": "utf-8",
    "modifiedAt": "2025-01-15T10:30:00Z"
  }
}
```

For binary files:
```json
{
  "data": {
    "path": "image.png",
    "content": "iVBORw0KGgo...",
    "size": 12345,
    "encoding": "base64",
    "modifiedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### Write File

```http
PUT /v1/spaces/{spaceId}/files/{path}
```

**Request body:**
```json
{
  "content": "console.log('updated');",
  "encoding": "utf-8"
}
```

---

### Delete File

```http
DELETE /v1/spaces/{spaceId}/files/{path}
```

---

### List Files

```http
GET /v1/spaces/{spaceId}/files?path=src/&recursive=true
```

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Directory path (default: root) |
| `recursive` | boolean | Include subdirectories |

**Response:**
```json
{
  "data": {
    "path": "src/",
    "files": [
      {
        "name": "index.ts",
        "path": "src/index.ts",
        "type": "file",
        "size": 234,
        "modifiedAt": "2025-01-15T10:30:00Z"
      },
      {
        "name": "utils",
        "path": "src/utils",
        "type": "directory"
      }
    ]
  }
}
```

---

### Upload Files (Multipart)

Upload multiple files at once.

```http
POST /v1/spaces/{spaceId}/files
Content-Type: multipart/form-data
```

**Form data:**
- `files`: File(s) to upload
- `basePath`: Base directory path (optional)

---

### Download Workspace Archive

Download entire workspace as a zip archive.

```http
GET /v1/spaces/{spaceId}/files/archive
Accept: application/zip
```

---

## Approvals API

### List Pending Approvals

```http
GET /v1/approvals?status=pending
```

**Response:**
```json
{
  "data": [
    {
      "id": "apr_abc123",
      "spaceId": "spc_a1b2c3d4",
      "runId": "run_x1y2z3",
      "operationId": "run-1",
      "operationType": "shell",
      "status": "pending",
      "details": {
        "command": "rm -rf temp/",
        "reason": "Destructive command"
      },
      "createdAt": "2025-01-15T10:30:00Z",
      "expiresAt": "2025-01-15T10:45:00Z"
    }
  ]
}
```

---

### Approve or Deny

```http
POST /v1/approvals/{approvalId}
```

**Request body:**
```json
{
  "decision": "approved",
  "reason": "Cleanup is safe to proceed"
}
```

---

### Get Approval Details

```http
GET /v1/approvals/{approvalId}
```

---

## Policies API

### Get Policy Presets

```http
GET /v1/policies/presets
```

**Response:**
```json
{
  "data": {
    "presets": {
      "restrictive": {
        "description": "Maximum security, minimal permissions",
        "shell": {
          "enabled": false
        },
        "filesystem": {
          "readOnly": true
        },
        "network": {
          "enabled": false
        }
      },
      "standard": {
        "description": "Balanced security and functionality",
        "shell": {
          "enabled": true,
          "allowedCommands": ["bun", "node", "npm", "cat", "echo"],
          "timeout": 30000
        },
        "filesystem": {
          "readOnly": false,
          "maxFileSize": 10485760
        },
        "network": {
          "enabled": false
        }
      },
      "permissive": {
        "description": "Maximum functionality, requires trust",
        "shell": {
          "enabled": true,
          "timeout": 300000
        },
        "filesystem": {
          "readOnly": false
        },
        "network": {
          "enabled": true,
          "allowedDomains": ["*"]
        }
      }
    }
  }
}
```

---

### Validate Policy

Check if an operation would be allowed by a policy.

```http
POST /v1/policies/validate
```

**Request body:**
```json
{
  "policy": "standard",
  "policyOverrides": {},
  "operation": {
    "type": "shell",
    "command": "curl https://example.com"
  }
}
```

**Response:**
```json
{
  "data": {
    "allowed": false,
    "reason": "Network access is disabled in 'standard' policy",
    "suggestion": "Use 'permissive' policy or add 'network.enabled: true' override"
  }
}
```

---

## WebSocket Events

For real-time communication, connect via WebSocket:

```
wss://api.agentspaces.io/v1/ws?token=as_live_xxx
```

### Subscribe to Space

```json
{
  "type": "subscribe",
  "channel": "space",
  "spaceId": "spc_a1b2c3d4"
}
```

### Events

**Run started:**
```json
{
  "type": "run.started",
  "spaceId": "spc_a1b2c3d4",
  "runId": "run_x1y2z3",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Operation output (streaming):**
```json
{
  "type": "run.output",
  "runId": "run_x1y2z3",
  "operationId": "shell-1",
  "stream": "stdout",
  "chunk": "Processing line 1...\n"
}
```

**Approval required:**
```json
{
  "type": "approval.required",
  "spaceId": "spc_a1b2c3d4",
  "runId": "run_x1y2z3",
  "approval": { ... }
}
```

**Run completed:**
```json
{
  "type": "run.completed",
  "spaceId": "spc_a1b2c3d4",
  "runId": "run_x1y2z3",
  "status": "completed",
  "durationMs": 2345
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource state conflict |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_API_KEY` | API key is invalid or expired |
| `SPACE_NOT_FOUND` | Space doesn't exist |
| `SPACE_NOT_READY` | Space is not in ready state |
| `RUN_NOT_FOUND` | Run doesn't exist |
| `RUN_ALREADY_COMPLETED` | Cannot modify completed run |
| `OPERATION_INVALID` | Operation failed validation |
| `POLICY_DENIED` | Operation blocked by policy |
| `APPROVAL_REQUIRED` | Operation needs approval |
| `APPROVAL_TIMEOUT` | Approval request expired |
| `FILE_NOT_FOUND` | File doesn't exist |
| `FILE_TOO_LARGE` | File exceeds size limit |
| `COMMAND_TIMEOUT` | Shell command timed out |
| `QUOTA_EXCEEDED` | Resource quota exceeded |
| `RATE_LIMITED` | Too many requests |

---

## Rate Limits

### Default Limits

| Endpoint | Limit |
|----------|-------|
| Space creation | 10/minute |
| Run creation | 60/minute |
| File operations | 300/minute |
| General API | 1000/minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705318800
```

### Rate Limited Response

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "details": {
      "retryAfter": 30
    }
  }
}
```

---

## OpenAPI Schema

The complete OpenAPI 3.0 schema is available at:

```
GET /v1/openapi.json
GET /v1/openapi.yaml
```

Interactive documentation:
```
GET /v1/docs
```

---

## Related Documents

- [Protocol Spec](./protocol-spec.md): Operations and events format
- [TypeScript SDK Spec](./typescript-sdk-spec.md): SDK that wraps this API
- [Architecture](./architecture.md): System design

