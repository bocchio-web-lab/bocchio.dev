// src/routes/portals/cms/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ parent, cookies, fetch }) => {
    const { tenant } = await parent();

    const xsrfToken = cookies.get('XSRF-TOKEN');
    const sessionCookie = cookies.get('backend_bocchio_session');

    const headers = {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
        'X-Tenant-ID': tenant.id.toString(),
        'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
    };

    // Fetch content statistics
    const [postsRes, pagesRes, projectsRes, commentsRes, tagsRes] = await Promise.all([
        fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/content?type=post&status=published`, {
            credentials: 'include',
            headers
        }),
        fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/content?type=page&status=published`, {
            credentials: 'include',
            headers
        }),
        fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/content?type=project&status=published`, {
            credentials: 'include',
            headers
        }),
        fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/comments?approved=false`, {
            credentials: 'include',
            headers
        }),
        fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/tags`, {
            credentials: 'include',
            headers
        })
    ]);

    const posts = postsRes.ok ? await postsRes.json() : { total: 0 };
    const pages = pagesRes.ok ? await pagesRes.json() : { total: 0 };
    const projects = projectsRes.ok ? await projectsRes.json() : { total: 0 };
    const pendingComments = commentsRes.ok ? await commentsRes.json() : { total: 0 };
    const tags = tagsRes.ok ? await tagsRes.json() : { data: [] };

    // Fetch recent content
    const recentContentRes = await fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/content`, {
        credentials: 'include',
        headers
    });

    const recentContent = recentContentRes.ok
        ? (await recentContentRes.json()).data.slice(0, 5)
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
