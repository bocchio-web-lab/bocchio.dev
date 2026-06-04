import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createPtmSdk } from '$lib/sdk.server';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();

    if (!tenant) {
        throw error(400, 'Tenant context is missing');
    }

    const sdk = createPtmSdk(cookies);
    const headers = { 'X-Tenant-ID': tenant.id.toString() };
    const tutorId = tenant.owner_id;

    const [dashboardResult, lessonsResult, paymentsResult, studentsResult, subjectsResult] = await Promise.all([
        sdk.dashboardTutor({ path: { tutorId }, headers } as any),
        sdk.lessonsIndex({ query: { tutor_id: tutorId, per_page: 5 }, headers } as any),
        sdk.paymentsIndex({ query: { tutor_id: tutorId, per_page: 5 }, headers } as any),
        sdk.studentsIndex({ query: { per_page: 5 }, headers } as any),
        sdk.subjectsIndex({ query: { per_page: 5 }, headers } as any),
    ]);

    if (dashboardResult.error || !dashboardResult.data?.data) {
        throw error(500, 'Failed to load PTM dashboard');
    }

    return {
        dashboard: dashboardResult.data.data,
        recentLessons: lessonsResult.data?.data ?? [],
        recentPayments: paymentsResult.data?.data ?? [],
        students: studentsResult.data?.data ?? [],
        subjects: subjectsResult.data?.data ?? [],
    };
};