import type { PageServerLoad } from './$types';
import { PUBLIC_CMS_TENANT_SLUG } from '$env/static/public';
import { HttpClient } from '$lib/api/http-client';
import type { ContentItem } from '$lib/types/cms';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
    const client = new HttpClient();

    const response = await client.get<{ data: ContentItem }>(
        `/api/content/cms/${PUBLIC_CMS_TENANT_SLUG}/projects/${params.slug}`
    );

    if (!response.data) {
        throw error(404, 'Project not found');
    }

    return {
        project: response.data.data
    };
};