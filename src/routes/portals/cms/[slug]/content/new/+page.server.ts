// src/routes/portals/cms/[slug]/content/new/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { createServerHttpClient } from '$lib/api/http.server';
import { redirect, fail } from '@sveltejs/kit';

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

    // Fetch available tags
    const tagsResponse = await httpClient.get('/api/manage/cms/tags', {
        headers: { 'X-Tenant-ID': tenant.id.toString() }
    });

    const tags = tagsResponse.ok ? tagsResponse.data.data : [];

    return { tags };
};

export const actions: Actions = {
    default: async ({ request, cookies, params }) => {
        const tenant = await getTenantBySlug(cookies, params.slug);
        if (!tenant) return fail(404, { error: 'Tenant not found' });

        const httpClient = createServerHttpClient(cookies);
        const formData = await request.formData();

        const type = formData.get('type') as string;
        const title = formData.get('title') as string;
        const slug = formData.get('slug') as string;
        const excerpt = formData.get('excerpt') as string;
        const body = formData.get('body') as string;
        const status = formData.get('status') as string;
        const published_at = formData.get('published_at') as string;
        const tags = formData.getAll('tags').map(Number);

        // Process meta properties
        const meta: Record<string, any> = {};

        // Header carousel images
        const headerImages = formData.getAll('meta_header_images')
            .map(img => img.toString().trim())
            .filter(img => img.length > 0);
        if (headerImages.length > 0) {
            meta.headerImages = headerImages;
        }

        // External resource links
        const linkTitles = formData.getAll('meta_external_links_title');
        const linkUrls = formData.getAll('meta_external_links_url');
        const externalLinks = [];
        for (let i = 0; i < linkTitles.length; i++) {
            const title = linkTitles[i]?.toString().trim();
            const url = linkUrls[i]?.toString().trim();
            if (title && url) {
                externalLinks.push({ title, url });
            }
        }
        if (externalLinks.length > 0) {
            meta.externalLinks = externalLinks;
        }

        // Custom meta fields
        const customKeys = formData.getAll('meta_custom_keys');
        const customValues = formData.getAll('meta_custom_values');
        for (let i = 0; i < customKeys.length; i++) {
            const key = customKeys[i]?.toString().trim();
            const value = customValues[i]?.toString().trim();
            if (key && value) {
                meta[key] = value;
            }
        }

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
        if (Object.keys(meta).length > 0) payload.meta = meta;

        const response = await httpClient.post('/api/manage/cms/content', payload, {
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
