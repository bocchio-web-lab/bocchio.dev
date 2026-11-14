import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies, url }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);
    const headers = buildTenantHeaders(tenant.id);

    const page = url.searchParams.get('page') ?? '1';

    const paymentsResult = await sdk.paymentsIndex({ query: { tutor_id: tenant.owner_id, page: page }, headers } as any);

    if (paymentsResult.error) {
        throw error(500, 'Failed to load payments');
    }

    return {
        payments: paymentsResult.data?.data ?? [],
        pagination: paymentsResult.data ?? null,
    };
};