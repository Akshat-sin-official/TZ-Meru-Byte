/**
 * Search Service
 * 
 * API client for search endpoints
 */

import { apiClient } from './apiClient';

export interface ExpertSearchResult {
  expertId: string;
  userId: string;
  displayName: string;
  bio: string;
  categories: string[];
  location?: string;
  hourlyRate?: number;
  minEngagementValue?: number;
  minEngagementUnit?: string;
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  profileImageUrl?: string;
  matchScore?: number;
  pricingStyle?: string[];
  serviceDeliveryStates?: string[];
  serviceArea?: string[];
  panIndiaAvailable?: boolean;
  subEntityType?: string;
  businessRole?: string;
  role?: string;
  yearsExperience?: number;
}

export interface ExpertSearchResponse {
  success: boolean;
  data: {
    results: ExpertSearchResult[];
    totalMatches: number;
    currentPage: number;
    totalPages: number;
    limit: number;
    fallbackLevel?: 'EXACT' | 'FOCUS_AREA' | 'SERVICE_CATEGORY' | 'NO_MATCH';
    fallbackBanner?: string;
    fallbackMatchedScope?: string;
  };
}

export interface SearchFilters {
  coreServiceCategories?: string[];
  primaryFilters?: string[];
  subServices?: string[];
  industrySectors?: string[];
  subIndustries?: string[];
  location?: string;
  clientScales?: string[];
  businessTypesServed?: string[];
  clientEngagementTypes?: string[];
  engagementModels?: string[];
  deliveryChannels?: string[];
  preferredDeliverySpeed?: string[];
  languages?: string[];
  pricingStyle?: string[];
  minProjectAmount?: number;
  maxBudget?: number;
  hasPortfolio?: boolean;
  hasToolsListed?: boolean;
  kycVerified?: boolean;
  verifiedCertifications?: boolean;
  complianceCompleted?: boolean;
  serviceDeliveryStates?: string[];
  panIndiaAvailable?: boolean;
  subEntityType?: string[];
  experienceRange?: {
    min?: number;
    max?: number;
  };
  keyword?: string; // Simple keyword search
}

export type ExpertSortOption =
  | 'recently_active'
  | 'experience_desc'
  | 'experience_asc'
  | 'budget_asc'
  | 'budget_desc'
  | 'best_match';

