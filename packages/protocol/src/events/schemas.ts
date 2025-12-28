import { z } from 'zod';

/** ISO 8601 timestamp */
const timestampSchema = z.string().datetime();

/** Base event schema */
const baseEventSchema = z.object({
  timestamp: timestampSchema,
  operationId: z.string().optional(),
});

/** User message event schema */
export const userMessageEventSchema = baseEventSchema.extend({
  type: z.literal('userMessage'),
  content: z.string(),
});

/** Message event schema */
export const messageEventSchema = baseEventSchema.extend({
  type: z.literal('message'),
  success: z.literal(true),
});

/** CreateFile event schema */
export const createFileEventSchema = baseEventSchema.extend({
  type: z.literal('createFile'),
  path: z.string(),
  success: z.boolean(),
  bytesWritten: z.number().int().optional(),
  error: z.string().optional(),
});

/** ReadFile event schema */
export const readFileEventSchema = baseEventSchema.extend({
  type: z.literal('readFile'),
  path: z.string(),
  success: z.boolean(),
  content: z.string().optional(),
  encoding: z.enum(['utf-8', 'base64']).optional(),
  size: z.number().int().optional(),
  error: z.string().optional(),
});

/** EditFile event schema */
export const editFileEventSchema = baseEventSchema.extend({
  type: z.literal('editFile'),
  path: z.string(),
  success: z.boolean(),
  editsApplied: z.number().int().optional(),
  error: z.string().optional(),
});

/** DeleteFile event schema */
export const deleteFileEventSchema = baseEventSchema.extend({
  type: z.literal('deleteFile'),
  path: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
});

/** Shell event schema */
export const shellEventSchema = baseEventSchema.extend({
  type: z.literal('shell'),
  command: z.string(),
  success: z.boolean(),
  exitCode: z.number().int().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  durationMs: z.number().int().optional(),
  error: z.string().optional(),
  timedOut: z.boolean().optional(),
});

/** Approval required event schema */
export const approvalRequiredEventSchema = baseEventSchema.extend({
  type: z.literal('approvalRequired'),
  operationType: z.string(),
  reason: z.string(),
  details: z.object({
    command: z.string().optional(),
    path: z.string().optional(),
    policy: z.string().optional(),
  }),
});

/** Policy denied event schema */
export const policyDeniedEventSchema = baseEventSchema.extend({
  type: z.literal('policyDenied'),
  operationType: z.string(),
  reason: z.string(),
  suggestion: z.string().optional(),
});

/** Error event schema */
export const errorEventSchema = baseEventSchema.extend({
  type: z.literal('error'),
  category: z.enum(['validation', 'policy', 'execution', 'timeout', 'system']),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

/** Union of all event schemas */
export const eventSchema = z.discriminatedUnion('type', [
  userMessageEventSchema,
  messageEventSchema,
  createFileEventSchema,
  readFileEventSchema,
  editFileEventSchema,
  deleteFileEventSchema,
  shellEventSchema,
  approvalRequiredEventSchema,
  policyDeniedEventSchema,
  errorEventSchema,
]);

/** Run status schema */
export const runStatusSchema = z.enum([
  'completed',
  'awaiting_approval',
  'error',
]);

/** Events message schema (from runtime to agent) */
export const eventsMessageSchema = z.object({
  protocolVersion: z.literal('1.0'),
  runId: z.string(),
  events: z.array(eventSchema),
  status: runStatusSchema,
});

/** Type inference helpers */
export type EventInput = z.input<typeof eventSchema>;
export type EventsMessageInput = z.input<typeof eventsMessageSchema>;

