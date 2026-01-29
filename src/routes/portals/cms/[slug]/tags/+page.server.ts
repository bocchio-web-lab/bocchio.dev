// src/routes/portals/cms/[slug]/tags/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { createServerHttpClient } from '$lib/api/http.server';
import { fail } from '@sveltejs/kit';

// Helper function to get tenant by slug
async function getTenantBySlug(cookies: any, slug: string) {
    const httpClient = createServerHttpClient(cookies);
    const tenantsResponse = await httpClient.get('/api/manage/tenants');
    if (!tenantsResponse.ok) return null;
    const tenants = tenantsResponse.data.data;
    return tenants.find((t: any) => t.public_slug === slug);
}

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();
    const httpClient = createServerHttpClient(cookies);

    const response = await httpClient.get('/api/manage/cms/tags', {
        headers: { 'X-Tenant-ID': tenant.id.toString() }
    });

    const tags = response.ok ? response.data.data : [];

    return { tags };
};

export const actions: Actions = {
    create: async ({ request, cookies, params }) => {
        const tenant = await getTenantBySlug(cookies, params.slug);
        if (!tenant) return fail(404, { error: 'Tenant not found' });

        const httpClient = createServerHttpClient(cookies);
        const formData = await request.formData();

        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;

        const payload: any = { name };
        if (slug) payload.slug = slug;

        const response = await httpClient.post('/api/manage/cms/tags', payload, {
            headers: { 'X-Tenant-ID': tenant.id.toString() }
        });

        if (!response.ok) {
            return fail(response.status, {
                error: response.error?.message || 'Failed to create tag'
            });
        }

        return { success: true, action: 'create' };
    },

    update: async ({ request, cookies, params }) => {
        const tenant = await getTenantBySlug(cookies, params.slug);
        if (!tenant) return fail(404, { error: 'Tenant not found' });

        const httpClient = createServerHttpClient(cookies);
        const formData = await request.formData();

        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;

        const payload: any = { name, slug };

        const response = await httpClient.put(`/api/manage/cms/tags/${id}`, payload, {
            headers: { 'X-Tenant-ID': tenant.id.toString() }
        });

        if (!response.ok) {
            return fail(response.status, {
                error: response.error?.message || 'Failed to update tag'
            });
        }

        return { success: true, action: 'update' };
    },

    delete: async ({ request, cookies, params }) => {
        const tenant = await getTenantBySlug(cookies, params.slug);
        if (!tenant) return fail(404, { error: 'Tenant not found' });

        const httpClient = createServerHttpClient(cookies);
        const formData = await request.formData();

        const id = formData.get('id') as string;

        const response = await httpClient.delete(`/api/manage/cms/tags/${id}`, {
            headers: { 'X-Tenant-ID': tenant.id.toString() }
        });

        if (!response.ok) {
            return fail(response.status, {
                error: response.error?.message || 'Failed to delete tag'
            });
        }

        return { success: true, action: 'delete' };
    }
};
