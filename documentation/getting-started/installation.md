# Installation

This guide covers different ways to install and run Agent Spaces.

## Quick Start (Development)

For development, clone the repository and run locally:

```bash
# Clone
git clone https://github.com/your-org/agent-spaces.git
cd agent-spaces

# Install dependencies
bun install

# Copy environment file
cp .env.example .env.local

# Start development server
bun dev
```

## Docker (Recommended for Production)

Run Agent Spaces using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/your-org/agent-spaces.git
cd agent-spaces

# Start with Docker Compose
docker-compose -f apps/server/docker-compose.yml up -d
```

The server will be available at `http://localhost:3000`.

## SDK Installation

Install the SDK in your project:

```bash
# Using npm
npm install @agent-spaces/sdk

# Using Bun
bun add @agent-spaces/sdk

# Using pnpm
pnpm add @agent-spaces/sdk
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | SQLite database path | `./data/agent-spaces.db` |
| `DOCKER_HOST` | Docker socket path | `/var/run/docker.sock` |
| `SANDBOX_BASE_IMAGE` | Default Docker image | `oven/bun:1` |
| `SANDBOX_TIMEOUT` | Default timeout (ms) | `30000` |
| `API_KEY_SECRET` | Secret for signing API keys | - |
| `AUTH_DISABLED` | Disable authentication | `true` |

### SDK Configuration

```typescript
import { AgentSpaces } from '@agent-spaces/sdk';

const client = new AgentSpaces({
  // API key for authentication
  apiKey: process.env.AGENT_SPACES_API_KEY,

  // Base URL (defaults to http://localhost:3000)
  baseUrl: 'https://your-server.com',

  // Request timeout (default: 30000)
  timeout: 60000,

  // Max retry attempts (default: 3)
  maxRetries: 3,
});
```

## Verifying Installation

Check that everything is working:

```bash
# Check server health
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","checks":{"docker":"ok"}}
```

## Requirements

### Development

- [Bun](https://bun.sh/) v1.1.0 or later
- [Docker](https://www.docker.com/) (for sandboxing)
- Node.js 18+ (optional, for npm compatibility)

### Production

- Docker with Docker Compose
- Linux host (recommended)
- At least 2GB RAM
- Docker socket access for container management

## Troubleshooting

### Docker Not Available

If you see "Docker not available" errors:

1. Ensure Docker is running: `docker info`
2. Check socket permissions: `ls -la /var/run/docker.sock`
3. Add your user to the docker group: `sudo usermod -aG docker $USER`

### Port Already in Use

If port 3000 is in use:

```bash
# Use a different port
PORT=4000 bun dev

# Or find what's using the port
lsof -i :3000
```

### Permission Issues

If you encounter permission errors with the data directory:

```bash
mkdir -p data/workspaces
chmod 755 data data/workspaces
```



