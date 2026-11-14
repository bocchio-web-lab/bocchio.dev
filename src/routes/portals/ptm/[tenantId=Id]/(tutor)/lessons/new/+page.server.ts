import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { createPtmSdk } from '$lib/sdk.server';
import { buildTenantHeaders, parseIdList, parseOptionalNumber, parseRequiredNumber } from '$lib/utils/ptm';

export const load: PageServerLoad = async ({ parent, cookies }) => {
    const { tenant } = await parent();
    const sdk = createPtmSdk(cookies);
    const headers = buildTenantHeaders(tenant.id);

    const [studentsResult, subjectsResult] = await Promise.all([
        sdk.studentsIndex({ query: { per_page: 50 }, headers } as any),
        sdk.subjectsIndex({ query: { per_page: 50 }, headers } as any),
    ]);

    return {
        students: studentsResult.data?.data ?? [],
        subjects: subjectsResult.data?.data ?? [],
    };
};

export const actions: Actions = {
    create: async ({ request, cookies, params }) => {
        const sdk = createPtmSdk(cookies);
        const formData = await request.formData();
        const tenantId = params.tenantId;

        const studentIds = formData.getAll('student_ids');

        for (const studentId of studentIds) {
            const response = await sdk.lessonsStore({
                body: {
                    student_id: studentId?.toString().trim() || null,
                    tutor_id: parseRequiredNumber(formData.get('tutor_id')),
                    lesson_date: formData.get('lesson_date')?.toString().trim() || null,
                    duration_minutes: parseRequiredNumber(formData.get('duration_minutes')),
                    topics: formData.get('topics')?.toString().trim() || null,
                    hourly_rate: parseOptionalNumber(formData.get('hourly_rate')),
                    extra_amount: parseOptionalNumber(formData.get('extra_amount')) ?? undefined,
                    notes: formData.get('notes')?.toString().trim() || null,
                    subject_ids: formData.getAll('subject_ids'),
                },
                headers: buildTenantHeaders(tenantId),
            } as any);

            if (response.error) {
                return fail(response.response?.status || 400, {
                    error: response.error.message || 'Failed to create lesson',
                });
            }
        }

        return { success: true };
    },
};