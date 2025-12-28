import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { Sandbox } from '@agent-spaces/sandbox';
import { PolicyEngine, type PolicyPreset } from '@agent-spaces/policy';
import { getDatabase, spaces, type Space, type NewSpace } from '../db';

/**
 * Options for creating a space.
 */
export interface CreateSpaceOptions {
  name?: string;
  description?: string;
  policy?: PolicyPreset;
  policyOverrides?: Record<string, unknown>;
  capabilities?: string[];
  env?: Record<string, string>;
  metadata?: Record<string, unknown>;
  ttlSeconds?: number;
}

/**
 * Service for managing spaces.
 */
export class SpaceService {
  private sandboxes = new Map<string, Sandbox>();
  private policyEngines = new Map<string, PolicyEngine>();

  constructor(private workspaceBaseDir: string = './data/workspaces') {}

  /**
   * Create a new space.
   */
  async create(options: CreateSpaceOptions = {}): Promise<Space> {
    const db = getDatabase();
    const id = `spc_${nanoid(12)}`;
    const now = new Date();

    // Create sandbox
    const sandbox = await Sandbox.create({
      id,
      workspaceBaseDir: this.workspaceBaseDir,
      env: options.env,
    });

    this.sandboxes.set(id, sandbox);

    // Create policy engine
    const policyEngine = options.policyOverrides
      ? PolicyEngine.fromPresetWithOverrides(
          options.policy || 'standard',
          options.policyOverrides as Parameters<typeof PolicyEngine.fromPresetWithOverrides>[1]
        )
      : PolicyEngine.fromPreset(options.policy || 'standard');

    this.policyEngines.set(id, policyEngine);

    // Calculate expiration
    const ttlSeconds = options.ttlSeconds || 12 * 60 * 60; // Default 12 hours
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    // Insert into database
    const newSpace: NewSpace = {
      id,
      name: options.name || `Space ${id}`,
      description: options.description,
      status: 'ready',
      policy: options.policy || 'standard',
      policyOverrides: options.policyOverrides,
      workspacePath: sandbox.workspacePath,
      capabilities: options.capabilities,
      env: options.env,
      metadata: options.metadata,
      createdAt: now,
      expiresAt,
    };

    await db.insert(spaces).values(newSpace);

    return newSpace as Space;
  }

  /**
   * Get a space by ID.
   */
  async get(id: string): Promise<Space | null> {
    const db = getDatabase();
    const result = await db.select().from(spaces).where(eq(spaces.id, id));
    return result[0] || null;
  }

  /**
   * List all spaces.
   */
  async list(options: { status?: string; limit?: number; offset?: number } = {}): Promise<Space[]> {
    const db = getDatabase();

    if (options.status) {
      const result = await db
        .select()
        .from(spaces)
        .where(eq(spaces.status, options.status as Space['status']))
        .limit(options.limit || 20)
        .offset(options.offset || 0);
      return result;
    }

    const result = await db
      .select()
      .from(spaces)
      .limit(options.limit || 20)
      .offset(options.offset || 0);
    return result;
  }

  /**
   * Update a space.
   */
  async update(id: string, updates: Partial<Pick<Space, 'name' | 'description' | 'metadata'>>): Promise<Space | null> {
    const db = getDatabase();
    await db.update(spaces).set(updates).where(eq(spaces.id, id));
    return this.get(id);
  }

  /**
   * Destroy a space.
   */
  async destroy(id: string): Promise<void> {
    const db = getDatabase();

    // Destroy sandbox if it exists
    const sandbox = this.sandboxes.get(id);
    if (sandbox) {
      await sandbox.destroy();
      this.sandboxes.delete(id);
    }

    // Remove policy engine
    this.policyEngines.delete(id);

    // Update status in database
    await db
      .update(spaces)
      .set({ status: 'destroyed' })
      .where(eq(spaces.id, id));
  }

  /**
   * Get the sandbox for a space.
   */
  getSandbox(id: string): Sandbox | undefined {
    return this.sandboxes.get(id);
  }

  /**
   * Get the policy engine for a space.
   */
  getPolicyEngine(id: string): PolicyEngine | undefined {
    return this.policyEngines.get(id);
  }

  /**
   * Extend the TTL of a space.
   */
  async extend(id: string, additionalSeconds: number): Promise<Space | null> {
    const space = await this.get(id);
    if (!space || !space.expiresAt) return null;

    const newExpiresAt = new Date(space.expiresAt.getTime() + additionalSeconds * 1000);
    const db = getDatabase();

    await db
      .update(spaces)
      .set({ expiresAt: newExpiresAt })
      .where(eq(spaces.id, id));

    return this.get(id);
  }
}

