// src/routes/auth/register/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { createAuthService } from '$lib/api/auth.server';

export const load = (async ({ cookies }) => {
    const authService = createAuthService(cookies);
    // Redirect if already authenticated
    if (await authService.isAuthenticated()) {
        throw redirect(302, '/user/dashboard');
    }
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const name = data.get('name')?.toString();
        const email = data.get('email')?.toString();
        const password = data.get('password')?.toString();
        const password_confirmation = data.get('password_confirmation')?.toString();

        if (!name || !email || !password || !password_confirmation) {
            return fail(400, {
                error: 'All fields are required',
                name,
                email
            });
        }

        if (password !== password_confirmation) {
            return fail(400, {
                error: 'Passwords do not match',
                name,
                email
            });
        }

        const authService = createAuthService(cookies);
        const result = await authService.register({
            name,
            email,
            password,
            password_confirmation
        });

        if (!result.success) {
            return fail(422, {
                error: result.message || 'Registration failed',
                errors: result.errors,
                name,
                email
            });
        }

        // Redirect to dashboard on success (Laravel Fortify auto-logs in after registration)
        throw redirect(302, '/user/dashboard');
    }
} satisfies Actions;