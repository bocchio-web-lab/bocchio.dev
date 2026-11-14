import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies, params }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);

    const response = await sdk.subjectsShow({
        path: { subject: Number(params.id) },
        headers: buildTenantHeaders(tenant.id),
    } as any);

    if (response.error || !response.data?.data) {
        throw error(404, 'Subject not found');
    }

    return { subject: response.data.data };
};

export const actions: Actions = {
    update: async ({ request, cookies, params }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = params.tenantId;

        const response = await sdk.subjectsUpdate({
            path: { subject: Number(params.id) },
            body: {
                name: formData.get('name')?.toString().trim() || '',
                notes: formData.get('notes')?.toString().trim() || null,
            },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to update subject',
            });
        }

        return { success: true };
    },

    delete: async ({ cookies, params, request }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id')?.toString() ?? params.tenantId;

        const response = await sdk.subjectsDestroy({
            path: { subject: Number(params.id) },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to delete subject',
            });
        }

        throw redirect(303, `/portals/ptm/${params.tenantId}/subjects`);
    },
};