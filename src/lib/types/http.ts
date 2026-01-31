// src/lib/types/http.ts

/**
 * Standard HTTP error structure
 */
export interface HttpError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

/**
 * Standard HTTP response wrapper
 */
export interface HttpResponse<T = any> {
  data?: T;
  error?: HttpError;
  ok?: boolean;
  status?: number;
}

/**
 * Auth response structure
 */
export interface AuthResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * User interface
 */
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Standard request options
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  tenantId?: number;
  requireAuth?: boolean;
}
