/**
 * Function metadata for the capability proxy.
 */
interface FunctionMeta {
  name: string;
  description: string;
  requiresApproval: boolean;
}

/**
 * Capability call handler type.
 */
type CapabilityCallHandler = (
  capabilityName: string,
  functionName: string,
  params: Record<string, unknown>
) => Promise<unknown>;

/**
 * Global capability call handler.
 * This is set by the sandbox runtime to handle calls.
 */
let globalCallHandler: CapabilityCallHandler | null = null;

/**
 * Set the global capability call handler.
 */
export function setCapabilityCallHandler(handler: CapabilityCallHandler): void {
  globalCallHandler = handler;
}

/**
 * Create a capability proxy that routes calls to the handler.
 */
export function createCapabilityProxy<T extends Record<string, unknown>>(
  capabilityName: string,
  functions: Record<string, FunctionMeta>
): T {
  const proxy: Record<string, (params?: Record<string, unknown>) => Promise<unknown>> = {};

  for (const [name] of Object.entries(functions)) {
    proxy[name] = async (params: Record<string, unknown> = {}) => {
      if (!globalCallHandler) {
        throw new Error(
          'Capability call handler not initialized. ' +
          'Are you running inside an Agent Spaces sandbox?'
        );
      }

      return globalCallHandler(capabilityName, name, params);
    };
  }

  return proxy as T;
}



