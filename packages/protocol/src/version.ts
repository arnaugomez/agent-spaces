/**
 * Protocol version following semantic versioning.
 * - Major: Breaking changes to operation/event structure
 * - Minor: Additive, backwards-compatible changes
 */
export const PROTOCOL_VERSION = '1.0' as const;

export type ProtocolVersion = typeof PROTOCOL_VERSION;

