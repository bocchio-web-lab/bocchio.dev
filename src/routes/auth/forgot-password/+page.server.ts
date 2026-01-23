// src/routes/auth/forgot-password/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { forgotPassword, isAuthenticated } from '$lib/server/auth';

export const load = (async ({ cookies }) => {
    // Redirect if already authenticated
    if (await isAuthenticated(cookies)) {
        throw redirect(302, '/user/dashboard');
    }
    return {};
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();

        if (!email) {
            return fail(400, {
                error: 'Email is required',
                email
            });
        }

        const result = await forgotPassword(email, cookies);

        if (!result.success) {
            return fail(422, {
                error: result.message || 'Failed to send reset link',
                errors: result.errors,
                email
            });
        }

        return {
            success: true,
            message: result.message
        };
    }
} satisfies Actions;
