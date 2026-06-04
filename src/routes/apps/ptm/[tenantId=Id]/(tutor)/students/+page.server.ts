import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);

    const response = await sdk.studentsIndex({
        query: { per_page: 50 },
        headers: buildTenantHeaders(tenant.id),
    } as any);

    if (response.error) {
        throw error(500, 'Failed to load students');
    }

    const payload = response.data ?? { data: [], total: 0, per_page: 50, current_page: 1, last_page: 1, links: [] };

    return {
        students: payload.data ?? [],
        pagination: payload,
    };
};

export const actions: Actions = {
    delete: async ({ request, cookies }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id')?.toString() ?? '';
        const studentId = Number(formData.get('student_id'));

        const response = await sdk.studentsDestroy({
            path: { student: studentId },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to delete student',
            });
        }

        return { success: true };
    },
};