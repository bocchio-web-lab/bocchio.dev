// src/lib/server/auth.ts
import { redirect, type Cookies } from '@sveltejs/kit';
import * as setCookie from 'set-cookie-parser';
import { PUBLIC_API_BASE_URL, PUBLIC_FRONTEND_URL } from '$env/static/public';

const SESSION_COOKIE_NAME: string = 'backend_bocchio_session';
const XSRF_TOKEN_NAME: string = 'XSRF-TOKEN';

export interface AuthResponse {
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
}

/**
 * Get CSRF token from Laravel Sanctum
 */
export async function getCsrfToken(cookies: Cookies): Promise<boolean> {
    try {
        const response = await fetch(`${PUBLIC_API_BASE_URL}/sanctum/csrf-cookie`, {
            credentials: 'include'
        });

        if (!response.ok) {
            return false;
        }

        // Handle multiple Set-Cookie headers
        const setCookieHeaders = response.headers.getSetCookie?.() || [];

        if (setCookieHeaders.length === 0) {
            const singleHeader = response.headers.get('set-cookie');
            if (singleHeader) {
                setCookieHeaders.push(singleHeader);
            }
        }

        if (setCookieHeaders.length === 0) {
            console.error('No Set-Cookie headers received');
            return false;
        }

        setCookieHeaders.forEach(headerValue => {
            const parsedCookies = setCookie.parse(headerValue, {
                decodeValues: true
            });

            parsedCookies.forEach((cookie) => {
                cookies.set(cookie.name, cookie.value, {
                    path: cookie.path || '/',
                    httpOnly: false, // Cannot set httpOnly from server-side JS
                    secure: cookie.secure ?? false,
                    sameSite: (cookie.sameSite as 'strict' | 'lax' | 'none') ?? 'lax',
                    maxAge: cookie.maxAge
                });
            });
        });

        return true;
    } catch (error) {
        console.error('Failed to get CSRF token:', error);
        return false;
    }
}

/**
 * Make authenticated request to Laravel backend
 */
async function makeAuthRequest(
    endpoint: string,
    method: string,
    cookies: Cookies,
    body?: FormData
): Promise<Response> {
    const xsrfToken = cookies.get(XSRF_TOKEN_NAME);
    const sessionCookie = cookies.get(SESSION_COOKIE_NAME);

    if (!xsrfToken || !sessionCookie) {
        return new Response(null, { status: 401 });
    }

    const response = await fetch(`${PUBLIC_API_BASE_URL}${endpoint}`, {
        method,
        body,
        credentials: 'include',
        headers: {
            'X-XSRF-TOKEN': decodeURIComponent(xsrfToken),
            'Accept': 'application/json',
            'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}; ${XSRF_TOKEN_NAME}=${xsrfToken}`,
            'Referer': PUBLIC_FRONTEND_URL
        }
    });

    // Update cookies from response
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    if (setCookieHeaders.length === 0) {
        const singleHeader = response.headers.get('set-cookie');
        if (singleHeader) {
            setCookieHeaders.push(singleHeader);
        }
    }

    setCookieHeaders.forEach(headerValue => {
        const parsedCookies = setCookie.parse(headerValue, {
            decodeValues: true
        });

        parsedCookies.forEach((cookie) => {
            cookies.set(cookie.name, cookie.value, {
                path: cookie.path || '/',
                httpOnly: false,
                secure: cookie.secure ?? false,
                sameSite: (cookie.sameSite as 'strict' | 'lax' | 'none') ?? 'lax',
                maxAge: cookie.maxAge
            });
        });
    });

    return response;
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

        const response = await makeAuthRequest('/login', 'POST', cookies, formData);

        if (response.ok) {
            return { success: true };
        }

        // Handle validation errors
        if (response.status === 422) {
            const data = await response.json();
            return {
                success: false,
                message: 'Validation failed',
                errors: data.errors
            };
        }

        return {
            success: false,
            message: response.statusText || 'Login failed'
        };
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

        const response = await makeAuthRequest('/register', 'POST', cookies, formData);

        if (response.ok) {
            return { success: true };
        }

        // Handle validation errors
        if (response.status === 422) {
            const data = await response.json();
            return {
                success: false,
                message: 'Validation failed',
                errors: data.errors
            };
        }

        return {
            success: false,
            message: response.statusText || 'Registration failed'
        };
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
        await makeAuthRequest('/logout', 'POST', cookies);
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
        const response = await makeAuthRequest('/api/user', 'GET', cookies);

        if (response.ok) {
            return await response.json();
        }

        return null;
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
export async function forgotPassword(
    email: string,
    cookies: Cookies
): Promise<AuthResponse> {
    try {
        const csrfSuccess = await getCsrfToken(cookies);
        if (!csrfSuccess) {
            return { success: false, message: 'Failed to initialize session' };
        }

        const formData = new FormData();
        formData.append('email', email);

        const response = await makeAuthRequest('/forgot-password', 'POST', cookies, formData);

        if (response.ok) {
            const data = await response.json();
            return { success: true, message: data.message || 'Password reset link sent!' };
        }

        if (response.status === 422) {
            const data = await response.json();
            return {
                success: false,
                message: 'Validation failed',
                errors: data.errors
            };
        }

        return {
            success: false,
            message: response.statusText || 'Failed to send reset link'
        };
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

        const response = await makeAuthRequest('/reset-password', 'POST', cookies, formData);

        if (response.ok) {
            const data = await response.json();
            return { success: true, message: data.message || 'Password reset successfully!' };
        }

        if (response.status === 422) {
            const data = await response.json();
            return {
                success: false,
                message: 'Validation failed',
                errors: data.errors
            };
        }

        return {
            success: false,
            message: response.statusText || 'Failed to reset password'
        };
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
        const response = await makeAuthRequest('/email/verification-notification', 'POST', cookies);

        if (response.ok) {
            const data = await response.json();
            return { success: true, message: data.message || 'Verification email sent!' };
        }

        return {
            success: false,
            message: response.statusText || 'Failed to send verification email'
        };
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

        const response = await makeAuthRequest(endpoint, 'GET', cookies);

        if (response.ok) {
            return { success: true, message: 'Email verified successfully!' };
        }

        if (response.status === 403) {
            return {
                success: false,
                message: 'Invalid or expired verification link'
            };
        }

        return {
            success: false,
            message: response.statusText || 'Failed to verify email'
        };
    } catch (error) {
        console.error('Verify email error:', error);
        return {
            success: false,
            message: 'An error occurred'
        };
    }
}