import type { PageServerLoad } from './$types';
import { httpClient } from '$lib/api/http';
import { CMS_TENANT_SLUG } from '$lib/api/constants';
import type { ContentItem, PaginatedResponse } from '$lib/types/cms';

export const load: PageServerLoad = async () => {
    const response = await httpClient.get<PaginatedResponse<ContentItem>>(
        `/api/content/cms/${CMS_TENANT_SLUG}/apps`
    );

    return {
        pagination: response.data
    };
};
