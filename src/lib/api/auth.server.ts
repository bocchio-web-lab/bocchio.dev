// src/lib/server/auth.server.ts
import { redirect, type Cookies } from '@sveltejs/kit';
import { createServerHttpClient } from './http.server';
import type { AuthResponse, User, HttpResponse } from '$lib/types/http';

/**
 * Convert HttpResponse to AuthResponse
 */
function toAuthResponse(response: HttpResponse, successMessage?: string): AuthResponse {
    if (response.ok) {
        return {
            success: true,
            message: successMessage || response.data?.message,
        };
    }

    return {
        success: false,
        message: response.error?.message || 'An error occurred',
        errors: response.error?.errors,
    };
}

/**
 * Authentication service for server-side operations
 */
export class AuthService {
    private httpClient: ReturnType<typeof createServerHttpClient>;

    constructor(cookies: Cookies) {
        this.httpClient = createServerHttpClient(cookies);
    }

    /**
     * Login user
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            // Initialize CSRF token first
            const csrfSuccess = await this.httpClient.initializeCsrfToken();
            if (!csrfSuccess) {
                return { success: false, message: 'Failed to initialize session' };
            }

            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);

            const response = await this.httpClient.post('/login', formData, { requireAuth: false });
            return toAuthResponse(response);
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'An error occurred during login',
            };
        }
    }

    /**
     * Register new user
     */
    async register(userData: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
    }): Promise<AuthResponse> {
        try {
            const csrfSuccess = await this.httpClient.initializeCsrfToken();
            if (!csrfSuccess) {
                return { success: false, message: 'Failed to initialize session' };
            }

            const formData = new FormData();
            Object.entries(userData).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const response = await this.httpClient.post('/register', formData, { requireAuth: false });
            return toAuthResponse(response);
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'An error occurred during registration',
            };
        }
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            await this.httpClient.post('/logout', undefined, { requireAuth: false });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.httpClient.clearAuthCookies();
        }
    }

    /**
     * Get authenticated user
     */
    async getUser(): Promise<User | null> {
        try {
            const response = await this.httpClient.get<User>('/api/user');
            return response.ok ? response.data || null : null;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const user = await this.getUser();
        return user !== null;
    }

    /**
     * Send password reset link
     */
    async forgotPassword(email: string): Promise<AuthResponse> {
        try {
            const csrfSuccess = await this.httpClient.initializeCsrfToken();
            if (!csrfSuccess) {
                return { success: false, message: 'Failed to initialize session' };
            }

            const formData = new FormData();
            formData.append('email', email);

            const response = await this.httpClient.post('/forgot-password', formData, {
                requireAuth: false,
            });
            return toAuthResponse(response, 'Password reset link sent!');
        } catch (error) {
            console.error('Forgot password error:', error);
            return {
                success: false,
                message: 'An error occurred',
            };
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(
        token: string,
        email: string,
        password: string,
        password_confirmation: string
    ): Promise<AuthResponse> {
        try {
            const csrfSuccess = await this.httpClient.initializeCsrfToken();
            if (!csrfSuccess) {
                return { success: false, message: 'Failed to initialize session' };
            }

            const formData = new FormData();
            formData.append('token', token);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('password_confirmation', password_confirmation);

            const response = await this.httpClient.post('/reset-password', formData, {
                requireAuth: false,
            });
            return toAuthResponse(response, 'Password reset successfully!');
        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                message: 'An error occurred',
            };
        }
    }

    /**
     * Resend email verification
     */
    async resendVerification(): Promise<AuthResponse> {
        try {
            const response = await this.httpClient.post('/email/verification-notification');
            return toAuthResponse(response, 'Verification email sent!');
        } catch (error) {
            console.error('Resend verification error:', error);
            return {
                success: false,
                message: 'An error occurred',
            };
        }
    }

    /**
     * Verify email with token
     */
    async verifyEmail(
        id: string,
        hash: string,
        expires: string,
        signature: string
    ): Promise<AuthResponse> {
        try {
            const queryParams = new URLSearchParams({ expires, signature });
            const endpoint = `/email/verify/${id}/${hash}?${queryParams.toString()}`;

            const response = await this.httpClient.get(endpoint);

            if (response.ok) {
                return { success: true, message: 'Email verified successfully!' };
            }

            if (response.status === 403) {
                return {
                    success: false,
                    message: 'Invalid or expired verification link',
                };
            }

            return toAuthResponse(response);
        } catch (error) {
            console.error('Verify email error:', error);
            return {
                success: false,
                message: 'An error occurred',
            };
        }
    }
}

/**
 * Helper function to create an auth service instance
 */
export function createAuthService(cookies: Cookies): AuthService {
    return new AuthService(cookies);
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(cookies: Cookies, redirectTo: string = '/auth/login') {
    const authService = createAuthService(cookies);
    const authenticated = await authService.isAuthenticated();

    if (!authenticated) {
        throw redirect(302, redirectTo);
    }
}