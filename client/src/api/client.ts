import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private dashboardClient: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.dashboardClient = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    const addAuth = (config: Parameters<Parameters<typeof this.client.interceptors.request.use>[0]>[0]) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    };

    const handleAuthError = (error: AxiosError<ApiResponse<unknown>>) => {
      if (error.response?.status === 401) {
        this.token = null;
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      return Promise.reject(error);
    };

    this.client.interceptors.request.use(addAuth);
    this.client.interceptors.response.use((r) => r, handleAuthError);

    this.dashboardClient.interceptors.request.use(addAuth);
    this.dashboardClient.interceptors.response.use((r) => r, handleAuthError);
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
    const response = await this.client.post<ApiResponse<{ user: unknown; token: string; refreshToken: string }>>('/auth/login', { email, password });
    return response.data;
  }

  async loginWithPin(userId: string, pin: string) {
    const response = await this.client.post<ApiResponse<{ user: unknown; token: string }>>('/auth/pin-login', { userId, pin });
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    this.token = null;
  }

  async getMe() {
    const response = await this.client.get<ApiResponse<unknown>>('/auth/me');
    return response.data;
  }

  async refreshToken(refreshToken: string) {
    const response = await this.client.post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', { refreshToken });
    return response.data;
  }

  // ============================================================================
  // ITEMS (API v1)
  // ============================================================================

  async getItems(params?: {
    step?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const response = await this.client.get<ApiResponse<unknown>>('/items', { params });
    return response.data;
  }

  async getItem(id: string) {
    const response = await this.client.get<ApiResponse<unknown>>(`/items/${id}`);
    return response.data;
  }

  async createItem(data: Record<string, unknown>) {
    const response = await this.client.post<ApiResponse<unknown>>('/items', data);
    return response.data;
  }

  async updateItem(id: string, data: Record<string, unknown>) {
    const response = await this.client.patch<ApiResponse<unknown>>(`/items/${id}`, data);
    return response.data;
  }

  async deleteItem(id: string) {
    const response = await this.client.delete<ApiResponse<unknown>>(`/items/${id}`);
    return response.data;
  }

  async uploadPhotos(itemId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));

    const response = await this.client.post<ApiResponse<unknown>>(`/items/${itemId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async deletePhoto(itemId: string, photoId: string) {
    const response = await this.client.delete<ApiResponse<unknown>>(`/items/${itemId}/photos/${photoId}`);
    return response.data;
  }

  async completeStep(itemId: string, step: string, action: string, data?: Record<string, unknown>) {
    const response = await this.client.post<ApiResponse<unknown>>(`/items/${itemId}/step`, {
      step,
      action,
      ...data,
    });
    return response.data;
  }

  async redoStep(itemId: string, step: string, context: string) {
    const response = await this.client.post<ApiResponse<unknown>>(`/items/${itemId}/redo`, {
      step,
      context,
    });
    return response.data;
  }

  // ============================================================================
  // AI
  // ============================================================================

  async identifyItem(itemId: string) {
    const response = await this.client.post<ApiResponse<unknown>>('/ai/identify', { itemId });
    return response.data;
  }

  async populateItem(itemId: string) {
    const response = await this.client.post<ApiResponse<unknown>>('/ai/populate', { itemId });
    return response.data;
  }

  async priceItem(itemId: string) {
    const response = await this.client.post<ApiResponse<unknown>>('/ai/price', { itemId });
    return response.data;
  }

  async analyzePhoto(photoData: string) {
    const response = await this.client.post<ApiResponse<unknown>>('/ai/analyze-photo', { photoData });
    return response.data;
  }

  // ============================================================================
  // LISTINGS
  // ============================================================================

  async createListing(itemId: string, ebayAccountId: string, options?: Record<string, unknown>) {
    const response = await this.client.post<ApiResponse<unknown>>('/listings', {
      itemId,
      ebayAccountId,
      ...options,
    });
    return response.data;
  }

  async getListing(id: string) {
    const response = await this.client.get<ApiResponse<unknown>>(`/listings/${id}`);
    return response.data;
  }

  async endListing(id: string) {
    const response = await this.client.delete<ApiResponse<unknown>>(`/listings/${id}`);
    return response.data;
  }

  // ============================================================================
  // TEMPLATES (API v1)
  // ============================================================================

  async getTemplates(params?: { search?: string; tags?: string[] }) {
    const response = await this.client.get<ApiResponse<unknown[]>>('/templates', { params });
    return response.data;
  }

  async getTemplate(id: string) {
    const response = await this.client.get<ApiResponse<unknown>>(`/templates/${id}`);
    return response.data;
  }

  async createTemplate(data: Record<string, unknown>) {
    const response = await this.client.post<ApiResponse<unknown>>('/templates', data);
    return response.data;
  }

  async updateTemplate(id: string, data: Record<string, unknown>) {
    const response = await this.client.patch<ApiResponse<unknown>>(`/templates/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: string) {
    const response = await this.client.delete<ApiResponse<unknown>>(`/templates/${id}`);
    return response.data;
  }

  async createTemplateFromEbay(ebayItemId: string, name: string) {
    const response = await this.client.post<ApiResponse<unknown>>('/templates/from-ebay', {
      ebayItemId,
      name,
    });
    return response.data;
  }

  async useTemplate(templateId: string, placeholders: Record<string, string>) {
    const response = await this.client.post<ApiResponse<unknown>>(`/templates/${templateId}/use`, {
      placeholders,
    });
    return response.data;
  }

  // ============================================================================
  // SELL SIMILAR (API v1)
  // ============================================================================

  async fetchEbayListing(ebayItemId: string) {
    const response = await this.client.get<ApiResponse<unknown>>(`/sell-similar/fetch/${ebayItemId}`);
    return response.data;
  }

  async createFromEbayListing(ebayItemId: string, options?: { copyFields?: string[]; saveAsTemplate?: string }) {
    const response = await this.client.post<ApiResponse<unknown>>('/sell-similar/create', {
      ebayItemId,
      ...options,
    });
    return response.data;
  }

  // ============================================================================
  // INVENTORY (API v1)
  // ============================================================================

  async getInventory(params?: { location?: string; stage?: string; search?: string; page?: number; limit?: number }) {
    const response = await this.client.get<ApiResponse<unknown[]>>('/inventory', { params });
    return response.data;
  }

  async getWarehouses() {
    const response = await this.client.get<ApiResponse<unknown[]>>('/inventory/locations');
    return response.data;
  }

  async getWarehouseLocations(warehouseId: string) {
    const response = await this.client.get<ApiResponse<unknown[]>>(`/inventory/locations`);
    return response.data;
  }

  async assignLocation(itemId: string, locationId: string) {
    const response = await this.client.post<ApiResponse<unknown>>('/inventory/assign', {
      itemId,
      locationId,
    });
    return response.data;
  }

  async searchInventory(params: { warehouseId?: string; locationCode?: string; query?: string }) {
    const response = await this.client.get<ApiResponse<unknown[]>>('/inventory/search', { params });
    return response.data;
  }

  // ============================================================================
  // RESEARCH
  // ============================================================================

  async searchSoldItems(query: string, options?: { minPrice?: number; maxPrice?: number; limit?: number }) {
    const response = await this.dashboardClient.post<ApiResponse<unknown[]>>('/sold-data/search', { query, ...options });
    return response.data;
  }

  async getPriceStats(query: string) {
    const response = await this.dashboardClient.get<ApiResponse<unknown>>('/sold-data/price-stats', { params: { q: query } });
    return response.data;
  }

  async suggestPrice(title: string, condition?: string) {
    const response = await this.dashboardClient.post<ApiResponse<unknown>>('/sold-data/suggest-price', { title, condition });
    return response.data;
  }

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  async getDashboardStats() {
    const response = await this.dashboardClient.get<ApiResponse<unknown>>('/dashboard/stats');
    return response.data;
  }

  async getRecentActivity(limit = 10) {
    const response = await this.dashboardClient.get<ApiResponse<unknown[]>>('/dashboard/activity', { params: { limit } });
    return response.data;
  }

  async getQueue() {
    const response = await this.dashboardClient.get<ApiResponse<unknown>>('/dashboard/queue');
    return response.data;
  }

  async getDashboardItem(id: string) {
    const response = await this.dashboardClient.get<ApiResponse<unknown>>(`/dashboard/item/${id}`);
    return response.data;
  }

  async updateDashboardItem(id: string, data: Record<string, unknown>) {
    const response = await this.dashboardClient.put<ApiResponse<unknown>>(`/dashboard/item/${id}`, data);
    return response.data;
  }

  async advanceItem(id: string, notes?: string) {
    const response = await this.dashboardClient.post<ApiResponse<unknown>>(`/dashboard/item/${id}/advance`, { notes });
    return response.data;
  }

  async rejectItem(id: string, reason: string) {
    const response = await this.dashboardClient.post<ApiResponse<unknown>>(`/dashboard/item/${id}/reject`, { reason });
    return response.data;
  }

  async bulkAdvanceItems(itemIds: string[], targetStage?: string) {
    const response = await this.dashboardClient.post<ApiResponse<unknown>>('/dashboard/items/bulk-advance', { itemIds, targetStage });
    return response.data;
  }

  async bulkPriceItems(itemIds: string[], priceAdjustment?: { type: string; value?: number; startingPrice?: number; buyNowPrice?: number }) {
    const response = await this.dashboardClient.post<ApiResponse<unknown>>('/dashboard/items/bulk-price', { itemIds, priceAdjustment });
    return response.data;
  }

  // ============================================================================
  // REPORTS
  // ============================================================================

  async getReports(range = '30d') {
    const response = await this.dashboardClient.get<ApiResponse<unknown>>('/dashboard/reports', { params: { range } });
    return response.data;
  }

  async exportReports(range = '30d', format = 'json') {
    const response = await this.dashboardClient.get<ApiResponse<unknown>>('/dashboard/reports/export', { params: { range, format } });
    return response.data;
  }

  // ============================================================================
  // LISTINGS (Dashboard)
  // ============================================================================

  async getActiveListings() {
    const response = await this.dashboardClient.get<ApiResponse<unknown[]>>('/dashboard/listings/active');
    return response.data;
  }

  async getSoldListings() {
    const response = await this.dashboardClient.get<ApiResponse<unknown[]>>('/dashboard/listings/sold');
    return response.data;
  }

  async getListingStats() {
    const response = await this.dashboardClient.get<ApiResponse<unknown>>('/dashboard/listings/stats');
    return response.data;
  }

  // ============================================================================
  // EBAY ACCOUNTS
  // ============================================================================

  async getEbayAccounts() {
    const response = await this.client.get<ApiResponse<unknown[]>>('/ebay/status');
    return response.data;
  }

  async getEbayAccount(id: string) {
    const response = await this.client.get<ApiResponse<unknown>>(`/ebay/status`);
    return response.data;
  }

  async getEbayStatus() {
    const response = await this.client.get<ApiResponse<unknown>>('/ebay/status');
    return response.data;
  }

  // ============================================================================
  // SYNC (placeholder)
  // ============================================================================

  async getSyncStatus() {
    return { success: true, data: { status: 'idle', lastSync: null } };
  }

  async pushChanges(changes: unknown[]) {
    return { success: true, data: { pushed: changes.length } };
  }

  async pullChanges(since?: string) {
    return { success: true, data: { changes: [] } };
  }
}

export const api = new ApiClient();
export default api;
