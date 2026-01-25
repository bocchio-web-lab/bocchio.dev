import type { PageServerLoad } from './$types';
import { PUBLIC_CMS_TENANT_SLUG } from '$env/static/public';
import { HttpClient } from '$lib/api/http-client';
import type { ContentItem, PaginatedResponse } from '$lib/types/cms';

export const load: PageServerLoad = async () => {
    const client = new HttpClient();

    const response = await client.get<PaginatedResponse<ContentItem>>(
        `/api/content/cms/${PUBLIC_CMS_TENANT_SLUG}/projects`
    );

    return {
        pagination: response.data
    };
};