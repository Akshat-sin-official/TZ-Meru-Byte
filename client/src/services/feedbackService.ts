/**
 * Feedback Service
 * 
 * Client-side service for feedback API interactions
 */

import { apiClient } from './apiClient';

export interface PlatformFlowCheck {
  // Seeker-specific
  seekerUnclearAreas?: string[];
  seekerUnexpectedAreas?: string[];
  // Expert-specific
  expertUnclearAreas?: string[];
  expertFrictionPoints?: string[];
  // Common
  improvementSuggestion?: string;
}

export interface ExperienceStatement {
  text: string;
  consentToPublish: boolean;
  displayPreference?: 'business_name' | 'role_only' | 'anonymous';
}

export interface FeedbackSubmission {
  engagementId: string;
  platformFlowCheck?: PlatformFlowCheck;
  experienceStatement?: ExperienceStatement;
}

export interface Feedback {
  id: string;
  userId: string;
  userRole: 'seeker' | 'expert';
  platformFlowCheck?: PlatformFlowCheck;
  experienceStatement?: ExperienceStatement;
  createdAt: string;
}

export interface EligibilityCheck {
  eligible: boolean;
  reason?: string;
}

class FeedbackService {
  /**
   * Submit feedback
   */
  async submitFeedback(data: FeedbackSubmission): Promise<{ feedbackId: string; message: string }> {
    const response = await apiClient.post<{ success: boolean; data: { feedbackId: string; message: string } }>(
      '/v1/feedback',
      data
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to submit feedback');
    }
    return response.data.data;
  }

  /**
   * Get feedback for an engagement
   */
  async getFeedbackByEngagement(engagementId: string): Promise<Feedback[]> {
    const response = await apiClient.get<{ success: boolean; data: Feedback[] }>(
      `/v1/feedback/engagement/${engagementId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch feedback');
    }
    return response.data.data;
  }

  /**
   * Get public testimonials
   */
  async getPublicTestimonials(filters?: {
    userRole?: 'seeker' | 'expert';
    limit?: number;
    offset?: number;
  }): Promise<{ testimonials: any[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.userRole) params.append('userRole', filters.userRole);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get<{ success: boolean; data: { testimonials: any[]; total: number } }>(
      `/v1/feedback/testimonials?${params.toString()}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch testimonials');
    }
    return response.data.data;
  }

  /**
   * Check if engagement is eligible for feedback
   */
  async checkEligibility(engagementId: string): Promise<EligibilityCheck> {
    const response = await apiClient.get<{ success: boolean; data: EligibilityCheck }>(
      `/v1/feedback/eligibility/${engagementId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to check eligibility');
    }
    return response.data.data;
  }
}

export const feedbackService = new FeedbackService();

