// src/lib/server/http-server.ts
import type { Cookies } from '@sveltejs/kit';
import * as setCookie from 'set-cookie-parser';
import { PUBLIC_API_BASE_URL, PUBLIC_FRONTEND_URL } from '$env/static/public';

const SESSION_COOKIE_NAME = 'backend_bocchio_session';
const XSRF_TOKEN_NAME = 'XSRF-TOKEN';

export interface ServerHttpResponse<T = any> {
    ok: boolean;
    status: number;
    data?: T;
    error?: {
        message: string;
        errors?: Record<string, string[]>;
    };
}

/**
 * Get CSRF token from Laravel Sanctum (server-side)
 */
export async function getCsrfToken(cookies: Cookies): Promise<boolean> {
    try {
        const response = await fetch(`${PUBLIC_API_BASE_URL}/sanctum/csrf-cookie`, {
            credentials: 'include'
        });

        if (!response.ok) {
            return false;
        }

        // Handle Set-Cookie headers
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

        setCookieHeaders.forEach((headerValue) => {
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

        return true;
    } catch (error) {
        console.error('Failed to get CSRF token:', error);
        return false;
    }
}

/**
 * Update cookies from API response
 */
function updateCookiesFromResponse(response: Response, cookies: Cookies): void {
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    if (setCookieHeaders.length === 0) {
        const singleHeader = response.headers.get('set-cookie');
        if (singleHeader) {
            setCookieHeaders.push(singleHeader);
        }
    }

    setCookieHeaders.forEach((headerValue) => {
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
}

/**
 * Build authenticated request headers
 */
function buildAuthHeaders(
    cookies: Cookies,
    customHeaders?: Record<string, string>
): Record<string, string> {
    const xsrfToken = cookies.get(XSRF_TOKEN_NAME);
    const sessionCookie = cookies.get(SESSION_COOKIE_NAME);

    const headers: Record<string, string> = {
        Accept: 'application/json',
        Referer: PUBLIC_FRONTEND_URL,
        ...customHeaders
    };

    if (xsrfToken && sessionCookie) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
        headers['Cookie'] = `${SESSION_COOKIE_NAME}=${sessionCookie}; ${XSRF_TOKEN_NAME}=${xsrfToken}`;
    }

    return headers;
}

/**
 * Make authenticated HTTP request (server-side)
 */
export async function makeAuthRequest<T = any>(
    endpoint: string,
    method: string,
    cookies: Cookies,
    options: {
        body?: FormData | string;
        headers?: Record<string, string>;
        requireAuth?: boolean;
    } = {}
): Promise<ServerHttpResponse<T>> {
    const { body, headers: customHeaders, requireAuth = true } = options;

    // Check authentication if required
    const xsrfToken = cookies.get(XSRF_TOKEN_NAME);
    const sessionCookie = cookies.get(SESSION_COOKIE_NAME);

    if (requireAuth && (!xsrfToken || !sessionCookie)) {
        return {
            ok: false,
            status: 401,
            error: { message: 'Unauthorized' }
        };
    }

    try {
        const headers = buildAuthHeaders(cookies, customHeaders);

        const response = await fetch(`${PUBLIC_API_BASE_URL}${endpoint}`, {
            method,
            body,
            credentials: 'include',
            headers
        });

        // Update cookies from response
        updateCookiesFromResponse(response, cookies);

        // Parse response
        if (response.ok) {
            const data = await response.json().catch(() => null);
            return {
                ok: true,
                status: response.status,
                data
            };
        }

        // Handle errors
        const errorData = await response.json().catch(() => ({
            message: response.statusText
        }));

        return {
            ok: false,
            status: response.status,
            error: errorData
        };
    } catch (error) {
        console.error('Server HTTP request failed:', error);
        return {
            ok: false,
            status: 500,
            error: {
                message: error instanceof Error ? error.message : 'Network error'
            }
        };
    }
}

/**
 * Make authenticated GET request
 */
export async function get<T = any>(
    endpoint: string,
    cookies: Cookies,
    options?: { headers?: Record<string, string>; requireAuth?: boolean }
): Promise<ServerHttpResponse<T>> {
    return makeAuthRequest<T>(endpoint, 'GET', cookies, options);
}

/**
 * Make authenticated POST request
 */
export async function post<T = any>(
    endpoint: string,
    cookies: Cookies,
    body?: FormData | Record<string, any>,
    options?: { headers?: Record<string, string>; requireAuth?: boolean }
): Promise<ServerHttpResponse<T>> {
    let requestBody: FormData | string | undefined;
    let headers = options?.headers || {};

    if (body instanceof FormData) {
        requestBody = body;
    } else if (body) {
        requestBody = JSON.stringify(body);
        headers = { 'Content-Type': 'application/json', ...headers };
    }

    return makeAuthRequest<T>(endpoint, 'POST', cookies, {
        body: requestBody,
        headers,
        requireAuth: options?.requireAuth
    });
}

/**
 * Make authenticated PUT request
 */
export async function put<T = any>(
    endpoint: string,
    cookies: Cookies,
    body?: Record<string, any>,
    options?: { headers?: Record<string, string>; requireAuth?: boolean }
): Promise<ServerHttpResponse<T>> {
    const headers = { 'Content-Type': 'application/json', ...options?.headers };

    return makeAuthRequest<T>(endpoint, 'PUT', cookies, {
        body: body ? JSON.stringify(body) : undefined,
        headers,
        requireAuth: options?.requireAuth
    });
}

/**
 * Make authenticated DELETE request
 */
export async function del<T = any>(
    endpoint: string,
    cookies: Cookies,
    options?: { headers?: Record<string, string>; requireAuth?: boolean }
): Promise<ServerHttpResponse<T>> {
    return makeAuthRequest<T>(endpoint, 'DELETE', cookies, options);
}
