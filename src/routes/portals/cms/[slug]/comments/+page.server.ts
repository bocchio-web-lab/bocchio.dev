// src/routes/portals/cms/[slug]/comments/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { createServerHttpClient } from '$lib/api/http.server';
import { fail } from '@sveltejs/kit';

// Helper function to get tenant by slug
async function getTenantBySlug(cookies: any, slug: string) {
    const httpClient = createServerHttpClient(cookies);
    const tenantsResponse = await httpClient.get('/api/manage/tenants');
    if (!tenantsResponse.ok) return null;
    const tenants = tenantsResponse.data.data;
    return tenants.find((t: any) => t.public_slug === slug);
}

export const load: PageServerLoad = async ({ parent, cookies, url }) => {
    const { tenant } = await parent();
    const httpClient = createServerHttpClient(cookies);

    const approved = url.searchParams.get('approved');
    const page = url.searchParams.get('page') || '1';

    const queryParams = new URLSearchParams();
    if (approved !== null) queryParams.set('approved', approved);
    if (page !== '1') queryParams.set('page', page);

    const queryString = queryParams.toString();
    const endpoint = queryString
        ? `/api/manage/cms/comments?${queryString}`
        : '/api/manage/cms/comments';

    const response = await httpClient.get(endpoint, {
        headers: { 'X-Tenant-ID': tenant.id.toString() }
    });

    const commentsData = response.ok ? response.data : { data: [], total: 0 };

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
    approve: async ({ request, cookies, params }) => {
        const tenant = await getTenantBySlug(cookies, params.slug);
        if (!tenant) return fail(404, { error: 'Tenant not found' });

        const httpClient = createServerHttpClient(cookies);
        const formData = await request.formData();

        const commentId = formData.get('comment_id') as string;

        const response = await httpClient.post(
            `/api/manage/cms/comments/${commentId}/approve`,
            undefined,
            { headers: { 'X-Tenant-ID': tenant.id.toString() } }
        );

        if (!response.ok) {
            return fail(response.status, {
                error: response.error?.message || 'Failed to approve comment'
            });
        }

        return { success: true, action: 'approve' };
    },

    reject: async ({ request, cookies, params }) => {
        const tenant = await getTenantBySlug(cookies, params.slug);
        if (!tenant) return fail(404, { error: 'Tenant not found' });

        const httpClient = createServerHttpClient(cookies);
        const formData = await request.formData();

        const commentId = formData.get('comment_id') as string;

        const response = await httpClient.post(
            `/api/manage/cms/comments/${commentId}/reject`,
            undefined,
            { headers: { 'X-Tenant-ID': tenant.id.toString() } }
        );

        if (!response.ok) {
            return fail(response.status, {
                error: response.error?.message || 'Failed to reject comment'
            });
        }

        return { success: true, action: 'reject' };
    },

    delete: async ({ request, cookies, params }) => {
        const tenant = await getTenantBySlug(cookies, params.slug);
        if (!tenant) return fail(404, { error: 'Tenant not found' });

        const httpClient = createServerHttpClient(cookies);
        const formData = await request.formData();

        const commentId = formData.get('comment_id') as string;

        const response = await httpClient.delete(
            `/api/manage/cms/comments/${commentId}`,
            { headers: { 'X-Tenant-ID': tenant.id.toString() } }
        );

        if (!response.ok) {
            return fail(response.status, {
                error: response.error?.message || 'Failed to delete comment'
            });
        }

        return { success: true, action: 'delete' };
    }
};
