import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse<unknown>>) => {
        if (error.response?.status === 401) {
          // Token expired, trigger logout
          this.token = null;
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  // ============================================================================
  // AUTH
  // ============================================================================

  async login(email: string, password: string) {
    const response = await this.client.post<ApiResponse<{ user: any; token: string; refreshToken: string }>>('/auth/login', { email, password });
    return response.data;
  }

  async loginWithPin(userId: string, pin: string) {
    const response = await this.client.post<ApiResponse<{ user: any; token: string }>>('/auth/pin-login', { userId, pin });
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    this.token = null;
  }

  async getMe() {
    const response = await this.client.get<ApiResponse<any>>('/auth/me');
    return response.data;
  }

  async refreshToken(refreshToken: string) {
    const response = await this.client.post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', { refreshToken });
    return response.data;
  }

  // ============================================================================
  // DOMAINS
  // ============================================================================

  async getDomains() {
    const response = await this.client.get<ApiResponse<any[]>>('/domains');
    return response.data;
  }

  async getDomain(id: string) {
    const response = await this.client.get<ApiResponse<any>>(`/domains/${id}`);
    return response.data;
  }

  async getDomainUsers(domainId: string) {
    const response = await this.client.get<ApiResponse<any[]>>(`/domains/${domainId}/users`);
    return response.data;
  }

  // ============================================================================
  // USERS
  // ============================================================================

  async getUsers() {
    const response = await this.client.get<ApiResponse<any[]>>('/users');
    return response.data;
  }

  async getUser(id: string) {
    const response = await this.client.get<ApiResponse<any>>(`/users/${id}`);
    return response.data;
  }

  async getUserPerformance(userId: string, startDate: string, endDate: string) {
    const response = await this.client.get<ApiResponse<any[]>>(`/users/${userId}/performance`, {
      params: { startDate, endDate },
    });
    return response.data;
  }

  // ============================================================================
  // ITEMS
  // ============================================================================

  async getItems(params?: {
    step?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const response = await this.client.get<ApiResponse<any>>('/items', { params });
    return response.data;
  }

  async getItem(id: string) {
    const response = await this.client.get<ApiResponse<any>>(`/items/${id}`);
    return response.data;
  }

  async createItem(data: any) {
    const response = await this.client.post<ApiResponse<any>>('/items', data);
    return response.data;
  }

  async updateItem(id: string, data: any) {
    const response = await this.client.patch<ApiResponse<any>>(`/items/${id}`, data);
    return response.data;
  }

  async deleteItem(id: string) {
    const response = await this.client.delete<ApiResponse<any>>(`/items/${id}`);
    return response.data;
  }

  async uploadPhotos(itemId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));

    const response = await this.client.post<ApiResponse<any>>(`/items/${itemId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async deletePhoto(itemId: string, photoId: string) {
    const response = await this.client.delete<ApiResponse<any>>(`/items/${itemId}/photos/${photoId}`);
    return response.data;
  }

  async completeStep(itemId: string, step: string, action: string, data?: any) {
    const response = await this.client.post<ApiResponse<any>>(`/items/${itemId}/step`, {
      step,
      action,
      ...data,
    });
    return response.data;
  }

  async redoStep(itemId: string, step: string, context: string) {
    const response = await this.client.post<ApiResponse<any>>(`/items/${itemId}/redo`, {
      step,
      context,
    });
    return response.data;
  }

  // ============================================================================
  // AI
  // ============================================================================

  async identifyItem(itemId: string) {
    const response = await this.client.post<ApiResponse<any>>('/ai/identify', { itemId });
    return response.data;
  }

  async populateItem(itemId: string) {
    const response = await this.client.post<ApiResponse<any>>('/ai/populate', { itemId });
    return response.data;
  }

  async priceItem(itemId: string) {
    const response = await this.client.post<ApiResponse<any>>('/ai/price', { itemId });
    return response.data;
  }

  async analyzePhoto(photoData: string) {
    const response = await this.client.post<ApiResponse<any>>('/ai/analyze-photo', { photoData });
    return response.data;
  }

  // ============================================================================
  // LISTINGS
  // ============================================================================

  async createListing(itemId: string, ebayAccountId: string, options?: any) {
    const response = await this.client.post<ApiResponse<any>>('/listings', {
      itemId,
      ebayAccountId,
      ...options,
    });
    return response.data;
  }

  async getListing(id: string) {
    const response = await this.client.get<ApiResponse<any>>(`/listings/${id}`);
    return response.data;
  }

  async endListing(id: string) {
    const response = await this.client.delete<ApiResponse<any>>(`/listings/${id}`);
    return response.data;
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async getTemplates(params?: { search?: string; tags?: string[] }) {
    const response = await this.client.get<ApiResponse<any[]>>('/templates', { params });
    return response.data;
  }

  async getTemplate(id: string) {
    const response = await this.client.get<ApiResponse<any>>(`/templates/${id}`);
    return response.data;
  }

  async createTemplate(data: any) {
    const response = await this.client.post<ApiResponse<any>>('/templates', data);
    return response.data;
  }

  async updateTemplate(id: string, data: any) {
    const response = await this.client.patch<ApiResponse<any>>(`/templates/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: string) {
    const response = await this.client.delete<ApiResponse<any>>(`/templates/${id}`);
    return response.data;
  }

  async createTemplateFromEbay(ebayItemId: string, name: string) {
    const response = await this.client.post<ApiResponse<any>>('/templates/from-ebay', {
      ebayItemId,
      name,
    });
    return response.data;
  }

  async useTemplate(templateId: string, placeholders: Record<string, string>) {
    const response = await this.client.post<ApiResponse<any>>(`/templates/${templateId}/use`, {
      placeholders,
    });
    return response.data;
  }

  // ============================================================================
  // SELL SIMILAR
  // ============================================================================

  async fetchEbayListing(ebayItemId: string) {
    const response = await this.client.get<ApiResponse<any>>(`/sell-similar/fetch/${ebayItemId}`);
    return response.data;
  }

  async createFromEbayListing(ebayItemId: string, options?: { copyFields?: string[]; saveAsTemplate?: string }) {
    const response = await this.client.post<ApiResponse<any>>('/sell-similar/create', {
      ebayItemId,
      ...options,
    });
    return response.data;
  }

  // ============================================================================
  // INVENTORY
  // ============================================================================

  async getWarehouses() {
    const response = await this.client.get<ApiResponse<any[]>>('/warehouses');
    return response.data;
  }

  async getWarehouseLocations(warehouseId: string) {
    const response = await this.client.get<ApiResponse<any[]>>(`/warehouses/${warehouseId}/locations`);
    return response.data;
  }

  async assignLocation(itemId: string, locationId: string) {
    const response = await this.client.post<ApiResponse<any>>('/inventory/assign', {
      itemId,
      locationId,
    });
    return response.data;
  }

  async searchInventory(params: { warehouseId?: string; locationCode?: string; query?: string }) {
    const response = await this.client.get<ApiResponse<any[]>>('/inventory/search', { params });
    return response.data;
  }

  // ============================================================================
  // RESEARCH
  // ============================================================================

  async searchSoldItems(query: string, options?: { minPrice?: number; maxPrice?: number; limit?: number }) {
    const response = await this.client.post<ApiResponse<any[]>>('/research/sold', { query, ...options });
    return response.data;
  }

  async getPriceStats(query: string) {
    const response = await this.client.get<ApiResponse<any>>('/research/price-stats', { params: { query } });
    return response.data;
  }

  async suggestPrice(itemId: string) {
    const response = await this.client.post<ApiResponse<any>>('/research/suggest-price', { itemId });
    return response.data;
  }

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  async getDashboardStats() {
    const response = await this.client.get<ApiResponse<any>>('/dashboard/stats');
    return response.data;
  }

  async getRecentActivity(limit = 10) {
    const response = await this.client.get<ApiResponse<any[]>>('/dashboard/activity', { params: { limit } });
    return response.data;
  }

  // ============================================================================
  // EBAY ACCOUNTS
  // ============================================================================

  async getEbayAccounts() {
    const response = await this.client.get<ApiResponse<any[]>>('/ebay-accounts');
    return response.data;
  }

  async getEbayAccount(id: string) {
    const response = await this.client.get<ApiResponse<any>>(`/ebay-accounts/${id}`);
    return response.data;
  }

  // ============================================================================
  // SYNC
  // ============================================================================

  async getSyncStatus() {
    const response = await this.client.get<ApiResponse<any>>('/sync/status');
    return response.data;
  }

  async pushChanges(changes: any[]) {
    const response = await this.client.post<ApiResponse<any>>('/sync/push', { changes });
    return response.data;
  }

  async pullChanges(since?: string) {
    const response = await this.client.get<ApiResponse<any>>('/sync/pull', { params: { since } });
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
