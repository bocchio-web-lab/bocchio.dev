// src/routes/portals/cms/[slug]/tags/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { createCmsSdk } from '$lib/sdk.server';
import { getCmsPortalTenant } from '../portal.server';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();
    const sdk = createCmsSdk(cookies);

    const response = await sdk.tagsIndex({
        headers: { 'X-Tenant-ID': tenant.id.toString() },
    } as any);

    if (response.error) {
        throw error(500, 'Failed to load tags');
    }

    const tags = response.data?.data ?? [];

    return { tags };
};

export const actions: Actions = {
    create: async ({ request, cookies, params }) => {
        const tenant = await getCmsPortalTenant(cookies, params.slug);
        const sdk = createCmsSdk(cookies);
        const formData = await request.formData();

        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;

        const response = await sdk.tagsStore({
            body: {
                name,
                ...(slug ? { slug } : {}),
            },
            headers: { 'X-Tenant-ID': tenant.id.toString() },
        } as any);

        if (response.error) {
            return fail(response.status || 400, {
                error: response.error?.message || 'Failed to create tag',
            });
        }

        return { success: true, action: 'create' };
    },

    update: async ({ request, cookies, params }) => {
        const tenant = await getCmsPortalTenant(cookies, params.slug);
        const sdk = createCmsSdk(cookies);
        const formData = await request.formData();

        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;

        const response = await sdk.tagsUpdate({
            path: { tag: Number(id) },
            body: {
                name,
                slug,
            },
            headers: { 'X-Tenant-ID': tenant.id.toString() },
        } as any);

        if (response.error) {
            return fail(response.status || 400, {
                error: response.error?.message || 'Failed to update tag',
            });
        }

        return { success: true, action: 'update' };
    },

    delete: async ({ request, cookies, params }) => {
        const tenant = await getCmsPortalTenant(cookies, params.slug);
        const sdk = createCmsSdk(cookies);
        const formData = await request.formData();

        const id = formData.get('id') as string;

        const response = await sdk.tagsDestroy({
            path: { tag: Number(id) },
            headers: { 'X-Tenant-ID': tenant.id.toString() },
        } as any);

        if (response.error) {
            return fail(response.status || 400, {
                error: response.error?.message || 'Failed to delete tag',
            });
        }

        return { success: true, action: 'delete' };
    }
};
