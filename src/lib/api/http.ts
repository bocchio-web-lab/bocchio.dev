// src/lib/api/http-client.ts
import { PUBLIC_API_BASE_URL, PUBLIC_FRONTEND_URL } from '$env/static/public';
import { browser } from '$app/environment';
import { HEADERS, HTTP_METHODS } from './constants';
import { getCsrfTokenFromCookies, initializeCsrfToken } from './csrf';
import type { HttpResponse, RequestOptions } from '$lib/types/http';

/**
 * Browser-side HTTP client with automatic CSRF handling
 */
export class HttpClient {
    private baseUrl: string;
    private csrfInitialized = false;

    constructor(baseUrl: string = PUBLIC_API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Ensure CSRF token is initialized for state-changing requests
     */
    private async ensureCsrfToken(): Promise<void> {
        if (!browser || this.csrfInitialized) return;

        const token = getCsrfTokenFromCookies();
        if (!token) {
            const success = await initializeCsrfToken();
            if (success) {
                this.csrfInitialized = true;
            }
        } else {
            this.csrfInitialized = true;
        }
    }

    /**
     * Build request headers
     */
    private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
        const headers: Record<string, string> = {
            [HEADERS.ACCEPT]: 'application/json',
            [HEADERS.CONTENT_TYPE]: 'application/json',
            ...customHeaders,
        };

        // Add CSRF token for browser requests
        if (browser) {
            const csrfToken = getCsrfTokenFromCookies();
            if (csrfToken) {
                headers[HEADERS.XSRF_TOKEN] = csrfToken;
            }
            headers[HEADERS.REFERER] = PUBLIC_FRONTEND_URL;
        }

        return headers;
    }

    /**
     * Check if method requires CSRF token
     */
    private requiresCsrfToken(method: string): boolean {
        return [HTTP_METHODS.POST, HTTP_METHODS.PUT, HTTP_METHODS.PATCH, HTTP_METHODS.DELETE].includes(
            method as any
        );
    }

    /**
     * Make an HTTP request
     */
    async request<T>(
        endpoint: string,
        method: string,
        options: RequestOptions & { body?: unknown } = {}
    ): Promise<HttpResponse<T>> {
        const { tenantId, headers: customHeaders, body, ...fetchOptions } = options;

        // Ensure CSRF token for state-changing methods
        if (this.requiresCsrfToken(method)) {
            await this.ensureCsrfToken();
        }

        const headers = this.buildHeaders(customHeaders);

        // Add tenant ID header if provided
        if (tenantId) {
            headers[HEADERS.TENANT_ID] = tenantId.toString();
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...fetchOptions,
                method,
                headers,
                credentials: 'include',
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                return {
                    error: {
                        message: data?.message || response.statusText,
                        errors: data?.errors,
                        status: response.status,
                    },
                };
            }

            return { data };
        } catch (error) {
            console.error('HTTP request failed:', error);
            return {
                error: {
                    message: error instanceof Error ? error.message : 'Network error',
                },
            };
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, options?: RequestOptions): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, HTTP_METHODS.GET, options);
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, HTTP_METHODS.POST, { ...options, body });
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, HTTP_METHODS.PUT, { ...options, body });
    }

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, HTTP_METHODS.PATCH, { ...options, body });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string, options?: RequestOptions): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, HTTP_METHODS.DELETE, options);
    }
}

// Export singleton instance
export const httpClient = new HttpClient();
