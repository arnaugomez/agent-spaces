/**
 * Types for the capabilities system.
 */

/**
 * Parameter type definition.
 */
export interface ParameterDef {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
  format?: string;
}

/**
 * Function definition within a tool.
 */
export interface FunctionDef<TParams = Record<string, unknown>, TReturn = unknown> {
  description: string;
  parameters: Record<string, ParameterDef>;
  returns?: unknown;
  requiresApproval?: boolean;
  approvalMessage?: (params: TParams) => string;
  handler: (params: TParams) => Promise<TReturn>;
}

/**
 * Tool definition.
 */
export interface ToolDef<TFunctions extends Record<string, FunctionDef> = Record<string, FunctionDef>> {
  name: string;
  description?: string;
  version?: string;
  functions: TFunctions;
  config?: {
    requiresApproval?: boolean;
    rateLimit?: { requests: number; period: 'minute' | 'hour' };
  };
}

/**
 * Compiled tool ready for use in sandbox.
 */
export interface CompiledTool {
  name: string;
  version: string;
  functions: Record<string, CompiledFunction>;
  typeDefinitions: string;
  runtimeCode: string;
}

/**
 * Compiled function.
 */
export interface CompiledFunction {
  name: string;
  description: string;
  parameters: Record<string, ParameterDef>;
  requiresApproval: boolean;
}

/**
 * MCP server configuration.
 */
export interface MCPServerConfig {
  /** Command to start the server (for stdio) */
  command?: string;
  /** Arguments for the command */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** URL for HTTP-based MCP servers */
  url?: string;
  /** Headers for HTTP requests */
  headers?: Record<string, string>;
}

/**
 * MCP tool discovered from a server.
 */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Capability registry entry.
 */
export interface CapabilityEntry {
  name: string;
  version: string;
  source: 'tool' | 'mcp' | 'sdk';
  compiled: CompiledTool;
}

