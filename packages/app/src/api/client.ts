declare const chrome: any; // ambient — present only in the extension bundle

const BASE = '/api/v1';

// Extension context: the same SPA is bundled into the extension as a
// chrome-extension:// page (Standards §1: the plugin is the front door).
// There, API calls need an absolute origin + Bearer from the service
// worker's session storage; login routes through the SW so it can also
// self-provision the machine key. In plain web-dev mode (vite) everything
// stays relative + cookie-based.
const EXT: boolean =
  typeof chrome !== 'undefined' && Boolean((chrome as any).storage?.session);

let apiOriginCache = '';
export async function initApiOrigin(): Promise<void> {
  if (!EXT) return;
  const { baseUrl } = await (chrome as any).storage.sync.get('baseUrl');
  apiOriginCache = ((baseUrl as string) || 'http://localhost:3005').replace(/\/$/, '');
}
export function apiOrigin(): string {
  return apiOriginCache;
}

function swSend<T>(msg: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    (chrome as any).runtime.sendMessage(msg, (res: T) => {
      const err = (chrome as any).runtime.lastError;
      if (err) return reject(new Error(err.message));
      resolve(res);
    });
  });
}

export class AuthError extends Error {
  constructor() {
    super('unauthenticated');
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  if (!EXT) return {};
  const { jwt } = await (chrome as any).storage.session.get('jwt');
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiOrigin()}${BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    throw new AuthError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export interface Me {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  canListOnEbay?: boolean;
  isAdmin: boolean;
}

function withAdmin(u: Omit<Me, 'isAdmin'>): Me {
  return { ...u, isAdmin: u.role === 'admin' };
}

export const api = {
  login: async (email: string, password: string): Promise<{ token?: string; user: Me }> => {
    if (EXT) {
      // Through the SW: stores JWT + provisions the machine key.
      const res = await swSend<{ ok: boolean; error?: string; user?: Omit<Me, 'isAdmin'> }>({
        type: 'login',
        email,
        pin: password,
      });
      if (!res.ok || !res.user) throw new Error(res.error || 'Login failed');
      return { user: withAdmin(res.user) };
    }
    const out = await http<{ token: string; user: Omit<Me, 'isAdmin'> }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, pin: password }),
    });
    return { token: out.token, user: withAdmin(out.user) };
  },
  logout: async (): Promise<{ ok: true }> => {
    if (EXT) await swSend({ type: 'logout' }).catch(() => undefined);
    return http<{ ok: true }>('/auth/logout', { method: 'POST' });
  },
  me: async (): Promise<Me> => withAdmin(await http<Omit<Me, 'isAdmin'>>('/auth/me')),
  listItems: (params?: { q?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.status) qs.set('status', params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return http<{ items: ItemRow[]; nextCursor: string | null }>(`/items${suffix}`);
  },
  getItem: (id: string) => http<ItemDetail>(`/items/${id}`),
  patchItem: (id: string, body: Partial<ItemDetail>) =>
    http<ItemDetail>(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  listPool: (cursor?: string) =>
    http<{ photos: PoolPhoto[]; nextCursor: string | null; total: number }>(
      `/pool${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
    ),
  createGroup: (photoIds: string[], label?: string) =>
    http<{ id: string; label: string | null; photoCount: number }>('/groups', {
      method: 'POST',
      body: JSON.stringify({ photoIds, label }),
    }),
  listGroups: (unidentifiedOnly = true) =>
    http<{ groups: GroupRow[] }>(`/groups?unidentified=${unidentifiedOnly ? 'true' : 'false'}`),
  getGroup: (id: string) => http<GroupDetail>(`/groups/${id}`),
  addPhotosToGroup: (groupId: string, photoIds: string[]) =>
    http<{ ok: true; added: number }>(`/groups/${groupId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ photoIds }),
    }),
  removePhotoFromGroup: (groupId: string, photoId: string) =>
    http<{ ok: true }>(`/groups/${groupId}/photos/${photoId}`, { method: 'DELETE' }),
  deleteGroup: (groupId: string) =>
    http<{ ok: true }>(`/groups/${groupId}`, { method: 'DELETE' }),
  deletePhoto: (photoId: string) =>
    http<{ ok: true }>(`/photos/${photoId}`, { method: 'DELETE' }),
  identifyGroupAi: (groupId: string, body: { context?: string; useVisualPriors?: boolean }) =>
    http<IdentifyAiResponse>(`/groups/${groupId}/identify-ai`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  groupImageSearch: (groupId: string, photoId: string, limit = 20) =>
    http<{ itemSummaries: EbayHit[]; total: number }>(
      `/groups/${groupId}/image-search`,
      { method: 'POST', body: JSON.stringify({ photoId, limit }) },
    ),
  identifyGroupEbay: (
    groupId: string,
    body: {
      ebayItemId: string;
      ebayItemUrl?: string;
      hit: {
        title: string;
        condition?: string;
        categoryPath?: string;
        categoryId?: string;
        description?: string;
        itemSpecifics?: Record<string, string>;
        imageUrls?: string[];
        price?: { value: string; currency: string };
      };
      approvedFields: {
        title: boolean;
        description: boolean;
        category: boolean;
        condition: boolean;
        itemSpecifics: boolean;
        images: boolean;
      };
    },
  ) =>
    http<{ itemId: string; ebayItemId: string; ebayItemUrl?: string }>(
      `/groups/${groupId}/identify-ebay`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  listDrafts: (cursor?: string) =>
    http<{ drafts: DraftRow[]; nextCursor: string | null }>(
      `/drafts${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
    ),
  listDevices: () => http<{ devices: Device[] }>('/devices'),
  listApiKeys: () => http<{ keys: ApiKeyRow[] }>('/settings/api-keys'),
  createApiKey: (body: { name: string }) =>
    http<{ id: string; apiKey: string }>('/settings/api-keys', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  revokeApiKey: (id: string) =>
    http<{ id: string; revokedAt: string }>(`/settings/api-keys/${id}/revoke`, {
      method: 'POST',
    }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    http<{ ok: true }>('/settings/password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  mergeItemInto: (sourceId: string, targetId: string) =>
    http<{ ok: true; mergedInto: string }>(`/items/${sourceId}/merge-into`, {
      method: 'POST',
      body: JSON.stringify({ targetId }),
    }),
  movePhotos: (sourceId: string, photoIds: string[], targetItemId: string) =>
    http<{ ok: true; moved: number }>(`/items/${sourceId}/photos/move`, {
      method: 'POST',
      body: JSON.stringify({ photoIds, targetItemId }),
    }),
  getIngestHint: () => http<{ hint: string }>('/settings/ingest-hint'),
  setIngestHint: (hint: string) =>
    http<{ hint: string }>('/settings/ingest-hint', {
      method: 'PUT',
      body: JSON.stringify({ hint }),
    }),
  photoImageSearch: (photoId: string, limit = 20) =>
    http<{ itemSummaries: EbayHit[]; total: number }>(
      `/items/photo/${photoId}/image-search`,
      { method: 'POST', body: JSON.stringify({ limit }) },
    ),
};

export interface EbayHit {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  condition?: string;
  conditionId?: string;
  itemWebUrl?: string;
  image?: { imageUrl?: string };
  thumbnailImages?: Array<{ imageUrl: string }>;
  seller?: { username?: string; feedbackScore?: number };
  categoryPath?: string;
}

export type IdentifyAiResponse =
  | { queued: true; batchId: string; provider: string }
  | { queued: false; itemId: string; costUsd: number; provider: string };

export interface ApiKeyRow {
  id: string;
  name: string | null;
  kind: string;
  machines: Array<{ machineId: string; label: string | null; kind: string | null; lastSeenAt: string | null }>;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface Device {
  id: string;
  machineId: string;
  label: string | null;
  kind: string | null;
  userAgent: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  apiKey: {
    id: string;
    name: string | null;
    kind: string;
    revokedAt: string | null;
    lastUsedAt: string | null;
  };
}

export interface DraftRow {
  id: string;
  itemId: string;
  ebayDraftId: string | null;
  ebayDraftUrl: string;
  ebayAccountId: string | null;
  notes: string | null;
  status: 'OPEN' | 'SUBMITTED' | 'ABANDONED' | 'UNKNOWN';
  lastSeenAt: string;
  lastFilledAt: string | null;
  createdAt: string;
  updatedAt: string;
  item: { id: string; title: string | null; brand: string | null };
}

export interface PoolPhoto {
  id: string;
  thumbnailPath: string | null;
  publicUrl: string | null;
  cdnUrl: string | null;
  originalPath: string | null;
  createdAt: string;
  photoGroupId: string | null;
}

export interface GroupRow {
  id: string;
  label: string | null;
  itemId: string | null;
  status: string;
  createdAt: string;
  photoCount: number;
  coverPhoto: {
    id: string;
    thumbnailPath: string | null;
    publicUrl: string | null;
    cdnUrl: string | null;
  } | null;
}

export interface GroupDetail {
  id: string;
  label: string | null;
  itemId: string | null;
  status: string;
  createdAt: string;
  item: { id: string; title: string | null; status: string; stage: string } | null;
  photos: Array<{
    id: string;
    thumbnailPath: string | null;
    publicUrl: string | null;
    cdnUrl: string | null;
    originalPath: string | null;
    createdAt: string;
  }>;
}

export interface ItemRow {
  id: string;
  title: string | null;
  brand: string | null;
  status: string;
  stage: string;
  completeness: { score?: number } | null;
  photos: { id: string; thumbnailPath: string | null; publicUrl: string | null }[];
  _count: { photos: number; comps: number; drafts: number };
}

export interface ItemDetail extends ItemRow {
  description: string | null;
  category: string | null;
  ebayCategoryId: string | null;
  condition: string | null;
  startingPrice: number | null;
  buyNowPrice: number | null;
  itemSpecifics: Record<string, string> | null;
  drafts: Array<{ id: string; ebayDraftUrl: string; status: string; lastSeenAt: string }>;
  comps: Array<{
    compId: number;
    isPrimary: boolean;
    comp: { id: number; ebayItemId: string; soldPrice: number | null; title: string | null; itemUrl: string | null };
  }>;
}
