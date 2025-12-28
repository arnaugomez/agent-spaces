/**
 * @agent-spaces/capabilities
 *
 * Capabilities system for converting tools and MCPs to code APIs.
 */

// Types
export * from './types';

// Tool definition
export { defineTool, defineFunction } from './define';

// Compiler
export { compileTool, generateTypeDefinitions, generateRuntimeCode } from './compiler';

// MCP
export { MCPClient, MCPBridge, getMCPBridge, discoverMCPTools, mcpToolsToToolDef } from './mcp';

// Runtime
export { createCapabilityProxy, setCapabilityCallHandler, CapabilityRegistry, getCapabilityRegistry } from './runtime';

// Standard library
export * as std from './std';

