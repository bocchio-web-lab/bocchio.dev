// src/routes/portals/cms/[slug]/content/+page.server.ts
import type { PageServerLoad } from './$types';
import { get } from '$lib/server/http-server';

export const load: PageServerLoad = async ({ parent, cookies, url }) => {
    const { tenant } = await parent();

    // Get filter params from URL
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const page = url.searchParams.get('page') || '1';

    // Build query string
    const queryParams = new URLSearchParams();
    if (type) queryParams.set('type', type);
    if (status) queryParams.set('status', status);
    if (page !== '1') queryParams.set('page', page);

    const queryString = queryParams.toString();
    const endpoint = queryString
        ? `/api/manage/cms/content?${queryString}`
        : '/api/manage/cms/content';

    const response = await get(endpoint, cookies, {
        headers: { 'X-Tenant-ID': tenant.id.toString() }
    });

    const contentData = response.ok ? response.data : { data: [], total: 0 };

    return {
        content: contentData.data || [],
        pagination: {
            currentPage: contentData.current_page || 1,
            perPage: contentData.per_page || 15,
            total: contentData.total || 0,
            lastPage: contentData.last_page || 1
        },
        filters: { type, status }
    };
};
