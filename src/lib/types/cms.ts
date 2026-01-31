// src/lib/types/cms.ts

/* ============================================================
   Core Enums
============================================================ */

export type ContentType = 'post' | 'page' | 'project';
export type ContentStatus = 'draft' | 'published' | 'archived';


/* ============================================================
   Shared / Utility Types
============================================================ */

export interface Timestamped {
    created_at: string;
    updated_at: string;
}

export interface Identifiable {
    id: number;
}


/* ============================================================
   Author
============================================================ */

export interface Author extends Identifiable {
    name: string;
    email: string;
}


/* ============================================================
   Tags
============================================================ */

export interface Tag extends Identifiable, Partial<Timestamped> {
    tenant_id?: number;
    name: string;
    slug: string;
    content_items_count?: number;
}


/* ============================================================
   Comments
============================================================ */

export interface Comment extends Identifiable, Timestamped {
    content_item_id: number;
    author_id: number;
    body: string;
    approved: boolean;

    content_item?: Pick<ContentItemBase, 'id' | 'title' | 'slug'>;
    author?: Author;
}


/* ============================================================
   Meta Models
============================================================ */

export interface ProjectMeta {
    headerImages: string[];
    externalLinks?: { title: string; url: string }[];
}

export interface AppMeta {
    headerImages: string[];
    externalLinks?: { title: string; url: string }[];
}


/* ============================================================
   Content Items
============================================================ */

interface ContentItemBase extends Identifiable, Timestamped {
    tenant_id: number;

    title: string;
    slug: string;
    excerpt?: string;
    body: string;

    status: ContentStatus;
    author_id: number;
    published_at?: string;

    author?: Author;
    tags?: Tag[];
    comments?: Comment[];
}


/* ---------- Variants ---------- */

export interface ProjectContentItem extends ContentItemBase {
    type: 'project';
    meta: ProjectMeta;
}

export interface AppContentItem extends ContentItemBase {
    type: 'app';
    meta: AppMeta;
}

export interface PostContentItem extends ContentItemBase {
    type: 'post';
    meta: null;
}


export type ContentItem =
    | ProjectContentItem
    | PostContentItem
    | AppContentItem;


/* ============================================================
   Create / Update DTOs (Discriminated)
============================================================ */

interface BaseContentRequest {
    title: string;
    slug?: string;
    excerpt?: string;
    body: string;
    status?: ContentStatus;
    published_at?: string;
    tags?: number[];
}

/* ---------- Create ---------- */

export type CreateContentRequest =
    | (BaseContentRequest & {
        type: 'project';
        meta: ProjectMeta;
    })
    | (BaseContentRequest & {
        type: 'post' | 'app';
        meta?: null;
    });

/* ---------- Update ---------- */

export type UpdateContentRequest =
    | (Partial<BaseContentRequest> & {
        type: 'project';
        meta?: ProjectMeta;
    })
    | (Partial<BaseContentRequest> & {
        type: 'post' | 'page';
        meta?: null;
    });


/* ============================================================
   Tag DTOs
============================================================ */

export interface CreateTagRequest {
    name: string;
    slug?: string;
}

export interface UpdateTagRequest {
    name?: string;
    slug?: string;
}


/* ============================================================
   Pagination
============================================================ */

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    per_page: number;
    total: number;
    last_page?: number;
    from?: number;
    to?: number;
}
