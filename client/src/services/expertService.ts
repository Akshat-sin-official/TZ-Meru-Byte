/**
 * Expert Service
 * 
 * API client for Expert endpoints
 */

import { apiClient } from './apiClient';
import { DayAvailability } from '../utils/schedulingSlots';

export interface ExpertStats {
  activeEngagements: number;
  discussions: number;
  totalEarned: number;
  totalPending: number;
  pendingActions: number;
  nextDiscussion?: {
    scheduledDate: string;
    scheduledTime?: string;
  } | null;
}

export interface ExpertEngagement {
  id: string;
  _id?: string;
  seekerName: string;
  seekerId: string;
  expertName: string;
  status: string;
  totalDeposit: number;
  totalProjectAmount: number;
  releasedAmount: number;
  heldAmount: number;
  progressPercentage: number;
  serviceCategory?: string;
  quotationId?: string | null;
  quotationRef?: string;
  hasPaidDeposit?: boolean;
  depositStatus?: 'paid' | 'pending' | 'not_paid';
  milestones: Array<{
    id: string;
    milestoneNumber: number;
    title: string;
    amount: number;
    percentage: number;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: string;
  }>;
  startedAt: string;
  createdAt: string;
  referenceId?: string;
}

export interface ExpertDiscussion {
  id: string;
  _id?: string;
  purpose: string;
  agenda: string;
  status: string;
  scheduledDate?: string;
  scheduledTime?: string;
  seekerName: string;
  expertName: string;
  createdAt: string;
  closedAt?: string;
  serviceCategory?: string;
  quotationUnlockedForBusiness?: boolean;
  quotationRequestedAt?: string;
  scheduledAt?: string;
  duration?: number;
  jitsiLink?: string | null;
  context?: any;
  referenceId?: string;
  rescheduleAttempts?: number;
  seekerId?: string;
  seekerReferenceId?: string;
  quotationStatus?: string | null;
  quotationId?: string;
  engagementId?: string;
  hasAcceptedQuotation?: boolean;
  meetingJoinedAt?: string;
  attendanceStatus?: string;
  scheduledBy?: string;
  expertResponse?: any;
  isArchived?: boolean;
}

export interface ExpertProfile {
  id: string;
  userId: string;
  expertId?: string;
  referenceId?: string;
  displayName: string;
  legalName?: string;
  bio: string;
  businessName?: string;
  brandAlias?: string;
  businessRole?: string;
  businessBackground?: string;
  website?: string;
  yearsExperience?: number;
  mobileNumber?: string;
  categories: string[];
  industrySectors?: string[];
  subIndustries?: string[];
  services?: Array<{
    serviceHead: string;
    primaryFilters: string[];
    subFilters: string[];
  }>;
  serviceDeliveryStates?: string[];
  panIndiaAvailable?: boolean;
  clientEngagementTypes?: string[];
  clientScales?: string[];
  businessTypesServed?: string[];
  engagementModels?: string[];
  deliveryChannels?: string[];
  preferredDeliverySpeed?: string[];
  languages?: string[];
  tools?: string[];
  pricingStyle?: string[];
  location?: {
    city: string;
    country: string;
    state?: string;
  } | string;
  timezone?: string;
  hourlyRate?: number;
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  bookingsAvailability?: {
    availableDays?: string[];
    availableTimeSlots?: string[];
  };
  availability?: Record<string, DayAvailability>;
  daysOff?: string[];
  profileImageUrl?: string;
  logoUrl?: string;
  portfolioUrls: string[];
  portfolioItems?: Array<{
    title: string;
    type: 'image' | 'video' | 'pdf' | 'url';
    url: string;
    description?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year: number;
    verified?: boolean;
    fileUrl?: string;
    verificationUrl?: string;
  }>;
  teamMembers?: Array<{
    name: string;
    role: string;
    expertise: string[];
    experience: number;
    photoUrl?: string;
  }>;
  testimonials?: Array<{
    type: 'screenshot' | 'link';
    source?: string;
    url?: string;
    content?: string;
  }>;
  entityType?: string;
  registeredAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  panNumber?: string;
  gstNumber?: string;
  gstStatus?: string;
  cinNumber?: string;
  llpinNumber?: string;
  documents?: Array<{
    documentType: string;
    fileUrl: string;
    verified: boolean;
    uploadedAt: string;
  }>;
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: 'savings' | 'current';
    proofUrl?: string;
    upiId?: string;
  };
  profileStatus?: 'profile_draft' | 'stage1_completed' | 'stage2_completed' | 'stage3_completed' | 'stage4_completed' | 'submitted_for_verification' | 'verified' | 'rejected' | 'suspended';
  isActive?: boolean;
  changeRequestStatus?: 'none' | 'pending' | 'changes_requested' | 'approved' | 'rejected';
  changeRequestReason?: string;
  pendingData?: Partial<ExpertProfile>;
  gstApplicability?: boolean;
  submitForVerification?: boolean;
  documentsRequested?: boolean;
  documentsRequestedReason?: string;
  documentsRequestedAt?: string;
  slug?: string;
  trustStatus?: string;
  trustCompliance?: {
    trustStatus?: 'pending' | 'submitted' | 'under_verification' | 'action_required' | 'not_verified' | 'verified' | string;
  };
}

