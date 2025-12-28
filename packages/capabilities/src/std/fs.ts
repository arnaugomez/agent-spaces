import { createCapabilityProxy } from '../runtime/proxy';

/**
 * Sandboxed filesystem capability.
 * These operations go through the sandbox policy.
 */
export const fs = createCapabilityProxy<{
  readFile(params: { path: string; encoding?: 'utf-8' | 'base64' }): Promise<string>;
  writeFile(params: { path: string; content: string; encoding?: 'utf-8' | 'base64' }): Promise<void>;
  deleteFile(params: { path: string }): Promise<void>;
  listFiles(params: { path?: string; recursive?: boolean }): Promise<Array<{
    name: string;
    path: string;
    type: 'file' | 'directory';
    size: number;
  }>>;
  exists(params: { path: string }): Promise<boolean>;
}>('std:fs', {
  readFile: { name: 'readFile', description: 'Read a file', requiresApproval: false },
  writeFile: { name: 'writeFile', description: 'Write a file', requiresApproval: false },
  deleteFile: { name: 'deleteFile', description: 'Delete a file', requiresApproval: false },
  listFiles: { name: 'listFiles', description: 'List files in a directory', requiresApproval: false },
  exists: { name: 'exists', description: 'Check if a file exists', requiresApproval: false },
});



