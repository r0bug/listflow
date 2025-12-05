// Core types for ConsoleEbay Platform

// ============================================================================
// ENUMS
// ============================================================================

export type WorkflowStep =
  | 'INGEST'
  | 'IDENTIFY'
  | 'POPULATE'
  | 'PRICE'
  | 'REVIEW'
  | 'APPROVE'
  | 'LIST'
  | 'LISTED'
  | 'SOLD'
  | 'FULFILL'
  | 'COMPLETE'
  | 'CANCELLED';

export type ItemStatus = 'ACTIVE' | 'PAUSED' | 'ERROR' | 'ARCHIVED' | 'DELETED';

export type ItemCreationSource =
  | 'MANUAL'
  | 'PHOTO_IMPORT'
  | 'UPC_SCAN'
  | 'ISBN_SCAN'
  | 'DISCOGS'
  | 'SELL_SIMILAR'
  | 'TEMPLATE'
  | 'API'
  | 'BULK_IMPORT';

export type ListingType = 'AUCTION' | 'FIXED_PRICE' | 'AUCTION_BIN';

export type TemplateSourceType = 'MANUAL' | 'SELL_SIMILAR' | 'AI_GENERATED' | 'IMPORTED';

export type DomainRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

// ============================================================================
// DOMAIN & AUTH
// ============================================================================

export interface Domain {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  settings: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  domainId: string;
  domain?: Domain;
  role: DomainRole;
  permissions: UserPermissions;
  isActive: boolean;
  isPlatformAdmin: boolean;
  compensationType?: 'hourly' | 'per_item' | 'salary' | 'commission';
  compensationRate?: number;
  itemsListedToday: number;
  itemsListedWeek: number;
  itemsListedMonth: number;
  itemsListedAllTime: number;
}

export interface UserPermissions {
  steps?: WorkflowStep[];
  ebayAccounts?: string[];
  warehouses?: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  domain: Domain | null;
}

// ============================================================================
// ITEMS
// ============================================================================

export interface ItemPhoto {
  id: string;
  itemId: string;
  originalPath: string;
  optimizedPath?: string;
  thumbnailPath?: string;
  ebayUrl?: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  sortOrder: number;
  isPrimary: boolean;
  aiAnalysis?: Record<string, unknown>;
}

export interface ItemSpecific {
  name: string;
  value: string;
  required?: boolean;
  locked?: boolean;
}

export interface Item {
  id: string;
  displayId: string;
  domainId: string;
  createdById: string;
  currentStep: WorkflowStep;
  status: ItemStatus;

  // Identifiers
  sku?: string;
  upc?: string;
  isbn?: string;
  discogsMasterId?: string;
  discogsReleaseId?: string;
  customIdentifier?: string;

  // AI-generated content
  title?: string;
  description?: string;
  category?: string;
  categoryId?: string;
  condition?: string;
  conditionId?: number;
  brand?: string;
  manufacturer?: string;
  model?: string;
  mpn?: string;

  itemSpecifics: ItemSpecific[];
  keywords: string[];
  aiAnalysis?: Record<string, unknown>;

  // Pricing
  costPrice?: number;
  suggestedPrice?: number;
  startingPrice?: number;
  buyNowPrice?: number;
  shippingCost?: number;

  // Location
  locationId?: string;
  location?: WarehouseLocation;

  // Quantity
  quantity: number;
  quantityListed: number;
  quantitySold: number;

  // Source
  creationSource: ItemCreationSource;
  listingTemplateId?: string;

  // Timestamps
  ingestedAt: string;
  identifiedAt?: string;
  populatedAt?: string;
  pricedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  listedAt?: string;
  soldAt?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  photos: ItemPhoto[];
  listing?: ItemListing;
}

export interface ItemListing {
  id: string;
  itemId: string;
  ebayAccountId: string;
  ebayItemId?: string;
  ebayListingUrl?: string;
  listingType: ListingType;
  listingDuration: string;
  startPrice: number;
  buyNowPrice?: number;
  reservePrice?: number;
  status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'SOLD' | 'ENDED' | 'CANCELLED' | 'ERROR';
  soldPrice?: number;
  soldAt?: string;
  buyerUsername?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  shippedAt?: string;
}

// ============================================================================
// TEMPLATES
// ============================================================================

export interface TemplateItemSpecific {
  name: string;
  value: string;
  required: boolean;
  locked: boolean;
}

export interface ListingTemplate {
  id: string;
  domainId: string;
  name: string;
  description?: string;
  tags: string[];
  sourceType: TemplateSourceType;
  sourceEbayItemId?: string;

  // Listing content
  titleTemplate?: string;
  categoryId?: string;
  categoryName?: string;
  categoryPath?: string;
  defaultCondition?: string;
  defaultConditionId?: number;
  itemSpecifics: TemplateItemSpecific[];
  descriptionTemplate?: string;

  // Pricing
  suggestedPriceMin?: number;
  suggestedPriceMax?: number;
  defaultListingType?: string;
  defaultDuration?: string;

  // Shipping
  defaultShippingProfileId?: string;
  estimatedShippingCost?: number;
  estimatedWeight?: number;
  packageDimensions?: { length: number; width: number; height: number };

  // Metadata
  referenceImageUrls: string[];
  requiresPhotos: boolean;
  minimumPhotos: number;
  isActive: boolean;
  isPublic: boolean;
  timesUsed: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellSimilarData {
  ebayItemId: string;
  listingUrl?: string;
  seller?: string;
  sellerFeedback?: number;
  title: string;
  description?: string;
  category?: string;
  categoryId?: string;
  condition?: string;
  conditionId?: number;
  brand?: string;
  itemSpecifics: ItemSpecific[];
  imageUrls: string[];
  price?: number;
  priceType?: string;
  shippingCost?: number;
  listingStatus?: string;
  soldDate?: string;
  soldPrice?: number;
}

// ============================================================================
// WAREHOUSES & LOCATIONS
// ============================================================================

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  isActive: boolean;
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  code: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  maxItems?: number;
  currentItems: number;
  isActive: boolean;
}

// ============================================================================
// EBAY ACCOUNTS
// ============================================================================

export interface EbayAccount {
  id: string;
  domainId: string;
  name: string;
  ebayUsername?: string;
  siteId: number;
  sandbox: boolean;
  isActive: boolean;
  lastSyncAt?: string;
}

// ============================================================================
// PERFORMANCE & STATS
// ============================================================================

export interface UserPerformanceLog {
  id: string;
  userId: string;
  date: string;
  itemsIngested: number;
  itemsIdentified: number;
  itemsPopulated: number;
  itemsPriced: number;
  itemsReviewed: number;
  itemsApproved: number;
  itemsListed: number;
  itemsFulfilled: number;
  totalTimeWorked: number;
  avgTimePerItem?: number;
  aiRedoRequests: number;
  editsMade: number;
  rejectionsGiven: number;
}

export interface DashboardStats {
  queueCounts: Record<WorkflowStep, number>;
  totalListed: number;
  soldToday: number;
  revenueToday: number;
  revenue30Days: number;
  needsAttention: {
    lowConfidence: number;
    stale: number;
    pendingSync: number;
  };
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// SYNC
// ============================================================================

export interface SyncStatus {
  isConnected: boolean;
  lastSyncAt?: string;
  pendingChanges: number;
  conflicts: number;
}
