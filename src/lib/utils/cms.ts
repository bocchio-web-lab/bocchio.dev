import { error } from '@sveltejs/kit';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { CMS_TENANT_SLUG } from '$lib/constants';
import { processMarkdown } from '$lib/markdown';
import { deliveryShowByType } from '$lib/sdk/cms';
import { getOptimizedOgImage } from '$lib/utils/app';

/**
 * The page of an app, from its entry in the CMS. The slug of the entry is the name of the folder of the page, in
 * `src/routes/(contents)/apps/`: the one that the list of the apps links to.
 *
 * The title and the subtitle are the ones of the list, the body is the text under the app, written in markdown.
 */
export async function loadApp(slug: string, fetch: typeof globalThis.fetch, url: URL) {
    const { data, error: failure, response } = await deliveryShowByType({
        path: { tenant_slug: CMS_TENANT_SLUG, type: 'apps', item_slug: slug },
        fetch,
    });

    if (response?.status === 404) throw error(404, 'App not found');

    if (failure || !data) {
        console.error('API Error:', failure);
        throw error(500, 'Failed to load the app');
    }

    // The generated types do not know about the tags and about what is in `meta`
    const app = data.data as typeof data.data & { tags?: { name: string }[]; meta: { headerImages?: string[] } | null };
    const images = app.meta?.headerImages ?? [];

    // An animation is nice on the list but not on a card of a social network: the first picture that stands still is used
    const picture = images.find((image) => !image.endsWith('.gif')) ?? images[0];

    return {
        app: { title: app.title, subtitle: app.excerpt ?? '', body: await processMarkdown(app.body) },
        title: app.title,
        description: app.excerpt ?? '',
        keywords: (app.tags ?? []).map((tag) => tag.name).join(', '),
        imageURL: getOptimizedOgImage(picture && new URL(picture, url.origin).href),
        // The parameters of the address (a picture to load, a room to join) are for the visitor: search engines get a single page
        canonical: `${url.origin}${url.pathname}`,
    };
}

/** The slugs of the published items of a type (`apps`, `projects`, `posts`), or none if the CMS cannot be reached. */
export async function listSlugs(type: string, fetch: typeof globalThis.fetch = globalThis.fetch): Promise<string[]> {
    try {
        const response = await fetch(`${PUBLIC_API_BASE_URL}/cms/delivery/${CMS_TENANT_SLUG}/${type}?per_page=100`);

        if (!response.ok) return [];

        const json = await response.json();

        return (json?.data ?? []).map((item: { slug: string }) => item.slug);
    } catch (err) {
        console.warn(`failed to fetch the ${type} of the CMS`, err);
        return [];
    }
}
