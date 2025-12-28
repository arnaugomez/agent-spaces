import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

/**
 * Database connection singleton.
 */
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlite: Database | null = null;

/**
 * Get or create the database connection.
 */
export function getDatabase() {
  if (!db) {
    const dbPath = process.env.DATABASE_URL || './data/agent-spaces.db';
    sqlite = new Database(dbPath, { create: true });

    // Enable WAL mode for better performance
    sqlite.exec('PRAGMA journal_mode = WAL;');

    db = drizzle(sqlite, { schema });

    // Run migrations (create tables if they don't exist)
    initializeDatabase(sqlite);
  }

  return db;
}

/**
 * Initialize the database schema.
 */
function initializeDatabase(sqlite: Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      status TEXT NOT NULL,
      policy TEXT NOT NULL DEFAULT 'standard',
      policy_overrides TEXT,
      workspace_path TEXT NOT NULL,
      capabilities TEXT,
      env TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES spaces(id),
      status TEXT NOT NULL,
      operations TEXT NOT NULL,
      events TEXT NOT NULL,
      pending_approval TEXT,
      started_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES spaces(id),
      run_id TEXT NOT NULL REFERENCES runs(id),
      operation_id TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      reason TEXT,
      decision TEXT,
      decision_reason TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      decided_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      space_id TEXT REFERENCES spaces(id),
      run_id TEXT REFERENCES runs(id),
      action TEXT NOT NULL,
      details TEXT,
      timestamp INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_runs_space_id ON runs(space_id);
    CREATE INDEX IF NOT EXISTS idx_approvals_space_id ON approvals(space_id);
    CREATE INDEX IF NOT EXISTS idx_approvals_run_id ON approvals(run_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_space_id ON audit_log(space_id);
  `);
}

/**
 * Close the database connection.
 */
export function closeDatabase() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}

// Re-export schema
export * from './schema';



