// src/lib/api/tenant-api.ts
import { httpClient, type HttpResponse } from './http-client';
import type { Service, Tenant, CreateTenantRequest, UpdateTenantRequest } from '$lib/types/platform';

/**
 * Platform Management API - Services and Tenants
 */
export class TenantApi {
    /**
     * Get all available services
     */
    async getServices(): Promise<HttpResponse<{ data: Service[] }>> {
        return httpClient.get('/api/manage/services');
    }

    /**
     * Get user's tenants
     */
    async getTenants(): Promise<HttpResponse<{ data: Tenant[] }>> {
        return httpClient.get('/api/manage/tenants');
    }

    /**
     * Create a new tenant
     */
    async createTenant(data: CreateTenantRequest): Promise<HttpResponse<{ data: Tenant }>> {
        return httpClient.post('/api/manage/tenants', data);
    }

    /**
     * Get tenant details
     */
    async getTenant(id: number): Promise<HttpResponse<{ data: Tenant }>> {
        return httpClient.get(`/api/manage/tenants/${id}`);
    }

    /**
     * Update tenant
     */
    async updateTenant(
        id: number,
        data: UpdateTenantRequest
    ): Promise<HttpResponse<{ data: Tenant }>> {
        return httpClient.put(`/api/manage/tenants/${id}`, data);
    }

    /**
     * Delete tenant
     */
    async deleteTenant(id: number): Promise<HttpResponse<{ message: string }>> {
        return httpClient.delete(`/api/manage/tenants/${id}`);
    }
}

// Export a singleton instance
export const tenantApi = new TenantApi();
