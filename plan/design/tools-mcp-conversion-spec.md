# Tools and MCP Conversion Specification

This document specifies how **Agent Spaces** converts traditional AI tools and MCP (Model Context Protocol) servers into code-callable APIs that agents can use within their generated code.

## Table of Contents

1. [Overview](#overview)
2. [Why Convert Tools to Code?](#why-convert-tools-to-code)
3. [Conversion Architecture](#conversion-architecture)
4. [Tool Definition Format](#tool-definition-format)
5. [Generated Code API](#generated-code-api)
6. [MCP Server Integration](#mcp-server-integration)
7. [Capability Registry](#capability-registry)
8. [Runtime Injection](#runtime-injection)
9. [Approval Integration](#approval-integration)
10. [Examples](#examples)

---

## Overview

Agent Spaces allows developers to:

1. **Define tools** using a standard schema
2. **Connect MCP servers** as capability sources
3. **Generate code APIs** from these definitions
4. **Inject APIs** into the sandbox runtime
5. **Execute code** that calls these APIs naturally

The AI agent writes code that uses these APIs as if they were regular TypeScript libraries.

---

## Why Convert Tools to Code?

Traditional tool calling has limitations (see [problems-with-tool-calling-and-mcp.md](../ideas/problems-with-tool-calling-and-mcp.md)):

| Tool Calling | Code APIs |
|--------------|-----------|
| AI must read all tool outputs | Code processes outputs deterministically |
| Tools can't be composed | Functions compose naturally |
| Tool overload degrades AI performance | Code APIs don't increase prompt size |
| AI bottleneck for data transformation | Code handles transformations |
| Secrets in tool inputs | Secrets as environment variables |

By converting tools to code APIs, agents can write programs like:

```typescript
import { trainSchedule, notes } from '@capabilities/company';

// AI doesn't need to read the full schedule
const morningTrips = await trainSchedule.getSchedule()
  .filter(trip => trip.hour < 12);

// Compose multiple capabilities
await notes.create({
  title: 'Morning Trains',
  content: morningTrips.map(t => `${t.hour}:00 - ${t.destination}`).join('\n')
});
```

---

## Conversion Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Capability Sources                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Tool Schemas   │   MCP Servers   │   Custom SDKs               │
│  (JSON/TS)      │   (stdio/http)  │   (npm packages)            │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Capability Compiler                          │
│  - Parse definitions                                            │
│  - Generate TypeScript interfaces                               │
│  - Generate runtime stubs                                       │
│  - Bundle dependencies                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Capability Bundle                            │
│  - TypeScript type definitions (.d.ts)                          │
│  - Runtime implementation                                       │
│  - Proxy to tool execution / MCP calls                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Sandbox Runtime                              │
│  import { tool } from '@capabilities/name';                     │
│  const result = await tool.action(params);                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Definition Format

### JSON Schema Format

Tools are defined using a JSON schema format compatible with existing AI tool definitions:

```json
{
  "name": "trainSchedule",
  "description": "Get train schedule information",
  "version": "1.0.0",
  "functions": [
    {
      "name": "getSchedule",
      "description": "Get all scheduled trains",
      "parameters": {
        "type": "object",
        "properties": {
          "station": {
            "type": "string",
            "description": "Filter by station name"
          },
          "date": {
            "type": "string",
            "format": "date",
            "description": "Date to check (YYYY-MM-DD)"
          }
        }
      },
      "returns": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "hour": { "type": "integer" },
            "minute": { "type": "integer" },
            "destination": { "type": "string" },
            "platform": { "type": "string" }
          }
        }
      }
    },
    {
      "name": "getTrainDetails",
      "description": "Get details for a specific train",
      "parameters": {
        "type": "object",
        "properties": {
          "trainId": { "type": "string", "required": true }
        },
        "required": ["trainId"]
      },
      "returns": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "operator": { "type": "string" },
          "stops": { "type": "array" }
        }
      }
    }
  ],
  "config": {
    "requiresApproval": false,
    "rateLimit": { "requests": 100, "period": "minute" }
  }
}
```

### TypeScript Format

For better developer experience, tools can be defined in TypeScript:

```typescript
// capabilities/train-schedule.ts
import { defineTool } from '@agent-spaces/capabilities';

interface Trip {
  id: string;
  hour: number;
  minute: number;
  destination: string;
  platform: string;
}

interface TrainDetails {
  id: string;
  operator: string;
  stops: string[];
}

export const trainSchedule = defineTool({
  name: 'trainSchedule',
  description: 'Get train schedule information',
  
  functions: {
    getSchedule: {
      description: 'Get all scheduled trains',
      parameters: {
        station: { type: 'string', optional: true },
        date: { type: 'string', format: 'date', optional: true },
      },
      returns: {} as Trip[],
      handler: async ({ station, date }) => {
        // Implementation - calls actual API
        const response = await fetch(`https://api.trains.com/schedule?station=${station}&date=${date}`);
        return response.json();
      },
    },
    
    getTrainDetails: {
      description: 'Get details for a specific train',
      parameters: {
        trainId: { type: 'string', required: true },
      },
      returns: {} as TrainDetails,
      handler: async ({ trainId }) => {
        const response = await fetch(`https://api.trains.com/trains/${trainId}`);
        return response.json();
      },
    },
  },
  
  config: {
    requiresApproval: false,
    rateLimit: { requests: 100, period: 'minute' },
  },
});
```

---

## Generated Code API

### Type Definitions

From the tool definition, the compiler generates TypeScript types:

```typescript
// Generated: @capabilities/train-schedule.d.ts

declare module '@capabilities/train-schedule' {
  export interface Trip {
    id: string;
    hour: number;
    minute: number;
    destination: string;
    platform: string;
  }

  export interface TrainDetails {
    id: string;
    operator: string;
    stops: string[];
  }

  export interface GetScheduleParams {
    station?: string;
    date?: string;
  }

  export interface GetTrainDetailsParams {
    trainId: string;
  }

  export const trainSchedule: {
    getSchedule(params?: GetScheduleParams): Promise<Trip[]>;
    getTrainDetails(params: GetTrainDetailsParams): Promise<TrainDetails>;
  };
}
```

### Runtime Implementation

The runtime stub proxies calls to the actual tool execution:

```typescript
// Generated: @capabilities/train-schedule/index.ts

import { createCapabilityProxy } from '@agent-spaces/runtime';

export const trainSchedule = createCapabilityProxy('trainSchedule', {
  getSchedule: {
    handler: 'trainSchedule.getSchedule',
    schema: { /* JSON schema for validation */ },
  },
  getTrainDetails: {
    handler: 'trainSchedule.getTrainDetails',
    schema: { /* JSON schema */ },
  },
});
```

### Usage in Agent Code

The agent writes natural TypeScript:

```typescript
import { trainSchedule } from '@capabilities/train-schedule';

// Full type inference and autocomplete
const trips = await trainSchedule.getSchedule({ station: 'Central' });

// Filter locally (not in AI's context)
const morning = trips.filter(t => t.hour < 12);

// Further operations
const details = await trainSchedule.getTrainDetails({ 
  trainId: morning[0].id 
});

console.log(`Train operated by: ${details.operator}`);
```

---

## MCP Server Integration

### MCP Configuration

MCP servers are configured in the space or globally:

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}"
      }
    },
    "github": {
      "url": "https://mcp.github.com/v1",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    }
  }
}
```

### MCP to Code API Conversion

The conversion process:

1. **Discovery**: Connect to MCP server, list available tools
2. **Schema Extraction**: Get JSON schema for each tool
3. **Code Generation**: Generate TypeScript types and stubs
4. **Bundling**: Include in capability bundle

```typescript
// MCP tools become importable modules
import { slack } from '@capabilities/mcp-slack';
import { github } from '@capabilities/mcp-github';

// Use like regular async functions
const channels = await slack.listChannels();
const issues = await github.listIssues({ repo: 'owner/repo' });
```

### MCP Protocol Bridge

```
┌───────────────────┐
│   Agent Code      │
│   import { x }    │
└────────┬──────────┘
         │ function call
         ▼
┌───────────────────┐
│  Capability Proxy │
│  (in sandbox)     │
└────────┬──────────┘
         │ JSON-RPC over IPC
         ▼
┌───────────────────┐
│  MCP Bridge       │
│  (host process)   │
└────────┬──────────┘
         │ stdio / HTTP
         ▼
┌───────────────────┐
│  MCP Server       │
│  (external)       │
└───────────────────┘
```

---

## Capability Registry

### Registry Structure

Capabilities are organized in a registry:

```typescript
interface CapabilityRegistry {
  capabilities: {
    [name: string]: CapabilityDefinition;
  };
  mcpServers: {
    [name: string]: MCPServerConfig;
  };
}

interface CapabilityDefinition {
  name: string;
  version: string;
  source: 'tool' | 'mcp' | 'sdk';
  schema: ToolSchema;
  bundle?: string;  // Path to compiled bundle
}
```

### Global Registry

System-wide capabilities available to all spaces:

```typescript
// agent-spaces.config.ts
export default {
  capabilities: {
    global: [
      '@agent-spaces/std',  // Standard library (fs, fetch, etc.)
      './capabilities/company-sdk',
    ],
    mcpServers: {
      slack: { /* config */ },
    },
  },
};
```

### Space-Specific Capabilities

Capabilities can be added per-space:

```typescript
const space = await client.spaces.create({
  name: 'my-space',
  capabilities: [
    '@company/internal-sdk',
    'mcp:slack',
    'mcp:github',
  ],
});
```

---

## Runtime Injection

### Sandbox Setup

When a space is created, capabilities are injected:

```typescript
// Pseudo-code for sandbox initialization
async function initializeSandbox(space: Space) {
  const capabilities = await loadCapabilities(space.capabilities);
  
  for (const capability of capabilities) {
    // Add to sandbox's node_modules
    await sandbox.installModule(
      capability.name,
      capability.bundle
    );
    
    // Set up IPC channel for external calls
    sandbox.registerHandler(
      capability.name,
      createCapabilityHandler(capability)
    );
  }
}
```

### Module Resolution

The sandbox resolves imports from `@capabilities/*`:

```typescript
// In agent code
import { trainSchedule } from '@capabilities/train-schedule';

// Resolves to: /.agent-spaces/capabilities/train-schedule/index.ts
```

### IPC Communication

Function calls that require external resources use IPC:

```typescript
// Inside sandbox
const result = await __agentSpaces.callCapability(
  'trainSchedule',
  'getSchedule',
  { station: 'Central' }
);

// Outside sandbox (host)
sandbox.on('capability.call', async (call) => {
  const capability = registry.get(call.name);
  const result = await capability.execute(call.function, call.params);
  sandbox.respond(call.id, result);
});
```

---

## Approval Integration

### Capability-Level Approvals

Some capabilities require approval for certain operations:

```typescript
export const fileSystem = defineTool({
  name: 'fileSystem',
  functions: {
    readFile: {
      description: 'Read a file',
      requiresApproval: false,  // No approval needed
      // ...
    },
    deleteFile: {
      description: 'Delete a file',
      requiresApproval: true,   // Requires approval
      approvalMessage: (params) => 
        `Delete file: ${params.path}?`,
      // ...
    },
  },
});
```

### Runtime Approval Flow

When code calls a function requiring approval:

```typescript
// Agent code
await fileSystem.deleteFile({ path: 'important.txt' });

// Runtime flow:
// 1. Capability proxy detects requiresApproval: true
// 2. Execution pauses
// 3. Approval request sent to user
// 4. User approves/denies
// 5. Execution continues or throws
```

### Approval Events

Approvals are surfaced as protocol events:

```json
{
  "type": "approvalRequired",
  "timestamp": "2025-01-15T10:30:00Z",
  "source": "capability",
  "capability": "fileSystem",
  "function": "deleteFile",
  "params": { "path": "important.txt" },
  "message": "Delete file: important.txt?"
}
```

---

## Examples

### Example 1: Convert OpenAI-style Tool

**Input (OpenAI tool format):**
```json
{
  "name": "get_weather",
  "description": "Get current weather for a location",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City name"
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"]
      }
    },
    "required": ["location"]
  }
}
```

**Generated TypeScript API:**
```typescript
// @capabilities/weather.d.ts
declare module '@capabilities/weather' {
  export interface GetWeatherParams {
    location: string;
    unit?: 'celsius' | 'fahrenheit';
  }
  
  export interface WeatherResult {
    temperature: number;
    unit: string;
    description: string;
  }
  
  export function getWeather(params: GetWeatherParams): Promise<WeatherResult>;
}
```

**Usage:**
```typescript
import { getWeather } from '@capabilities/weather';

const weather = await getWeather({ 
  location: 'San Francisco', 
  unit: 'celsius' 
});

console.log(`${weather.temperature}°${weather.unit}: ${weather.description}`);
```

### Example 2: MCP Slack Integration

**MCP Configuration:**
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}"
      }
    }
  }
}
```

**Generated API (auto-discovered from MCP):**
```typescript
// @capabilities/mcp-slack.d.ts
declare module '@capabilities/mcp-slack' {
  export interface Channel {
    id: string;
    name: string;
  }
  
