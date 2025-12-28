# REST API Reference

Complete reference for the Agent Spaces REST API.

## Base URL

```
http://localhost:3000/v1
```

## Authentication

Include your API key in the Authorization header:

```
Authorization: Bearer as_live_xxxxxxxxxxxx
```

## Response Format

All responses follow this structure:

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

Error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

---

## Spaces

### Create Space

```http
POST /v1/spaces
```

**Request Body:**

```json
{
  "name": "my-space",
  "description": "Optional description",
  "policy": "standard",
  "policyOverrides": {
    "filesystem": { "maxFileSize": 52428800 }
  },
  "capabilities": ["weather"],
  "env": { "API_KEY": "value" },
  "metadata": { "userId": "123" },
  "ttlSeconds": 3600
}
```

**Response (201):**

```json
{
  "data": {
    "id": "spc_abc123",
    "name": "my-space",
    "status": "ready",
    "policy": "standard",
    "createdAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-15T11:30:00Z"
  },
  "meta": { "requestId": "req_xyz789" }
}
```

### List Spaces

```http
GET /v1/spaces
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `limit` | number | Max results (default: 20) |
| `offset` | number | Pagination offset |

**Response (200):**

```json
{
  "data": [
    { "id": "spc_abc123", "name": "space-1", "status": "ready" },
    { "id": "spc_def456", "name": "space-2", "status": "running" }
  ],
  "meta": { "requestId": "req_xyz789", "hasMore": false }
}
```

### Get Space

```http
GET /v1/spaces/:id
```

**Response (200):**

```json
{
  "data": {
    "id": "spc_abc123",
    "name": "my-space",
    "description": "Description",
    "status": "ready",
    "policy": "standard",
    "capabilities": ["weather"],
    "createdAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-15T11:30:00Z",
    "metadata": { "userId": "123" }
  },
  "meta": { "requestId": "req_xyz789" }
}
```

### Update Space

```http
PATCH /v1/spaces/:id
```

**Request Body:**

```json
{
  "name": "new-name",
  "description": "Updated description",
  "metadata": { "key": "value" }
}
```

### Delete Space

```http
DELETE /v1/spaces/:id
```

**Response (200):**

```json
{
  "data": {
    "id": "spc_abc123",
    "status": "destroyed",
    "destroyedAt": "2024-01-15T11:00:00Z"
  }
}
```

### Extend Space TTL

```http
POST /v1/spaces/:id/extend
```

**Request Body:**

```json
{
  "duration": 3600
}
```

---

## Runs

### Execute Operations

```http
POST /v1/spaces/:spaceId/runs
```

**Request Body:**

```json
{
  "protocolVersion": "1.0",
  "operations": [
    {
      "type": "createFile",
      "path": "hello.ts",
      "content": "console.log('Hello');"
    },
    {
      "type": "shell",
      "command": "bun run hello.ts"
    }
  ]
}
```

**Response (201):**

```json
{
  "data": {
    "id": "run_xyz789",
    "spaceId": "spc_abc123",
    "status": "completed",
    "protocolVersion": "1.0",
    "events": [
      {
        "type": "createFile",
        "path": "hello.ts",
        "success": true,
        "bytesWritten": 23,
        "timestamp": "2024-01-15T10:30:01Z"
      },
      {
        "type": "shell",
        "command": "bun run hello.ts",
        "success": true,
        "exitCode": 0,
        "stdout": "Hello\n",
        "durationMs": 150,
        "timestamp": "2024-01-15T10:30:01Z"
      }
    ],
    "startedAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:30:02Z"
  }
}
```

### List Runs

```http
GET /v1/spaces/:spaceId/runs
```

### Get Run

```http
GET /v1/spaces/:spaceId/runs/:runId
```

### Resume Run (After Approval)

```http
POST /v1/spaces/:spaceId/runs/:runId/resume
```

**Request Body:**

```json
{
  "approval": {
    "operationId": "shell-1",
    "decision": "approved",
    "reason": "User approved the operation"
  }
}
```

### Cancel Run

```http
POST /v1/spaces/:spaceId/runs/:runId/cancel
```

---

## Files

### Read File

```http
GET /v1/spaces/:spaceId/files/:path
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `encoding` | string | `utf-8` or `base64` |

**Response (200):**

```json
{
  "data": {
    "path": "config.json",
    "content": "{\"key\": \"value\"}",
    "size": 16,
    "encoding": "utf-8"
  }
}
```

### List Directory

```http
GET /v1/spaces/:spaceId/files/path/to/dir/
```

Note the trailing slash to list directory contents.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `recursive` | boolean | Include subdirectories |

### Write File

```http
PUT /v1/spaces/:spaceId/files/:path
```

**Request Body:**

```json
{
  "content": "file contents",
  "encoding": "utf-8"
}
```

### Delete File

```http
DELETE /v1/spaces/:spaceId/files/:path
```

---

## Health

### Health Check

```http
GET /health
```

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "docker": "ok"
  }
}
```

### Readiness Check

```http
GET /health/ready
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | Operation not allowed |
| `SPACE_NOT_FOUND` | 404 | Space does not exist |
| `RUN_NOT_FOUND` | 404 | Run does not exist |
| `FILE_NOT_FOUND` | 404 | File does not exist |
| `POLICY_DENIED` | 403 | Blocked by policy |
| `APPROVAL_REQUIRED` | 200 | Operation needs approval |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

