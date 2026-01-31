// src/lib/constants.ts

/**
 * Cookie and header constants shared across client and server
 */
export const COOKIES = {
    SESSION: 'backend_bocchio_session',
    XSRF_TOKEN: 'XSRF-TOKEN',
} as const;

export const HEADERS = {
    ACCEPT: 'Accept',
    CONTENT_TYPE: 'Content-Type',
    XSRF_TOKEN: 'X-XSRF-TOKEN',
    TENANT_ID: 'X-Tenant-ID',
    REFERER: 'Referer',
    COOKIE: 'Cookie',
} as const;

export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
} as const;

/**
 * CMS Configuration
 */
export const CMS_TENANT_SLUG = 'bocchios-portfolio-rn9aaw' as const;
