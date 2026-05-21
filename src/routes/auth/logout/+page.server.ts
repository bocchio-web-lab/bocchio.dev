import { fail, redirect } from '@sveltejs/kit';
import { createIdentitySdk } from '$lib/sdk.server';
import type { Actions, PageServerLoad } from './$types';

// This page should only be accessed via POST action, so we redirect any GET requests back to home
export const load = (() => {
    throw redirect(302, '/');
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ cookies, locals }) => {

        const sdk = createIdentitySdk(cookies);
        try {
            await sdk.logout();
        } catch (error) {
            fail(503, { error: 'Could not reach authentication service' });
        } finally {
            locals.user = null;
            sdk.cookieManager.clearAuthCookies();
        }

        throw redirect(302, '/');
    }
} satisfies Actions;