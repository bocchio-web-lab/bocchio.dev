export interface PtmDashboardStats {
    students?: {
        total?: number;
        active?: number;
        on_hold?: number;
        ended?: number;
    };
    tutors?: {
        total?: number;
        active?: number;
    };
    lessons?: {
        total?: number;
        completed?: number;
        planned?: number;
        pending_amount?: number;
        billed_amount?: number;
    };
    payments?: {
        count?: number;
        received_amount?: number;
    };
}

export interface PtmTutor {
    id: number;
    user_id?: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    hourly_rate?: number;
    currency?: string;
    is_active?: boolean;
}

export interface PtmStudent {
    id: number;
    external_code?: string;
    first_name: string;
    last_name: string;
    support_status?: string;
    birth_date?: string;
    email?: string;
    phone?: string;
    guardian_name?: string;
    guardian_phone?: string;
    default_subjects?: string[];
    default_hourly_rate?: number;
    default_extra_amount?: number;
}

export interface PtmAssignment {
    id: number;
    student_id: number;
    tutor_id: number;
    start_date?: string;
    end_date?: string | null;
    is_primary?: boolean;
    notes?: string;
    student?: PtmStudent;
    tutor?: PtmTutor;
}

export interface PtmLesson {
    id: number;
    student_id: number;
    tutor_id: number;
    assignment_id?: number | null;
    scheduled_at?: string;
    duration_minutes?: number;
    subject?: string;
    topics?: string;
    hourly_rate?: number;
    extra_amount?: number;
    computed_amount?: number;
    status?: string;
    is_paid?: boolean;
    paid_at?: string | null;
    notes?: string;
    student?: PtmStudent;
    tutor?: PtmTutor;
}

export interface PtmPayment {
    id: number;
    student_id: number;
    tutor_id?: number | null;
    received_at?: string;
    amount?: number;
    currency?: string;
    method?: string;
    reference?: string;
    notes?: string;
    student?: PtmStudent;
    tutor?: PtmTutor;
}
