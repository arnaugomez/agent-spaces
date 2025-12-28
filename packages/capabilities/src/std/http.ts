import { createCapabilityProxy } from '../runtime/proxy';

/**
 * HTTP response type.
 */
interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Sandboxed HTTP capability.
 * Network requests go through the sandbox policy.
 */
export const http = createCapabilityProxy<{
  get(params: { url: string; headers?: Record<string, string> }): Promise<HttpResponse>;
  post(params: { url: string; body?: unknown; headers?: Record<string, string> }): Promise<HttpResponse>;
  put(params: { url: string; body?: unknown; headers?: Record<string, string> }): Promise<HttpResponse>;
  patch(params: { url: string; body?: unknown; headers?: Record<string, string> }): Promise<HttpResponse>;
  delete(params: { url: string; headers?: Record<string, string> }): Promise<HttpResponse>;
}>('std:http', {
  get: { name: 'get', description: 'HTTP GET request', requiresApproval: false },
  post: { name: 'post', description: 'HTTP POST request', requiresApproval: false },
  put: { name: 'put', description: 'HTTP PUT request', requiresApproval: false },
  patch: { name: 'patch', description: 'HTTP PATCH request', requiresApproval: false },
  delete: { name: 'delete', description: 'HTTP DELETE request', requiresApproval: false },
});



