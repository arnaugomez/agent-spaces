import { readFile, writeFile, unlink, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { FileResult, FileInfo } from '../types';
import { ensureDir, getFullPath, isPathInWorkspace } from './workspace';

/**
 * Create a file in the workspace.
 */
export async function createFile(
  workspacePath: string,
  relativePath: string,
  content: string,
  options: { overwrite?: boolean; encoding?: 'utf-8' | 'base64' } = {}
): Promise<FileResult> {
  try {
    // Validate path
    if (!isPathInWorkspace(workspacePath, relativePath)) {
      return {
        success: false,
        path: relativePath,
        error: 'Path is outside workspace',
      };
    }

    const fullPath = getFullPath(workspacePath, relativePath);

    // Check if file exists
    if (!options.overwrite && existsSync(fullPath)) {
      return {
        success: false,
        path: relativePath,
        error: 'File already exists',
      };
    }

    // Ensure parent directory exists
    await ensureDir(workspacePath, dirname(relativePath));

    // Write file
    const buffer =
      options.encoding === 'base64'
        ? Buffer.from(content, 'base64')
        : Buffer.from(content, 'utf-8');

    await writeFile(fullPath, buffer);

    return {
      success: true,
      path: relativePath,
      size: buffer.length,
    };
  } catch (error) {
    return {
      success: false,
      path: relativePath,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Read a file from the workspace.
 */
export async function readFileContent(
  workspacePath: string,
  relativePath: string,
  encoding: 'utf-8' | 'base64' = 'utf-8'
): Promise<FileResult> {
  try {
    // Validate path
    if (!isPathInWorkspace(workspacePath, relativePath)) {
      return {
        success: false,
        path: relativePath,
        error: 'Path is outside workspace',
      };
    }

    const fullPath = getFullPath(workspacePath, relativePath);

    if (!existsSync(fullPath)) {
      return {
        success: false,
        path: relativePath,
        error: 'File not found',
      };
    }

    const buffer = await readFile(fullPath);
    const content =
      encoding === 'base64'
        ? buffer.toString('base64')
        : buffer.toString('utf-8');

    return {
      success: true,
      path: relativePath,
      content,
      size: buffer.length,
    };
  } catch (error) {
    return {
      success: false,
      path: relativePath,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Edit a file in the workspace.
 */
export async function editFile(
  workspacePath: string,
  relativePath: string,
  edits: Array<{ oldContent: string; newContent: string }>
): Promise<FileResult & { editsApplied?: number }> {
  try {
    // Validate path
    if (!isPathInWorkspace(workspacePath, relativePath)) {
      return {
        success: false,
        path: relativePath,
        error: 'Path is outside workspace',
      };
    }

    const fullPath = getFullPath(workspacePath, relativePath);

    if (!existsSync(fullPath)) {
      return {
        success: false,
        path: relativePath,
        error: 'File not found',
      };
    }

    let content = await readFile(fullPath, 'utf-8');
    let editsApplied = 0;

    for (const edit of edits) {
      if (!content.includes(edit.oldContent)) {
        return {
          success: false,
          path: relativePath,
          error: `Could not find content to replace: "${edit.oldContent.substring(0, 50)}..."`,
        };
      }
      content = content.replace(edit.oldContent, edit.newContent);
      editsApplied++;
    }

    await writeFile(fullPath, content, 'utf-8');

    return {
      success: true,
      path: relativePath,
      editsApplied,
      size: Buffer.byteLength(content),
    };
  } catch (error) {
    return {
      success: false,
      path: relativePath,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a file from the workspace.
 */
export async function deleteFile(
  workspacePath: string,
  relativePath: string
): Promise<FileResult> {
  try {
    // Validate path
    if (!isPathInWorkspace(workspacePath, relativePath)) {
      return {
        success: false,
        path: relativePath,
        error: 'Path is outside workspace',
      };
    }

    const fullPath = getFullPath(workspacePath, relativePath);

    if (!existsSync(fullPath)) {
      return {
        success: false,
        path: relativePath,
        error: 'File not found',
      };
    }

    await unlink(fullPath);

    return {
      success: true,
      path: relativePath,
    };
  } catch (error) {
    return {
      success: false,
      path: relativePath,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List files in a directory.
 */
export async function listFiles(
  workspacePath: string,
  relativePath = '',
  recursive = false
): Promise<FileInfo[]> {
  const fullPath = getFullPath(workspacePath, relativePath);

  if (!existsSync(fullPath)) {
    return [];
  }

  const entries = await readdir(fullPath, { withFileTypes: true });
  const files: FileInfo[] = [];

  for (const entry of entries) {
    const entryPath = relativePath
      ? join(relativePath, entry.name)
      : entry.name;
    const entryFullPath = join(fullPath, entry.name);

    if (entry.isDirectory()) {
      files.push({
        path: entryPath,
        size: 0,
        isDirectory: true,
        modifiedAt: new Date(),
      });

      if (recursive) {
        const subFiles = await listFiles(workspacePath, entryPath, true);
        files.push(...subFiles);
      }
    } else {
      const stats = await stat(entryFullPath);
      files.push({
        path: entryPath,
        size: stats.size,
        isDirectory: false,
        modifiedAt: stats.mtime,
      });
    }
  }

  return files;
}



