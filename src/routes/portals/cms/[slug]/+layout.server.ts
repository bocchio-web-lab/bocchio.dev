// src/routes/portals/cms/[slug]/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { requireAuth } from '$lib/api/auth.server';
import { createServerHttpClient } from '$lib/api/http.server';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies, locals, params }) => {
    await requireAuth(cookies);

    const httpClient = createServerHttpClient(cookies);

    // Fetch all user's tenants to find the one matching the slug
    const tenantsResponse = await httpClient.get('/api/manage/tenants');

    if (!tenantsResponse.ok) {
        throw error(500, 'Failed to load tenants');
    }

    const tenants = tenantsResponse.data.data;
    const tenant = tenants.find((t: any) => t.public_slug === params.slug);

    if (!tenant) {
        throw error(404, 'Tenant not found or you do not have access');
    }

    // Check if this is a CMS tenant
    if (tenant.service?.slug !== 'cms') {
        throw error(400, 'This is not a CMS tenant');
    }

    // Get detailed tenant information with members
    const tenantDetailResponse = await httpClient.get(`/api/manage/tenants/${tenant.id}`);

    const tenantDetail = tenantDetailResponse.ok
        ? tenantDetailResponse.data.data
        : tenant;

    // Determine user's role in this tenant
    const userMember = tenantDetail.users?.find((u: any) => u.id === locals.user?.id);
    const userRole =
        tenant.owner_id === locals.user?.id ? 'owner' : userMember?.pivot?.role || 'member';

    return {
        user: locals.user,
        tenant: tenantDetail,
        userRole
    };
};
