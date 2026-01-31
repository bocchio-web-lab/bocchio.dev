// src/routes/auth/logout/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createAuthService } from '$lib/api/auth.server';

export const load = (() => {
    // This page should only be accessed via POST action
    throw redirect(302, '/');
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ cookies }) => {
        const authService = createAuthService(cookies);
        await authService.logout();
        throw redirect(302, '/');
    }
} satisfies Actions;