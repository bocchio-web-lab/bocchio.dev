import { servicesIndex, tenantsIndex } from '$lib/sdk/platform';
import { createPlatformSdk } from '$lib/sdk.server';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
    const sdk = createPlatformSdk(cookies);

    const [servicesResult, tenantsResult] = await Promise.all([
        servicesIndex({ client: sdk.client }),
        tenantsIndex({ client: sdk.client }),
    ]);

    return {
        services: servicesResult.data?.data ?? [],
        tenants: tenantsResult.data?.data ?? [],
    };
}) satisfies PageServerLoad;