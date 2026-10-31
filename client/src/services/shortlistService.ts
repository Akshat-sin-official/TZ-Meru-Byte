import { apiClient } from './apiClient';

export interface ShortlistedExpertData {
  _id: string;
  expertId: string;
  expertData: {
    name?: string;
    fullName?: string;
    email: string;
    isActive: boolean;
  };
  profileData: any;
  shortlistedAt: string;
}

export const shortlistService = {
  /**
   * Get seeker's shortlists
   */
  getShortlist: async (): Promise<ShortlistedExpertData[]> => {
    const response = await apiClient.get<any>('/v1/seeker/shortlist');
    return response.data.data;
  },

  /**
   * Toggle a single expert in shortlist
   */
  toggleShortlist: async (expertId: string): Promise<{ message: string; shortlisting: boolean }> => {
    const response = await apiClient.post<any>('/v1/seeker/shortlist/toggle', { expertId });
    return response.data;
  },

  /**
   * Sync local storage shortlists to backend
   */
  syncShortlist: async (expertIds: string[]): Promise<{ message: string; syncedCount: number }> => {
    const response = await apiClient.post<any>('/v1/seeker/shortlist/sync', { expertIds });
    return response.data;
  },

  /**
   * Track comparison activity (PDF Pages 4-5, deduplicated)
   */
  trackCompare: async (expertIds: string[], serviceRequired?: string): Promise<{ success: boolean; newlyTrackedCount: number }> => {
    const response = await apiClient.post<any>('/v1/seeker/compare/track', { expertIds, serviceRequired });
    return response.data;
  },
};
