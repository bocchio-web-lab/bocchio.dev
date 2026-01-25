// src/lib/api/http-client.ts
import { PUBLIC_API_BASE_URL, PUBLIC_FRONTEND_URL } from '$env/static/public';
import { browser } from '$app/environment';

export interface HttpError {
    message: string;
    errors?: Record<string, string[]>;
    status?: number;
}

export interface HttpResponse<T> {
    data?: T;
    error?: HttpError;
}

/**
 * Get CSRF token from cookies (browser only)
 */
function getCsrfToken(): string | null {
    if (!browser) return null;

    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find((c) => c.trim().startsWith('XSRF-TOKEN='));
    if (!xsrfCookie) return null;

    const token = xsrfCookie.split('=')[1];
    return token ? decodeURIComponent(token) : null;
}

/**
 * Initialize CSRF token from Laravel Sanctum
 */
async function initializeCsrfToken(): Promise<boolean> {
    if (!browser) return false;

    try {
        const response = await fetch(`${PUBLIC_API_BASE_URL}/sanctum/csrf-cookie`, {
            credentials: 'include'
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
        return false;
    }
}

/**
 * Low-level HTTP client with CSRF token handling
 */
export class HttpClient {
    private baseUrl: string;
    private csrfInitialized: boolean = false;

    constructor(baseUrl: string = PUBLIC_API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Ensure CSRF token is initialized
     */
    private async ensureCsrfToken(): Promise<void> {
        if (!browser || this.csrfInitialized) return;

        const token = getCsrfToken();
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
     * Build headers for authenticated requests
     */
    private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...customHeaders
        };

        // Add CSRF token for state-changing methods (browser only)
        if (browser) {
            const csrfToken = getCsrfToken();
            if (csrfToken) {
                headers['X-XSRF-TOKEN'] = csrfToken;
            }
        }

        // Add referer for Laravel CORS
        if (browser) {
            headers['Referer'] = PUBLIC_FRONTEND_URL;
        }

        return headers;
    }

    /**
     * Make an HTTP request
     */
    async request<T>(
        endpoint: string,
        options: RequestInit & {
            headers?: Record<string, string>;
            tenantId?: number;
        } = {}
    ): Promise<HttpResponse<T>> {
        const { tenantId, headers: customHeaders, ...fetchOptions } = options;

        // Ensure CSRF token for state-changing methods
        if (
            options.method &&
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())
        ) {
            await this.ensureCsrfToken();
        }

        const headers = this.buildHeaders(customHeaders);

        // Add tenant ID header if provided
        if (tenantId) {
            headers['X-Tenant-ID'] = tenantId.toString();
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...fetchOptions,
                headers,
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    message: response.statusText
                }));
                return {
                    error: {
                        ...errorData,
                        status: response.status
                    }
                };
            }

            const data = await response.json();
            return { data };
        } catch (error) {
            console.error('HTTP request failed:', error);
            return {
                error: {
                    message: error instanceof Error ? error.message : 'Network error'
                }
            };
        }
    }

    /**
     * GET request
     */
    async get<T>(
        endpoint: string,
        options: Omit<RequestInit, 'method' | 'body'> & {
            headers?: Record<string, string>;
            tenantId?: number;
        } = {}
    ): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST request
     */
    async post<T>(
        endpoint: string,
        body?: unknown,
        options: Omit<RequestInit, 'method' | 'body'> & {
            headers?: Record<string, string>;
            tenantId?: number;
        } = {}
    ): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined
        });
    }

    /**
     * PUT request
     */
    async put<T>(
        endpoint: string,
        body?: unknown,
        options: Omit<RequestInit, 'method' | 'body'> & {
            headers?: Record<string, string>;
            tenantId?: number;
        } = {}
    ): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined
        });
    }

    /**
     * PATCH request
     */
    async patch<T>(
        endpoint: string,
        body?: unknown,
        options: Omit<RequestInit, 'method' | 'body'> & {
            headers?: Record<string, string>;
            tenantId?: number;
        } = {}
    ): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(
        endpoint: string,
        options: Omit<RequestInit, 'method' | 'body'> & {
            headers?: Record<string, string>;
            tenantId?: number;
        } = {}
    ): Promise<HttpResponse<T>> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

// Export a singleton instance
export const httpClient = new HttpClient();
