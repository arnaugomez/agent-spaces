import type { ResolvedConfig } from '../config';
import { AgentSpacesError, NetworkError, parseApiError } from '../errors';

/**
 * HTTP request options.
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * API response wrapper.
 */
export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
    hasMore?: boolean;
    nextCursor?: string;
  };
}

/**
 * HTTP client for making API requests.
 */
export class HttpClient {
  constructor(private config: ResolvedConfig) {}

  /**
   * Make an API request.
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.config.baseUrl}/v1${path}`;
    const method = options.method || 'GET';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (options.body) {
      requestInit.body = JSON.stringify(options.body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, options.timeout || this.config.timeout);

    requestInit.signal = controller.signal;

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        const response = await this.config.fetch(url, requestInit);
        clearTimeout(timeoutId);

        const data = await response.json() as { error?: { code: string; message: string; details?: unknown }; meta?: { requestId?: string } };

        if (!response.ok) {
          const error = parseApiError(data as { error: { code: string; message: string; details?: unknown }; meta?: { requestId?: string } }, response.status);

          // Retry on 5xx errors
          if (response.status >= 500 && attempt < this.config.maxRetries) {
            lastError = error;
            attempt++;
            await this.delay(this.config.retryDelay * attempt);
            continue;
          }

          throw error;
        }

        return data as T;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof AgentSpacesError) {
          throw error;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new NetworkError('Request timed out');
          }

          // Retry on network errors
          if (attempt < this.config.maxRetries) {
            lastError = error;
            attempt++;
            await this.delay(this.config.retryDelay * attempt);
            continue;
          }

          throw new NetworkError(error.message, error);
        }

        throw new NetworkError('Unknown error');
      }
    }

    throw lastError || new NetworkError('Request failed after retries');
  }

  /**
   * GET request.
   */
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * POST request.
   */
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  /**
   * PUT request.
   */
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request.
   */
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request.
   */
  delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Delay helper for retries.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

