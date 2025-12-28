# Introduction to Agent Spaces

Agent Spaces is an open-source framework for creating isolated code execution environments where AI agents can safely create files and run code.

## The Problem

Modern AI agents need to do more than just answer questions—they need to interact with the world, write code, manipulate files, and run commands. But current approaches have significant drawbacks:

1. **Tool-calling bottlenecks**: Every action requires an LLM call, increasing latency and cost
2. **Security concerns**: Giving agents direct access to systems is dangerous
3. **Tool overload**: Agents struggle with too many tools to choose from
4. **Lack of standardization**: Every tool has different interfaces and protocols

## The Solution

Agent Spaces provides:

- **Isolated Sandboxes**: Docker-based environments where agents can run code safely
- **Simple Protocol**: A fixed set of operations (file operations + shell) that are composable via code
- **Policy Engine**: Fine-grained access control for every operation
- **TypeScript SDK**: Ergonomic API for integrating with your AI applications

## How It Works

Instead of calling tools, agents write code:

```
# Traditional approach: Many tool calls
1. call_api("weather", location="NYC")
2. call_api("format", data=result)
3. call_api("write_file", path="report.txt", content=formatted)

# Agent Spaces approach: Write code
1. createFile("weather.ts", `
   const weather = await fetch("api.weather.com/NYC");
   const report = formatWeather(weather);
   await Bun.write("report.txt", report);
`)
2. shell("bun run weather.ts")
```

This approach is:

- **More efficient**: Complex logic in one code execution
- **More flexible**: Any library or API available via code
- **More secure**: All execution happens in a controlled sandbox
- **More observable**: Every operation is logged and auditable

## Key Concepts

### Spaces

A Space is an isolated execution environment with:
- Its own filesystem (workspace)
- Its own Docker container
- Security policy configuration
- Optional capabilities

### Operations

Operations are instructions from the agent:
- `message`: Send a message to the user
- `createFile`: Create a file in the workspace
- `readFile`: Read a file from the workspace
- `editFile`: Edit an existing file
- `deleteFile`: Remove a file
- `shell`: Execute a shell command

### Events

Events are responses from the runtime:
- Operation results (success/failure)
- Shell output (stdout/stderr)
- Approval requests
- Policy denials

### Policies

Policies control what operations are allowed:
- `restrictive`: Read-only, no shell, no network
- `standard`: Basic operations, curated commands
- `permissive`: Most operations allowed

## Next Steps

- [Quick Start Guide](./quickstart.md) - Get running in 5 minutes
- [Installation](./installation.md) - Detailed setup instructions
- [Working with Spaces](../guides/spaces.md) - Deep dive into spaces



