import type { PageServerLoad } from './$types';
import { createCmsSdk } from '$lib/sdk.server';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant, userRole } = await parent();
    const sdk = createCmsSdk(cookies);
    const headers = { 'X-Tenant-ID': tenant.id.toString() };

    const [contentResult, tagsResult, commentsResult] = await Promise.all([
        sdk.contentIndex({ headers } as any),
        sdk.tagsIndex({ headers } as any),
        sdk.commentModerationIndex({ headers } as any),
    ]);

    const content = contentResult.data?.data ?? [];
    const tags = tagsResult.data?.data ?? [];
    const comments = commentsResult.data?.data ?? [];

    return {
        stats: {
            published: content.filter((item: any) => item.status === 'published').length,
            drafts: content.filter((item: any) => item.status === 'draft').length,
            pages: content.filter((item: any) => item.type === 'page').length,
            tags: tags.length,
            pendingComments: comments.filter((item: any) => item.approved === false).length,
        },
        recentContent: content.slice(0, 5),
        recentComments: comments.slice(0, 5),
    };
};