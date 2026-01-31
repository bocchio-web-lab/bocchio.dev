// src/lib/server/http-server.server.ts
import type { Cookies } from '@sveltejs/kit';
import { PUBLIC_API_BASE_URL, PUBLIC_FRONTEND_URL } from '$env/static/public';
import { HEADERS, HTTP_METHODS } from './constants';
import { CookieManager } from './cookie-manager';
import type { HttpResponse, RequestOptions } from '$lib/types/http';

/**
 * Server-side HTTP client with session cookie handling
 */
export class ServerHttpClient {
    private baseUrl: string;
    private cookieManager: CookieManager;

    constructor(cookies: Cookies, baseUrl: string = PUBLIC_API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.cookieManager = new CookieManager(cookies);
    }

    /**
     * Build request headers with authentication
     */
    private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
        const headers: Record<string, string> = {
            [HEADERS.ACCEPT]: 'application/json',
            [HEADERS.REFERER]: PUBLIC_FRONTEND_URL,
            ...customHeaders,
        };

        const csrfToken = this.cookieManager.getCsrfToken();
        const cookieHeader = this.cookieManager.buildCookieHeader();

        if (csrfToken) {
            headers[HEADERS.XSRF_TOKEN] = csrfToken;
        }

        if (cookieHeader) {
            headers[HEADERS.COOKIE] = cookieHeader;
        }

        return headers;
    }

    /**
     * Make an HTTP request
     */
    async request<T>(
        endpoint: string,
        method: string,
        options: RequestOptions & { body?: FormData | string } = {}
    ): Promise<HttpResponse<T>> {
        const { body, headers: customHeaders, requireAuth = true, tenantId } = options;

        // Check authentication if required
        if (requireAuth && !this.cookieManager.hasValidSession()) {
            return {
                ok: false,
                status: 401,
                error: { message: 'Unauthorized', status: 401 },
            };
        }

        try {
            const headers = this.buildHeaders(customHeaders);

            // Add tenant ID header if provided
            if (tenantId) {
                headers[HEADERS.TENANT_ID] = tenantId.toString();
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method,
                body,
                credentials: 'include',
                headers,
            });

            // Update cookies from response
            this.cookieManager.parseCookiesFromResponse(response);

            // Parse response
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                return {
                    ok: false,
                    status: response.status,
                    error: {
                        message: data?.message || response.statusText,
                        errors: data?.errors,
                        status: response.status,
                    },
                };
            }

            return {
                ok: true,
                status: response.status,
                data,
            };
        } catch (error) {
            console.error('Server HTTP request failed:', error);
            return {
                ok: false,
                status: 500,
                error: {
                    message: error instanceof Error ? error.message : 'Network error',
                    status: 500,
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
    async post<T>(
        endpoint: string,
        body?: FormData | Record<string, any>,
        options?: RequestOptions
    ): Promise<HttpResponse<T>> {
        let requestBody: FormData | string | undefined;
        let headers = options?.headers || {};

        if (body instanceof FormData) {
            requestBody = body;
        } else if (body) {
            requestBody = JSON.stringify(body);
            headers = { [HEADERS.CONTENT_TYPE]: 'application/json', ...headers };
        }

        return this.request<T>(endpoint, HTTP_METHODS.POST, {
            ...options,
            body: requestBody,
            headers,
        });
    }

    /**
     * PUT request
     */
    async put<T>(
        endpoint: string,
        body?: Record<string, any>,
        options?: RequestOptions
    ): Promise<HttpResponse<T>> {
        const headers = { [HEADERS.CONTENT_TYPE]: 'application/json', ...options?.headers };

        return this.request<T>(endpoint, HTTP_METHODS.PUT, {
            ...options,
            body: body ? JSON.stringify(body) : undefined,
            headers,
        });
    }

    /**
     * PATCH request
     */
    async patch<T>(
        endpoint: string,
        body?: Record<string, any>,
        options?: RequestOptions
    ): Promise<HttpResponse<T>> {
        const headers = { [HEADERS.CONTENT_TYPE]: 'application/json', ...options?.headers };

        return this.request<T>(endpoint, HTTP_METHODS.PATCH, {
            ...options,
            body: body ? JSON.stringify(body) : undefined,
            headers,
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string, options?: RequestOptions): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, HTTP_METHODS.DELETE, options);
    }

    /**
     * Initialize CSRF token
     */
    async initializeCsrfToken(): Promise<boolean> {
        return this.cookieManager.initializeCsrfToken();
    }

    /**
     * Clear authentication cookies
     */
    clearAuthCookies(): void {
        this.cookieManager.clearAuthCookies();
    }
}

/**
 * Helper function to create a server HTTP client instance
 */
export function createServerHttpClient(cookies: Cookies): ServerHttpClient {
    return new ServerHttpClient(cookies);
}

// Re-export types
export type { HttpResponse } from '$lib/types/http';
export type ServerHttpResponse<T = any> = HttpResponse<T>;
