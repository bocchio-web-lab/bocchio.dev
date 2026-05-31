import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies, params }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);

    const response = await sdk.studentsShow({
        path: { student: Number(params.id) },
        headers: buildTenantHeaders(tenant.id),
    } as any);

    if (response.error || !response.data?.data) {
        throw error(404, 'Student not found');
    }

    return { student: response.data.data };
};

export const actions: Actions = {
    update: async ({ request, cookies, params }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = params.tenantId;

        const response = await sdk.studentsUpdate({
            path: { student: Number(params.id) },
            body: {
                name: formData.get('name')?.toString().trim() || undefined,
                hourly_rate: formData.get('hourly_rate')?.toString() ? Number(formData.get('hourly_rate')?.toString()) : null,
                currency: formData.get('currency')?.toString() || undefined,
                dashboard_key: formData.get('dashboard_key')?.toString().trim() || null,
                support_status: (formData.get('support_status')?.toString() || undefined) as 'active' | 'on_hold' | 'ended' | undefined,
                support_ended_at: formData.get('support_ended_at')?.toString().trim() || null,
                notes: formData.get('notes')?.toString().trim() || null,
            },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to update student',
            });
        }

        return { success: true, dashboard_key: response.data?.dashboard_key ?? '' };
    },

    issueDashboardKey: async ({ request, cookies, params }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id')?.toString() ?? params.tenantId;

        const response = await sdk.studentIssueDashboardKey({
            path: { student: Number(params.id) },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to issue dashboard key',
            });
        }

        return { success: true, dashboard_key: response.data?.data.dashboard_key ?? '' };
    },

    reissueDashboardKey: async ({ request, cookies, params }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id')?.toString() ?? params.tenantId;

        const response = await sdk.studentReissueDashboardKey({
            path: { student: Number(params.id) },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to reissue dashboard key',
            });
        }

        return { success: true, dashboard_key: response.data?.data.dashboard_key ?? '' };
    },

    delete: async ({ cookies, params, request }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id')?.toString() ?? params.tenantId;

        const response = await sdk.studentsDestroy({
            path: { student: Number(params.id) },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to delete student',
            });
        }

        throw redirect(303, `/portals/ptm/${params.tenantId}/students`);
    },
};