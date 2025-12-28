# Security Policies

Policies control what operations are allowed in a space. This guide covers the built-in presets and how to customize policies.

## Policy Presets

Agent Spaces includes three built-in policy presets:

### Restrictive

Maximum security, minimal permissions.

```typescript
const space = await client.spaces.create({
  policy: 'restrictive',
});
```

| Feature | Setting |
|---------|---------|
| Filesystem | Read-only |
| Max file size | 1MB |
| Shell | Disabled |
| Network | Disabled |
| Blocked patterns | `.*`, `*.env`, `*.key`, `*.pem` |

### Standard (Default)

Balanced security and functionality.

```typescript
const space = await client.spaces.create({
  policy: 'standard',
});
```

| Feature | Setting |
|---------|---------|
| Filesystem | Read/write |
| Max file size | 10MB |
| Shell | Enabled (allowlist) |
| Network | Disabled |
| Allowed commands | `bun`, `node`, `npm`, `npx`, `cat`, `echo`, `ls`, etc. |
| Approval required | `rm -rf`, `rm -r` |
| Blocked patterns | `sudo`, `chmod`, `chown`, `curl`, `wget` |

### Permissive

Maximum functionality, requires trust.

```typescript
const space = await client.spaces.create({
  policy: 'permissive',
});
```

| Feature | Setting |
|---------|---------|
| Filesystem | Read/write |
| Max file size | 100MB |
| Shell | Enabled (blocklist) |
| Network | Enabled |
| Timeout | 5 minutes |
| Approval required | `rm -rf`, `chmod`, `chown` |
| Blocked | `sudo`, `rm -rf /`, `rm -rf ~` |

## Policy Overrides

Customize any preset with overrides:

```typescript
const space = await client.spaces.create({
  policy: 'standard',
  policyOverrides: {
    filesystem: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
    },
    shell: {
      allowedCommands: ['bun', 'node', 'npm', 'npx', 'python3'],
      timeout: 60000, // 1 minute
    },
    network: {
      enabled: true,
      allowedDomains: ['api.openai.com', 'api.anthropic.com'],
    },
  },
});
```

## Policy Structure

### Filesystem Policy

```typescript
{
  filesystem: {
    enabled: true,           // Enable filesystem operations
    readOnly: false,         // If true, only readFile allowed
    maxFileSize: 10485760,   // Max file size in bytes
    allowedPaths: ['src/*'], // Glob patterns to allow
    blockedPaths: ['.*']     // Glob patterns to block
  }
}
```

### Shell Policy

```typescript
{
  shell: {
    enabled: true,
    allowedCommands: ['bun', 'node'],  // Allowlist (base command)
    blockedPatterns: ['sudo', 'rm -rf /'],  // Block these patterns
    timeout: 30000,                    // Default timeout
    approvalRequired: ['rm -rf']       // Patterns requiring approval
  }
}
```

### Network Policy

```typescript
{
  network: {
    enabled: false,
    allowedDomains: ['api.example.com'],  // Domain allowlist
    blockedDomains: ['malware.com']       // Domain blocklist
  }
}
```

## How Policy Evaluation Works

1. **Check enabled** - Is the category enabled?
2. **Check blocklist** - Is the operation explicitly blocked?
3. **Check allowlist** - If specified, is the operation allowed?
4. **Check approval** - Does the operation require approval?
5. **Allow** - If all checks pass, allow the operation

## Common Patterns

### Read-Only Analysis

```typescript
policyOverrides: {
  filesystem: {
    readOnly: true,
  },
  shell: {
    enabled: true,
    allowedCommands: ['cat', 'grep', 'wc', 'head', 'tail'],
  },
}
```

### Build Environment

```typescript
policyOverrides: {
  shell: {
    allowedCommands: ['bun', 'npm', 'npx', 'node', 'tsc'],
    timeout: 120000,
  },
  network: {
    enabled: true,
    allowedDomains: ['registry.npmjs.org', 'github.com'],
  },
}
```

### Data Processing

```typescript
policyOverrides: {
  filesystem: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
  shell: {
    allowedCommands: ['bun', 'node', 'python3'],
    timeout: 300000, // 5 minutes
  },
}
```

## Approval Workflow

When an operation requires approval:

```typescript
const run = await space.run({
  operations: [
    { type: 'shell', command: 'rm -rf old-data/', id: 'cleanup' },
  ],
});

if (run.status === 'awaiting_approval') {
  // Show to user
  console.log('Approval needed:', run.pendingApproval);
  
  // After user decision
  await run.approve({ operationId: 'cleanup' });
  // or
  await run.deny({ operationId: 'cleanup' });
}
```

## Policy Denied Events

When a policy denies an operation:

```typescript
{
  type: 'policyDenied',
  operationType: 'shell',
  reason: 'Command "sudo" is blocked',
  suggestion: 'Use a policy that allows elevated commands'
}
```

The run continues with remaining operations (denied operations are skipped).



