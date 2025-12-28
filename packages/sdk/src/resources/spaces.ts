import type { Operation, Event } from '@agent-spaces/protocol';
import { PROTOCOL_VERSION } from '@agent-spaces/protocol';
import { BaseResource } from './base';
import type { HttpClient, ApiResponse } from '../http';

/**
 * Space data returned from API.
 */
export interface SpaceData {
  id: string;
  name: string;
  description?: string;
  status: 'creating' | 'ready' | 'running' | 'paused' | 'destroyed';
  policy: string;
  capabilities?: string[];
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Run data returned from API.
 */
export interface RunData {
  id: string;
  spaceId: string;
  status: 'running' | 'completed' | 'awaiting_approval' | 'cancelled' | 'error';
  protocolVersion: string;
  events: Event[];
  pendingApproval?: {
    operationId: string;
    operationType: string;
    reason: string;
    details: Record<string, unknown>;
  };
  startedAt: string;
  completedAt?: string;
}

/**
 * Options for creating a space.
 */
export interface CreateSpaceOptions {
  name?: string;
  description?: string;
  policy?: 'restrictive' | 'standard' | 'permissive';
  policyOverrides?: Record<string, unknown>;
  capabilities?: string[];
  env?: Record<string, string>;
  metadata?: Record<string, unknown>;
  ttlSeconds?: number;
}

/**
 * Options for running operations.
 */
export interface RunOptions {
  operations: Operation[];
  context?: {
    files?: string[];
  };
}

/**
 * Space instance with methods.
 */
export class Space {
  constructor(
    public data: SpaceData,
    private http: HttpClient
  ) {}

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get status(): SpaceData['status'] {
    return this.data.status;
  }

  /**
   * Refresh space data from API.
   */
  async refresh(): Promise<void> {
    const response = await this.http.get<ApiResponse<SpaceData>>(
      `/spaces/${this.id}`
    );
    this.data = response.data;
  }

  /**
   * Execute operations in this space.
   */
  async run(options: RunOptions): Promise<Run> {
    const response = await this.http.post<ApiResponse<RunData>>(
      `/spaces/${this.id}/runs`,
      {
        protocolVersion: PROTOCOL_VERSION,
        operations: options.operations,
        context: options.context,
      }
    );

    return new Run(response.data, this.http, this.id);
  }

  /**
   * Update space properties.
   */
  async update(
    updates: Partial<Pick<SpaceData, 'name' | 'description' | 'metadata'>>
  ): Promise<void> {
    const response = await this.http.patch<ApiResponse<SpaceData>>(
      `/spaces/${this.id}`,
      updates
    );
    this.data = response.data;
  }

  /**
   * Extend space TTL.
   */
  async extend(options: { duration: number }): Promise<void> {
    const response = await this.http.post<ApiResponse<{ expiresAt: string }>>(
      `/spaces/${this.id}/extend`,
      options
    );
    this.data.expiresAt = response.data.expiresAt;
  }

  /**
   * Destroy the space.
   */
  async destroy(): Promise<void> {
    await this.http.delete(`/spaces/${this.id}`);
    this.data.status = 'destroyed';
  }

  /**
   * Files resource for this space.
   */
  get files(): SpaceFiles {
    return new SpaceFiles(this.http, this.id);
  }

  /**
   * Runs resource for this space.
   */
  get runs(): SpaceRuns {
    return new SpaceRuns(this.http, this.id);
  }
}

/**
 * Run instance with methods.
 */
export class Run {
  constructor(
    public data: RunData,
    private http: HttpClient,
    private spaceId: string
  ) {}

  get id(): string {
    return this.data.id;
  }

  get status(): RunData['status'] {
    return this.data.status;
  }

  get events(): Event[] {
    return this.data.events;
  }

  get pendingApproval(): RunData['pendingApproval'] {
    return this.data.pendingApproval;
  }

  /**
   * Approve a pending operation.
   */
  async approve(options: { operationId: string; reason?: string }): Promise<void> {
    const response = await this.http.post<ApiResponse<RunData>>(
      `/spaces/${this.spaceId}/runs/${this.id}/resume`,
      {
        approval: {
          operationId: options.operationId,
          decision: 'approved',
          reason: options.reason,
        },
      }
    );
    this.data = response.data;
  }

