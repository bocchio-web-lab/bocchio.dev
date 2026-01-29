// src/routes/auth/reset-password/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { createAuthService } from '$lib/api/auth.server';

export const load = (async ({ cookies, url }) => {
    const authService = createAuthService(cookies);
    // Redirect if already authenticated
    if (await authService.isAuthenticated()) {
        throw redirect(302, '/user/dashboard');
    }

    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');

    if (!token || !email) {
        throw redirect(302, '/auth/forgot-password');
    }

    return {
        token,
        email
    };
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const token = data.get('token')?.toString();
        const email = data.get('email')?.toString();
        const password = data.get('password')?.toString();
        const password_confirmation = data.get('password_confirmation')?.toString();

        if (!token || !email || !password || !password_confirmation) {
            return fail(400, {
                error: 'All fields are required',
                email
            });
        }

        if (password !== password_confirmation) {
            return fail(400, {
                error: 'Passwords do not match',
                email
            });
        }

        if (password.length < 8) {
            return fail(400, {
                error: 'Password must be at least 8 characters',
                email
            });
        }

        const authService = createAuthService(cookies);
        const result = await authService.resetPassword(token, email, password, password_confirmation);

        if (!result.success) {
            return fail(422, {
                error: result.message || 'Failed to reset password',
                errors: result.errors,
                email
            });
        }

        // Redirect to login on success
        throw redirect(302, '/auth/login?reset=success');
    }
} satisfies Actions;
