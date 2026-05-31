import type { Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { createIdentitySdk } from '$lib/sdk.server';

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();
        const password = data.get('password')?.toString();

        if (!email || !password) {
            return fail(400, {
                errors: {
                    email: !email ? ['Email is required'] : undefined,
                    password: !password ? ['Password is required'] : undefined,
                },
                email,
            });
        }

        const sdk = createIdentitySdk(cookies);
        const csrf = await sdk.ensureCsrf();
        if (!csrf.ok) return fail(503, { error: csrf.error, errors: null, email });

        const result = await sdk.loginStore({
            body: { email, password },
            throwOnError: false,
        });

        if (result.error) {
            const status = result.response?.status ?? 401;
            return fail(status, {
                error: result.error.message ?? 'Invalid credentials',
                errors: result.error.errors ?? null,
                email,
            });
        }

        redirect(302, '/dashboard');
    },
} satisfies Actions;