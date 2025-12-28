import { resolveConfig, type AgentSpacesConfig } from './config';
import { HttpClient } from './http';
import { SpacesResource } from './resources';

/**
 * Agent Spaces SDK client.
 */
export class AgentSpaces {
  private http: HttpClient;

  /** Spaces resource */
  public spaces: SpacesResource;

  constructor(config: AgentSpacesConfig = {}) {
    const resolvedConfig = resolveConfig(config);
    this.http = new HttpClient(resolvedConfig);

    // Initialize resources
    this.spaces = new SpacesResource(this.http);
  }
}

