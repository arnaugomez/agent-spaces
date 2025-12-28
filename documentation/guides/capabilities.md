# Capabilities

Capabilities allow you to expose tools and APIs to agents running in spaces. This guide covers defining tools, integrating MCP servers, and using capabilities in code.

## Overview

Capabilities bridge external tools and MCP servers to the Agent Spaces protocol. Instead of the agent calling tools directly, tools are converted to code-callable APIs that run inside the sandbox.

## Defining Tools

### Basic Tool Definition

```typescript
import { defineTool } from '@agent-spaces/capabilities';

const calculator = defineTool({
  name: 'calculator',
  description: 'Basic math operations',
  version: '1.0.0',
  functions: {
    add: {
      description: 'Add two numbers',
      parameters: {
        a: { type: 'number', required: true },
        b: { type: 'number', required: true },
      },
      handler: async ({ a, b }) => a + b,
    },
    multiply: {
      description: 'Multiply two numbers',
      parameters: {
        a: { type: 'number', required: true },
        b: { type: 'number', required: true },
      },
      handler: async ({ a, b }) => a * b,
    },
  },
});
```

### Tool with External API

```typescript
const weather = defineTool({
  name: 'weather',
  functions: {
    getCurrent: {
      description: 'Get current weather for a location',
      parameters: {
        location: { type: 'string', required: true },
        units: { type: 'string', enum: ['metric', 'imperial'] },
      },
      handler: async ({ location, units = 'metric' }) => {
        const response = await fetch(
          `https://api.weather.com/current?q=${location}&units=${units}`
        );
        return response.json();
      },
    },
  },
});
```

### Tool Requiring Approval

```typescript
const email = defineTool({
  name: 'email',
  config: {
    requiresApproval: true, // All functions require approval
  },
  functions: {
    send: {
      description: 'Send an email',
      parameters: {
        to: { type: 'string', required: true },
        subject: { type: 'string', required: true },
        body: { type: 'string', required: true },
      },
      requiresApproval: true, // Or per-function
      approvalMessage: ({ to, subject }) =>
        `Send email to ${to}: "${subject}"?`,
      handler: async ({ to, subject, body }) => {
        // Send email logic
      },
    },
  },
});
```

## Compiling Tools

Tools are compiled to generate TypeScript definitions and runtime code:

```typescript
import { compileTool } from '@agent-spaces/capabilities';

const compiled = compileTool(calculator);

console.log(compiled.typeDefinitions);
// export interface AddParams { a: number; b: number; }
// export interface CalculatorTool {
//   add(params: AddParams): Promise<unknown>;
//   multiply(params: MultiplyParams): Promise<unknown>;
// }

console.log(compiled.runtimeCode);
// export const calculator = createCapabilityProxy('calculator', {...});
```

## MCP Integration

### Discovering MCP Tools

```typescript
import { discoverMCPTools, mcpToolsToToolDef } from '@agent-spaces/capabilities';

// Discover tools from an MCP server
const mcpTools = await discoverMCPTools({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', './workspace'],
});

// Convert to Agent Spaces tool definition
const toolDef = mcpToolsToToolDef('filesystem', mcpTools);
```

### Using the MCP Bridge

```typescript
import { getMCPBridge } from '@agent-spaces/capabilities';

const bridge = getMCPBridge();

// Register an MCP server
await bridge.register('filesystem', {
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', './workspace'],
});

// Call a tool
const result = await bridge.callTool('filesystem', 'read_file', {
  path: 'example.txt',
});
```

## Standard Library

Agent Spaces provides built-in capabilities for common operations:

### Filesystem (std:fs)

```typescript
import { std } from '@agent-spaces/capabilities';

// Inside sandbox code:
const content = await std.fs.readFile({ path: 'data.json' });
await std.fs.writeFile({ path: 'output.json', content: result });
const files = await std.fs.listFiles({ path: '.', recursive: true });
```

### HTTP (std:http)

```typescript
import { std } from '@agent-spaces/capabilities';

// Inside sandbox code:
const response = await std.http.get({
  url: 'https://api.example.com/data',
  headers: { Authorization: 'Bearer token' },
});

const result = await std.http.post({
  url: 'https://api.example.com/submit',
  body: { key: 'value' },
});
```

## Enabling Capabilities

Specify capabilities when creating a space:

```typescript
const space = await client.spaces.create({
  name: 'with-capabilities',
  capabilities: ['calculator', 'weather', 'mcp-filesystem'],
});
```

## How Capabilities Work

1. **Definition**: Tool defined with schema and handlers
2. **Compilation**: Generates TypeScript types and proxy code
3. **Registration**: Capability registered with the runtime
4. **Injection**: Type definitions and proxies available in sandbox
5. **Execution**: Calls routed through the capability handler
6. **Policy**: All calls subject to policy evaluation

## Example: Full Workflow

```typescript
// 1. Define the tool
const myTool = defineTool({
  name: 'myTool',
  functions: {
    process: {
      description: 'Process data',
      parameters: { input: { type: 'string', required: true } },
      handler: async ({ input }) => input.toUpperCase(),
    },
  },
});

// 2. Register with the registry
import { getCapabilityRegistry } from '@agent-spaces/capabilities';
const registry = getCapabilityRegistry();
registry.registerTool(myTool);

// 3. Create space with capability
const space = await client.spaces.create({
  capabilities: ['myTool'],
});

// 4. Agent code can now use the tool
const run = await space.run({
  operations: [
    {
      type: 'createFile',
      path: 'script.ts',
      content: `
        import { myTool } from '@capabilities/myTool';
        const result = await myTool.process({ input: 'hello' });
        console.log(result); // HELLO
      `,
    },
    { type: 'shell', command: 'bun run script.ts' },
  ],
});
```

