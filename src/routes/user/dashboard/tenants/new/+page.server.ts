import { redirect, fail } from '@sveltejs/kit';
import { servicesIndex, tenantsStore } from '$lib/sdk/platform';
import { createPlatformSdk } from '$lib/sdk.server';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ cookies, locals, url }) => {
    if (!locals.user) redirect(302, '/auth/login');

    const sdk = createPlatformSdk(cookies);
    const servicesResult = await servicesIndex({ client: sdk.client });
    const services = servicesResult.data?.data ?? [];

    const requestedServiceId = Number(url.searchParams.get('service'));
    const initialServiceId =
        services.find((service) => service.id === requestedServiceId)?.id ??
        services[0]?.id ??
        null;

    return {
        user: locals.user,
        services,
        initialServiceId,
    };
}) satisfies PageServerLoad;

export const actions = {
    createTenant: async ({ request, cookies }) => {
        const formData = await request.formData();

        const name = formData.get('name')?.toString().trim();
        const serviceId = Number(formData.get('service_id'));
        const accessLevel = formData.get('access_level')?.toString();

        if (!name || !serviceId || !accessLevel) {
            return fail(400, {
                error: 'Missing required fields',
            });
        }

        const sdk = createPlatformSdk(cookies);
        const result = await tenantsStore({
            client: sdk.client,
            body: {
                name,
                service_id: serviceId,
                access_level: accessLevel as 'public' | 'private' | 'token_protected',
            },
        });

        if (result.error) {
            return fail(400, {
                error: result.error.message,
            });
        }

        const tenant = result.data?.data;
        if (!tenant) {
            return fail(500, {
                error: 'Tenant was not created',
            });
        }

        throw redirect(303, `/user/dashboard/tenants/${tenant.id}`);
    },
} satisfies Actions;