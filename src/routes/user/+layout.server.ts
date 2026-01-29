import type { LayoutServerLoad } from './$types';
import { requireAuth } from '$lib/api/auth.server';

// Commented out - requireAuth is now handled in hooks.server.ts via locals.user
// export const load = (async ({ cookies, locals }) => {
//     await requireAuth(cookies);

//     return {
//         user: locals.user
//     };
// }) satisfies LayoutServerLoad;