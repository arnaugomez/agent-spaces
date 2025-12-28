import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Spaces table - isolated execution environments.
 */
export const spaces = sqliteTable('spaces', {
  id: text('id').primaryKey(),
  name: text('name'),
  description: text('description'),
  status: text('status').$type<'creating' | 'ready' | 'running' | 'paused' | 'destroyed'>().notNull(),
  policy: text('policy').notNull().default('standard'),
  policyOverrides: text('policy_overrides', { mode: 'json' }).$type<Record<string, unknown>>(),
  workspacePath: text('workspace_path').notNull(),
  capabilities: text('capabilities', { mode: 'json' }).$type<string[]>(),
  env: text('env', { mode: 'json' }).$type<Record<string, string>>(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
});

/**
 * Runs table - execution sessions within spaces.
 */
export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(),
  spaceId: text('space_id').references(() => spaces.id).notNull(),
  status: text('status').$type<'running' | 'completed' | 'awaiting_approval' | 'cancelled' | 'error'>().notNull(),
  operations: text('operations', { mode: 'json' }).notNull(),
  events: text('events', { mode: 'json' }).notNull(),
  pendingApproval: text('pending_approval', { mode: 'json' }).$type<{
    operationId: string;
    operationType: string;
    reason: string;
  } | null>(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

/**
 * Approvals table - pending approval requests.
 */
export const approvals = sqliteTable('approvals', {
  id: text('id').primaryKey(),
  spaceId: text('space_id').references(() => spaces.id).notNull(),
  runId: text('run_id').references(() => runs.id).notNull(),
  operationId: text('operation_id').notNull(),
  operationType: text('operation_type').notNull(),
  status: text('status').$type<'pending' | 'approved' | 'denied' | 'expired'>().notNull(),
  details: text('details', { mode: 'json' }).$type<Record<string, unknown>>(),
  reason: text('reason'),
  decision: text('decision'),
  decisionReason: text('decision_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  decidedAt: integer('decided_at', { mode: 'timestamp' }),
});

/**
 * Audit log table - immutable log of all operations.
 */
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  spaceId: text('space_id').references(() => spaces.id),
  runId: text('run_id').references(() => runs.id),
  action: text('action').notNull(),
  details: text('details', { mode: 'json' }).$type<Record<string, unknown>>(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// Type exports for use in application code
export type Space = typeof spaces.$inferSelect;
export type NewSpace = typeof spaces.$inferInsert;
export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;



