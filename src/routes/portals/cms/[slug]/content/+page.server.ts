// src/routes/portals/cms/[slug]/content/+page.server.ts
import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ parent, cookies, fetch, url }) => {
    const { tenant } = await parent();

    const xsrfToken = cookies.get('XSRF-TOKEN');
    const sessionCookie = cookies.get('backend_bocchio_session');

    const headers = {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
        'X-Tenant-ID': tenant.id.toString(),
        'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
    };

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

    const response = await fetch(`${PUBLIC_API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers
    });

    const contentData = response.ok ? await response.json() : { data: [], total: 0 };

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
