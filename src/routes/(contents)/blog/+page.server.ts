import type { PageServerLoad } from './$types';
import { httpClient } from '$lib/api/http';
import { CMS_TENANT_SLUG } from '$lib/api/constants';
import type { ContentItem, PaginatedResponse } from '$lib/types/cms';
import { processMarkdown } from '$lib/markdown';

export const load: PageServerLoad = async ({ setHeaders }) => {

    setHeaders({
        'Cache-Control': 'max-age=60, s-maxage=300'
    });

    const response = await httpClient.get<PaginatedResponse<ContentItem>>(
        `/api/content/cms/${CMS_TENANT_SLUG}/posts`
    );

    if (!response.data) {
        return { pagination: null };
    }

    // response.data.data.sort((a, b) => {
    //     if (a.slug === 'hello-world') return -1; // 'a' comes first
    //     if (b.slug === 'hello-world') return 1;  // 'b' comes first
    //     return 0; // No change for others
    // });

    // Process markdown for all posts
    const processedPosts = await Promise.all(
        response.data.data.map(async (post) => ({
            ...post,
            body: await processMarkdown(post.body)
        }))
    );

    return {
        pagination: {
            ...response.data,
            data: processedPosts
        }
    };
};

