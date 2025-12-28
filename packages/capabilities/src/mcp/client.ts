import type { MCPServerConfig, MCPTool } from '../types';

/**
 * MCP client for communicating with MCP servers.
 */
export class MCPClient {
  private process: Awaited<ReturnType<typeof Bun.spawn>> | null = null;

  constructor(private config: MCPServerConfig) {}

  /**
   * Connect to the MCP server.
   */
  async connect(): Promise<void> {
    if (this.config.command) {
      // Start the server process
      this.process = Bun.spawn([this.config.command, ...(this.config.args || [])], {
        env: { ...process.env, ...this.config.env },
        stdin: 'pipe',
        stdout: 'pipe',
        stderr: 'pipe',
      });
    }
    // For HTTP-based servers, we don't need to start a process
  }

  /**
   * Send a JSON-RPC request to the server.
   */
  async request<T>(method: string, params?: unknown): Promise<T> {
    if (this.config.url) {
      // HTTP-based server
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        }),
      });

      const data = await response.json() as { result?: T; error?: { message: string } };
      if (data.error) {
        throw new Error(data.error.message);
      }
      return data.result as T;
    }

    if (this.process) {
      // stdio-based server
      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }) + '\n';

      const stdin = this.process.stdin;
      const stdout = this.process.stdout;

      if (typeof stdin === 'object' && stdin !== null && 'write' in stdin) {
        (stdin as { write: (data: string) => void }).write(request);
      }

      // Read response (simplified - real implementation needs proper framing)
      if (typeof stdout === 'object' && stdout !== null && 'getReader' in stdout) {
        const reader = (stdout as ReadableStream<Uint8Array>).getReader();
        const { value } = await reader.read();
        reader.releaseLock();

        if (value) {
          const response = JSON.parse(new TextDecoder().decode(value)) as { result?: T; error?: { message: string } };
          if (response.error) {
            throw new Error(response.error.message);
          }
          return response.result as T;
        }
      }

      throw new Error('No response from MCP server');
    }

    throw new Error('No connection method configured');
  }

  /**
   * List available tools from the server.
   */
  async listTools(): Promise<MCPTool[]> {
    return this.request<MCPTool[]>('tools/list');
  }

  /**
   * Call a tool on the server.
   */
  async callTool(name: string, arguments_: Record<string, unknown>): Promise<unknown> {
    return this.request('tools/call', { name, arguments: arguments_ });
  }

  /**
   * Disconnect from the server.
   */
  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

