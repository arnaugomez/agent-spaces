import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { nanoid } from 'nanoid';

/**
 * Create a new workspace directory.
 */
export async function createWorkspace(baseDir: string): Promise<string> {
  const workspaceId = nanoid(12);
  const workspacePath = join(baseDir, workspaceId);

  await mkdir(workspacePath, { recursive: true });

  return workspacePath;
}

/**
 * Destroy a workspace directory.
 */
export async function destroyWorkspace(workspacePath: string): Promise<void> {
  if (existsSync(workspacePath)) {
    await rm(workspacePath, { recursive: true, force: true });
  }
}

/**
 * Ensure a directory exists within the workspace.
 */
export async function ensureDir(
  workspacePath: string,
  relativePath: string
): Promise<void> {
  const fullPath = join(workspacePath, relativePath);
  await mkdir(fullPath, { recursive: true });
}

/**
 * Get the full path for a file in the workspace.
 */
export function getFullPath(workspacePath: string, relativePath: string): string {
  return join(workspacePath, relativePath);
}

/**
 * Validate that a path is within the workspace.
 */
export function isPathInWorkspace(
  workspacePath: string,
  targetPath: string
): boolean {
  const resolvedWorkspace = join(workspacePath);
  const resolvedTarget = join(workspacePath, targetPath);

  return resolvedTarget.startsWith(resolvedWorkspace);
}

