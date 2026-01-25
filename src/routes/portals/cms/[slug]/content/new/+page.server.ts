// src/routes/portals/cms/[slug]/content/new/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { get, post } from '$lib/server/http-server';
import { redirect, fail } from '@sveltejs/kit';

// Helper function to get tenant by slug
async function getTenantBySlug(cookies: any, slug: string) {
    const tenantsResponse = await get('/api/manage/tenants', cookies);
    if (!tenantsResponse.ok) return null;
    const tenants = tenantsResponse.data.data;
    return tenants.find((t: any) => t.public_slug === slug);
}

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();

    // Fetch available tags
    const tagsResponse = await get('/api/manage/cms/tags', cookies, {
        headers: { 'X-Tenant-ID': tenant.id.toString() }
    });

    const tags = tagsResponse.ok ? tagsResponse.data.data : [];

    return { tags };
};

export const actions: Actions = {
    default: async ({ request, cookies, params }) => {
        const tenant = await getTenantBySlug(cookies, params.slug);
        if (!tenant) return fail(404, { error: 'Tenant not found' });

        const formData = await request.formData();

        const type = formData.get('type') as string;
        const title = formData.get('title') as string;
        const slug = formData.get('slug') as string;
        const excerpt = formData.get('excerpt') as string;
        const body = formData.get('body') as string;
        const status = formData.get('status') as string;
        const published_at = formData.get('published_at') as string;
        const tags = formData.getAll('tags').map(Number);

        const payload: any = {
            type,
            title,
            body,
            status: status || 'draft'
        };

        if (slug) payload.slug = slug;
        if (excerpt) payload.excerpt = excerpt;
        if (published_at) payload.published_at = published_at;
        if (tags.length > 0) payload.tags = tags;

        const response = await post('/api/manage/cms/content', cookies, payload, {
            headers: { 'X-Tenant-ID': tenant.id.toString() }
        });

        if (!response.ok) {
            return fail(response.status, {
                error: response.error?.message || 'Failed to create content'
            });
        }

        throw redirect(303, `/portals/cms/${params.slug}/content/${response.data.data.id}`);
    }
};
