import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, '/auth/login');
    if (!locals.user.email_verified_at) redirect(302, '/user/profile');
};
