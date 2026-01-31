// src/routes/user/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/api/auth.server';
import { createServerHttpClient } from '$lib/api/http.server';

export const load: PageServerLoad = async ({ cookies, locals }) => {
    await requireAuth(cookies);

    const httpClient = createServerHttpClient(cookies);

    // Fetch services
    const servicesResponse = await httpClient.get('/api/manage/services');
    const services = servicesResponse.ok ? servicesResponse.data.data : [];

    // Fetch user's tenants
    const tenantsResponse = await httpClient.get('/api/manage/tenants');
    const tenants = tenantsResponse.ok ? tenantsResponse.data.data : [];

    return {
        user: locals.user,
        services,
        tenants
    };
};
