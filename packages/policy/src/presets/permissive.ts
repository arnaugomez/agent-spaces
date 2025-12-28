import type { Policy } from '../types';

/**
 * Permissive policy preset.
 * Maximum functionality, requires trust.
 */
export const permissivePolicy: Policy = {
  name: 'permissive',
  description: 'Maximum functionality, requires trust',
  filesystem: {
    enabled: true,
    readOnly: false,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    blockedPaths: ['*.key', '*.pem'],
  },
  shell: {
    enabled: true,
    blockedPatterns: ['rm -rf /', 'rm -rf ~', 'sudo'],
    timeout: 300000, // 5 minutes
    approvalRequired: ['rm -rf', 'rm -r', 'chmod', 'chown'],
  },
  network: {
    enabled: true,
    allowedDomains: ['*'],
  },
};



