// src/lib/types/platform.ts
// Types for Platform Management API

export interface Service {
    id: number;
    name: string;
    slug: string;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Tenant {
    id: number;
    name: string;
    service_id: number;
    owner_id: number;
    public_slug: string;
    access_level: 'public' | 'private' | 'token_protected';
    public_api_key: string;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    service?: Service;
    users?: TenantMember[];
}

export interface TenantMember {
    id: number;
    name: string;
    email: string;
    pivot: {
        role: string;
    };
}

export interface CreateTenantRequest {
    name: string;
    service_id: number;
    public_slug?: string;
    access_level?: 'public' | 'private' | 'token_protected';
}

export interface UpdateTenantRequest {
    name?: string;
    public_slug?: string;
    access_level?: 'public' | 'private' | 'token_protected';
    regenerate_api_key?: boolean;
}
