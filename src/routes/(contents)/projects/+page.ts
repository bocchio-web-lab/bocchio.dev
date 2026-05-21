import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { deliveryListByType } from '$lib/sdk/cms';
import { CMS_TENANT_SLUG } from '$lib/constants';

export const load: PageLoad = async ({ url, fetch }) => {

    const page = url.searchParams.get('page') || '1';

    const { data, error: err } = await deliveryListByType({
        path: {
            tenant_slug: CMS_TENANT_SLUG,
            type: 'projects',
        },
        query: {
            page: page !== '1' ? String(page) : undefined,
            per_page: String(3),
        },
        fetch: fetch
    });

    if (err) {
        console.error('API Error:', err);
        throw error(500, 'Failed to load projects');
    }

    return {
        pagination: data
    };
};