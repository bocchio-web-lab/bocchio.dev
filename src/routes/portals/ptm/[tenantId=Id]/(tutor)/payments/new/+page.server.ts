import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders, parseOptionalNumber, parseRequiredNumber } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);
    const headers = buildTenantHeaders(tenant.id);

    const studentsResult = await sdk.studentsIndex({ query: { per_page: 50 }, headers } as any);

    return {
        students: studentsResult.data?.data ?? [],
    };
};

export const actions: Actions = {
    create: async ({ request, cookies, params }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = params.tenantId;

        const response = await sdk.paymentsStore({
            body: {
                student_id: parseRequiredNumber(formData.get('student_id')),
                tutor_id: parseRequiredNumber(formData.get('tutor_id')),
                received_at: formData.get('received_at')?.toString() || new Date().toISOString(),
                amount: parseRequiredNumber(formData.get('amount')),
                currency: formData.get('currency')?.toString().trim() || 'USD',
                method: (formData.get('method')?.toString() || 'cash') as 'cash' | 'electronic',
                notes: formData.get('notes')?.toString().trim() || null,
            },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to create payment',
            });
        }

        return { success: true };
    },
};