import type { Policy } from '../types';

/**
 * Restrictive policy preset.
 * Maximum security, minimal permissions.
 */
export const restrictivePolicy: Policy = {
  name: 'restrictive',
  description: 'Maximum security, minimal permissions',
  filesystem: {
    enabled: true,
    readOnly: true,
    maxFileSize: 1024 * 1024, // 1MB
    blockedPaths: ['.*', '*.env', '*.key', '*.pem'],
  },
  shell: {
    enabled: false,
    timeout: 10000,
  },
  network: {
    enabled: false,
  },
};



