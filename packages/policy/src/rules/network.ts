import type { NetworkPolicy, PolicyEvaluation } from '../types';

/**
 * Check if a domain matches a pattern.
 */
function matchesDomain(domain: string, pattern: string): boolean {
  if (pattern === '*') {
    return true;
  }

  // Exact match
  if (pattern === domain) {
    return true;
  }

  // Wildcard subdomain match (*.example.com)
  if (pattern.startsWith('*.')) {
    const baseDomain = pattern.substring(2);
    return domain === baseDomain || domain.endsWith(`.${baseDomain}`);
  }

  return false;
}

/**
 * Check if a domain matches any pattern in a list.
 */
function matchesAnyDomain(domain: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesDomain(domain, pattern));
}

/**
 * Evaluate network policy for a domain.
 */
export function evaluateNetworkPolicy(
  policy: NetworkPolicy,
  domain: string
): PolicyEvaluation {
  // Check if network is enabled
  if (!policy.enabled) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Network access is disabled',
      suggestion: 'Use a policy that allows network access',
      policy: 'network.enabled',
    };
  }

  // Check blocked domains first
  if (policy.blockedDomains && matchesAnyDomain(domain, policy.blockedDomains)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Domain "${domain}" is blocked`,
      policy: 'network.blockedDomains',
    };
  }

  // Check allowed domains (if specified)
  if (policy.allowedDomains && policy.allowedDomains.length > 0) {
    if (!matchesAnyDomain(domain, policy.allowedDomains)) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Domain "${domain}" is not in allowed domains`,
        policy: 'network.allowedDomains',
      };
    }
  }

  return {
    allowed: true,
    requiresApproval: false,
  };
}



