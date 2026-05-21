import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { deliveryListByType } from '$lib/sdk/cms';
import { CMS_TENANT_SLUG } from '$lib/constants';

export const load: PageLoad = async ({ fetch }) => {

    const { data, error: err } = await deliveryListByType({
        path: {
            tenant_slug: CMS_TENANT_SLUG,
            type: 'apps',
        },
        fetch: fetch
    });

    if (err) {
        console.error('API Error:', err);
        throw error(500, 'Failed to load apps');
    }

    return {
        pagination: data
    };
};