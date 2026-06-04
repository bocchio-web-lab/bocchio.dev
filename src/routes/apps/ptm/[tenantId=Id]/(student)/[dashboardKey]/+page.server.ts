import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createClient } from '$lib/sdk/ptm/client';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { dashboardStudent } from '$lib/sdk/ptm';
import { safeJsonParse } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ params }) => {
    const client = createClient({ baseUrl: `${PUBLIC_API_BASE_URL}/ptm` });
    const result = await dashboardStudent({
        client,
        path: { dashboardKey: params.dashboardKey },
    });

    if (result.error || !result.data?.data) {
        throw error(404, 'Student not found.');
    }

    const dashboard = result.data.data;

    return {
        student: safeJsonParse<Record<string, unknown>>(dashboard.student) ?? dashboard.student,
        stats: dashboard.stats,
        recentLessons: safeJsonParse<Array<Record<string, unknown>>>(dashboard.recent_lessons) ?? [],
        recentPayments: safeJsonParse<Array<Record<string, unknown>>>(dashboard.recent_payments) ?? [],
    };
};