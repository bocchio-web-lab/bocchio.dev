import type { Cookies } from '@sveltejs/kit';
import * as setCookie from 'set-cookie-parser';
import { PUBLIC_API_BASE_URL, PUBLIC_FRONTEND_URL } from '$env/static/public';
import { createClient as createIdentityClient } from '$lib/sdk/identity/client';
import { createClient as createPlatformClient } from '$lib/sdk/platform/client';
import { createClient as createCMSClient } from '$lib/sdk/cms/client';
import * as identityAPIs from '$lib/sdk/identity';
import * as platformAPIs from '$lib/sdk/platform';
import * as cmsAPIs from '$lib/sdk/cms';

/**
 * Cookie and header constants shared across client and server
 */
export const COOKIES = {
    SESSION: 'bocchios_api_session',
    XSRF_TOKEN: 'XSRF-TOKEN',
} as const;

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
            const response = await fetch(`${PUBLIC_API_BASE_URL}/identity/csrf-cookie`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Referer': PUBLIC_FRONTEND_URL
                }
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
                    httpOnly: cookie.httpOnly ?? false,
                    secure: cookie.secure ?? false,
                    sameSite: (cookie.sameSite as 'strict' | 'lax' | 'none') ?? 'lax',
                    maxAge: cookie.maxAge,
                    domain: cookie.domain,
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


// SDK implementation with support for multiple API clients (identity, platform, etc.)
const CLIENT_FACTORIES = {
    identity: {
        create: () => createIdentityClient({ baseUrl: `${PUBLIC_API_BASE_URL}/identity`, credentials: 'include' }),
        apis: identityAPIs,
    },
    platform: {
        create: () => createPlatformClient({ baseUrl: `${PUBLIC_API_BASE_URL}/platform`, credentials: 'include' }),
        apis: platformAPIs,
    },
    cms: {
        create: () => createCMSClient({ baseUrl: `${PUBLIC_API_BASE_URL}/cms`, credentials: 'include' }),
        apis: cmsAPIs,
    },
} as const;

type ClientType = keyof typeof CLIENT_FACTORIES;
type ClientInstance<T extends ClientType> = ReturnType<(typeof CLIENT_FACTORIES)[T]['create']>;
type APIs<T extends ClientType> = (typeof CLIENT_FACTORIES)[T]['apis'];

type APIFn = (options: { client?: unknown;[key: string]: unknown }) => unknown;
type BoundAPIs<T extends ClientType> = {
    [K in keyof APIs<T>]: APIs<T>[K] extends APIFn
    ? (options?: Omit<Parameters<APIs<T>[K]>[0], 'client'>) => ReturnType<APIs<T>[K]>
    : APIs<T>[K];
};

/**
 * Generic SDK class that manages API clients and cookie handling for server-side contexts.
 */
export class SDK<T extends ClientType> {
    private readonly _client: ClientInstance<T>;
    private readonly _cookieManager: CookieManager;

    constructor(cookies: Cookies, clientType: T) {
        this._client = CLIENT_FACTORIES[clientType].create() as ClientInstance<T>;
        this._cookieManager = new CookieManager(cookies);
        this.setupInterceptors();
        this.bindAPIs(CLIENT_FACTORIES[clientType].apis);
    }

    /**
     * The configured hey-api client
     */
    get client(): ClientInstance<T> {
        return this._client;
    }

    /**
     * The cookie manager instance
     */
    get cookieManager(): CookieManager {
        return this._cookieManager;
    }

    /**
     * Ensure that a valid CSRF token is present, initializing it if necessary
     */
    async ensureCsrf(): Promise<{ ok: true } | { ok: false; error: string }> {
        const tokenExists = !!this._cookieManager.getCsrfToken();
        if (tokenExists) {
            return { ok: true };
        }

        const tokenInitialized = await this._cookieManager.initializeCsrfToken();
        if (!tokenInitialized) {
            return { ok: false, error: 'Could not reach authentication service' };
        }

        return { ok: true };
    }

    /**
     * Set up request and response interceptors to handle cookies and CSRF tokens automatically
     * for all API calls made through this SDK instance.
     * Required for server-side usage to maintain session state with Laravel Sanctum.
     */
    private setupInterceptors(): void {
        this._client.interceptors.request.use((request) => {
            const xsrfToken = this._cookieManager.getCsrfToken();
            const sessionCookie = this._cookieManager.getSessionCookie();

            request.headers.set('Accept', 'application/json');
            request.headers.set('Referer', PUBLIC_FRONTEND_URL);

            if (xsrfToken) {
                request.headers.set('X-XSRF-TOKEN', xsrfToken);
            }

            if (sessionCookie && xsrfToken) {
                request.headers.set(
                    'Cookie',
                    `${COOKIES.SESSION}=${sessionCookie}; ${COOKIES.XSRF_TOKEN}=${xsrfToken}`,
                );
            }

            return request;
        });

        this._client.interceptors.response.use((response) => {
            this._cookieManager.parseCookiesFromResponse(response);
            return response;
        });
    }

    /**
     * Bind API functions from the client factory to this SDK instance, injecting the client automatically.
     */
    private bindAPIs(apis: Record<string, unknown>): void {
        for (const [name, fn] of Object.entries(apis)) {
            if (typeof fn !== 'function') continue;

            (this as Record<string, unknown>)[name] = (options: Record<string, unknown> = {}) =>
                fn({ ...options, client: this._client });
        }
    }
}


// Factory functions for creating SDK instances with specific clients
type SDKWithAPIs<T extends ClientType> = SDK<T> & BoundAPIs<T>;
export const createIdentitySdk = (cookies: Cookies) => new SDK(cookies, 'identity') as SDKWithAPIs<'identity'>;
export const createPlatformSdk = (cookies: Cookies) => new SDK(cookies, 'platform') as SDKWithAPIs<'platform'>;
export const createCmsSdk = (cookies: Cookies) => new SDK(cookies, 'cms') as SDKWithAPIs<'cms'>;