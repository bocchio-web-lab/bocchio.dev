// src/routes/portals/cms/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { get } from '$lib/server/http-server';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();

    const tenantId = tenant.id.toString();

    // Fetch content statistics
    const [postsRes, pagesRes, projectsRes, commentsRes, tagsRes] = await Promise.all([
        get('/api/manage/cms/content?type=post&status=published', cookies, {
            headers: { 'X-Tenant-ID': tenantId }
        }),
        get('/api/manage/cms/content?type=page&status=published', cookies, {
            headers: { 'X-Tenant-ID': tenantId }
        }),
        get('/api/manage/cms/content?type=project&status=published', cookies, {
            headers: { 'X-Tenant-ID': tenantId }
        }),
        get('/api/manage/cms/comments?approved=false', cookies, {
            headers: { 'X-Tenant-ID': tenantId }
        }),
        get('/api/manage/cms/tags', cookies, {
            headers: { 'X-Tenant-ID': tenantId }
        })
    ]);

    const posts = postsRes.ok ? postsRes.data : { total: 0 };
    const pages = pagesRes.ok ? pagesRes.data : { total: 0 };
    const projects = projectsRes.ok ? projectsRes.data : { total: 0 };
    const pendingComments = commentsRes.ok ? commentsRes.data : { total: 0 };
    const tags = tagsRes.ok ? tagsRes.data : { data: [] };

    // Fetch recent content
    const recentContentRes = await get('/api/manage/cms/content', cookies, {
        headers: { 'X-Tenant-ID': tenantId }
    });

    const recentContent = recentContentRes.ok
        ? recentContentRes.data.data.slice(0, 5)
        : [];

    return {
        stats: {
            postsCount: posts.total || 0,
            pagesCount: pages.total || 0,
            projectsCount: projects.total || 0,
            pendingCommentsCount: pendingComments.total || 0,
            tagsCount: tags.data?.length || 0
        },
        recentContent
    };
};
