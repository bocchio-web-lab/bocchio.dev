import { servicesIndex, tenantsIndex } from '$lib/sdk/platform';
import { createPlatformSdk } from '$lib/sdk.server';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies, locals }) => {
    if (!locals.user) redirect(302, '/auth/login');

    const sdk = createPlatformSdk(cookies);

    const [servicesResult, tenantsResult] = await Promise.all([
        servicesIndex({ client: sdk.client }),
        tenantsIndex({ client: sdk.client }),
    ]);

    return {
        user: locals.user,
        services: servicesResult.data?.data ?? [],
        tenants: tenantsResult.data?.data ?? [],
    };
}) satisfies PageServerLoad;