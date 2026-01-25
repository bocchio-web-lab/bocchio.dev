// src/lib/api/auth-api.ts
import { httpClient, type HttpResponse } from './http-client';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
}

/**
 * Authentication API (browser-side)
 */
export class AuthApi {
    /**
     * Get current authenticated user
     */
    async getUser(): Promise<HttpResponse<User>> {
        return httpClient.get('/api/user');
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const result = await this.getUser();
        return !result.error;
    }
}

// Export a singleton instance
export const authApi = new AuthApi();
