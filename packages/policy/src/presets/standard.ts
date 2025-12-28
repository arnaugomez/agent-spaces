import type { Policy } from '../types';

/**
 * Standard policy preset.
 * Balanced security and functionality.
 */
export const standardPolicy: Policy = {
  name: 'standard',
  description: 'Balanced security and functionality',
  filesystem: {
    enabled: true,
    readOnly: false,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    blockedPaths: ['.*', '*.env', '*.key', '*.pem', 'node_modules'],
  },
  shell: {
    enabled: true,
    allowedCommands: [
      'bun',
      'node',
      'npm',
      'npx',
      'cat',
      'echo',
      'ls',
      'pwd',
      'head',
      'tail',
      'grep',
      'find',
      'wc',
    ],
    blockedPatterns: [
      'rm -rf /',
      'rm -rf ~',
      'sudo',
      'chmod',
      'chown',
      'curl',
      'wget',
      'ssh',
    ],
    timeout: 30000,
    approvalRequired: ['rm -rf', 'rm -r'],
  },
  network: {
    enabled: false,
  },
};

