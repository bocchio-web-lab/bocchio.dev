// src/routes/portals/cms/[slug]/content/new/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent, cookies, fetch }) => {
    const { tenant } = await parent();

    const xsrfToken = cookies.get('XSRF-TOKEN');
    const sessionCookie = cookies.get('backend_bocchio_session');

    // Fetch available tags
    const tagsResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/tags`, {
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
            'X-Tenant-ID': tenant.id.toString(),
            'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
        }
    });

    const tags = tagsResponse.ok ? (await tagsResponse.json()).data : [];

    return { tags };
};

export const actions: Actions = {
    default: async ({ request, cookies, params, parent }) => {
        const { tenant } = await parent();
        const formData = await request.formData();

        const xsrfToken = cookies.get('XSRF-TOKEN');
        const sessionCookie = cookies.get('backend_bocchio_session');

        const type = formData.get('type') as string;
        const title = formData.get('title') as string;
        const slug = formData.get('slug') as string;
        const excerpt = formData.get('excerpt') as string;
        const body = formData.get('body') as string;
        const status = formData.get('status') as string;
        const published_at = formData.get('published_at') as string;
        const tags = formData.getAll('tags').map(Number);

        const payload: any = {
            type,
            title,
            body,
            status: status || 'draft'
        };

        if (slug) payload.slug = slug;
        if (excerpt) payload.excerpt = excerpt;
        if (published_at) payload.published_at = published_at;
        if (tags.length > 0) payload.tags = tags;

        const response = await fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/content`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
                'X-Tenant-ID': tenant.id.toString(),
                'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to create content' }));
            return fail(response.status, { error: error.message || 'Failed to create content' });
        }

        const result = await response.json();
        throw redirect(303, `/portals/cms/${params.slug}/content/${result.data.id}`);
    }
};
