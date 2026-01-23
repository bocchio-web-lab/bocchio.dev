// src/routes/portals/cms/[slug]/comments/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent, cookies, fetch, url }) => {
    const { tenant } = await parent();

    const xsrfToken = cookies.get('XSRF-TOKEN');
    const sessionCookie = cookies.get('backend_bocchio_session');

    const headers = {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
        'X-Tenant-ID': tenant.id.toString(),
        'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
    };

    const approved = url.searchParams.get('approved');
    const page = url.searchParams.get('page') || '1';

    const queryParams = new URLSearchParams();
    if (approved !== null) queryParams.set('approved', approved);
    if (page !== '1') queryParams.set('page', page);

    const queryString = queryParams.toString();
    const endpoint = queryString
        ? `/api/manage/cms/comments?${queryString}`
        : '/api/manage/cms/comments';

    const response = await fetch(`${PUBLIC_API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers
    });

    const commentsData = response.ok ? await response.json() : { data: [], total: 0 };

    return {
        comments: commentsData.data || [],
        pagination: {
            currentPage: commentsData.current_page || 1,
            perPage: commentsData.per_page || 20,
            total: commentsData.total || 0,
            lastPage: commentsData.last_page || 1
        },
        filters: { approved }
    };
};

export const actions: Actions = {
    approve: async ({ request, cookies, parent }) => {
        const { tenant } = await parent();
        const formData = await request.formData();

        const xsrfToken = cookies.get('XSRF-TOKEN');
        const sessionCookie = cookies.get('backend_bocchio_session');

        const commentId = formData.get('comment_id') as string;

        const response = await fetch(
            `${PUBLIC_API_BASE_URL}/api/manage/cms/comments/${commentId}/approve`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
                    'X-Tenant-ID': tenant.id.toString(),
                    'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
                }
            }
        );

        if (!response.ok) {
            const error = await response
                .json()
                .catch(() => ({ message: 'Failed to approve comment' }));
            return fail(response.status, { error: error.message || 'Failed to approve comment' });
        }

        return { success: true, action: 'approve' };
    },

    reject: async ({ request, cookies, parent }) => {
        const { tenant } = await parent();
        const formData = await request.formData();

        const xsrfToken = cookies.get('XSRF-TOKEN');
        const sessionCookie = cookies.get('backend_bocchio_session');

        const commentId = formData.get('comment_id') as string;

        const response = await fetch(
            `${PUBLIC_API_BASE_URL}/api/manage/cms/comments/${commentId}/reject`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
                    'X-Tenant-ID': tenant.id.toString(),
                    'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
                }
            }
        );

        if (!response.ok) {
            const error = await response
                .json()
                .catch(() => ({ message: 'Failed to reject comment' }));
            return fail(response.status, { error: error.message || 'Failed to reject comment' });
        }

        return { success: true, action: 'reject' };
    },

    delete: async ({ request, cookies, parent }) => {
        const { tenant } = await parent();
        const formData = await request.formData();

        const xsrfToken = cookies.get('XSRF-TOKEN');
        const sessionCookie = cookies.get('backend_bocchio_session');

        const commentId = formData.get('comment_id') as string;

        const response = await fetch(
            `${PUBLIC_API_BASE_URL}/api/manage/cms/comments/${commentId}`,
            {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
                    'X-Tenant-ID': tenant.id.toString(),
                    'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
                }
            }
        );

        if (!response.ok) {
            const error = await response
                .json()
                .catch(() => ({ message: 'Failed to delete comment' }));
            return fail(response.status, { error: error.message || 'Failed to delete comment' });
        }

        return { success: true, action: 'delete' };
    }
};
