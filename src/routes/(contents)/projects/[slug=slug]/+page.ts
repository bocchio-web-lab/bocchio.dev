import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { deliveryShowByType } from '$lib/sdk/cms';
import { CMS_TENANT_SLUG } from '$lib/constants';
import { processMarkdown } from '$lib/markdown';

export const load: PageLoad = async ({ params, fetch }) => {

    const { data, error: err } = await deliveryShowByType({
        path: {
            tenant_slug: CMS_TENANT_SLUG,
            type: 'projects',
            item_slug: params.slug
        },
        fetch: fetch
    });

    if (err) {
        console.error('API Error:', err);
        throw error(500, 'Failed to load project');
    }

    if (!data) {
        throw error(404, 'Project not found');
    }

    const project = data.data;

    // Process markdown body with LaTeX support using mdsvex
    const processedBody = await processMarkdown(project.body);

    return {
        project: {
            ...project,
            body: processedBody
        }
    };
};