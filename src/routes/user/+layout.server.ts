import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';

export const load = (async ({ cookies, locals }) => {
    await requireAuth(cookies);

    return {
        user: locals.user
    };
}) satisfies PageServerLoad;