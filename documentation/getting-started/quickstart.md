# Quick Start

Get Agent Spaces running in 5 minutes.

## Prerequisites

- [Bun](https://bun.sh/) v1.1.0+
- [Docker](https://www.docker.com/) running locally

## Step 1: Start the Server

Clone the repository and start the development server:

```bash
# Clone the repo
git clone https://github.com/your-org/agent-spaces.git
cd agent-spaces

# Install dependencies
bun install

# Start the server
bun dev
```

The server will start at `http://localhost:3000`.

## Step 2: Create Your First Space

Using the SDK:

```typescript
import { AgentSpaces } from '@agent-spaces/sdk';

const client = new AgentSpaces({
  baseUrl: 'http://localhost:3000',
});

// Create an isolated space
const space = await client.spaces.create({
  name: 'my-first-space',
  policy: 'standard',
});

console.log(`Created space: ${space.id}`);
```

Or using curl:

```bash
curl -X POST http://localhost:3000/v1/spaces \
  -H "Content-Type: application/json" \
  -d '{"name": "my-first-space", "policy": "standard"}'
```

## Step 3: Execute Operations

Run some operations in your space:

```typescript
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

// Check the results
for (const event of run.events) {
  if (event.type === 'shell') {
    console.log('Output:', event.stdout);
  }
}

// Output: Hello, Agent Spaces!
```

## Step 4: Clean Up

When you're done, destroy the space:

```typescript
await space.destroy();
```

## What's Next?

- Learn about [security policies](../guides/policies.md)
- Explore the [REST API](../api-reference/rest-api.md)
- Set up [capabilities](../guides/capabilities.md) for your tools

## Full Example

Here's a complete example that creates a space, runs code, and cleans up:

```typescript
import { AgentSpaces } from '@agent-spaces/sdk';

async function main() {
  const client = new AgentSpaces({
    baseUrl: 'http://localhost:3000',
  });

  // Create space
  const space = await client.spaces.create({
    name: 'quick-demo',
  });

  try {
    // Run operations
    const run = await space.run({
      operations: [
        {
          type: 'createFile',
          path: 'script.ts',
          content: `
            const numbers = [1, 2, 3, 4, 5];
            const sum = numbers.reduce((a, b) => a + b, 0);
            console.log("Sum:", sum);
          `,
        },
        {
          type: 'shell',
          command: 'bun run script.ts',
        },
      ],
    });

    // Find the shell event
    const shellEvent = run.events.find((e) => e.type === 'shell');
    if (shellEvent && shellEvent.type === 'shell') {
      console.log('Result:', shellEvent.stdout);
      // Result: Sum: 15
    }
  } finally {
    // Always clean up
    await space.destroy();
  }
}

main().catch(console.error);
```

