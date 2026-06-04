import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
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

        const response = await sdk.subjectsStore({
            body: {
                name: formData.get('name')?.toString().trim() || '',
                notes: formData.get('notes')?.toString().trim() || null,
            },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to create subject',
            });
        }

        return { success: true };
    },
};