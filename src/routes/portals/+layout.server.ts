import { createPlatformSdk } from '$lib/sdk.server';
import type { User } from '$lib/sdk/identity';
import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies, locals, params }) => {
    if (!params.slug) {
        throw error(400, 'Tenant slug is missing');
    }

    const sdk = createPlatformSdk(cookies);
    const result = await sdk.tenantsIndex();
    const tenants = result.data?.data ?? result.data ?? [];

    const tenant = (tenants as any[]).find((item) => item.public_slug === params.slug);

    if (!tenant) {
        throw error(404, 'Tenant not found or you do not have access');
    }

    // Fetch tenant details to get the service and users
    const tenantResult = await sdk.tenantsShow({ path: { tenant: tenant.id } });
    const tenantDetails = tenantResult.data?.data ?? tenantResult.data;

    if (!tenantDetails) {
        throw error(404, 'Tenant details not found');
    }

    // Determine user's role in this tenant
    const userMember = tenantDetails.users?.find((u: User) => u.id === locals.user?.id);
    const userRole: 'owner' | 'admin' | 'editor' | 'author' | 'moderator' = tenantDetails.owner_id === locals.user?.id
        ? 'owner'
        : userMember?.pivot?.role

    return {
        tenant,
        userRole,
    };
};
