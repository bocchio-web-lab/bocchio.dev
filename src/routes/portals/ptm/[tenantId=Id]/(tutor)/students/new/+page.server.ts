import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent }) => {
    const { tenant } = await parent();
    return { tenant };
};

export const actions: Actions = {
    create: async ({ request, cookies, params }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = params.tenantId;
        const name = formData.get('name')?.toString().trim() ?? '';

        if (!name) {
            return fail(400, { error: 'Name is required' });
        }

        const response = await sdk.studentsStore({
            body: {
                name,
                hourly_rate: Number(formData.get('hourly_rate')?.toString() || '0') || null,
                currency: formData.get('currency')?.toString() || 'USD',
                dashboard_key: formData.get('dashboard_key')?.toString().trim() || null,
                support_status: (formData.get('support_status')?.toString() || 'active') as 'active' | 'on_hold' | 'ended',
                support_ended_at: formData.get('support_ended_at')?.toString().trim() || null,
                notes: formData.get('notes')?.toString().trim() || null,
            },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to create student',
            });
        }

        return {
            success: true,
            dashboard_key: response.data?.dashboard_key ?? '',
        };
    },
};