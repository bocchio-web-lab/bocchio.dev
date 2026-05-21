import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { deliveryListByType } from '$lib/sdk/cms';
import { CMS_TENANT_SLUG } from '$lib/constants';
import { processMarkdown } from '$lib/markdown';

export const load: PageLoad = async ({ fetch }) => {

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

    // response.data.data.sort((a, b) => {
    //     if (a.slug === 'hello-world') return -1; // 'a' comes first
    //     if (b.slug === 'hello-world') return 1;  // 'b' comes first
    //     return 0; // No change for others
    // });

    // Process markdown for all posts
    const processedPosts = await Promise.all(
        data.data.map(async (post) => ({
            ...post,
            body: await processMarkdown(post.body)
        }))
    );

    return {
        pagination: {
            ...data,
            data: processedPosts
        }
    };
};

