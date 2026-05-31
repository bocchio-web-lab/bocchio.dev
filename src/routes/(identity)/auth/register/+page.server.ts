import type { Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { createIdentitySdk } from '$lib/sdk.server';

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
                errors: {
                    name: !name ? ['Name is required'] : undefined,
                    email: !email ? ['Email is required'] : undefined,
                    password: !password ? ['Password is required'] : undefined,
                    password_confirmation: !password_confirmation ? ['Password confirmation is required'] : undefined,
                },
                name,
                email,
            });
        }

        if (password !== password_confirmation) {
            return fail(400, {
                error: 'Passwords do not match',
                errors: { password_confirmation: ['Passwords do not match'] },
                name,
                email,
            });
        }

        const sdk = createIdentitySdk(cookies);
        const csrf = await sdk.ensureCsrf();
        if (!csrf.ok) return fail(503, { error: csrf.error, errors: null, email });

        const result = await sdk.registerStore({
            body: { name, email, password, password_confirmation },
            throwOnError: false,
        });

        if (result.error) {
            const status = result.response?.status ?? 422;
            return fail(status, {
                error: result.error.message ?? 'Registration failed',
                errors: result.error.errors ?? null,
                name,
                email,
            });
        }

        redirect(302, '/dashboard');
    },
} satisfies Actions;