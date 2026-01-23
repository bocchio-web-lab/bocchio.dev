// src/routes/auth/verify-email/[id]/[hash]/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { verifyEmail } from '$lib/server/auth';

export const load = (async ({ cookies, params, url }) => {
    const { id, hash } = params;
    const expires = url.searchParams.get('expires') || '';
    const signature = url.searchParams.get('signature') || '';

    if (!expires || !signature) {
        throw redirect(302, '/auth/verify-email?error=invalid');
    }

    const result = await verifyEmail(id, hash, expires, signature, cookies);

    if (result.success) {
        throw redirect(302, '/user/dashboard?verified=1');
    } else {
        throw redirect(302, '/auth/verify-email?error=' + encodeURIComponent(result.message || 'failed'));
    }
}) satisfies PageServerLoad;
