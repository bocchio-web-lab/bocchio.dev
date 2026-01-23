// src/routes/user/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, locals, fetch }) => {
    await requireAuth(cookies);

    const xsrfToken = cookies.get('XSRF-TOKEN');
    const sessionCookie = cookies.get('backend_bocchio_session');

    // Fetch services
    const servicesResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/manage/services`, {
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
            'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
        }
    });

    const services = servicesResponse.ok ? (await servicesResponse.json()).data : [];

    // Fetch user's tenants
    const tenantsResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/manage/tenants`, {
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
            'Cookie': `backend_bocchio_session=${sessionCookie}; XSRF-TOKEN=${xsrfToken}`
        }
    });

    const tenants = tenantsResponse.ok ? (await tenantsResponse.json()).data : [];

    return {
        user: locals.user,
        services,
        tenants
    };
};
