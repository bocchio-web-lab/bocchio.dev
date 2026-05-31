import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);

    const response = await sdk.subjectsIndex({ query: { per_page: 50 }, headers: buildTenantHeaders(tenant.id) } as any);

    if (response.error) {
        throw error(500, 'Failed to load subjects');
    }

    return {
        subjects: response.data?.data ?? [],
    };
};