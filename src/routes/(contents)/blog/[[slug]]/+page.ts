import type { EntryGenerator, PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { deliveryListByType } from '$lib/sdk/cms';
import { CMS_TENANT_SLUG } from '$lib/constants';
import { processMarkdown } from '$lib/markdown';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { getOptimizedOgImage } from '$lib/utils/app';

export const prerender = true;

function stripHtml(input: string) {
    return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function makeExcerpt(input: string, length = 200) {
    const text = stripHtml(input);
    const excerpt = text.slice(0, Math.min(text.length, length)).trimEnd() + '...';
    return `<p>${excerpt}</p>`;
}

export const load: PageLoad = async ({ params, fetch }) => {
    const { data, error: err } = await deliveryListByType({
        path: {
            tenant_slug: CMS_TENANT_SLUG,
            type: 'posts'
        },
        fetch: fetch
    });

    if (err) {
        console.error('API Error:', err);
        throw error(500, 'Failed to load posts');
    }

    if (!data || !data.data) {
        throw error(404, 'Posts not found');
    }

    const processedPosts = await Promise.all(
        data.data.map(async (post) => {
            const body = await processMarkdown(post.body);

            return {
                ...post,
                body,
                excerpt: post.excerpt?.trim() || makeExcerpt(body)
            };
        })
    );

    const activeSlug = params.slug ?? null;
    const activePost = activeSlug
        ? processedPosts.find((post) => post.slug === activeSlug)
        : null;

    if (activeSlug && !activePost) {
        throw error(404, 'Post not found');
    }

    return {
        pagination: {
            ...data,
            data: processedPosts
        },
        activeSlug,
        title: activePost?.title || 'Blog',
        description:
            stripHtml(activePost?.excerpt ||
                'Personal adventures and life experiences, shared through my blog.'),
        keywords: activePost
            ? (activePost.tags || []).map((tag) => tag.name).join(', ')
            : 'blog, personal, adventures, life experiences, mechatronics, robotics',
        imageURL: getOptimizedOgImage(activePost?.meta?.headerImages?.[0])
    };
};


export const entries: EntryGenerator = async () => {
    try {
        const url = `${PUBLIC_API_BASE_URL}/cms/delivery/${CMS_TENANT_SLUG}/posts?per_page=100`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        const items = json?.data || [];
        return items.map((it) => ({ slug: it.slug }));
    } catch (err) {
        console.warn('entries(): failed to fetch blog posts for prerendering', err);
        return [];
    }
}
