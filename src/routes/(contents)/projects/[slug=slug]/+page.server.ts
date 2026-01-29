import type { PageServerLoad } from './$types';
import { httpClient } from '$lib/api/http';
import { CMS_TENANT_SLUG } from '$lib/api/constants';
import type { ContentItem } from '$lib/types/cms';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
    const response = await httpClient.get<{ data: ContentItem }>(
        `/api/content/cms/${CMS_TENANT_SLUG}/projects/${params.slug}`
    );

    if (!response.data) {
        throw error(404, 'Project not found');
    }

    return {
        project: response.data.data
    };
};