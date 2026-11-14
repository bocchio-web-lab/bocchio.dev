// src/routes/portals/cms/[tenantId=Id]/content/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createCmsSdk } from '$lib/sdk.server';

export const load: PageServerLoad = async ({ parent, cookies, url }) => {
    const { tenant } = await parent();
    const sdk = createCmsSdk(cookies);
    const headers = { 'X-Tenant-ID': tenant.id.toString() };

    // Get filter params from URL
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const title = url.searchParams.get('title') || '';
    const page = url.searchParams.get('page') || '1';

    // Build query string
    const queryParams = new URLSearchParams();
    if (type) queryParams.set('type', type);
    if (status) queryParams.set('status', status);
    if (title) queryParams.set('title', title);
    if (page !== '1') queryParams.set('page', page);

    const query = Object.fromEntries(queryParams.entries());
    const response = await sdk.contentIndex({
        headers,
        ...(Object.keys(query).length > 0 ? { query } : {}),
    } as any);

    if (response.error) {
        throw error(500, 'Failed to load content');
    }

    const contentData = response.data ?? { data: [], total: 0 };
    const content = contentData.data || [];

    // The types for the filter are the ones of all the content, not of the items of this page: these are only the ones
    // that pass the filters (and one page of them), so a filter would lose its own options as soon as it is used.
    // (The endpoint is called by its path, so that it works without making the SDK again; an API that does not have it
    // yet gives the types of this page, as before)
    let types: string[] = [];
    try {
        const reply = await sdk.client.get({ url: '/manage/content/types', headers });
        const list = (reply.data as { data?: unknown } | undefined)?.data;
        if (Array.isArray(list)) types = list.filter((item): item is string => typeof item === 'string' && item !== '');
    } catch {
        // see above
    }
    if (types.length === 0) types = content.map((item: { type?: string | null }) => item.type ?? '').filter(Boolean);
    if (type) types.push(type);
    types = [...new Set(types)].sort((a, b) => a.localeCompare(b));

    return {
        content,
        types,
        pagination: {
            currentPage: contentData.current_page || 1,
            perPage: contentData.per_page || 15,
            total: contentData.total || 0,
            lastPage: contentData.last_page || 1
        },
        filters: { type, status, title }
    };
};
