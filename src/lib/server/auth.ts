// src/lib/server/auth.ts
import { redirect, type Cookies } from '@sveltejs/kit';
import { getCsrfToken, post, get, type ServerHttpResponse } from './http-server';

const SESSION_COOKIE_NAME = 'backend_bocchio_session';
const XSRF_TOKEN_NAME = 'XSRF-TOKEN';

export interface AuthResponse {
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
}

/**
 * Convert ServerHttpResponse to AuthResponse
 */
function toAuthResponse(response: ServerHttpResponse, successMessage?: string): AuthResponse {
    if (response.ok) {
        return {
            success: true,
            message: successMessage || response.data?.message
        };
    }

    return {
        success: false,
        message: response.error?.message || 'An error occurred',
        errors: response.error?.errors
    };
}

/**
 * Login user
 */
export async function login(
    email: string,
    password: string,
    cookies: Cookies
): Promise<AuthResponse> {
    try {
        // Get CSRF token first
        const csrfSuccess = await getCsrfToken(cookies);
        if (!csrfSuccess) {
            return { success: false, message: 'Failed to initialize session' };
        }

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const response = await post('/login', cookies, formData, { requireAuth: false });
        return toAuthResponse(response);
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'An error occurred during login'
        };
    }
}

/**
 * Register new user
 */
export async function register(
    userData: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
    },
    cookies: Cookies
): Promise<AuthResponse> {
    try {
        // Get CSRF token first
        const csrfSuccess = await getCsrfToken(cookies);
        if (!csrfSuccess) {
            return { success: false, message: 'Failed to initialize session' };
        }

        const formData = new FormData();
        Object.entries(userData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        const response = await post('/register', cookies, formData, { requireAuth: false });
        return toAuthResponse(response);
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            message: 'An error occurred during registration'
        };
    }
}

/**
 * Logout user
 */
export async function logout(cookies: Cookies): Promise<void> {
    try {
        await post('/logout', cookies, undefined, { requireAuth: false });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear all auth cookies
        cookies.delete(XSRF_TOKEN_NAME, { path: '/' });
        cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
    }
}

/**
 * Get authenticated user
 */
export async function getUser(cookies: Cookies): Promise<any | null> {
    try {
        const response = await get('/api/user', cookies);
        return response.ok ? response.data : null;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(cookies: Cookies): Promise<boolean> {
    const sessionCookie = cookies.get(SESSION_COOKIE_NAME);
    if (!sessionCookie) {
        return false;
    }

    const user = await getUser(cookies);
    return user !== null;
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(cookies: Cookies, redirectTo: string = '/auth/login') {
    const authenticated = await isAuthenticated(cookies);
    if (!authenticated) {
        throw redirect(302, redirectTo);
    }
}

/**
 * Send password reset link
 */
export async function forgotPassword(email: string, cookies: Cookies): Promise<AuthResponse> {
    try {
        const csrfSuccess = await getCsrfToken(cookies);
        if (!csrfSuccess) {
            return { success: false, message: 'Failed to initialize session' };
        }

        const formData = new FormData();
        formData.append('email', email);

        const response = await post('/forgot-password', cookies, formData, { requireAuth: false });
        return toAuthResponse(response, 'Password reset link sent!');
    } catch (error) {
        console.error('Forgot password error:', error);
        return {
            success: false,
            message: 'An error occurred'
        };
    }
}

/**
 * Reset password with token
 */
export async function resetPassword(
    token: string,
    email: string,
    password: string,
    password_confirmation: string,
    cookies: Cookies
): Promise<AuthResponse> {
    try {
        const csrfSuccess = await getCsrfToken(cookies);
        if (!csrfSuccess) {
            return { success: false, message: 'Failed to initialize session' };
        }

        const formData = new FormData();
        formData.append('token', token);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('password_confirmation', password_confirmation);

        const response = await post('/reset-password', cookies, formData, { requireAuth: false });
        return toAuthResponse(response, 'Password reset successfully!');
    } catch (error) {
        console.error('Reset password error:', error);
        return {
            success: false,
            message: 'An error occurred'
        };
    }
}

/**
 * Resend email verification
 */
export async function resendVerification(cookies: Cookies): Promise<AuthResponse> {
    try {
        const response = await post('/email/verification-notification', cookies);
        return toAuthResponse(response, 'Verification email sent!');
    } catch (error) {
        console.error('Resend verification error:', error);
        return {
            success: false,
            message: 'An error occurred'
        };
    }
}

/**
 * Verify email with token
 */
export async function verifyEmail(
    id: string,
    hash: string,
    expires: string,
    signature: string,
    cookies: Cookies
): Promise<AuthResponse> {
    try {
        const queryParams = new URLSearchParams({ expires, signature });
        const endpoint = `/email/verify/${id}/${hash}?${queryParams.toString()}`;

        const response = await get(endpoint, cookies);

        if (response.ok) {
            return { success: true, message: 'Email verified successfully!' };
        }

        if (response.status === 403) {
            return {
                success: false,
                message: 'Invalid or expired verification link'
            };
        }

        return toAuthResponse(response);
    } catch (error) {
        console.error('Verify email error:', error);
        return {
            success: false,
            message: 'An error occurred'
        };
    }
}

// Re-export for backward compatibility
export { getCsrfToken };
