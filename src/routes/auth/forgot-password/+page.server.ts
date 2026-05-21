import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { createIdentitySdk } from '$lib/sdk.server';

export const load = (async ({ locals }) => {
    if (locals.user) redirect(302, '/user/dashboard');
    return { user: null };
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();

        if (!email) return fail(400, { errors: { email: ['Email is required'] }, email });

        const sdk = createIdentitySdk(cookies);
        const csrf = await sdk.ensureCsrf();
        if (!csrf.ok) return fail(503, { error: csrf.error, errors: null, email });

        const result = await sdk.passwordEmail({
            body: { email },
            throwOnError: false
        });

        if (result.error) {
            return fail(422, {
                error: result.error.message || 'Failed to send reset link',
                errors: result.error.errors,
                email
            });
        }

        return {
            success: true,
            message: result.data?.message || 'Password reset link sent!'
        };
    }
} satisfies Actions;
