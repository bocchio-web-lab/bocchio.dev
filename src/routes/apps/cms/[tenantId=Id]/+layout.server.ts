import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ parent }) => {
    const { tenant } = await parent();

    if (!tenant) {
        throw error(400, 'Tenant context is missing');
    }

    // Now the service check only runs for /apps/cms/... routes
    if (tenant.service?.slug !== 'cms') {
        throw error(400, 'This is not a CMS tenant');
    }

    const base = `/apps/cms/${tenant.id}`;

    return {
        portalNavItems: [
            { href: base, label: 'Dashboard' },
            { href: `${base}/content`, label: 'Content' },
            { href: `${base}/tags`, label: 'Tags' },
            { href: `${base}/comments`, label: 'Comments' },
        ]
    };
};
