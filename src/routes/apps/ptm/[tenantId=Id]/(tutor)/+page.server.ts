import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();

    if (!tenant) {
        throw error(400, 'Tenant context is missing');
    }

    const sdk = createPtmSdk(cookies);
    const headers = buildTenantHeaders(tenant.id);
    const tutorId = tenant.owner_id;

    const dashboardResult = await sdk.dashboardTutor({ path: { tutorId }, headers } as any);

    if (dashboardResult.error || !dashboardResult.data?.data) {
        throw error(500, 'Failed to load PTM dashboard');
    }

    return {
        dashboard: dashboardResult.data.data,
    };
};