import type Docker from 'dockerode';
import { nanoid } from 'nanoid';
import type { SandboxConfig, SandboxStatus, ShellResult, FileResult, FileInfo } from './types';
import { createContainer, destroyContainer, execInContainer } from './docker';
import {
  createWorkspace,
  destroyWorkspace,
  createFile,
  readFileContent,
  editFile,
  deleteFile,
  listFiles,
} from './filesystem';

/**
 * Default sandbox configuration.
 */
const DEFAULT_CONFIG: Partial<SandboxConfig> = {
  baseImage: process.env.SANDBOX_BASE_IMAGE || 'oven/bun:1',
  workDir: '/workspace',
  timeout: Number(process.env.SANDBOX_TIMEOUT) || 30000,
  env: {},
};

/**
 * Sandbox class for isolated code execution.
 */
export class Sandbox {
  private container: Docker.Container | null = null;
  private _status: SandboxStatus = 'creating';

  constructor(
    public readonly config: SandboxConfig,
    public readonly workspacePath: string
  ) {}

  /**
   * Create a new sandbox instance.
   */
  static async create(
    options: Partial<SandboxConfig> & { workspaceBaseDir: string }
  ): Promise<Sandbox> {
    const id = options.id || nanoid(12);

    // Create workspace directory
    const workspacePath = await createWorkspace(options.workspaceBaseDir);

    const config: SandboxConfig = {
      id,
      baseImage: options.baseImage || DEFAULT_CONFIG.baseImage!,
      workDir: options.workDir || DEFAULT_CONFIG.workDir!,
      workspacePath,
      env: { ...DEFAULT_CONFIG.env, ...options.env },
      timeout: options.timeout || DEFAULT_CONFIG.timeout!,
      memoryLimit: options.memoryLimit,
      cpuLimit: options.cpuLimit,
    };

    const sandbox = new Sandbox(config, workspacePath);

    // Create Docker container
    sandbox.container = await createContainer(config);
    sandbox._status = 'ready';

    return sandbox;
  }

  /**
   * Get the current sandbox status.
   */
  get status(): SandboxStatus {
    return this._status;
  }

  /**
   * Get the sandbox ID.
   */
  get id(): string {
    return this.config.id;
  }

  /**
   * Execute a shell command in the sandbox.
   */
  async exec(
    command: string,
    options: { cwd?: string; env?: Record<string, string>; timeout?: number } = {}
  ): Promise<ShellResult> {
    if (!this.container) {
      return {
        success: false,
        command,
        exitCode: 1,
        stdout: '',
        stderr: 'Sandbox not initialized',
        durationMs: 0,
        timedOut: false,
      };
    }

    this._status = 'running';

    try {
      const result = await execInContainer(this.container, command, {
        cwd: options.cwd ? `${this.config.workDir}/${options.cwd}` : this.config.workDir,
        env: { ...this.config.env, ...options.env },
        timeout: options.timeout || this.config.timeout,
      });

      this._status = 'ready';
      return result;
    } catch (error) {
      this._status = 'error';
      return {
        success: false,
        command,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        durationMs: 0,
        timedOut: false,
      };
    }
  }

  /**
   * Create a file in the workspace.
   */
  async createFile(
    path: string,
    content: string,
    options: { overwrite?: boolean; encoding?: 'utf-8' | 'base64' } = {}
  ): Promise<FileResult> {
    return createFile(this.workspacePath, path, content, options);
  }

  /**
   * Read a file from the workspace.
   */
  async readFile(
    path: string,
    encoding: 'utf-8' | 'base64' = 'utf-8'
  ): Promise<FileResult> {
    return readFileContent(this.workspacePath, path, encoding);
  }

  /**
   * Edit a file in the workspace.
   */
  async editFile(
    path: string,
    edits: Array<{ oldContent: string; newContent: string }>
  ): Promise<FileResult & { editsApplied?: number }> {
    return editFile(this.workspacePath, path, edits);
  }

  /**
   * Delete a file from the workspace.
   */
  async deleteFile(path: string): Promise<FileResult> {
    return deleteFile(this.workspacePath, path);
  }

  /**
   * List files in the workspace.
   */
  async listFiles(path = '', recursive = false): Promise<FileInfo[]> {
    return listFiles(this.workspacePath, path, recursive);
  }

  /**
   * Destroy the sandbox and cleanup resources.
   */
  async destroy(): Promise<void> {
    if (this.container) {
      await destroyContainer(this.container);
      this.container = null;
    }

    await destroyWorkspace(this.workspacePath);
    this._status = 'stopped';
  }
}

