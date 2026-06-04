// src/routes/apps/cms/[slug]/content/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createCmsSdk } from '$lib/sdk.server';

export const load: PageServerLoad = async ({ parent, cookies, url }) => {
    const { tenant } = await parent();
    const sdk = createCmsSdk(cookies);

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

    const queryString = queryParams.toString();
    const endpoint = queryString
        ? `/api/manage/cms/content?${queryString}`
        : '/api/manage/cms/content';

    const query = Object.fromEntries(queryParams.entries());
    const response = await sdk.contentIndex({
        headers: { 'X-Tenant-ID': tenant.id.toString() },
        ...(Object.keys(query).length > 0 ? { query } : {}),
    } as any);

    if (response.error) {
        throw error(500, 'Failed to load content');
    }

    const contentData = response.data ?? { data: [], total: 0 };

    return {
        content: contentData.data || [],
        pagination: {
            currentPage: contentData.current_page || 1,
            perPage: contentData.per_page || 15,
            total: contentData.total || 0,
            lastPage: contentData.last_page || 1
        },
        filters: { type, status, title }
    };
};
