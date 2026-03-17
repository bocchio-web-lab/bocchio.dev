import type { PageServerLoad } from './$types';
import { httpClient } from '$lib/api/http';
import { CMS_TENANT_SLUG } from '$lib/api/constants';
import type { ContentItem, PaginatedResponse } from '$lib/types/cms';

export const load: PageServerLoad = async ({ url }) => {

    // Get filter params from URL
    const page = url.searchParams.get('page') || '1';

    // Build query string
    const queryParams = new URLSearchParams();
    if (page !== '1') queryParams.set('page', page);

    const queryString = queryParams.toString();
    const endpoint = queryString
        ? `/api/content/cms/${CMS_TENANT_SLUG}/projects?${queryString}`
        : `/api/content/cms/${CMS_TENANT_SLUG}/projects`;

    const response = await httpClient.get<PaginatedResponse<ContentItem>>(
        endpoint
    );

    return {
        pagination: response.data
    };
};