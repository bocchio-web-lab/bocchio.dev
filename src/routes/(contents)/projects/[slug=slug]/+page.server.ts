import type { PageServerLoad } from './$types';
import { httpClient } from '$lib/api/http';
import { CMS_TENANT_SLUG } from '$lib/api/constants';
import type { ProjectContentItem } from '$lib/types/cms';
import { error } from '@sveltejs/kit';
import { processMarkdown } from '$lib/markdown';

export const load: PageServerLoad = async ({ params }) => {
    const response = await httpClient.get<{ data: ProjectContentItem }>(
        `/api/content/cms/${CMS_TENANT_SLUG}/projects/${params.slug}`
    );

    if (!response.data) {
        throw error(404, 'Project not found');
    }

    const project = response.data.data;

    // Process markdown body with LaTeX support using mdsvex
    const processedBody = await processMarkdown(project.body);

    return {
        project: {
            ...project,
            body: processedBody
        }
    };
};