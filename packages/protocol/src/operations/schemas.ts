import { z } from 'zod';

/** Maximum path length */
const MAX_PATH_LENGTH = 255;

/** Maximum command length */
const MAX_COMMAND_LENGTH = 4096;

/** Maximum content length (10MB) */
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;

/** Maximum message length */
const MAX_MESSAGE_LENGTH = 100000;

/** Minimum timeout (1 second) */
const MIN_TIMEOUT = 1000;

/** Maximum timeout (1 hour) */
const MAX_TIMEOUT = 3600000;

/** Path validation - must be relative, no traversal */
const pathSchema = z
  .string()
  .max(MAX_PATH_LENGTH)
  .refine((path) => !path.startsWith('/'), {
    message: 'Path must be relative (no leading /)',
  })
  .refine((path) => !path.includes('..'), {
    message: 'Path cannot contain parent directory traversal (..)',
  })
  .refine((path) => !path.includes('\0'), {
    message: 'Path cannot contain null bytes',
  });

/** Encoding options */
const encodingSchema = z.enum(['utf-8', 'base64']).optional().default('utf-8');

/** Base operation schema */
const baseOperationSchema = z.object({
  id: z.string().optional(),
});

/** Message operation schema */
export const messageOperationSchema = baseOperationSchema.extend({
  type: z.literal('message'),
  content: z.string().max(MAX_MESSAGE_LENGTH),
});

/** CreateFile operation schema */
export const createFileOperationSchema = baseOperationSchema.extend({
  type: z.literal('createFile'),
  path: pathSchema,
  content: z.string().max(MAX_CONTENT_LENGTH),
  encoding: encodingSchema,
  overwrite: z.boolean().optional().default(false),
});

/** ReadFile operation schema */
export const readFileOperationSchema = baseOperationSchema.extend({
  type: z.literal('readFile'),
  path: pathSchema,
  encoding: encodingSchema,
});

/** File edit schema */
export const fileEditSchema = z.object({
  oldContent: z.string(),
  newContent: z.string(),
});

/** EditFile operation schema */
export const editFileOperationSchema = baseOperationSchema.extend({
  type: z.literal('editFile'),
  path: pathSchema,
  edits: z.array(fileEditSchema).min(1),
});

/** DeleteFile operation schema */
export const deleteFileOperationSchema = baseOperationSchema.extend({
  type: z.literal('deleteFile'),
  path: pathSchema,
});

/** Shell operation schema */
export const shellOperationSchema = baseOperationSchema.extend({
  type: z.literal('shell'),
  command: z.string().max(MAX_COMMAND_LENGTH),
  cwd: pathSchema.optional(),
  timeout: z.number().int().min(MIN_TIMEOUT).max(MAX_TIMEOUT).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

/** Union of all operation schemas */
export const operationSchema = z.discriminatedUnion('type', [
  messageOperationSchema,
  createFileOperationSchema,
  readFileOperationSchema,
  editFileOperationSchema,
  deleteFileOperationSchema,
  shellOperationSchema,
]);

/** Operations message schema (from agent to runtime) */
export const operationsMessageSchema = z.object({
  protocolVersion: z.literal('1.0'),
  operations: z.array(operationSchema),
});

/** Type inference helpers */
export type MessageOperationInput = z.input<typeof messageOperationSchema>;
export type CreateFileOperationInput = z.input<
  typeof createFileOperationSchema
>;
export type ReadFileOperationInput = z.input<typeof readFileOperationSchema>;
export type EditFileOperationInput = z.input<typeof editFileOperationSchema>;
export type DeleteFileOperationInput = z.input<
  typeof deleteFileOperationSchema
>;
export type ShellOperationInput = z.input<typeof shellOperationSchema>;
export type OperationInput = z.input<typeof operationSchema>;
export type OperationsMessageInput = z.input<typeof operationsMessageSchema>;

