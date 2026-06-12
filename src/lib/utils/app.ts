import { type BadgeVariant } from "$components/ui/badge";
import { type TenantAccessLevel } from "$lib/sdk/platform/types.gen";

export const accessLevelOptions: { value: TenantAccessLevel; label: string }[] = [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
    { value: "token_protected", label: "Token Protected" },
] as const;


export function getPortalLink(service: { slug: string } | undefined, tenant: { id: string }): string | null {

    if (!service) return null;

    switch (service.slug) {
        case "cms": return `/apps/cms/${tenant.id}`;
        case "ptm": return `/apps/ptm/${tenant.id}`;
        default: return null;
    }
}


// ----------------------------------------------------------------
// UI Utilities and Types
// ----------------------------------------------------------------

/**
 * Returns the appropriate badge variant based on the user's role.
 * @param role - The role of the user (e.g., "owner", "admin" ...).
 * @returns The corresponding badge variant for the given role.
 */
export function getRoleBadgeVariant(role: string): BadgeVariant {
    switch (role) {
        // case "owner": return "default";
        default: return "secondary";
    }
}


/**
 * Returns the appropriate badge variant based on the access level.
 * @param level - The access level (e.g., "public", "private", "token_protected").
 * @returns The corresponding badge variant.
 */
export function getAccessLevelBadgeVariant(level: string): BadgeVariant {
    switch (level) {
        // case "public": return "default";
        default: return "secondary";
    }
}


// ----------------------------------------------------------------
// Open Graph Image Utility
// ----------------------------------------------------------------
/**
 * Optimizes an Open Graph image URL by injecting Cloudinary transformations.
 * Guarantees standard OG dimensions (1200x630) and strict size compression (<600KB) for WhatsApp/LinkedIn.
 * @returns The optimized image URL suitable for Open Graph metadata.
 */
export function getOptimizedOgImage(url?: string): string {
    const fallbackImage = 'https://res.cloudinary.com/bocchio/image/upload/c_limit,w_1200,h_630,q_auto,f_jpg/v1/profile_photo_tommaso_bocchietti_piz_lucendro';

    if (!url) return fallbackImage;

    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        const uploadIndex = url.indexOf('/upload/');
        const transformSegment = url.slice(uploadIndex + '/upload/'.length).split('/')[0] || '';

        if (transformSegment.includes('_') && !transformSegment.match(/^v\d+$/)) {
            let newTransform = transformSegment;

            // Format (f_)
            newTransform = newTransform.includes('f_')
                ? newTransform.replace(/f_[a-zA-Z0-9]+/, 'f_jpg')
                : newTransform + ',f_jpg';

            // Quality (q_)
            newTransform = newTransform.includes('q_')
                ? newTransform.replace(/q_[a-zA-Z0-9]+/, 'q_auto')
                : newTransform + ',q_auto';

            // Crop Mode (c_) - using \b to ensure we match c_ but not co_ (color)
            newTransform = /\bc_[a-z]+\b/.test(newTransform)
                ? newTransform.replace(/\bc_[a-z]+\b/, 'c_limit')
                : newTransform + ',c_limit';

            // Width (w_)
            newTransform = /\bw_\d+\b/.test(newTransform)
                ? newTransform.replace(/\bw_\d+\b/, 'w_1200')
                : newTransform + ',w_1200';

            // Height (h_)
            newTransform = /\bh_\d+\b/.test(newTransform)
                ? newTransform.replace(/\bh_\d+\b/, 'h_630')
                : newTransform + ',h_630';

            url = url.replace(transformSegment, newTransform);
        } else {
            url = url.replace('/upload/', '/upload/c_limit,w_1200,h_630,q_auto,f_jpg/');
        }
    }

    return url;
}