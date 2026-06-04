import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);
    const headers = buildTenantHeaders(tenant.id);

    const [paymentsResult, studentsResult] = await Promise.all([
        sdk.paymentsIndex({ query: { tutor_id: tenant.owner_id, per_page: 50 }, headers } as any),
        sdk.studentsIndex({ query: { per_page: 50 }, headers } as any),
    ]);

    if (paymentsResult.error) {
        throw error(500, 'Failed to load payments');
    }

    return {
        payments: paymentsResult.data?.data ?? [],
        students: studentsResult.data?.data ?? [],
    };
};