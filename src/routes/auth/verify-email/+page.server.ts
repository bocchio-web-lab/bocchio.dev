// src/routes/auth/verify-email/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { requireAuth, resendVerification, getUser } from '$lib/server/auth';

export const load = (async ({ cookies }) => {
    await requireAuth(cookies);

    const user = await getUser(cookies);

    // If already verified, redirect to dashboard
    if (user?.email_verified_at) {
        throw redirect(302, '/user/dashboard');
    }

    return {
        user
    };
}) satisfies PageServerLoad;

export const actions = {
    resend: async ({ cookies }) => {
        await requireAuth(cookies);

        const result = await resendVerification(cookies);

        if (!result.success) {
            return fail(422, {
                error: result.message || 'Failed to send verification email'
            });
        }

        return {
            success: true,
            message: result.message
        };
    }
} satisfies Actions;
