// src/routes/portals/cms/[slug]/tags/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { fail } from '@sveltejs/kit';

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

    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/tags`, {
        credentials: 'include',
        headers
    });

    const tags = response.ok ? (await response.json()).data : [];

    return { tags };
};

export const actions: Actions = {
    create: async ({ request, cookies, parent }) => {
        const { tenant } = await parent();
        const formData = await request.formData();

        const xsrfToken = cookies.get('XSRF-TOKEN');
        const sessionCookie = cookies.get('backend_bocchio_session');

        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;

        const payload: any = { name };
        if (slug) payload.slug = slug;

        const response = await fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/tags`, {
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
            const error = await response.json().catch(() => ({ message: 'Failed to create tag' }));
            return fail(response.status, { error: error.message || 'Failed to create tag' });
        }

        return { success: true, action: 'create' };
    },

    update: async ({ request, cookies, parent }) => {
        const { tenant } = await parent();
        const formData = await request.formData();

        const xsrfToken = cookies.get('XSRF-TOKEN');
        const sessionCookie = cookies.get('backend_bocchio_session');

        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;

        const payload: any = { name, slug };

        const response = await fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/tags/${id}`, {
            method: 'PUT',
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
            const error = await response.json().catch(() => ({ message: 'Failed to update tag' }));
            return fail(response.status, { error: error.message || 'Failed to update tag' });
        }

        return { success: true, action: 'update' };
    },

    delete: async ({ request, cookies, parent }) => {
        const { tenant } = await parent();
        const formData = await request.formData();

        const xsrfToken = cookies.get('XSRF-TOKEN');
        const sessionCookie = cookies.get('backend_bocchio_session');

        const id = formData.get('id') as string;

        const response = await fetch(`${PUBLIC_API_BASE_URL}/api/manage/cms/tags/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
                'X-Tenant-ID': tenant.id.toString(),
                'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to delete tag' }));
            return fail(response.status, { error: error.message || 'Failed to delete tag' });
        }

        return { success: true, action: 'delete' };
    }
};
