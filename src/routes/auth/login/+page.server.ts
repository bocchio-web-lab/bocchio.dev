// src/routes/auth/login/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { login, isAuthenticated } from '$lib/server/auth';

export const load = (async ({ cookies }) => {
    // Redirect if already authenticated
    if (await isAuthenticated(cookies)) {
        throw redirect(302, '/user/dashboard');
    }
    return {
        user: null
    };
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();
        const password = data.get('password')?.toString();

        if (!email || !password) {
            return fail(400, {
                error: 'Email and password are required',
                email
            });
        }

        const result = await login(email, password, cookies);

        if (!result.success) {
            return fail(401, {
                error: result.message || 'Invalid credentials',
                errors: result.errors,
                email
            });
        }

        // Redirect to dashboard on success
        throw redirect(302, '/user/dashboard');
    }
} satisfies Actions;