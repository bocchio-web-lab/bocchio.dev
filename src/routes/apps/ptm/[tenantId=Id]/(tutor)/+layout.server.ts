import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ parent }) => {
    const { tenant } = await parent();

    if (!tenant) {
        throw error(400, 'Tenant context is missing');
    }

    // Now the service check only runs for /apps/ptm/... routes
    if (tenant.service?.slug !== 'ptm') {
        throw error(400, 'This is not a PTM tenant');
    }

    const base = `/apps/ptm/${tenant.id}`;

    return {
        portalNavItems: [
            { href: base, label: 'Dashboard' },
            { href: `${base}/lessons`, label: 'Lessons' },
            { href: `${base}/payments`, label: 'Payments' },
            { href: `${base}/students`, label: 'Students' },
            { href: `${base}/subjects`, label: 'Subjects' },
        ]
    };
};
