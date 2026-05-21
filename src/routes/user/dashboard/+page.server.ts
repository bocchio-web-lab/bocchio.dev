import { servicesIndex, tenantsIndex } from '$lib/sdk/platform';
import { createPlatformSdk } from '$lib/sdk.server';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

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


export const actions = {
    createTenant: async ({ request, cookies }) => {
        const data = await request.formData();

        const name = data.get('name')?.toString();
        const serviceId = Number(data.get('service_id'));
        const accessLevel = data.get('access_level')?.toString();

        if (!name || !serviceId || !accessLevel) {
            return fail(400, {
                error: 'Missing required fields',
            });
        }

        const sdk = createPlatformSdk(cookies);

        const result = await sdk.tenantsStore({
            body: {
                name,
                service_id: serviceId,
                access_level: accessLevel as
                    | 'public'
                    | 'private'
                    | 'token_protected',
            },
        });

        if (result.error) {
            return fail(400, {
                error: result.error.message,
            });
        }

        return {
            success: true,
        };
    },
} satisfies Actions;