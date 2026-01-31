// src/routes/auth/verify-email/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { requireAuth, createAuthService } from '$lib/api/auth.server';

export const load = (async ({ cookies }) => {
    await requireAuth(cookies);

    const authService = createAuthService(cookies);
    const user = await authService.getUser();

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

        const authService = createAuthService(cookies);
        const result = await authService.resendVerification();

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