  export interface Message {
    channel: string;
    text: string;
    ts: string;
  }
  
  export const slack: {
    listChannels(): Promise<Channel[]>;
    postMessage(params: { channel: string; text: string }): Promise<Message>;
    getChannelHistory(params: { channel: string; limit?: number }): Promise<Message[]>;
  };
}
```

**Usage:**
```typescript
import { slack } from '@capabilities/mcp-slack';

// Find channel
const channels = await slack.listChannels();
const general = channels.find(c => c.name === 'general');

// Get recent messages
const history = await slack.getChannelHistory({ 
  channel: general.id, 
  limit: 10 
});

// Reply to the latest
await slack.postMessage({
  channel: general.id,
  text: `Re: "${history[0].text}" - Got it!`
});
```

### Example 3: Custom Company SDK

**Tool Definition:**
```typescript
// capabilities/company-crm.ts
import { defineTool } from '@agent-spaces/capabilities';

export const crm = defineTool({
  name: 'crm',
  description: 'Company CRM system',
  
  functions: {
    searchCustomers: {
      description: 'Search for customers',
      parameters: {
        query: { type: 'string', required: true },
        limit: { type: 'number', default: 10 },
      },
      returns: {} as Customer[],
      handler: async ({ query, limit }) => {
        return await crmApi.search(query, limit);
      },
    },
    
    createTicket: {
      description: 'Create support ticket',
      parameters: {
        customerId: { type: 'string', required: true },
        subject: { type: 'string', required: true },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      returns: {} as Ticket,
      requiresApproval: true,
      approvalMessage: (p) => `Create ${p.priority} ticket for customer ${p.customerId}?`,
      handler: async (params) => {
        return await crmApi.createTicket(params);
      },
    },
  },
});
```

**Usage:**
```typescript
import { crm } from '@capabilities/company-crm';

// Search doesn't need approval
const customers = await crm.searchCustomers({ 
  query: 'acme corp' 
});

// This will pause for approval
const ticket = await crm.createTicket({
  customerId: customers[0].id,
  subject: 'Integration issue',
  priority: 'high',
});

console.log(`Created ticket: ${ticket.id}`);
```

---

## Capability Standard Library

Agent Spaces provides a standard library of capabilities:

```typescript
// @agent-spaces/std - always available

import { 
  fs,        // File system operations
  http,      // HTTP client
  json,      // JSON parsing/stringify
  csv,       // CSV parsing
  crypto,    // Cryptographic functions (hash, encrypt)
  time,      // Date/time utilities
} from '@agent-spaces/std';

// All are sandboxed and policy-controlled
const data = await fs.readFile('data.json');
const parsed = json.parse(data);

const response = await http.get('https://api.example.com/data');
// Network access controlled by policy
```

---

## Compilation Pipeline

### Build Process

```bash
# Compile capability definitions
agent-spaces capabilities build

# Output structure:
# .agent-spaces/
#   capabilities/
#     train-schedule/
#       index.js        # Runtime bundle
#       index.d.ts      # Type definitions
#       schema.json     # JSON schema
#     mcp-slack/
#       index.js
#       index.d.ts
#       schema.json
```

### Bundle Format

Each capability bundle includes:

1. **Type definitions** (`.d.ts`) - For TypeScript support
2. **Runtime code** (`.js`) - Proxy implementation
3. **Schema** (`.json`) - For validation
4. **Metadata** - Version, dependencies, config

---

## Related Documents

- [Architecture](./architecture.md): System components
- [Protocol Spec](./protocol-spec.md): How code execution works
- [REST API Spec](./rest-api-spec.md): Capability configuration endpoints

