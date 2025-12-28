import { restrictivePolicy } from './restrictive';
import { standardPolicy } from './standard';
import { permissivePolicy } from './permissive';
import type { Policy, PolicyPreset } from '../types';

export { restrictivePolicy } from './restrictive';
export { standardPolicy } from './standard';
export { permissivePolicy } from './permissive';

/**
 * Get a policy preset by name.
 */
export function getPreset(name: PolicyPreset): Policy {
  switch (name) {
    case 'restrictive':
      return restrictivePolicy;
    case 'standard':
      return standardPolicy;
    case 'permissive':
      return permissivePolicy;
    default:
      throw new Error(`Unknown policy preset: ${name}`);
  }
}

/**
 * All available presets.
 */
export const presets: Record<PolicyPreset, Policy> = {
  restrictive: restrictivePolicy,
  standard: standardPolicy,
  permissive: permissivePolicy,
};

