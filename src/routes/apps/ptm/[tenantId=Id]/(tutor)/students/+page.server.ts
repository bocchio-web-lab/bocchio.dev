import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);
    const header = buildTenantHeaders(tenant.id)

    const response = await sdk.studentsIndex({ headers: header } as any);

    if (response.error) {
        throw error(500, 'Failed to load students');
    }

    return {
        students: response.data.data ?? [],
        pagination: response.data,
    };
};