import type Docker from 'dockerode';
import { getDockerClient } from './client';
import type { SandboxConfig, ShellResult } from '../types';

/**
 * Create a Docker container for a sandbox.
 */
export async function createContainer(
  config: SandboxConfig
): Promise<Docker.Container> {
  const docker = getDockerClient();

  // Ensure the image exists
  try {
    await docker.getImage(config.baseImage).inspect();
  } catch {
    // Pull the image if it doesn't exist
    await new Promise<void>((resolve, reject) => {
      docker.pull(config.baseImage, (err: Error | null, stream: NodeJS.ReadableStream) => {
        if (err) {
          reject(err);
          return;
        }
        docker.modem.followProgress(stream, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  const containerConfig: Docker.ContainerCreateOptions = {
    Image: config.baseImage,
    name: `agent-space-${config.id}`,
    WorkingDir: config.workDir,
    Env: Object.entries(config.env).map(([k, v]) => `${k}=${v}`),
    Tty: false,
    OpenStdin: false,
    HostConfig: {
      Binds: [`${config.workspacePath}:${config.workDir}`],
      NetworkMode: 'none', // Disable network by default
      AutoRemove: false,
      Memory: config.memoryLimit,
      NanoCpus: config.cpuLimit ? config.cpuLimit * 1e9 : undefined,
    },
    // Keep container running with a sleep command
    Cmd: ['sleep', 'infinity'],
  };

  const container = await docker.createContainer(containerConfig);
  await container.start();

  return container;
}

/**
 * Execute a command in a container.
 */
export async function execInContainer(
  container: Docker.Container,
  command: string,
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<ShellResult> {
  const startTime = Date.now();

  const execConfig: Docker.ExecCreateOptions = {
    Cmd: ['sh', '-c', command],
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: options.cwd,
    Env: options.env
      ? Object.entries(options.env).map(([k, v]) => `${k}=${v}`)
      : undefined,
  };

  const exec = await container.exec(execConfig);

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout = options.timeout || 30000;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      // Kill the exec process
      exec.inspect().then((info) => {
        if (info.Running) {
          // Force stop by sending signal
          container.kill({ signal: 'SIGKILL' }).catch(() => {});
        }
      });
    }, timeout);

    exec.start({ hijack: true, stdin: false }, (err, stream) => {
      if (err || !stream) {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          command,
          exitCode: 1,
          stdout: '',
          stderr: err?.message || 'Failed to start exec',
          durationMs: Date.now() - startTime,
          timedOut: false,
        });
        return;
      }

      // Demux stdout and stderr
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        // Docker multiplexes stdout/stderr with header
        // Header: [type(1), 0, 0, 0, size(4)]
        // type: 1 = stdout, 2 = stderr
        let offset = 0;
        while (offset < chunk.length) {
          if (offset + 8 > chunk.length) break;
          const type = chunk[offset];
          const size = chunk.readUInt32BE(offset + 4);
          offset += 8;
          if (offset + size > chunk.length) break;
          const data = chunk.subarray(offset, offset + size);
          if (type === 1) {
            stdoutChunks.push(data);
          } else if (type === 2) {
            stderrChunks.push(data);
          }
          offset += size;
        }
      });

      stream.on('end', async () => {
        clearTimeout(timeoutId);

        stdout = Buffer.concat(stdoutChunks).toString('utf-8');
        stderr = Buffer.concat(stderrChunks).toString('utf-8');

        // Get exit code
        let exitCode = 0;
        try {
          const info = await exec.inspect();
          exitCode = info.ExitCode ?? 0;
        } catch {
          exitCode = timedOut ? 124 : 1;
        }

        resolve({
          success: !timedOut && exitCode === 0,
          command,
          exitCode,
          stdout,
          stderr,
          durationMs: Date.now() - startTime,
          timedOut,
        });
      });

      stream.on('error', (err) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          command,
          exitCode: 1,
          stdout: '',
          stderr: err.message,
          durationMs: Date.now() - startTime,
          timedOut: false,
        });
      });
    });
  });
}

/**
 * Stop and remove a container.
 */
export async function destroyContainer(
  container: Docker.Container
): Promise<void> {
  try {
    await container.stop({ t: 5 });
  } catch {
    // Container might already be stopped
  }
  try {
    await container.remove({ force: true });
  } catch {
    // Container might already be removed
  }
}



