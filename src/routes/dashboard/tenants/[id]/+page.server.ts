import { redirect, error, fail } from '@sveltejs/kit';
import { servicesShow, tenantsShow, tenantsUpdate, tenantsDestroy } from '$lib/sdk/platform';
import { createPlatformSdk } from '$lib/sdk.server';
import type { Actions, PageServerLoad } from './$types';

function parseSettings(settingsRaw: string) {
    if (!settingsRaw) {
        return null;
    }

    return JSON.parse(settingsRaw);
}

export const load = (async ({ cookies, params }) => {
    const tenantId = Number(params.id);
    if (!Number.isFinite(tenantId)) {
        throw error(404, 'Tenant not found');
    }

    const sdk = createPlatformSdk(cookies);
    const tenantResult = await tenantsShow({ client: sdk.client, path: { tenant: tenantId } });

    if (tenantResult.error || !tenantResult.data?.data) {
        throw error(404, 'Tenant not found');
    }

    const tenant = tenantResult.data.data;
    const serviceResult = await servicesShow({ client: sdk.client, path: { service: tenant.service_id } });

    return {
        tenant,
        service: serviceResult.data?.data ?? null,
    };
}) satisfies PageServerLoad;

export const actions = {
    updateTenant: async ({ request, cookies, params }) => {
        const tenantId = Number(params.id);
        if (!Number.isFinite(tenantId)) {
            throw error(404, 'Tenant not found');
        }

        const formData = await request.formData();
        const name = formData.get('name')?.toString().trim();
        const accessLevel = formData.get('access_level')?.toString();
        const regenerateApiKey = formData.get('regenerate_api_key') === 'on';
        const settingsRaw = formData.get('settings')?.toString().trim() ?? '';

        if (!name || !accessLevel) {
            return fail(400, { error: 'Missing required fields' });
        }

        let parsedSettings: unknown = null;

        if (settingsRaw) {
            try {
                parsedSettings = parseSettings(settingsRaw);
            } catch {
                return fail(400, { error: 'Settings must be valid JSON' });
            }
        }

        const sdk = createPlatformSdk(cookies);
        const result = await tenantsUpdate({
            client: sdk.client,
            path: { tenant: tenantId },
            body: {
                name,
                access_level: accessLevel as 'public' | 'private' | 'token_protected',
                regenerate_api_key: regenerateApiKey,
                settings: parsedSettings as any,
            } as any,
        });

        if (result.error) {
            return fail(400, {
                error: result.error.message,
            });
        }

        throw redirect(303, `/dashboard/tenants/${tenantId}`);
    },
    deleteTenant: async ({ cookies, params }) => {
        const tenantId = Number(params.id);
        if (!Number.isFinite(tenantId)) {
            return fail(404, { error: 'Tenant not found' });
        }

        const sdk = createPlatformSdk(cookies);
        const result = await tenantsDestroy({ client: sdk.client, path: { tenant: tenantId } });

        if (result.error) {
            return fail(400, { error: result.error.message });
        }

        throw redirect(303, '/dashboard');
    },
} satisfies Actions;