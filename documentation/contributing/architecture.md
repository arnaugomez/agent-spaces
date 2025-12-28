# System Architecture

This document provides an overview of the Agent Spaces architecture.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AI Agent                              │
│                   (Claude, GPT, etc.)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ Operations JSON
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     TypeScript SDK                           │
│                  (@agent-spaces/sdk)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     REST API Server                          │
│                  (@agent-spaces/server)                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │   Hono     │  │ Middleware │  │    Route Handlers   │   │
│  │  Framework │  │  (Auth,    │  │  (Spaces, Runs,     │   │
│  │            │  │  Logging)  │  │   Files, Health)    │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│     Core     │  │    Policy    │  │   Sandbox    │
│   Business   │  │    Engine    │  │   (Docker)   │
│    Logic     │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     SQLite Database                          │
│                 (Spaces, Runs, Audit Log)                    │
└─────────────────────────────────────────────────────────────┘
```

## Package Responsibilities

### @agent-spaces/protocol

**Purpose**: Define the operations/events protocol.

- Operation types and Zod schemas
- Event types and Zod schemas
- Validation utilities
- TypeScript type exports

**Dependencies**: zod

### @agent-spaces/policy

**Purpose**: Access control and security rules.

- Policy presets (restrictive, standard, permissive)
- Filesystem rules (path validation, size limits)
- Shell rules (command allowlists, blocklists)
- Network rules (domain filtering)
- Policy evaluation engine

**Dependencies**: @agent-spaces/protocol

### @agent-spaces/sandbox

**Purpose**: Docker-based isolated execution.

- Container lifecycle management
- Filesystem operations (within workspace)
- Shell command execution
- Workspace directory management
- Timeout handling

**Dependencies**: @agent-spaces/protocol, dockerode

### @agent-spaces/core

**Purpose**: Business logic orchestration.

- Space management (create, destroy, extend)
- Run execution (process operations, emit events)
- Database operations (Drizzle + SQLite)
- Policy integration

**Dependencies**: @agent-spaces/protocol, @agent-spaces/sandbox, @agent-spaces/policy, drizzle-orm

### @agent-spaces/capabilities

**Purpose**: Tool and MCP conversion.

- Tool definition helpers
- TypeScript code generation
- MCP server integration
- Capability registry
- Standard library (fs, http)

**Dependencies**: @agent-spaces/protocol

### @agent-spaces/sdk

**Purpose**: TypeScript client library.

- AgentSpaces client class
- Space and Run resources
- HTTP client with retries
- Error handling
- Type-safe API

**Dependencies**: @agent-spaces/protocol

### @agent-spaces/server

**Purpose**: REST API server.

- Hono-based routing
- Authentication middleware
- Request validation
- OpenAPI documentation
- Docker deployment

**Dependencies**: All packages, hono

## Data Flow

### Creating a Space

```
Client → POST /spaces → Create Sandbox → Insert to DB → Return Space
```

### Executing Operations

```
Client → POST /runs → Validate Operations → For each operation:
  → Check Policy
  → If denied: Emit PolicyDenied event
  → If approval needed: Pause, emit ApprovalRequired
  → Execute in Sandbox
  → Emit result event
→ Store Run → Return Events
```

### File Operations

```
CreateFile → Policy check → Write to workspace directory → Emit event
ReadFile → Policy check → Read from workspace → Emit event with content
EditFile → Policy check → Apply edits → Emit event
DeleteFile → Policy check → Remove file → Emit event
```

### Shell Operations

```
Shell → Policy check → Docker exec → Capture stdout/stderr → Emit event
```

## Database Schema

### spaces

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (spc_xxx) |
| name | TEXT | Human-readable name |
| status | TEXT | creating/ready/running/destroyed |
| policy | TEXT | Policy preset name |
| workspace_path | TEXT | Host path to workspace |
| created_at | INTEGER | Unix timestamp |
| expires_at | INTEGER | Expiration timestamp |

### runs

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (run_xxx) |
| space_id | TEXT | Foreign key to spaces |
| status | TEXT | running/completed/awaiting_approval |
| operations | TEXT | JSON array of operations |
| events | TEXT | JSON array of events |
| started_at | INTEGER | Start timestamp |
| completed_at | INTEGER | Completion timestamp |

### audit_log

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key |
| space_id | TEXT | Related space |
| action | TEXT | Action performed |
| details | TEXT | JSON details |
| timestamp | INTEGER | When it happened |

## Security Model

### Isolation

- Each space gets its own Docker container
- Containers run with no network by default
- Filesystem access limited to workspace directory

### Policy Enforcement

1. All operations pass through policy engine
2. Blocked operations emit PolicyDenied events
3. Sensitive operations can require approval
4. All actions logged to audit table

### Path Validation

- Paths must be relative
- No parent directory traversal (..)
- Validated at protocol level

## Extension Points

### Adding Operations

1. Add type to `@agent-spaces/protocol`
2. Add handler to `@agent-spaces/core`
3. Update policy rules as needed

### Adding Policies

1. Create preset in `@agent-spaces/policy`
2. Add to presets index
3. Document in guides

### Adding Capabilities

1. Define tool with `defineTool()`
2. Register with capability registry
3. Inject into sandbox runtime

