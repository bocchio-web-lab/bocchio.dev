// src/routes/portals/cms/[slug]/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { getCmsPortalTenant } from './portal.server';

export const load: LayoutServerLoad = async ({ cookies, locals, params }) => {

    const tenant = await getCmsPortalTenant(cookies, params.slug);

    // Determine user's role in this tenant
    const userMember = tenant.users?.find((u) => u.id === locals.user?.id);
    const userRole =
        tenant.owner_id === locals.user?.id ? 'owner' : userMember?.pivot?.role || 'member';

    return {
        user: locals.user,
        tenant,
        userRole,
    };
};
