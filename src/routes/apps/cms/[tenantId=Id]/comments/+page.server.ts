import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { createCmsSdk } from '$lib/sdk.server';

export const load: PageServerLoad = async ({ parent, cookies, url }) => {
    const { tenant } = await parent();
    const sdk = createCmsSdk(cookies);

    const approved = url.searchParams.get('approved');
    const page = url.searchParams.get('page') || '1';

    const queryParams = new URLSearchParams();
    if (approved !== null) queryParams.set('approved', approved);
    if (page !== '1') queryParams.set('page', page);

    const queryString = queryParams.toString();
    const query = Object.fromEntries(queryParams.entries());
    const response = await sdk.commentModerationIndex({
        headers: { 'X-Tenant-ID': tenant.id.toString() },
        ...(Object.keys(query).length > 0 ? { query } : {}),
    } as any);

    if (response.error) {
        throw error(500, 'Failed to load comments');
    }

    const commentsData = response.data ?? { data: [], total: 0 };

    return {
        comments: commentsData.data || [],
        pagination: commentsData,
        filters: { approved }
    };
};

export const actions: Actions = {
    approve: async ({ request, cookies, params }) => {
        const sdk = createCmsSdk(cookies);
        const formData = await request.formData();

        const tenantId = params.tenantId;
        const commentId = formData.get('comment_id') as string;

        const response = await sdk.commentModerationApprove({
            path: { comment: Number(commentId) },
            headers: { 'X-Tenant-ID': tenantId },
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error?.message || 'Failed to approve comment',
            });
        }

        return { success: true, action: 'approve' };
    },

    reject: async ({ request, cookies, params }) => {
        const sdk = createCmsSdk(cookies);
        const formData = await request.formData();

        const tenantId = params.tenantId;
        const commentId = formData.get('comment_id') as string;

        const response = await sdk.commentModerationReject({
            path: { comment: Number(commentId) },
            headers: { 'X-Tenant-ID': tenantId },
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error?.message || 'Failed to reject comment',
            });
        }

        return { success: true, action: 'reject' };
    },

    delete: async ({ request, cookies, params }) => {
        const sdk = createCmsSdk(cookies);
        const formData = await request.formData();

        const tenantId = params.tenantId;
        const commentId = formData.get('comment_id') as string;

        const response = await sdk.commentModerationDestroy({
            path: { comment: Number(commentId) },
            headers: { 'X-Tenant-ID': tenantId },
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error?.message || 'Failed to delete comment',
            });
        }

        return { success: true, action: 'delete' };
    }
};
