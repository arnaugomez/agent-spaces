import type { CapabilityEntry, ToolDef } from '../types';
import { compileTool } from '../compiler';

/**
 * Registry for managing capabilities.
 */
export class CapabilityRegistry {
  private capabilities = new Map<string, CapabilityEntry>();

  /**
   * Register a tool definition.
   */
  registerTool(tool: ToolDef): void {
    const compiled = compileTool(tool);
    this.register({
      name: tool.name,
      version: tool.version || '1.0.0',
      source: 'tool',
      compiled,
    });
  }

  /**
   * Register a compiled capability.
   */
  register(entry: CapabilityEntry): void {
    this.capabilities.set(entry.name, entry);
  }

  /**
   * Get a capability by name.
   */
  get(name: string): CapabilityEntry | undefined {
    return this.capabilities.get(name);
  }

  /**
   * Check if a capability is registered.
   */
  has(name: string): boolean {
    return this.capabilities.has(name);
  }

  /**
   * Get all registered capabilities.
   */
  getAll(): CapabilityEntry[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Get capability names.
   */
  getNames(): string[] {
    return Array.from(this.capabilities.keys());
  }

  /**
   * Remove a capability.
   */
  remove(name: string): boolean {
    return this.capabilities.delete(name);
  }

  /**
   * Clear all capabilities.
   */
  clear(): void {
    this.capabilities.clear();
  }
}

// Default global registry
let defaultRegistry: CapabilityRegistry | null = null;

/**
 * Get the default capability registry.
 */
export function getCapabilityRegistry(): CapabilityRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new CapabilityRegistry();
  }
  return defaultRegistry;
}

