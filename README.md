# Agent Spaces

An open-source framework for creating isolated code execution environments where AI agents can safely create files and run code.

## Features

- **Isolated Sandboxes**: Docker-based execution environments with configurable policies
- **Operations Protocol**: Simple JSON protocol for file and shell operations
- **TypeScript SDK**: Ergonomic API for AI agent integration
- **Capabilities System**: Convert tools and MCPs to code-callable APIs
- **Policy Engine**: Fine-grained access control for filesystem, shell, and network

## Project Structure

```
agent-spaces/
├── apps/
│   └── server/              # REST API server (Hono + Bun)
├── packages/
│   ├── protocol/            # Operations/events protocol types and validation
│   ├── core/                # Core business logic
│   ├── sandbox/             # Docker-based sandbox engine
│   ├── policy/              # Policy engine for access control
│   ├── capabilities/        # Tool/MCP to code API conversion
│   └── sdk/                 # TypeScript SDK
├── evals/                   # LLM evaluation scenarios
└── documentation/           # Project documentation
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.1.0 or later
- [Docker](https://www.docker.com/) running locally

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/agent-spaces.git
cd agent-spaces

# Install dependencies
bun install

# Set up environment
cp .env.example .env.local

# Start the development server
bun dev
```

### Basic Usage

```typescript
import { AgentSpaces } from '@agent-spaces/sdk';

// Initialize client
const client = new AgentSpaces({
  baseUrl: 'http://localhost:3000',
  apiKey: process.env.AGENT_SPACES_API_KEY,
});

// Create an isolated space
const space = await client.spaces.create({
  name: 'my-agent-space',
  policy: 'standard',
});

// Execute operations
const run = await space.run({
  operations: [
    {
      type: 'createFile',
      path: 'hello.ts',
      content: 'console.log("Hello, Agent Spaces!");',
    },
    {
      type: 'shell',
      command: 'bun run hello.ts',
    },
  ],
});

// Check results
console.log(run.events);
// [
//   { type: 'createFile', success: true, path: 'hello.ts' },
//   { type: 'shell', success: true, stdout: 'Hello, Agent Spaces!\n' }
// ]

// Cleanup
await space.destroy();
```

## Documentation

See the [documentation](./documentation/) folder for:

- [Getting Started](./documentation/getting-started/)
- [Guides](./documentation/guides/)
- [API Reference](./documentation/api-reference/)

## Development

```bash
# Run all tests
bun test

# Run linting
bun lint

# Type checking
bun typecheck

# Build all packages
bun build
```

## Architecture

Agent Spaces follows a modular architecture:

1. **Protocol**: Defines the operations (createFile, shell, etc.) and events
2. **Sandbox**: Docker-based isolation with filesystem and shell execution
3. **Policy**: Access control rules for operations
4. **Core**: Business logic orchestrating sandbox and policy
5. **Server**: REST API exposing the functionality
6. **SDK**: TypeScript client wrapping the REST API
7. **Capabilities**: Converts tools/MCPs to code-callable APIs

## Contributing

See [documentation/contributing/](./documentation/contributing/) for development setup and guidelines.

## License

MIT

