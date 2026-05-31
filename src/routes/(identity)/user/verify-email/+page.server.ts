import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { createIdentitySdk } from '$lib/sdk.server';

export const load = (async ({ locals, url, cookies }) => {
    if (locals.user?.email_verified_at) redirect(302, '/dashboard');

    const verifyUrl = url.searchParams.get('verify_url');

    if (verifyUrl) {
        const parsed = new URL(verifyUrl);
        const segments = parsed.pathname.split('/').filter(Boolean);

        const hash = segments.at(-1);
        const id = segments.at(-2);
        const expires = parsed.searchParams.get('expires') ?? '';
        const signature = parsed.searchParams.get('signature') ?? '';

        if (!id || !hash || !expires || !signature) {
            redirect(302, '/user/verify-email?error=invalid');
        }

        const sdk = createIdentitySdk(cookies);
        const result = await sdk.verificationVerify({
            path: { id, hash },
            query: { expires, signature },
            throwOnError: false,
        });

        if (result.error) {
            redirect(302, '/user/verify-email?error=failed');
        }

        redirect(302, '/dashboard?verified=1');
    }

}) satisfies PageServerLoad;

export const actions = {
    resend: async ({ cookies }) => {
        const sdk = createIdentitySdk(cookies);
        const result = await sdk.verificationSend({ throwOnError: false });

        if (result.error) {
            return fail(422, {
                error: result.error.message ?? 'Failed to send verification email',
            });
        }

        redirect(302, '/user/verify-email?sent=1');
    },
} satisfies Actions;