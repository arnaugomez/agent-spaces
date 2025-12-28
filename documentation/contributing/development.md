# Development Setup

This guide helps you set up a development environment for contributing to Agent Spaces.

## Prerequisites

- [Bun](https://bun.sh/) v1.1.0+
- [Docker](https://www.docker.com/)
- [Git](https://git-scm.com/)
- A code editor (VS Code recommended)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/agent-spaces.git
cd agent-spaces
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment

```bash
cp .env.example .env.local
```

### 4. Start Development Server

```bash
bun dev
```

The server runs at `http://localhost:3000`.

## Project Structure

```
agent-spaces/
├── apps/
│   └── server/           # REST API server
├── packages/
│   ├── protocol/         # Protocol types and validation
│   ├── sandbox/          # Docker sandbox engine
│   ├── policy/           # Policy engine
│   ├── core/             # Business logic
│   ├── capabilities/     # Tool/MCP conversion
│   └── sdk/              # TypeScript SDK
├── evals/                # LLM evaluation scenarios
├── documentation/        # Documentation
└── plan/                 # Design documents
```

## Development Commands

### Build

```bash
# Build all packages
bun run build

# Build specific package
bun run build --filter @agent-spaces/protocol
```

### Test

```bash
# Run all tests
bun test

# Run specific package tests
bun test packages/protocol

# Watch mode
bun test --watch
```

### Lint & Format

```bash
# Check linting
bun lint

# Fix linting issues
bun lint:fix

# Format code
bun format
```

### Type Check

```bash
bun typecheck
```

## Package Development

### Protocol Package

The protocol package defines operations and events.

```bash
cd packages/protocol
bun test
```

Key files:
- `src/operations/` - Operation types and schemas
- `src/events/` - Event types and schemas
- `src/validation/` - Validation utilities

### Sandbox Package

The sandbox package handles Docker-based isolation.

```bash
cd packages/sandbox
bun test
```

Requires Docker to be running.

### Core Package

The core package contains business logic.

```bash
cd packages/core
bun test
```

### SDK Package

The SDK package provides the client library.

```bash
cd packages/sdk
bun test
```

## Running the Server

```bash
# Development (with hot reload)
cd apps/server
bun dev

# Production build
bun build
bun start
```

## Running Evals

Evals require an LLM API key:

```bash
export OPENAI_API_KEY=sk-...
# or
export ANTHROPIC_API_KEY=sk-ant-...

cd evals
bun run eval
```

## Database

The development database is SQLite at `./data/agent-spaces.db`.

```bash
# Create/migrate database
bun run db:migrate

# Generate migrations (after schema changes)
bun run db:generate
```

## Docker Development

Build and run with Docker:

```bash
docker-compose -f apps/server/docker-compose.yml up --build
```

## Code Style

- Use TypeScript
- Follow the Biome linter rules
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Write tests for new features

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`bun test`)
5. Run linting (`bun lint`)
6. Commit with a clear message
7. Push to your fork
8. Open a Pull Request

## Troubleshooting

### Docker Issues

```bash
# Check Docker is running
docker info

# Reset Docker state
docker system prune -a
```

### Database Issues

```bash
# Reset database
rm ./data/agent-spaces.db
bun run db:migrate
```

### Port Conflicts

```bash
# Use different port
PORT=4000 bun dev
```

