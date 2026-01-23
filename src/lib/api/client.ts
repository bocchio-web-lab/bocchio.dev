// src/lib/api/client.ts
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { browser } from '$app/environment';

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = PUBLIC_API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Make an authenticated API request
     */
    async request<T>(
        endpoint: string,
        options: RequestInit & { tenantId?: number } = {}
    ): Promise<{ data?: T; error?: ApiError }> {
        const { tenantId, ...fetchOptions } = options;

        const headers: HeadersInit = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...fetchOptions.headers
        };

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
                return { error: errorData };
            }

            const data = await response.json();
            return { data };
        } catch (error) {
            console.error('API request failed:', error);
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
    async get<T>(endpoint: string, options: RequestInit & { tenantId?: number } = {}) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST request
     */
    async post<T>(
        endpoint: string,
        body?: unknown,
        options: RequestInit & { tenantId?: number } = {}
    ) {
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
        options: RequestInit & { tenantId?: number } = {}
    ) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string, options: RequestInit & { tenantId?: number } = {}) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

// Export a singleton instance
export const apiClient = new ApiClient();
