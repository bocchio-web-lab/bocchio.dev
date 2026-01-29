// src/lib/utils/csrf.ts
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { COOKIES } from './constants';

/**
 * Get CSRF token from browser cookies
 */
export function getCsrfTokenFromCookies(): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find((c) => c.trim().startsWith(`${COOKIES.XSRF_TOKEN}=`));

    if (!xsrfCookie) return null;

    const token = xsrfCookie.split('=')[1];
    return token ? decodeURIComponent(token) : null;
}

/**
 * Initialize CSRF token from Laravel Sanctum
 */
export async function initializeCsrfToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
        const response = await fetch(`${PUBLIC_API_BASE_URL}/sanctum/csrf-cookie`, {
            credentials: 'include',
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
        return false;
    }
}
