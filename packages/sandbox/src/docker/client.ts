import Docker from 'dockerode';

/**
 * Docker client singleton.
 */
let dockerClient: Docker | null = null;

/**
 * Get the Docker client instance.
 */
export function getDockerClient(): Docker {
  if (!dockerClient) {
    dockerClient = new Docker({
      socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock',
    });
  }
  return dockerClient;
}

/**
 * Check if Docker is available.
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    const client = getDockerClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Docker version info.
 */
export async function getDockerVersion(): Promise<Docker.DockerVersion> {
  const client = getDockerClient();
  return client.version();
}



