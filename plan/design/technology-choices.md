# Technology Choices

This document outlines the key technology decisions for building **Agent Spaces**, with justifications and alternative options for each choice.

## Table of Contents

1. [Summary](#summary)
2. [Primary Language & Runtime](#primary-language--runtime)
3. [Web Framework](#web-framework)
4. [Database & Storage](#database--storage)
5. [Sandbox & Isolation](#sandbox--isolation)
6. [Task Queue & Background Jobs](#task-queue--background-jobs)
7. [Testing & Quality](#testing--quality)
8. [Observability](#observability)
9. [Containerization & Deployment](#containerization--deployment)
10. [Decision Matrix](#decision-matrix)

---

## Summary

| Category | Recommended Choice | Alternatives Considered |
|----------|-------------------|------------------------|
| Language & Runtime | TypeScript + Bun | Node.js, Deno, Go, Rust |
| Web Framework | Hono | Elysia, Express, Fastify |
| Database | SQLite (dev) + PostgreSQL (prod) | MySQL, MongoDB |
| Object Storage | Local FS + S3-compatible | MinIO, GCS |
| Sandbox | Isolated-VM + Docker containers | Firecracker, gVisor, Deno isolates |
| Task Queue | BullMQ (Redis) | Bee-Queue, custom |
| Testing | Bun test + Vitest | Jest |
| Observability | OpenTelemetry + Pino | Winston, Bunyan |
| Containerization | Docker + Docker Compose | Podman |

---

## Primary Language & Runtime

### Recommended: TypeScript + Bun

**Bun** is a fast, all-in-one JavaScript/TypeScript runtime with built-in bundler, test runner, and package manager.

**Justification:**
- **Performance**: Bun is significantly faster than Node.js for many operations (startup, package install, bundling)
- **TypeScript native**: No compilation step needed; TypeScript runs directly
- **Built-in tooling**: Test runner, bundler, package manager—fewer dependencies
- **Modern APIs**: Native `fetch`, WebSocket, SQLite support out of the box
- **Alignment with project goals**: The protocol targets "TypeScript on Bun" as the initial language for agent code execution

**Trade-offs:**
- Less mature ecosystem than Node.js
- Some npm packages may have compatibility issues
- Smaller community for troubleshooting

### Alternative Options

| Option | Pros | Cons | When to Choose |
|--------|------|------|----------------|
| **Node.js** | Mature, stable, huge ecosystem | Slower, requires build step for TS | If Bun compatibility issues arise |
| **Deno** | Secure by default, TypeScript native | Smaller ecosystem, different module system | If security isolation is a primary concern |
| **Go** | Excellent concurrency, single binary | Different language, no TypeScript SDK synergy | If raw performance is critical |
| **Rust** | Maximum performance, memory safety | Steep learning curve, slower development | If building at massive scale |

### Recommendation Decision

**Start with Bun** for rapid development and alignment with project goals. If significant compatibility issues arise, Node.js is a drop-in fallback since Bun aims for Node.js compatibility.

---

## Web Framework

### Recommended: Hono

**Hono** is a lightweight, ultrafast web framework designed for edge computing and modern runtimes.

**Justification:**
- **Bun-first design**: Optimized for Bun and edge runtimes
- **Type-safe**: Strong TypeScript support with Zod integration
- **Minimal**: Small bundle size, fast startup
- **Familiar API**: Similar to Express, easy for developers to learn
- **Built-in validation**: Request validation middleware
- **OpenAPI support**: Built-in OpenAPI schema generation

**Trade-offs:**
- Smaller community than Express
- Fewer middleware options (but growing)

### Alternative Options

| Option | Pros | Cons | When to Choose |
|--------|------|------|----------------|
| **Elysia** | Blazingly fast, Bun-native, excellent DX | Very new, smaller ecosystem | If maximum Bun performance matters |
| **Express** | Massive ecosystem, battle-tested | Slower, callback-based, aging API | If you need specific Express middleware |
| **Fastify** | Fast, schema-based validation | More complex, Node.js focused | If using Node.js instead of Bun |
| **tRPC** | Type-safe end-to-end | Requires specific client, not REST | If only TypeScript clients are expected |

### Recommendation Decision

**Hono** for its balance of performance, TypeScript support, and ecosystem maturity. Consider **Elysia** if benchmarks show it's significantly faster for your use case.

---

## Database & Storage

### Primary Database: SQLite (Development) + PostgreSQL (Production)

**Justification:**
- **SQLite for development**: 
  - Zero configuration, embedded
  - Bun has native SQLite support (`bun:sqlite`)
  - Fast for local development
  - Easy to reset and test

- **PostgreSQL for production**:
  - Proven reliability at scale
  - Excellent JSON support for flexible schemas
  - Strong ecosystem (backup tools, replication)
  - ACID compliance for audit logs

**Schema needs:**
- Spaces metadata
- Runs and operation logs
- Policy definitions
- Approval records
- Audit trails

### ORM/Query Builder: Drizzle ORM

**Justification:**
- **Type-safe**: Full TypeScript type inference from schema
- **SQL-like**: Familiar syntax, not too abstracted
- **Lightweight**: Small bundle, fast runtime
- **Multi-database**: Works with SQLite, PostgreSQL, MySQL
- **Migrations**: Built-in migration system

**Alternatives:**
| Option | Pros | Cons | When to Choose |
|--------|------|------|----------------|
| **Prisma** | Great DX, visual editor | Heavy runtime, slower | If you prefer declarative schema |
| **Kysely** | Type-safe, lightweight | Less features | If you want minimal abstraction |
| **Raw SQL** | Full control, no overhead | No type safety, more code | If ORM overhead is unacceptable |

### Object Storage: Local FS + S3-Compatible

For workspace file storage:

**Development**: Local filesystem with structured paths
**Production**: S3-compatible storage (AWS S3, MinIO, Cloudflare R2)

**Justification:**
- Workspace files can be large and numerous
- S3 is industry standard, well-supported
- MinIO provides self-hosted S3 compatibility
- R2 offers zero egress fees

---

## Sandbox & Isolation

This is the most critical technical decision for security.

### Recommended: Layered Approach

Use multiple isolation layers depending on deployment mode:

```
┌─────────────────────────────────────────────┐
│ Layer 1: Process Isolation (always)         │
│   - isolated-vm or vm2 for code execution   │
│   - Separate process per space              │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Layer 2: Container Isolation (production)   │
│   - Docker containers per space             │
│   - Resource limits (cgroups)               │
│   - Network namespaces                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Layer 3: VM Isolation (high security)       │
│   - Firecracker microVMs                    │
│   - Full kernel isolation                   │
└─────────────────────────────────────────────┘
```

### Option A: isolated-vm (Recommended for MVP)

**Justification:**
- V8 isolate-level separation
- Fast startup (milliseconds)
- Memory and CPU limits
- No container overhead
- Works within a single Bun process

**Trade-offs:**
- Same kernel as host (less isolation than containers)
- V8-specific (JavaScript/TypeScript only)

### Option B: Docker Containers (Recommended for Production)

**Justification:**
- Industry-standard isolation
- Full filesystem, network, and process isolation
- Easy to configure resource limits
- Reproducible environments
- Works with any language/runtime

**Trade-offs:**
- Slower startup (seconds)
- More resource overhead
- Requires Docker daemon

### Option C: Firecracker microVMs (Future/Enterprise)

**Justification:**
- Strongest isolation (separate kernel)
- Fast startup (~125ms)
- Minimal overhead
- Used by AWS Lambda

**Trade-offs:**
- Complex to set up
- Requires KVM support
- More operational overhead

### Alternative Sandboxing Options

| Option | Isolation Level | Startup Time | Complexity | When to Choose |
|--------|----------------|--------------|------------|----------------|
| **vm2** | Process | ~1ms | Low | Quick prototyping (⚠️ known vulns) |
| **isolated-vm** | V8 Isolate | ~5ms | Low | MVP, single-tenant |
| **Deno subprocess** | Process + perms | ~50ms | Medium | If using Deno |
| **Docker** | Container | ~1-3s | Medium | Production multi-tenant |
| **gVisor** | Container + syscall | ~2s | High | High-security production |
| **Firecracker** | microVM | ~125ms | High | Enterprise, untrusted code |

### Recommendation Decision

**MVP**: Start with `isolated-vm` for fast iteration and development
**Production**: Add Docker container layer for proper isolation
**Enterprise**: Evaluate Firecracker for maximum security

---

## Task Queue & Background Jobs

### Recommended: BullMQ with Redis

**Justification:**
- **Mature**: Battle-tested in production
- **Redis-based**: Persistent, fast
- **Features**: Retries, delays, priorities, rate limiting
- **Observability**: Built-in dashboard (Bull Board)
- **TypeScript**: First-class TypeScript support

**Use cases:**
- Long-running shell command execution
- Space cleanup jobs
- Audit log processing
- Webhook delivery

### Alternative Options

| Option | Pros | Cons | When to Choose |
|--------|------|------|----------------|
| **Bee-Queue** | Simpler, lighter | Fewer features | If you need minimal queuing |
| **Agenda** | MongoDB-based | Requires MongoDB | If already using MongoDB |
| **Custom (SQLite)** | No Redis dependency | Must build everything | If avoiding Redis complexity |
| **Temporal** | Workflow orchestration | Complex, overkill | If complex workflows needed |

---

## Testing & Quality

### Test Runner: Bun Test

**Justification:**
- Built into Bun—zero configuration
- Fast execution
- Jest-compatible API
- Snapshot testing support
- Coverage reporting

### Alternatives

| Option | Pros | Cons | When to Choose |
|--------|------|------|----------------|
| **Vitest** | Fast, Vite-compatible | Extra dependency | If Bun test is insufficient |
| **Jest** | Massive ecosystem | Slower, requires config | If specific Jest features needed |

### Additional Quality Tools

| Tool | Purpose |
|------|---------|
| **Biome** | Linting + formatting (fast, Rust-based) |
| **TypeScript** | Type checking (strict mode) |
| **Zod** | Runtime validation |
| **Changesets** | Version management |

---

## Observability

### Logging: Pino

**Justification:**
- Extremely fast (low overhead)
- Structured JSON logging
- Bun compatible
- Easy to pipe to log aggregators

### Tracing: OpenTelemetry

**Justification:**
- Vendor-neutral standard
- Traces requests across services
- Integrates with major observability platforms
- Critical for debugging distributed runs

### Metrics: OpenTelemetry + Prometheus

**Justification:**
- Standard metrics format
- Easy to integrate with Grafana
- Track run durations, error rates, resource usage

---

## Containerization & Deployment

### Development: Docker Compose

**Justification:**
- Define all services (API, Redis, PostgreSQL) in one file
- Easy local development setup
- Reproducible environment

### Production: Docker + Orchestration

**Options:**
| Option | When to Choose |
|--------|----------------|
| **Docker Compose** | Single-server deployment |
| **Docker Swarm** | Simple multi-node |
| **Kubernetes** | Large scale, complex requirements |
| **Fly.io** | Simple managed deployment |
| **Railway** | Developer-friendly PaaS |

---

## Decision Matrix

### Criteria Weights

| Criteria | Weight | Description |
|----------|--------|-------------|
| Developer Experience | 25% | Ease of use, documentation, TypeScript support |
| Performance | 20% | Speed, resource efficiency |
| Maturity | 20% | Stability, community, ecosystem |
| Security | 20% | Isolation, audit support |
| Simplicity | 15% | Minimal dependencies, easy operations |

### Final Recommendations Summary

| Category | Choice | Confidence |
|----------|--------|------------|
| Runtime | **Bun** | High |
| Web Framework | **Hono** | High |
| Database | **Drizzle + SQLite/PostgreSQL** | High |
| Sandbox (MVP) | **isolated-vm** | Medium |
| Sandbox (Prod) | **Docker** | High |
| Queue | **BullMQ** | High |
| Testing | **Bun test** | High |
| Logging | **Pino** | High |
| Tracing | **OpenTelemetry** | High |
| Linting | **Biome** | High |

---

## Open Decisions (For Your Input)

### 1. Sandbox Strategy for MVP

**Option A**: Start with `isolated-vm` only
- Faster development
- Less operational complexity
- Sufficient for trusted/internal use

**Option B**: Start with Docker from day one
- Proper isolation from the start
- More realistic testing
- Slower development cycle

**Recommendation**: Start with isolated-vm for rapid prototyping, add Docker layer before any multi-tenant or production use.

### 2. Monorepo vs Multi-repo

**Option A**: Monorepo (Turborepo)
- Single repo for: `packages/core`, `packages/sdk`, `packages/cli`, `apps/server`
- Shared dependencies and tooling
- Atomic commits across packages

**Option B**: Multi-repo
- Separate repos: `agent-spaces-server`, `agent-spaces-sdk`
- Independent versioning
- Clearer boundaries

**Recommendation**: Monorepo with Turborepo for easier development in early stages.

### 3. Configuration Format

**Option A**: TypeScript configuration files
- Type-safe, IDE support
- `agent-spaces.config.ts`

**Option B**: JSON/YAML configuration
- Simpler, more portable
- `agent-spaces.json` or `agent-spaces.yaml`

**Recommendation**: TypeScript config with JSON schema for non-TS users.

---

## Next Steps

Once you've made decisions on the open questions:

1. Review [Architecture](./architecture.md) to ensure alignment
2. Check [Project Structure](./project-structure.md) for directory organization
3. Begin implementation with the chosen stack

