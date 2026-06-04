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