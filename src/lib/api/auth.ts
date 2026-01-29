// src/lib/api/auth-api.ts
import { httpClient } from './http';
import type { HttpResponse, User } from '$lib/types/http';

/**
 * Authentication API for browser-side operations
 */
export class AuthApi {
    /**
     * Get current authenticated user
     */
    async getUser(): Promise<HttpResponse<User>> {
        return httpClient.get<User>('/api/user');
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const result = await this.getUser();
        return !result.error;
    }
}

// Export singleton instance
export const authApi = new AuthApi();
