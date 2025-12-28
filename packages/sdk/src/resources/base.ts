import { HttpClient } from '../http';

/**
 * Base class for API resources.
 */
export abstract class BaseResource {
  constructor(protected http: HttpClient) {}
}

