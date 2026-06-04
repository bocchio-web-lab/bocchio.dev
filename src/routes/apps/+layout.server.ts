import { createPlatformSdk } from '$lib/sdk.server';
import type { User } from '$lib/sdk/identity';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies, locals, params }) => {
    if (!locals.user) redirect(302, '/auth/login');

    if (!params.tenantId) {
        throw error(400, 'Tenant ID is missing');
    }

    const sdk = createPlatformSdk(cookies);
    const tenantId = Number(params.tenantId);

    const tenantResult = await sdk.tenantsShow({ path: { tenant: tenantId } });
    const tenant = tenantResult.data?.data ?? tenantResult.data;

    if (!tenant) {
        throw error(404, 'Tenant not found or you do not have access');
    }

    // Determine user's role in this tenant
    const userMember = tenant.users?.find((u: User) => u.id === locals.user?.id);
    const userRole: 'owner' | 'admin' | 'editor' | 'author' | 'moderator' | 'external' = tenant.owner_id === locals.user?.id
        ? 'owner'
        : userMember?.pivot?.role || 'external';

    return {
        tenant,
        userRole,
    };
};
