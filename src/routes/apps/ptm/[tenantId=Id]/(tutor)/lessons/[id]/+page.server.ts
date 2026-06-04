import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders, parseIdList, parseOptionalNumber, parseRequiredNumber } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies, params }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);
    const headers = buildTenantHeaders(tenant.id);

    const [lessonResult, studentsResult, subjectsResult] = await Promise.all([
        sdk.lessonsShow({ path: { lesson: Number(params.id) }, headers } as any),
        sdk.studentsIndex({ query: { per_page: 50 }, headers } as any),
        sdk.subjectsIndex({ query: { per_page: 50 }, headers } as any),
    ]);

    if (lessonResult.error || !lessonResult.data?.data) {
        throw error(404, 'Lesson not found');
    }

    return {
        lesson: lessonResult.data.data,
        students: studentsResult.data?.data ?? [],
        subjects: subjectsResult.data?.data ?? [],
    };
};

export const actions: Actions = {
    update: async ({ request, cookies, params }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = params.tenantId;

        const response = await sdk.lessonsUpdate({
            path: { lesson: Number(params.id) },
            body: {
                student_id: parseRequiredNumber(formData.get('student_id')),
                tutor_id: parseRequiredNumber(formData.get('tutor_id')),
                duration_minutes: parseRequiredNumber(formData.get('duration_minutes')),
                topics: formData.get('topics')?.toString().trim() || null,
                hourly_rate: parseOptionalNumber(formData.get('hourly_rate')),
                extra_amount: parseOptionalNumber(formData.get('extra_amount')) ?? undefined,
                notes: formData.get('notes')?.toString().trim() || null,
                subject_ids: parseIdList(formData.get('subject_ids')),
            },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to update lesson',
            });
        }

        return { success: true };
    },

    delete: async ({ cookies, params, request }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = formData.get('tenant_id')?.toString() ?? params.tenantId;

        const response = await sdk.lessonsDestroy({
            path: { lesson: Number(params.id) },
            headers: buildTenantHeaders(tenantId),
        } as any);

        if (response.error) {
            return fail(response.response?.status || 400, {
                error: response.error.message || 'Failed to delete lesson',
            });
        }

        throw redirect(303, `/apps/ptm/${params.tenantId}/lessons`);
    },
};