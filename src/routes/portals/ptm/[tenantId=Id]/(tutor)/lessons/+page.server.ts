import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies, url }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);
    const headers = buildTenantHeaders(tenant.id);

    const page = url.searchParams.get('page') ?? '1';

    const [lessonsResult, studentsResult] = await Promise.all([
        sdk.lessonsIndex({ query: { tutor_id: tenant.owner_id, per_page: 50, page: page }, headers } as any),
        sdk.studentsIndex({ query: { per_page: 50 }, headers } as any),
    ]);

    if (lessonsResult.error) {
        throw error(500, 'Failed to load lessons');
    }

    return {
        lessons: lessonsResult.data?.data ?? [],
        students: studentsResult.data?.data ?? [],
        pagination: lessonsResult.data ?? null,
    };
};