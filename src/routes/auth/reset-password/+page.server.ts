import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { createIdentitySdk } from '$lib/sdk.server';

export const load = (async ({ url, locals }) => {

    if (locals.user) redirect(302, '/user/dashboard');

    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');
    if (!token || !email) throw redirect(302, '/auth/forgot-password');

    return { user: null, token, email };

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
                errors: {
                    token: !token ? ['Token is required'] : undefined,
                    email: !email ? ['Email is required'] : undefined,
                    password: !password ? ['Password is required'] : undefined,
                    password_confirmation: !password_confirmation ? ['Password confirmation is required'] : undefined,
                },
                token,
                email,
            });
        }

        if (password !== password_confirmation) {
            return fail(400, {
                error: 'Passwords do not match',
                errors: { password_confirmation: ['Passwords do not match'] },
                token,
                email,
            });
        }

        const sdk = createIdentitySdk(cookies);
        const csrf = await sdk.ensureCsrf();
        if (!csrf.ok) return fail(503, { error: csrf.error, errors: null, email });

        const result = await sdk.passwordUpdate({
            body: {
                token,
                email,
                password,
                password_confirmation
            },
            throwOnError: false
        });

        if (result.error) {
            return fail(422, {
                error: result.error.message || 'Failed to reset password',
                errors: result.error.errors,
                token,
                email
            });
        }

        // Redirect to login on success
        throw redirect(302, '/auth/login?reset=success');
    }
} satisfies Actions;
