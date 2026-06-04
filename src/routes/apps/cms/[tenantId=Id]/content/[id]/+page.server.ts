import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createCmsSdk } from '$lib/sdk.server';

export const load: PageServerLoad = async ({ parent, cookies, params }) => {
    const { tenant } = await parent();
    const sdk = createCmsSdk(cookies);

    const tenantId = tenant.id.toString();

    // Fetch content item
    const contentResponse = await sdk.contentShow({
        path: { id: params.id },
        headers: { 'X-Tenant-ID': tenantId },
    } as any);

    if (contentResponse.error) {
        throw error(404, 'Content not found');
    }

    // Fetch available tags
    const tagsResponse = await sdk.tagsIndex({
        headers: { 'X-Tenant-ID': tenantId },
    } as any);

    const tags = tagsResponse.error ? [] : tagsResponse.data?.data ?? [];

    return {
        content: contentResponse.data?.data,
        tags
    };
};

export const actions: Actions = {
    update: async ({ request, cookies, params }) => {
        const sdk = createCmsSdk(cookies);
        const formData = await request.formData();

        const tenantId = params.tenantId;
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

        const response = await sdk.contentUpdate({
            path: { id: params.id },
            body: { type, title, slug, excerpt, body, status, published_at, tags, meta },
            headers: { 'X-Tenant-ID': tenantId },
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error?.message || 'Failed to update content'
            });
        }

        return { success: true };
    },

    delete: async ({ cookies, params }) => {
        const sdk = createCmsSdk(cookies);

        const tenantId = params.tenantId;

        const response = await sdk.contentDestroy({
            path: { id: params.id },
            headers: { 'X-Tenant-ID': tenantId },
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error?.message || 'Failed to delete content'
            });
        }

        throw redirect(303, `/apps/cms/${params.tenantId}/content`);
    }
};
