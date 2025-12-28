import type { MCPServerConfig, MCPTool, ToolDef, ParameterDef } from '../types';
import { MCPClient } from './client';

/**
 * Discover tools from an MCP server.
 */
export async function discoverMCPTools(config: MCPServerConfig): Promise<MCPTool[]> {
  const client = new MCPClient(config);

  try {
    await client.connect();
    const tools = await client.listTools();
    return tools;
  } finally {
    await client.disconnect();
  }
}

/**
 * Convert MCP tools to Agent Spaces tool definitions.
 */
export function mcpToolsToToolDef(
  serverName: string,
  tools: MCPTool[]
): ToolDef {
  const functions: Record<string, {
    description: string;
    parameters: Record<string, ParameterDef>;
    handler: (params: Record<string, unknown>) => Promise<unknown>;
  }> = {};

  for (const tool of tools) {
    const parameters: Record<string, ParameterDef> = {};

    // Convert MCP input schema to parameter definitions
    for (const [name, schema] of Object.entries(tool.inputSchema.properties)) {
      const s = schema as { type?: string; description?: string; enum?: string[] };
      parameters[name] = {
        type: (s.type as ParameterDef['type']) || 'string',
        description: s.description,
        required: tool.inputSchema.required?.includes(name),
        enum: s.enum,
      };
    }

    functions[tool.name] = {
      description: tool.description || `MCP tool: ${tool.name}`,
      parameters,
      // Handler will be replaced with MCP bridge call at runtime
      handler: async () => {
        throw new Error('MCP handler not initialized');
      },
    };
  }

  return {
    name: `mcp-${serverName}`,
    description: `Tools from MCP server: ${serverName}`,
    version: '1.0.0',
    functions,
  };
}



