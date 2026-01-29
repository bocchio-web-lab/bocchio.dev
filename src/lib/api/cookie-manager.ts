// src/lib/server/utils/cookie-manager.ts
import type { Cookies } from '@sveltejs/kit';
import * as setCookie from 'set-cookie-parser';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { COOKIES } from './constants';

/**
 * Server-side cookie management utility
 */
export class CookieManager {
    constructor(private cookies: Cookies) { }

    /**
     * Get CSRF token from cookies
     */
    getCsrfToken(): string | null {
        const token = this.cookies.get(COOKIES.XSRF_TOKEN);
        return token ? decodeURIComponent(token) : null;
    }

    /**
     * Get session cookie
     */
    getSessionCookie(): string | null {
        return this.cookies.get(COOKIES.SESSION) || null;
    }

    /**
     * Check if user has valid session cookies
     */
    hasValidSession(): boolean {
        return !!(this.getCsrfToken() && this.getSessionCookie());
    }

    /**
     * Initialize CSRF token from Laravel Sanctum
     */
    async initializeCsrfToken(): Promise<boolean> {
        try {
            const response = await fetch(`${PUBLIC_API_BASE_URL}/sanctum/csrf-cookie`, {
                credentials: 'include',
            });

            if (!response.ok) return false;

            this.parseCookiesFromResponse(response);
            return true;
        } catch (error) {
            console.error('Failed to initialize CSRF token:', error);
            return false;
        }
    }

    /**
     * Parse and set cookies from API response
     */
    parseCookiesFromResponse(response: Response): void {
        const setCookieHeaders = this.extractSetCookieHeaders(response);

        setCookieHeaders.forEach((headerValue) => {
            const parsedCookies = setCookie.parse(headerValue, { decodeValues: true });

            parsedCookies.forEach((cookie) => {
                this.cookies.set(cookie.name, cookie.value, {
                    path: cookie.path || '/',
                    httpOnly: false,
                    secure: cookie.secure ?? false,
                    sameSite: (cookie.sameSite as 'strict' | 'lax' | 'none') ?? 'lax',
                    maxAge: cookie.maxAge,
                });
            });
        });
    }

    /**
     * Extract Set-Cookie headers from response
     */
    private extractSetCookieHeaders(response: Response): string[] {
        const headers = response.headers.getSetCookie?.() || [];

        if (headers.length === 0) {
            const singleHeader = response.headers.get('set-cookie');
            if (singleHeader) {
                headers.push(singleHeader);
            }
        }

        return headers;
    }

    /**
     * Build cookie header string for requests
     */
    buildCookieHeader(): string | null {
        const xsrfToken = this.cookies.get(COOKIES.XSRF_TOKEN);
        const sessionCookie = this.cookies.get(COOKIES.SESSION);

        if (!xsrfToken || !sessionCookie) return null;

        return `${COOKIES.SESSION}=${sessionCookie}; ${COOKIES.XSRF_TOKEN}=${xsrfToken}`;
    }

    /**
     * Clear all authentication cookies
     */
    clearAuthCookies(): void {
        this.cookies.delete(COOKIES.XSRF_TOKEN, { path: '/' });
        this.cookies.delete(COOKIES.SESSION, { path: '/' });
    }
}
