import type { MCPServerConfig } from '../types';
import { MCPClient } from './client';

/**
 * MCP bridge for proxying capability calls to MCP servers.
 */
export class MCPBridge {
  private clients = new Map<string, MCPClient>();

  /**
   * Register an MCP server.
   */
  async register(name: string, config: MCPServerConfig): Promise<void> {
    const client = new MCPClient(config);
    await client.connect();
    this.clients.set(name, client);
  }

  /**
   * Call a tool on an MCP server.
   */
  async callTool(
    serverName: string,
    toolName: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server '${serverName}' not registered`);
    }

    return client.callTool(toolName, params);
  }

  /**
   * Disconnect all MCP servers.
   */
  async disconnectAll(): Promise<void> {
    for (const client of this.clients.values()) {
      await client.disconnect();
    }
    this.clients.clear();
  }

  /**
   * Get registered server names.
   */
  getServerNames(): string[] {
    return Array.from(this.clients.keys());
  }
}

// Singleton bridge instance
let bridge: MCPBridge | null = null;

/**
 * Get the global MCP bridge instance.
 */
export function getMCPBridge(): MCPBridge {
  if (!bridge) {
    bridge = new MCPBridge();
  }
  return bridge;
}

