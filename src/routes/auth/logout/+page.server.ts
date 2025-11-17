// src/routes/auth/logout/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { logout } from '$lib/server/auth';

export const load = (() => {
    // This page should only be accessed via POST action
    throw redirect(302, '/');
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ cookies }) => {
        await logout(cookies);
        throw redirect(302, '/');
    }
} satisfies Actions;