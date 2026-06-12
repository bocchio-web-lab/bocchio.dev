import type { EntryGenerator, PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { deliveryShowByType } from '$lib/sdk/cms';
import { CMS_TENANT_SLUG } from '$lib/constants';
import { processMarkdown } from '$lib/markdown';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { getOptimizedOgImage } from '$lib/utils/app';

export const prerender = true;

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
        },
        title: project.title,
        description: project.excerpt || '',
        keywords: (project.tags || []).join(', '),
        imageURL: getOptimizedOgImage(project.meta.headerImages?.[0])
    };
};

export const entries: EntryGenerator = async () => {
    try {
        const url = `${PUBLIC_API_BASE_URL}/cms/delivery/${CMS_TENANT_SLUG}/projects?per_page=100`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        const items = json?.data || [];
        return items.map((it) => ({ slug: it.slug }));
    } catch (err) {
        console.warn('entries(): failed to fetch projects for prerendering', err);
        return [];
    }
}
