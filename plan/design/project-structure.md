# Project Structure and Developer Toolchain

This document defines the folder structure, development toolchain, CI/CD pipelines, and developer workflows for **Agent Spaces**.

## Table of Contents

1. [Monorepo Structure](#monorepo-structure)
2. [Package Organization](#package-organization)
3. [Development Toolchain](#development-toolchain)
4. [Testing Strategy](#testing-strategy)
5. [Documentation Structure](#documentation-structure)
6. [CI/CD Pipelines](#cicd-pipelines)
7. [Environment Variables & Secrets](#environment-variables--secrets)
8. [Developer Workflow](#developer-workflow)
9. [Release Process](#release-process)

---

## Monorepo Structure

Agent Spaces uses a **monorepo** structure managed with **Turborepo** for optimal developer experience.

```
agent-spaces/
├── .github/                    # GitHub Actions workflows
│   ├── workflows/
│   │   ├── ci.yml              # CI pipeline
│   │   ├── release.yml         # Release pipeline
│   │   └── security.yml        # Security scanning
│   └── CODEOWNERS
│
├── apps/                       # Deployable applications
│   ├── server/                 # Main API server
│   └── docs/                   # Documentation site
│
├── packages/                   # Shared packages
│   ├── core/                   # Core business logic
│   ├── sdk/                    # TypeScript SDK
│   ├── protocol/               # Protocol types & validation
│   ├── capabilities/           # Capability system
│   ├── sandbox/                # Sandbox engine
│   ├── policy/                 # Policy engine
│   └── cli/                    # CLI tool
│
├── documentation/              # Project documentation
│   ├── getting-started/
│   ├── guides/
│   ├── api-reference/
│   └── contributing/
│
├── plan/                       # Planning documents
│   ├── design/                 # Design documents
│   ├── requirements/           # PRDs
│   └── ideas/                  # Ideas and proposals
│
├── examples/                   # Example projects
│   ├── basic/
│   ├── with-capabilities/
│   └── full-stack/
│
├── scripts/                    # Development scripts
│   ├── setup.ts
│   ├── build.ts
│   └── release.ts
│
├── .env.example                # Example environment variables
├── .gitignore
├── biome.json                  # Linting & formatting config
├── bun.lockb                   # Bun lockfile
├── package.json                # Root package.json
├── turbo.json                  # Turborepo config
└── tsconfig.json               # Root TypeScript config
```

---

## Package Organization

### apps/server

The main API server application.

```
apps/server/
├── src/
│   ├── index.ts                # Entry point
│   ├── app.ts                  # Hono app setup
│   ├── routes/
│   │   ├── spaces.ts           # /spaces endpoints
│   │   ├── runs.ts             # /runs endpoints
│   │   ├── files.ts            # /files endpoints
│   │   ├── approvals.ts        # /approvals endpoints
│   │   └── health.ts           # Health checks
│   ├── middleware/
│   │   ├── auth.ts             # Authentication
│   │   ├── validation.ts       # Request validation
│   │   ├── rateLimit.ts        # Rate limiting
│   │   └── errorHandler.ts     # Error handling
│   ├── services/
│   │   ├── space.service.ts
│   │   ├── run.service.ts
│   │   ├── file.service.ts
│   │   └── approval.service.ts
│   ├── db/
│   │   ├── index.ts            # Database connection
│   │   ├── schema.ts           # Drizzle schema
│   │   └── migrations/         # SQL migrations
│   └── config/
│       ├── index.ts            # Configuration loader
│       └── env.ts              # Environment validation
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

### packages/core

Core business logic shared across applications.

```
packages/core/
├── src/
│   ├── index.ts                # Public exports
│   ├── space/
│   │   ├── space.ts            # Space entity
│   │   ├── space.repository.ts
│   │   └── space.types.ts
│   ├── run/
│   │   ├── run.ts
│   │   ├── run.executor.ts
│   │   └── run.types.ts
│   ├── file/
│   │   ├── file.service.ts
│   │   └── file.types.ts
│   └── approval/
│       ├── approval.ts
│       └── approval.types.ts
├── tests/
├── package.json
└── tsconfig.json
```

### packages/sdk

TypeScript SDK for client applications.

```
packages/sdk/
├── src/
│   ├── index.ts                # Main exports
│   ├── client.ts               # AgentSpaces client
│   ├── resources/
│   │   ├── spaces.ts           # Spaces resource
│   │   ├── runs.ts             # Runs resource
│   │   ├── files.ts            # Files resource
│   │   └── approvals.ts        # Approvals resource
│   ├── types/
│   │   ├── operations.ts       # Operation types
│   │   ├── events.ts           # Event types
│   │   └── config.ts           # Config types
│   ├── errors/
│   │   └── index.ts            # Error classes
│   ├── streaming/
│   │   ├── sse.ts              # SSE client
│   │   └── websocket.ts        # WebSocket client
│   └── testing/
│       ├── mock.ts             # Mock client
│       └── fixtures.ts         # Test fixtures
├── tests/
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

### packages/protocol

Protocol types and validation.

```
packages/protocol/
├── src/
│   ├── index.ts
│   ├── operations/
│   │   ├── index.ts
│   │   ├── message.ts
│   │   ├── createFile.ts
│   │   ├── readFile.ts
│   │   ├── editFile.ts
│   │   ├── deleteFile.ts
│   │   └── shell.ts
│   ├── events/
│   │   ├── index.ts
│   │   └── [event types]
│   ├── validation/
│   │   ├── schemas.ts          # Zod schemas
│   │   └── validator.ts
│   └── version.ts
├── tests/
├── package.json
└── tsconfig.json
```

### packages/sandbox

Sandbox execution engine.

```
packages/sandbox/
├── src/
│   ├── index.ts
│   ├── sandbox.ts              # Main sandbox class
│   ├── engines/
│   │   ├── isolated-vm.ts      # isolated-vm engine
│   │   ├── docker.ts           # Docker engine
│   │   └── process.ts          # Process isolation
│   ├── filesystem/
│   │   ├── workspace.ts        # Workspace management
│   │   └── virtual-fs.ts       # Virtual filesystem
│   ├── shell/
│   │   ├── executor.ts         # Command executor
│   │   └── parser.ts           # Command parser
│   └── capabilities/
│       ├── loader.ts           # Capability loader
│       └── proxy.ts            # Capability proxy
├── tests/
├── package.json
└── tsconfig.json
```

### packages/policy

Policy engine for access control.

```
packages/policy/
├── src/
│   ├── index.ts
│   ├── engine.ts               # Policy engine
│   ├── presets/
│   │   ├── restrictive.ts
│   │   ├── standard.ts
│   │   └── permissive.ts
│   ├── rules/
│   │   ├── filesystem.ts
│   │   ├── shell.ts
│   │   └── network.ts
│   └── types.ts
├── tests/
├── package.json
└── tsconfig.json
```

### packages/capabilities

Capability system for tool/MCP conversion.

```
packages/capabilities/
├── src/
│   ├── index.ts
│   ├── define.ts               # defineTool helper
│   ├── compiler/
│   │   ├── index.ts            # Capability compiler
│   │   ├── parser.ts           # Schema parser
│   │   └── generator.ts        # Code generator
│   ├── mcp/
│   │   ├── bridge.ts           # MCP protocol bridge
│   │   ├── discovery.ts        # Tool discovery
│   │   └── types.ts
│   ├── runtime/
│   │   ├── proxy.ts            # Runtime proxy
│   │   └── registry.ts         # Capability registry
│   └── std/                    # Standard library
│       ├── fs.ts
│       ├── http.ts
│       └── json.ts
├── tests/
├── package.json
└── tsconfig.json
```

### packages/cli

Command-line interface.

```
packages/cli/
├── src/
│   ├── index.ts                # Entry point
│   ├── commands/
│   │   ├── init.ts             # agent-spaces init
│   │   ├── dev.ts              # agent-spaces dev
│   │   ├── run.ts              # agent-spaces run
│   │   ├── spaces.ts           # agent-spaces spaces
│   │   └── capabilities.ts     # agent-spaces capabilities
│   ├── utils/
│   │   ├── config.ts
│   │   └── output.ts
│   └── lib/
│       └── prompts.ts
├── bin/
│   └── agent-spaces.ts
├── package.json
└── tsconfig.json
```

---

## Development Toolchain

### Core Tools

| Tool | Purpose | Version |
|------|---------|---------|
| **Bun** | Runtime, package manager, bundler | Latest |
| **TypeScript** | Type checking | 5.x |
| **Turborepo** | Monorepo orchestration | Latest |
| **Biome** | Linting & formatting | Latest |
| **Drizzle** | Database ORM | Latest |
| **Hono** | Web framework | Latest |
| **Zod** | Schema validation | Latest |

### Configuration Files

#### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "tests/**"]
    },
    "test:unit": {
      "dependsOn": ["build"]
    },
    "test:integration": {
      "dependsOn": ["build"]
    },
    "lint": {
      "inputs": ["src/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

#### biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  }
}
```

#### tsconfig.json (root)

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Testing Strategy

### Test Types

| Type | Tool | Purpose | Location |
|------|------|---------|----------|
| **Unit** | Bun test | Component testing | `tests/unit/` |
| **Integration** | Bun test | Service integration | `tests/integration/` |
| **E2E** | Bun test | Full system testing | `tests/e2e/` |
| **Snapshot** | Bun test | Protocol validation | `tests/snapshots/` |

### Test Structure

```
packages/[package]/tests/
├── unit/
│   ├── [module].test.ts
│   └── __snapshots__/
├── integration/
│   ├── [feature].test.ts
│   └── fixtures/
└── setup.ts
```

### Running Tests

```bash
# Run all tests
bun test

# Run with Turbo (parallel)
bun turbo test

# Run specific package
bun turbo test --filter=@agent-spaces/core

# Unit tests only
bun turbo test:unit

# Integration tests only
bun turbo test:integration

# With coverage
bun test --coverage
```

### Test Configuration

```typescript
// bunfig.toml
[test]
coverage = true
coverageDir = "coverage"
coverageReporters = ["text", "lcov"]
```

### Evals (AI Agent Testing)

For testing AI agent behavior:

```
evals/
├── scenarios/
│   ├── file-operations.eval.ts
│   ├── shell-execution.eval.ts
│   └── approval-flow.eval.ts
├── fixtures/
│   ├── workspaces/
│   └── expected-outputs/
├── runner.ts
└── report.ts
```

```typescript
// evals/scenarios/file-operations.eval.ts
import { defineEval } from '../runner';

export default defineEval({
  name: 'file-operations',
  description: 'Test basic file operations',
  
  scenarios: [
    {
      name: 'create-and-read',
      operations: [
        { type: 'createFile', path: 'test.txt', content: 'hello' },
        { type: 'readFile', path: 'test.txt' },
      ],
      expectedEvents: [
        { type: 'createFile', success: true },
        { type: 'readFile', success: true, content: 'hello' },
      ],
    },
  ],
});
```

---

## Documentation Structure

Documentation lives in the `documentation/` folder:

```
documentation/
├── getting-started/
│   ├── introduction.md
│   ├── quickstart.md
│   ├── installation.md
│   └── first-space.md
│
├── guides/
│   ├── spaces.md
│   ├── runs-and-operations.md
│   ├── file-operations.md
│   ├── shell-execution.md
│   ├── policies.md
│   ├── approvals.md
│   ├── capabilities.md
│   ├── mcp-integration.md
│   └── self-hosting.md
│
├── api-reference/
│   ├── rest-api/
│   │   ├── overview.md
│   │   ├── spaces.md
│   │   ├── runs.md
│   │   ├── files.md
│   │   └── approvals.md
│   ├── sdk/
│   │   ├── overview.md
│   │   ├── client.md
│   │   ├── spaces.md
│   │   ├── runs.md
│   │   └── types.md
│   └── protocol/
│       ├── overview.md
│       ├── operations.md
│       └── events.md
│
├── examples/
│   ├── basic-usage.md
│   ├── data-processing.md
│   ├── document-generation.md
│   └── multi-step-workflow.md
│
├── contributing/
│   ├── development-setup.md
│   ├── architecture.md
│   ├── coding-standards.md
│   └── pull-requests.md
│
└── changelog/
    └── CHANGELOG.md
```

### Documentation Site

The documentation site lives in `apps/docs/`:

```
apps/docs/
├── src/
│   ├── pages/
│   ├── components/
│   └── styles/
├── public/
├── next.config.js          # Or Astro/Docusaurus config
└── package.json
```

**Recommended documentation framework**: **Astro** with Starlight theme (fast, Markdown-first, good DX)

---

## CI/CD Pipelines

### GitHub Actions Workflows

#### ci.yml (Continuous Integration)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run typecheck

  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: "**/dist"
```

#### release.yml (Release Pipeline)

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - run: bun install
      - run: bun run build
      - run: bun run test
      
      # Publish to npm
      - run: |
          echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc
          bun run publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      # Build and push Docker image
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - uses: docker/build-push-action@v5
        with:
          context: apps/server
          push: true
          tags: agentspaces/server:${{ github.ref_name }}
      
      # Create GitHub Release
      - uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

#### security.yml (Security Scanning)

```yaml
name: Security

on:
  schedule:
    - cron: '0 0 * * *'  # Daily
  push:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun audit

  codeql:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: typescript
      - uses: github/codeql-action/analyze@v3
```

---

## Environment Variables & Secrets

### Environment Files

```bash
# .env.example - Template for developers
# Copy to .env.local for local development

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_spaces
DATABASE_URL_SQLITE=./data/agent-spaces.db

# Redis (for queues)
REDIS_URL=redis://localhost:6379

# Storage
STORAGE_TYPE=local                    # local | s3
STORAGE_PATH=./data/workspaces        # For local storage
S3_BUCKET=                            # For S3 storage
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Authentication
API_KEY_SECRET=your-secret-key        # For signing API keys
AUTH_DISABLED=true                    # Disable auth for development

# Sandbox
SANDBOX_ENGINE=isolated-vm            # isolated-vm | docker | process
DOCKER_HOST=unix:///var/run/docker.sock

# Capabilities
CAPABILITIES_PATH=./capabilities

# External Services (for capabilities)
SLACK_BOT_TOKEN=
GITHUB_TOKEN=
```

### Secret Management

| Environment | Method |
|-------------|--------|
| **Local** | `.env.local` (git-ignored) |
| **CI** | GitHub Secrets |
| **Production** | Secret manager (Vault, AWS Secrets Manager) |

### Required Secrets for CI/CD

| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | Publishing to npm |
| `DOCKER_USERNAME` | Docker Hub login |
| `DOCKER_PASSWORD` | Docker Hub password |
| `CODECOV_TOKEN` | Code coverage reporting |

---

## Developer Workflow

### Getting Started

```bash
# Clone repository
git clone https://github.com/your-org/agent-spaces.git
cd agent-spaces

# Install dependencies
bun install

# Set up environment
cp .env.example .env.local

# Start development
bun dev
```

### Daily Development

```bash
# Start all services in dev mode
bun dev

# Start specific package
bun --filter @agent-spaces/server dev

# Run tests while developing
bun test --watch

# Check types
bun typecheck

# Lint and format
bun lint
bun format
```

### Creating a New Package

```bash
# Use the script
bun run scripts/new-package.ts my-package

# Or manually
mkdir -p packages/my-package/src
cd packages/my-package
bun init
```

### Branch Naming

```
feature/short-description
fix/issue-number-description
docs/section-name
refactor/component-name
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(sdk): add streaming support for runs
fix(sandbox): handle timeout correctly
docs(api): add examples for file operations
refactor(core): extract run executor
test(protocol): add validation tests
chore: update dependencies
```

### Pull Request Process

1. Create feature branch
2. Make changes
3. Run `bun lint && bun test`
4. Push and create PR
5. Wait for CI checks
6. Request review
7. Squash and merge

---

## Release Process

### Versioning

Use [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Add a changeset when making changes
bun changeset

# Create release (CI does this automatically)
bun changeset version
bun changeset publish
```

### Release Types

| Type | Version Bump | Example |
|------|--------------|---------|
| **patch** | Bug fixes | 1.0.0 → 1.0.1 |
| **minor** | New features | 1.0.0 → 1.1.0 |
| **major** | Breaking changes | 1.0.0 → 2.0.0 |

### Release Checklist

- [ ] All tests passing
- [ ] CHANGELOG updated
- [ ] Documentation updated
- [ ] Security audit clean
- [ ] Tag created and pushed
- [ ] npm packages published
- [ ] Docker image pushed
- [ ] GitHub release created

---

## Scripts Reference

### Root package.json Scripts

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:unit": "turbo test:unit",
    "test:integration": "turbo test:integration",
    "test:e2e": "turbo test:e2e",
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "format": "biome format --write .",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean && rm -rf node_modules",
    "changeset": "changeset",
    "version": "changeset version",
    "publish": "turbo build && changeset publish",
    "db:migrate": "bun --filter @agent-spaces/server db:migrate",
    "db:generate": "bun --filter @agent-spaces/server db:generate"
  }
}
```

---

## Related Documents

- [Architecture](./architecture.md): System design
- [Technology Choices](./technology-choices.md): Tool selection rationale
- [Risks](./risks.md): Risk management