  /**
   * Deny a pending operation.
   */
  async deny(options: { operationId: string; reason?: string }): Promise<void> {
    const response = await this.http.post<ApiResponse<RunData>>(
      `/spaces/${this.spaceId}/runs/${this.id}/resume`,
      {
        approval: {
          operationId: options.operationId,
          decision: 'denied',
          reason: options.reason,
        },
      }
    );
    this.data = response.data;
  }

  /**
   * Cancel the run.
   */
  async cancel(): Promise<void> {
    await this.http.post(`/spaces/${this.spaceId}/runs/${this.id}/cancel`);
    this.data.status = 'cancelled';
  }
}

/**
 * Files resource for a space.
 */
export class SpaceFiles {
  constructor(
    private http: HttpClient,
    private spaceId: string
  ) {}

  /**
   * Read a file from the workspace.
   */
  async read(
    path: string,
    encoding: 'utf-8' | 'base64' = 'utf-8'
  ): Promise<{ content: string; size: number }> {
    const response = await this.http.get<
      ApiResponse<{ path: string; content: string; size: number }>
    >(`/spaces/${this.spaceId}/files/${encodeURIComponent(path)}?encoding=${encoding}`);
    return { content: response.data.content, size: response.data.size };
  }

  /**
   * Write a file to the workspace.
   */
  async write(
    path: string,
    content: string,
    encoding: 'utf-8' | 'base64' = 'utf-8'
  ): Promise<{ size: number }> {
    const response = await this.http.put<ApiResponse<{ path: string; size: number }>>(
      `/spaces/${this.spaceId}/files/${encodeURIComponent(path)}`,
      { content, encoding }
    );
    return { size: response.data.size };
  }

  /**
   * Delete a file from the workspace.
   */
  async delete(path: string): Promise<void> {
    await this.http.delete(`/spaces/${this.spaceId}/files/${encodeURIComponent(path)}`);
  }

  /**
   * List files in the workspace.
   */
  async list(
    options: { path?: string; recursive?: boolean } = {}
  ): Promise<
    Array<{
      name: string;
      path: string;
      type: 'file' | 'directory';
      size?: number;
      modifiedAt?: string;
    }>
  > {
    const path = options.path || '';
    const recursive = options.recursive ? 'true' : 'false';
    const response = await this.http.get<
      ApiResponse<{ files: Array<{ name: string; path: string; type: string; size: number; modifiedAt: string }> }>
    >(`/spaces/${this.spaceId}/files/${path}?recursive=${recursive}`);
    return response.data.files.map((f) => ({
      ...f,
      type: f.type as 'file' | 'directory',
    }));
  }
}

/**
 * Runs resource for a space.
 */
export class SpaceRuns {
  constructor(
    private http: HttpClient,
    private spaceId: string
  ) {}

  /**
   * Get a run by ID.
   */
  async get(runId: string): Promise<Run> {
    const response = await this.http.get<ApiResponse<RunData>>(
      `/spaces/${this.spaceId}/runs/${runId}`
    );
    return new Run(response.data, this.http, this.spaceId);
  }

  /**
   * List runs for this space.
   */
  async list(options: { status?: string; limit?: number } = {}): Promise<Run[]> {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.limit) params.set('limit', options.limit.toString());

    const response = await this.http.get<ApiResponse<RunData[]>>(
      `/spaces/${this.spaceId}/runs?${params}`
    );
    return response.data.map((data) => new Run(data, this.http, this.spaceId));
  }
}

/**
 * Spaces resource.
 */
export class SpacesResource extends BaseResource {
  /**
   * Create a new space.
   */
  async create(options: CreateSpaceOptions = {}): Promise<Space> {
    const response = await this.http.post<ApiResponse<SpaceData>>(
      '/spaces',
      options
    );
    return new Space(response.data, this.http);
  }

  /**
   * Get a space by ID.
   */
  async get(id: string): Promise<Space> {
    const response = await this.http.get<ApiResponse<SpaceData>>(
      `/spaces/${id}`
    );
    return new Space(response.data, this.http);
  }

  /**
   * List all spaces.
   */
  async list(options: { status?: string; limit?: number } = {}): Promise<Space[]> {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.limit) params.set('limit', options.limit.toString());

    const response = await this.http.get<ApiResponse<SpaceData[]>>(
      `/spaces?${params}`
    );
    return response.data.map((data) => new Space(data, this.http));
  }

  /**
   * Delete a space by ID.
   */
  async delete(id: string): Promise<void> {
    await this.http.delete(`/spaces/${id}`);
  }
}

