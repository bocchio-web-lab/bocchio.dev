// src/lib/types/cms.ts
// Types for CMS Management API

export type ContentType = 'post' | 'page' | 'project';
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface Author {
    id: number;
    name: string;
    email: string;
}

export interface Tag {
    id: number;
    tenant_id?: number;
    name: string;
    slug: string;
    created_at?: string;
    updated_at?: string;
    content_items_count?: number;
}

export interface Comment {
    id: number;
    content_item_id: number;
    author_id: number;
    body: string;
    approved: boolean;
    created_at: string;
    updated_at: string;
    content_item?: {
        id: number;
        title: string;
        slug: string;
    };
    author?: Author;
}

export interface ContentItem {
    id: number;
    tenant_id: number;
    type: ContentType;
    title: string;
    slug: string;
    excerpt?: string;
    body: string;
    status: ContentStatus;
    author_id: number;
    published_at?: string;
    meta?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    author?: Author;
    tags?: Tag[];
    comments?: Comment[];
}

export interface CreateContentRequest {
    type: ContentType;
    title: string;
    slug?: string;
    excerpt?: string;
    body: string;
    status?: ContentStatus;
    published_at?: string;
    meta?: Record<string, unknown>;
    tags?: number[];
}

export interface UpdateContentRequest {
    title?: string;
    slug?: string;
    excerpt?: string;
    body?: string;
    status?: ContentStatus;
    published_at?: string;
    meta?: Record<string, unknown>;
    tags?: number[];
}

export interface CreateTagRequest {
    name: string;
    slug?: string;
}

export interface UpdateTagRequest {
    name?: string;
    slug?: string;
}

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    per_page: number;
    total: number;
    last_page?: number;
    from?: number;
    to?: number;
}