export interface ExpertSearchInput {
  filters?: SearchFilters;
  sort?: {
    field: ExpertSortOption;
    order?: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

class SearchService {
  /**
   * Search experts
   */
  async searchExperts(input: ExpertSearchInput = {}): Promise<{
    experts: ExpertSearchResult[];
    total: number;
    page: number;
    limit: number;
    fallbackLevel?: 'EXACT' | 'FOCUS_AREA' | 'SERVICE_CATEGORY' | 'NO_MATCH';
    fallbackBanner?: string;
    fallbackMatchedScope?: string;
  }> {
    const response = await apiClient.post<ExpertSearchResponse>(
      '/v1/search/experts',
      {
        filters: input.filters,
        sort: input.sort ? {
          field: input.sort.field,
          order: input.sort.order || (input.sort.field.endsWith('_asc') ? 'asc' : 'desc'),
        } : undefined,
        page: input.page,
        limit: input.limit,
      }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to search experts');
    }
    // Transform backend response to match frontend expectations
    return {
      experts: response.data.data.results,
      total: response.data.data.totalMatches,
      page: response.data.data.currentPage,
      limit: response.data.data.limit,
      fallbackLevel: response.data.data.fallbackLevel,
      fallbackBanner: response.data.data.fallbackBanner,
      fallbackMatchedScope: response.data.data.fallbackMatchedScope,
    };
  }

  /**
   * Get dynamic search boundaries for experience and budget
   */
  async getSearchBounds(): Promise<{
    experience: { min: number; max: number };
    budget: { min: number; max: number };
  }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          experience: { min: number; max: number };
          budget: { min: number; max: number };
        };
      }>('/v1/search/bounds');
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      return {
        experience: { min: 1, max: 35 },
        budget: { min: 10000, max: 500000 },
      };
    } catch (err) {
      console.warn('Failed to fetch search bounds, falling back to defaults:', err);
      return {
        experience: { min: 1, max: 35 },
        budget: { min: 10000, max: 500000 },
      };
    }
  }

  /**
   * Get filter metadata
   */
  async getFilters(): Promise<{
    coreServiceCategories: string[];
    industries: string[];
    deliveryMode: string[];
    pricingModel: string[];
    languages: string[];
  }> {
    const response = await apiClient.get<{ success: boolean; data: any }>('/v1/search/filters');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch filters');
    }
    return response.data.data;
  }

  /**
   * Save requirement (filter set) for reuse
   */
  async saveRequirement(filters: SearchFilters, name?: string): Promise<{
    id: string;
    name?: string;
    filters: SearchFilters;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: {
        id: string;
        name?: string;
        filters: SearchFilters;
      };
    }>('/v1/search/save-requirement', {
      filters,
      name: name || 'Saved Requirement',
    });
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to save requirement');
    }
    return response.data.data;
  }

  /**
   * Get saved requirements
   */
  async getSavedRequirements(): Promise<Array<{
    id: string;
    name?: string;
    filters: SearchFilters;
  }>> {
    const response = await apiClient.get<{
      success: boolean;
      data: Array<{
        id: string;
        name?: string;
        filters: SearchFilters;
      }>;
    }>('/v1/search/saved-requirements');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch saved requirements');
    }
    return response.data.data;
  }

  /**
   * Get expert profile by userId
   */
  async getExpertProfileByUserId(userId: string): Promise<{
    id: string;
    expertId: string;
    userId: string;
    displayName: string;
    bio: string;
    categories: string[];
    subServices?: string[];
    location?: string | { city: string; country: string };
    timezone?: string;
    hourlyRate?: number;
    availabilityStatus: 'available' | 'busy' | 'unavailable';
    profileImageUrl?: string;
    portfolioUrls: string[];
    certifications: Array<{ name: string; issuer: string; year: number }>;
    services?: Array<{
      serviceHead: string;
      primaryFilters: string[];
      subFilters: string[];
    }>;
    isProfileComplete: boolean;
    isActive: boolean;
    isVerified: boolean;
    email?: string;
    fullName?: string;
    bookingsAvailability?: {
      availableDays?: string[];
      availableTimeSlots?: string[];
    };
    availability?: Record<string, { available: boolean; from?: string; to?: string }>;
    daysOff?: string[];
    // Additional fields for comparison
    yearsExperience?: number;
    subEntityType?: string;
    businessRole?: string;
    industrySectors?: string[];
    subIndustries?: string[];
    clientScales?: string[];
    businessTypesServed?: string[];
    clientEngagementTypes?: string[];
    engagementModels?: string[];
    deliveryChannels?: string[];
    preferredDeliverySpeed?: string[];
    languages?: string[];
    tools?: string[];
    pricingStyle?: string[];
    serviceDeliveryStates?: string[];
    panIndiaAvailable?: boolean;
    kycVerified?: boolean;
    verifiedCertifications?: boolean;
    complianceCompleted?: boolean;
    hasPortfolio?: boolean;
    hasToolsListed?: boolean;
    minEngagementValue?: number;
    legalName?: string;
    entityType?: string;
    isPanRegistered?: boolean;
    isGstRegistered?: boolean;
    panNumber?: string;
    gstNumber?: string;
    gstRegistered?: string;
    panRegistered?: string;
    documents?: Array<{
      documentType: string;
      fileUrl: string;
      verified?: boolean;
    }>;
    portfolioItems?: Array<{
      title: string;
      description?: string;
      url: string;
      type: 'image' | 'video' | 'pdf' | 'url';
    }>;
  }> {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/v1/search/experts/${userId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch expert profile');
    }
    return response.data.data;
  }

  /**
   * Get multiple expert profiles by userIds
   */
  async getExpertProfilesBulk(userIds: string[]): Promise<any[]> {
    const response = await apiClient.post<{ success: boolean; data: any[] }>(
      '/v1/search/experts/bulk',
      { userIds }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch expert profiles');
    }
    return response.data.data;
  }

  /**
   * Maps natural language prompt to validated filter properties
   */
  async mapNaturalLanguageQuery(query: string): Promise<{
    success: boolean;
    filters: any;
    missingInfoPrompt: string | null;
    missingFields: string[];
  }> {
    const response = await apiClient.post<any>(
      '/experts/search/map-query',
      { query }
    );
    return response.data;
  }
}

export const searchService = new SearchService();