export interface ExpertQuotation {
  id: string;
  _id?: string;
  referenceId?: string;
  title?: string;
  projectTitle?: string;
  scope?: string;
  status: string;
  totalAmount: number;
  seekerName?: string;
  seekerId: string;
  discussionId?: string;
  discussionRef?: string;
  createdAt?: string;
  updatedAt?: string;
  sentAt?: string;
  viewedAt?: string;
  currentRevision?: number;
  revisionHistoryCount?: number;
}

export interface SubmitMilestoneRequest {
  engagementId: string;
  milestoneNumber: number;
  submissionContent: string;
  submissionFiles?: string[];
}

class ExpertService {
  /**
   * Get expert dashboard statistics
   */
  async getStats(): Promise<ExpertStats> {
    const response = await apiClient.get<{ success: boolean; data: ExpertStats }>('/v1/expert/dashboard/stats');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch expert stats');
    }
    return response.data.data;
  }

  /**
   * Get expert's engagements
   */
  async getEngagements(): Promise<ExpertEngagement[]> {
    const response = await apiClient.get<{ success: boolean; data: ExpertEngagement[] }>('/v1/expert/engagements');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch engagements');
    }
    return response.data.data;
  }

  /**
   * Get expert's discussions
   */
  async getDiscussions(): Promise<ExpertDiscussion[]> {
    // Scheduled discussions (platform-controlled) live under /v1/scheduled-discussions
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      '/v1/scheduled-discussions/my'
    );
    if (!response.data.success) {
      throw new Error('Failed to fetch scheduled discussions');
    }
    const rows = response.data.data || [];
    return rows.map((d: any) => {
      const business = d.businessId;
      const expert = d.expertId;
      const scheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : null;
      return {
        id: String(d._id || d.id),
        purpose: d.purpose,
        agenda: d.agenda,
        status: d.status,
        scheduledAt: d.scheduledAt,
        scheduledDate: scheduledAt ? scheduledAt.toISOString() : undefined,
        scheduledTime: scheduledAt
          ? scheduledAt.toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit', 
              timeZone: 'Asia/Kolkata' 
            })
          : undefined,
        seekerName: business?.fullName || business?.email || 'Business',
        seekerId: business?._id ? String(business._id) : undefined,
        seekerReferenceId: business?.referenceId || 'N/A',
        expertName: expert?.fullName || expert?.email || 'Expert',
        createdAt: d.createdAt,
        rescheduleAttempts: d.rescheduleAttempts ?? 0,
        duration: d.duration,
        jitsiLink: d.jitsiLink ?? null,
        context: d.context,
        referenceId: d.referenceId,
        quotationStatus: d.quotationStatus,
        hasAcceptedQuotation: d.hasAcceptedQuotation,
        meetingJoinedAt: d.meetingJoinedAt,
        attendanceStatus: d.attendanceStatus,
        scheduledBy: d.scheduledBy ? String(d.scheduledBy) : undefined,
        expertResponse: d.expertResponse,
      } as ExpertDiscussion;
    });
  }

  /**
   * Scheduled-discussions (platform-controlled) expert actions
   */
  async acceptScheduledDiscussion(discussionId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string; message?: string }>(
      `/v1/scheduled-discussions/${discussionId}/accept`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to accept discussion');
    }
  }

  async declineScheduledDiscussion(discussionId: string, reason?: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string; message?: string }>(
      `/v1/scheduled-discussions/${discussionId}/decline`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to decline discussion');
    }
  }

  async rescheduleScheduledDiscussion(discussionId: string, proposedTimeIso: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string; message?: string }>(
      `/v1/scheduled-discussions/${discussionId}/reschedule`,
      { proposedTime: proposedTimeIso }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to propose new time');
    }
  }

  async tentativeHoldScheduledDiscussion(discussionId: string, reason?: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string; message?: string }>(
      `/v1/scheduled-discussions/${discussionId}/tentative`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to hold tentatively');
    }
  }

  /**
   * Get expert profile
   */
  async getProfile(): Promise<ExpertProfile> {
    const response = await apiClient.get<{ success: boolean; data: ExpertProfile }>('/v1/expert/profile');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch expert profile');
    }
    return response.data.data;
  }

  /**
   * Get expert quotations
   */
  async getQuotations(): Promise<ExpertQuotation[]> {
    const response = await apiClient.get<{ success: boolean; data: ExpertQuotation[] }>('/v1/expert/quotations');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch expert quotations');
    }
    return response.data.data;
  }

  /**
   * Update expert profile
   */
  async updateProfile(profileData: Partial<ExpertProfile>): Promise<ExpertProfile> {
    const response = await apiClient.put<{ success: boolean; data: ExpertProfile; message?: string }>(
      '/v1/expert/profile',
      profileData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update expert profile');
    }
    return response.data.data;
  }

  /**
   * Submit milestone completion
   */
  async submitMilestone(data: SubmitMilestoneRequest): Promise<{ submissionId: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string; data?: { submissionId: string }; error?: string | { code?: string; message?: string; details?: unknown } }>(
      '/v1/milestones/submit',
      data
    );
    if (!response.data.success) {
      const errorData = response.data.error;
      const errorMessage = (typeof errorData === 'object' && errorData?.message)
        ? errorData.message
        : (typeof errorData === 'string' ? errorData : response.data.message || 'Failed to submit milestone');
      throw new Error(errorMessage);
    }
    if (!response.data.data) {
      throw new Error('Invalid response from server');
    }
    return response.data.data;
  }

  /**
   * Complete compliance
   */
  async completeCompliance(engagementId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string | { code?: string; message?: string; details?: unknown } }>(
      `/v1/engagements/${engagementId}/complete-compliance`
    );
    if (!response.data.success) {
      const errorData = response.data.error;
      const errorMessage = (typeof errorData === 'object' && errorData?.message)
        ? errorData.message
        : (typeof errorData === 'string' ? errorData : response.data.message || 'Failed to complete compliance');
      throw new Error(errorMessage);
    }
  }

  /**
   * Complete engagement
   */
  async completeEngagement(engagementId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string | { code?: string; message?: string; details?: unknown } }>(
      `/v1/engagements/${engagementId}/complete`
    );
    if (!response.data.success) {
      const errorData = response.data.error;
      const errorMessage = (typeof errorData === 'object' && errorData?.message)
        ? errorData.message
        : (typeof errorData === 'string' ? errorData : response.data.message || 'Failed to complete engagement');
      throw new Error(errorMessage);
    }
  }

  /**
   * Close engagement
   */
  async closeEngagement(engagementId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string | { code?: string; message?: string; details?: unknown } }>(
      `/v1/engagements/${engagementId}/close`
    );
    if (!response.data.success) {
      const errorData = response.data.error;
      const errorMessage = (typeof errorData === 'object' && errorData?.message)
        ? errorData.message
        : (typeof errorData === 'string' ? errorData : response.data.message || 'Failed to close engagement');
      throw new Error(errorMessage);
    }
  }

  /**
   * Create quotation
   */
  async getQuotationDraftByDiscussion(discussionId: string): Promise<{
    id: string;
    draftSnapshot?: Record<string, unknown>;
    [key: string]: unknown;
  } | null> {
    const response = await apiClient.get<{
      success: boolean;
      data: Record<string, unknown> | null;
    }>(`/v1/expert/quotations/draft/${discussionId}`);
    if (!response.data.success) {
      throw new Error('Failed to load quotation draft');
    }
    return response.data.data as { id: string; draftSnapshot?: Record<string, unknown> } | null;
  }

  async saveQuotationDraft(data: Record<string, unknown>): Promise<{ id: string; status: string }> {
    const response = await apiClient.post<{
      success: boolean;
      data?: { id: string; status: string };
      error?: string | { message?: string };
      message?: string;
    }>('/v1/quotations', { ...data, saveAsDraft: true });
    if (!response.data.success || !response.data.data) {
      const err = response.data.error;
      const msg =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: string }).message)
          : typeof err === 'string'
            ? err
            : response.data.message || 'Failed to save draft';
      throw new Error(msg);
    }
    return response.data.data;
  }

  async createQuotation(data: {
    discussionId: string;
    saveAsDraft?: boolean;
    totalEngagementValue: number;
    currency?: string;
    milestones: Array<{
      milestoneNumber: number;
      name: string;
      scope: string;
      timeline: string;
      depositPercentage: number;
      depositAmount: number;
      // Backward compatibility
      description?: string;
      amount?: number;
    }>;
    validUntil: string | Date;
    placeOfSupply?: {
      city?: string;
      state: string;
      country: string;
    };
    draftSnapshot?: Record<string, unknown>;
    serviceCategory?: string;
    engagementAlignment?: Record<string, unknown>;
    gstContext?: {
      clientGSTStatus: 'registered' | 'not_registered';
      clientGSTIN?: string;
      expertGSTStatus: 'registered' | 'not_registered';
      expertGSTIN?: string;
    };
    exclusions?: {
      outOfScopeItems: string[];
      thirdPartyCosts?: string;
      changeRequestHandling?: string;
    };
    dependenciesAndAssumptions?: string;
    engagementStartDate?: string | Date;
    estimatedEndDate?: string | Date;
  }): Promise<{ id: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string; data?: { id: string }; error?: string | { code?: string; message?: string; details?: unknown } }>(
      '/v1/quotations',
      {
        ...data,
        validUntil: typeof data.validUntil === 'string' ? data.validUntil : data.validUntil.toISOString(),
        engagementStartDate: data.engagementStartDate
          ? (typeof data.engagementStartDate === 'string' ? data.engagementStartDate : data.engagementStartDate.toISOString())
          : undefined,
        estimatedEndDate: data.estimatedEndDate
          ? (typeof data.estimatedEndDate === 'string' ? data.estimatedEndDate : data.estimatedEndDate.toISOString())
          : undefined,
      }
    );
    if (!response.data.success) {
      const errorData = response.data.error;
      const errorMessage = (typeof errorData === 'object' && errorData?.message)
        ? errorData.message
        : (typeof errorData === 'string' ? errorData : response.data.message || 'Failed to create quotation');
      // Handle 409 conflict - quotation already exists
      if (errorMessage.includes('already been sent') || errorMessage.includes('already exists')) {
        throw new Error('A quotation has already been sent for this discussion. Please check your quotations list.');
      }
      throw new Error(errorMessage);
    }
    if (!response.data.data) {
      throw new Error('Invalid response from server');
    }
    return response.data.data;
  }

  /**
   * Get discussion
   */
  async getDiscussion(discussionId: string): Promise<ExpertDiscussion> {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/v1/scheduled-discussions/${discussionId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch discussion');
    }
    const d: any = response.data.data;
    const scheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : null;

    return {
      id: String(d._id || d.id),
      purpose: d.purpose,
      agenda: d.agenda,
      status: d.status,
      scheduledAt: d.scheduledAt,
      scheduledDate: scheduledAt ? scheduledAt.toISOString() : undefined,
      scheduledTime: scheduledAt
        ? scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : undefined,
      seekerName: d.businessId?.fullName || d.businessId?.email || 'Business',
      seekerId: d.businessId?._id ? String(d.businessId._id) : undefined,
      seekerReferenceId: d.businessId?.referenceId || 'N/A',
      expertName: d.expertId?.fullName || d.expertId?.email || 'Expert',
      createdAt: d.createdAt,
      closedAt: d.completedAt,
      quotationUnlockedForBusiness: d.quotationUnlockedForBusiness,
      quotationRequestedAt: d.quotationRequestedAt,
      duration: d.duration,
      jitsiLink: d.jitsiLink ?? null,
      context: d.context,
      referenceId: d.referenceId,
      quotationStatus: d.quotationStatus,
      hasAcceptedQuotation: d.hasAcceptedQuotation,
      meetingJoinedAt: d.meetingJoinedAt,
      attendanceStatus: d.attendanceStatus,
    } as ExpertDiscussion;
  }

  /**
   * Mark discussion as completed
   */
  async completeDiscussion(discussionId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/scheduled-discussions/${discussionId}/complete`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to mark discussion as completed');
    }
  }

  /**
   * Archive discussion
   */
  async archiveDiscussion(discussionId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/scheduled-discussions/${discussionId}/archive`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to archive discussion');
    }
  }

  /**
   * Schedule follow-up discussion
   */
  async scheduleFollowUpDiscussion(seekerId: string, subject: string, description: string): Promise<{ id: string }> {
    // Note: This would create a new discussion - may need to adjust based on requirements
    const response = await apiClient.post<{ success: boolean; data?: { id: string }; message?: string; error?: string }>(
      '/v1/discussions',
      {
        expertId: seekerId, // This might need adjustment - expert creates discussion with seeker
        subject,
        description,
      }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to schedule follow-up');
    }
    if (!response.data.data) {
      throw new Error('Invalid response from server');
    }
    return response.data.data;
  }

  /**
   * Block time
   */
  async blockTime(startTime: Date, endTime: Date, reason?: string): Promise<ExpertAvailability> {
    const response = await apiClient.post<{ success: boolean; data: ExpertAvailability; error?: string }>(
      '/v1/expert/availability',
      { startTime, endTime, reason }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to block time');
    }
    return response.data.data;
  }

  /**
   * Get availability blocks
   */
  async getAvailability(): Promise<ExpertAvailability[]> {
    const response = await apiClient.get<{ success: boolean; data: ExpertAvailability[]; error?: string }>(
      '/v1/expert/availability'
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch availability');
    }
    return response.data.data;
  }

  /**
   * Delete availability block
   */
  async deleteAvailability(id: string): Promise<void> {
    const response = await apiClient.delete<{ success: boolean; error?: string }>(
      `/v1/expert/availability/${id}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete availability block');
    }
  }

  /**
   * Save onboarding draft
   */
  async saveOnboardingDraft(data: { formData: any; currentStep: number }): Promise<{ profileStatus: string }> {
    const response = await apiClient.put<{ success: boolean; data: { profileStatus: string }; message?: string }>(
      '/v1/expert/onboarding/draft',
      data
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to save draft');
    }
    return response.data.data;
  }

  /**
   * Get full onboarding profile
   */
  async getOnboardingFullProfile(): Promise<any> {
    const response = await apiClient.get<{ success: boolean; data: any }>('/v1/expert/onboarding/full-profile');
    if (!response.data.success) {
      throw new Error('Failed to fetch profile draft');
    }
    return response.data.data;
  }

  /**
   * Auto-enrich onboarding profile using 3-tier progressive intelligence:
   * Tier 1: Business email domain -> web scrape + AI taxonomy
   * Tier 2: Website URL -> web scrape + AI taxonomy
   * Tier 3: About summary -> AI taxonomy classification
   */
  async autoEnrichOnboarding(data: {
    email?: string;
    websiteUrl?: string;
    aboutText?: string;
  }): Promise<{ success: boolean; data: any; message?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: any; message?: string }>(
        '/v1/expert/onboarding/auto-enrich',
        data
      );
      return response.data;
    } catch {
      return { success: false, data: null };
    }
  }

  /**
   * Request compliance update (Entity Type / Bank Details)
   * Requires admin approval before changes go live.
   */
  async requestComplianceUpdate(data: {
    entityType?: string;
    bankDetails?: {
      accountHolderName: string;
      bankName: string;
      branchName?: string;
      accountNumber: string;
      ifscCode: string;
      accountType: 'savings' | 'current';
      upiId?: string;
    };
    reason: string;
  }): Promise<{ changeRequestStatus: string; changeRequestDate: string }> {
    const response = await apiClient.post<{
      success: boolean;
      error?: string;
      data?: { changeRequestStatus: string; changeRequestDate: string };
    }>('/v1/expert/compliance/request-update', data);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to submit compliance update request');
    }
    return response.data.data!;
  }


  /**
   * Get single quotation
   */
  async getQuotation(id: string): Promise<any> {
    const response = await apiClient.get<{ success: boolean; data: any; error?: string; message?: string }>(
      `/v1/quotations/${id}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Failed to fetch quotation');
    }
    return response.data.data;
  }

  /**
   * Request a scheduled discussion (Expert -> Seeker)
   */
  async requestScheduledDiscussion(data: {
    seekerId: string;
    purpose: 'requirement_discussion' | 'clarification' | 'alignment';
    agenda: string;
    scheduledAt: string; // ISO
    duration?: number; // minutes
    context?: Record<string, unknown>;
    quotationId?: string;
    engagementId?: string;
  }): Promise<{ discussionId: string; status: string; scheduledAt: string }> {
    const response = await apiClient.post<{
      success: boolean;
      message?: string;
      data?: { discussionId: string; status: string; scheduledAt: string };
      error?: string;
    }>('/v1/scheduled-discussions/request', {
      seekerId: data.seekerId,
      purpose: data.purpose,
      agenda: data.agenda,
      scheduledAt: data.scheduledAt,
      duration: data.duration || 45,
      context: data.context,
      quotationId: data.quotationId,
      engagementId: data.engagementId,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Failed to request discussion');
    }
    return response.data.data;
  }
}

export interface ExpertAvailability {
  _id: string;
  expertId: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export const expertService = new ExpertService();

