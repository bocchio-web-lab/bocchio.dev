import { error } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { createPlatformSdk } from '$lib/sdk.server';
import type { Tenant } from '$lib/sdk/platform';

type PortalTenant = Tenant & {
    service?: {
        slug?: string;
        name?: string | null;
    };
    users?: Array<{
        id: number;
        pivot?: {
            role?: string;
        };
    }>;
};

export async function getCmsPortalTenant(cookies: Cookies, slug: string): Promise<PortalTenant> {
    const sdk = createPlatformSdk(cookies);
    const result = await sdk.tenantsIndex();
    const tenants = ((result.data?.data ?? result.data ?? []) as Array<PortalTenant>);

    const tenant = tenants.find((item) => item.public_slug === slug);

    if (!tenant) {
        throw error(404, 'Tenant not found or you do not have access');
    }

    if (tenant.service?.slug !== 'cms') {
        throw error(400, 'This is not a CMS tenant');
    }

    return tenant;
}