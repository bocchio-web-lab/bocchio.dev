// src/routes/portals/cms/[slug]/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies, locals, params, fetch }) => {
    await requireAuth(cookies);

    const xsrfToken = cookies.get('XSRF-TOKEN');
    const sessionCookie = cookies.get('backend_bocchio_session');

    // Fetch all user's tenants to find the one matching the slug
    const tenantsResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/manage/tenants`, {
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
            'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
        }
    });

    if (!tenantsResponse.ok) {
        throw error(500, 'Failed to load tenants');
    }

    const tenants = (await tenantsResponse.json()).data;
    const tenant = tenants.find((t: any) => t.public_slug === params.slug);

    if (!tenant) {
        throw error(404, 'Tenant not found or you do not have access');
    }

    // Check if this is a CMS tenant
    if (tenant.service?.slug !== 'cms') {
        throw error(400, 'This is not a CMS tenant');
    }

    // Get detailed tenant information with members
    const tenantDetailResponse = await fetch(
        `${PUBLIC_API_BASE_URL}/api/manage/tenants/${tenant.id}`,
        {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
                'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
            }
        }
    );

    const tenantDetail = tenantDetailResponse.ok
        ? (await tenantDetailResponse.json()).data
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
