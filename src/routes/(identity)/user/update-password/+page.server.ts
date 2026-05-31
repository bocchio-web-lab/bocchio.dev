import type { Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { createIdentitySdk } from '$lib/sdk.server';

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const current_password = data.get('current_password')?.toString();
        const password = data.get('password')?.toString();
        const password_confirmation = data.get('password_confirmation')?.toString();

        if (!current_password || !password || !password_confirmation) {
            return fail(400, {
                error: 'All fields are required',
                errors: {
                    current_password: !current_password ? ['Current password is required'] : undefined,
                    password: !password ? ['Password is required'] : undefined,
                    password_confirmation: !password_confirmation ? ['Password confirmation is required'] : undefined,
                },
                current_password,
                password,
                password_confirmation,
            });
        }

        if (password !== password_confirmation) {
            return fail(400, {
                error: 'Passwords do not match',
                errors: { password_confirmation: ['Passwords do not match'] },
                current_password,
                password,
                password_confirmation,
            });
        }

        const sdk = createIdentitySdk(cookies);
        const csrf = await sdk.ensureCsrf();
        if (!csrf.ok) return fail(503, { error: csrf.error, errors: null });

        const result = await sdk.userPasswordUpdate({
            body: {
                current_password,
                password,
                password_confirmation
            },
            throwOnError: false
        });

        if (result.error) {
            return fail(422, {
                error: result.error.message || 'Failed to reset password',
                errors: result.error.errors,
                current_password,
                password,
                password_confirmation,
            });
        }

        // Redirect to login on success
        throw redirect(302, '/auth/login?reset=success');
    }
} satisfies Actions;
