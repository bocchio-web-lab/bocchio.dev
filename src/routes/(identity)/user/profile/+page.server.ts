import { fail, redirect } from '@sveltejs/kit';
import { createIdentitySdk } from '$lib/sdk.server';
import type { Actions } from './$types';

export const actions = {
    updateProfile: async ({ request, cookies }) => {
        const data = await request.formData();
        const name = data.get('name')?.toString().trim();
        const email = data.get('email')?.toString().trim();

        if (!name || !email) {
            return fail(400, {
                error: 'Name and email are required',
                errors: {
                    name: !name ? ['Name is required'] : undefined,
                    email: !email ? ['Email is required'] : undefined,
                },
                name,
                email,
            });
        }

        const sdk = createIdentitySdk(cookies);
        const csrf = await sdk.ensureCsrf();
        if (!csrf.ok) {
            return fail(503, {
                error: csrf.error,
                errors: null,
                name,
                email,
            });
        }

        const result = await sdk.client.put({
            url: '/user/profile-information',
            body: { name, email },
        });

        if (result.error) {
            return fail(result.response?.status ?? 422, {
                error: result.error.message ?? 'Failed to update profile',
                errors: result.error.errors ?? null,
                name,
                email,
            });
        }

        throw redirect(303, '/user/profile');
    },

    deleteAccount: async ({ cookies, locals }) => {
        const sdk = createIdentitySdk(cookies);

        try {
            await sdk.logout();
        } catch {
            return fail(503, {
                error: 'Could not reach authentication service',
            });
        } finally {
            locals.user = null;
            sdk.cookieManager.clearAuthCookies();
        }

        throw redirect(303, '/');
    },
} satisfies Actions;