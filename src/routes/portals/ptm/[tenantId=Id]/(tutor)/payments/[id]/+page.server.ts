import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders, parseOptionalNumber, parseRequiredNumber } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies, params }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);
    const headers = buildTenantHeaders(tenant.id);

    const [paymentResult, studentsResult] = await Promise.all([
        sdk.paymentsShow({ path: { payment: Number(params.id) }, headers } as any),
        sdk.studentsIndex({ query: { per_page: 50 }, headers } as any),
    ]);

    if (paymentResult.error || !paymentResult.data?.data) {
        throw error(404, 'Payment not found');
    }

    return {
        payment: paymentResult.data.data,
        students: studentsResult.data?.data ?? [],
    };
};

export const actions: Actions = {
    update: async ({ request, cookies, params }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = params.tenantId;

        const response = await sdk.paymentsUpdate({
            path: { payment: Number(params.id) },
            body: {
                student_id: parseRequiredNumber(formData.get('student_id')),
                tutor_id: parseOptionalNumber(formData.get('tutor_id')),
                received_at: formData.get('received_at')?.toString() || undefined,
                amount: parseRequiredNumber(formData.get('amount')),
                currency: formData.get('currency')?.toString().trim() || undefined,
                method: (formData.get('method')?.toString() || 'cash') as 'cash' | 'electronic',
                notes: formData.get('notes')?.toString().trim() || null,
            },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to update payment',
            });
        }

        return { success: true };
    },

    delete: async ({ cookies, params, request }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id')?.toString() ?? params.tenantId;

        const response = await sdk.paymentsDestroy({
            path: { payment: Number(params.id) },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to delete payment',
            });
        }

        throw redirect(303, `/portals/ptm/${params.tenantId}/payments`);
    },
};