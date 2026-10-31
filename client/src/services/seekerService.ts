/**
 * Seeker Service
 * 
 * API client for Seeker endpoints
 */

import { apiClient } from './apiClient';

export interface SeekerStats {
  discussions: number;
  pendingQuotations: number;
  activeEngagements: number;
  depositsHeld: number;
  fundsReleased?: number;
  totalDeposits?: number;
}

export interface SeekerEngagement {
  id: string;
  _id?: string;
  expertId?: string;
  seekerName: string;
  expertName: string;
  status: string;
  totalDeposit: number;
  totalProjectAmount: number;
  remainingBalance: number;
  hasPaidDeposit: boolean;
  releasedAmount: number;
  heldAmount: number;
  progressPercentage: number;
  quotationId?: string; // Quotation ID for "View Quotation" action
  milestones: Array<{
    id: string;
    milestoneNumber: number;
    title: string;
    amount: number;
    percentage: number;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: string;
    submissionId?: string;
  }>;
  startedAt: string;
  createdAt: string;
  referenceId?: string;
}

export interface SeekerQuotation {
  id: string;
  _id?: string;
  expertId?: any;
  expertName: string;
  seekerName: string;
  status: string;
  totalAmount: number;
  totalEngagementValue?: number;
  currency: string;
  milestones: Array<{
    id: string;
    _id?: string;
    milestoneNumber: number;
    title?: string;
    name?: string;
    amount?: number;
    depositAmount?: number;
    percentage?: number;
    depositPercentage?: number;
    scope?: string;
    timeline?: string;
    status?: 'pending' | 'submitted' | 'approved' | 'rejected' | string;
  }>;
  validUntil: string;
  createdAt: string;
  acceptedAt?: string;
  scope: string;
  exclusions: any;
  referenceId?: string;
}

export interface SeekerDiscussion {
  id: string;
  purpose: string;
  agenda: string;
  status: string;
  scheduledDate?: string;
  scheduledTime?: string;
  seekerName: string;
  expertName: string;
  expertId?: string;
  createdAt: string;
  closedAt?: string;
  quotationUnlockedForBusiness?: boolean;
  rescheduleAttempts?: number;
  expertResponse?: {
    proposedNewTime?: string;
    action?: string;
  };
  quotationRequestedAt?: string;
  // Scheduled-discussions fields (platform-controlled calls)
  scheduledAt?: string;
  duration?: number;
  jitsiLink?: string | null;
  checklist?: {
    items: Array<{
      id: string;
      label: string;
      checked: boolean;
    }>;
    notes?: string;
    updatedAt?: string;
  };
  referenceId?: string;
  quotationStatus?: string | null;
  quotationId?: string;
  engagementId?: string;
  meetingJoinedAt?: string;
  attendanceStatus?: string;
  scheduledBy?: string;
  businessCounterResponse?: any;
}

export interface ApproveMilestoneRequest {
  reason?: string;
}

export interface RejectMilestoneRequest {
  reason: string;
}

export interface RevisionMilestoneRequest {
  feedback: string;
}

class SeekerService {
  /**
   * Get seeker dashboard statistics
   */
  async getStats(): Promise<SeekerStats> {
    const response = await apiClient.get<{ success: boolean; data: SeekerStats }>('/v1/seeker/dashboard/stats');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch seeker stats');
    }
    return response.data.data;
  }

  /**
   * Get seeker's engagements
   */
  async getEngagements(): Promise<SeekerEngagement[]> {
    const response = await apiClient.get<{ success: boolean; data: SeekerEngagement[] }>('/v1/seeker/engagements');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch engagements');
    }
    return response.data.data;
  }

  /**
   * Get seeker's quotations
   */
  async getQuotations(): Promise<SeekerQuotation[]> {
    const response = await apiClient.get<{ success: boolean; data: SeekerQuotation[] }>('/v1/quotations');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch quotations');
    }
    return response.data.data;
  }

  /**
   * Get single quotation detail
   */
  async getQuotation(id: string | any): Promise<any> {
    let quotationId = id;
    if (typeof id === 'object' && id !== null) {
      quotationId = id._id?.toString() || id.id || String(id);
    } else if (typeof id === 'string' && (id.includes('_id:') || id.includes('ObjectId'))) {
      const match = id.match(/ObjectId\(['"]([0-9a-fA-F]{24})['"]\)/) || id.match(/['"]([0-9a-fA-F]{24})['"]/);
      if (match && match[1]) {
        quotationId = match[1];
      }
    }
    const response = await apiClient.get<{ success: boolean; data: any; error?: string; message?: string }>(`/v1/quotations/${quotationId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch quotation');
    }
    return response.data.data;
  }

  /**
   * Get seeker's discussions
   */
  async getDiscussions(): Promise<SeekerDiscussion[]> {
    // Scheduled discussions live under /v1/scheduled-discussions
    const response = await apiClient.get<{ success: boolean; data: any[]; error?: string; message?: string }>(
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
      
      // Get expertId correctly whether it's an object or a string
      let finalExpertId: string;
      if (typeof expert === 'object' && expert !== null && '_id' in expert) {
        finalExpertId = String(expert._id);
      } else if (typeof expert === 'string') {
        finalExpertId = expert;
      } else {
        finalExpertId = String(d.expertId);
      }

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
        seekerName: business?.fullName || business?.email || 'Business',
        expertName: expert?.fullName || expert?.email || 'Expert',
        expertId: finalExpertId,
        rescheduleAttempts: d.rescheduleAttempts ?? 0,
        createdAt: d.createdAt,
        duration: d.duration,
        jitsiLink: d.jitsiLink ?? null,
        quotationStatus: d.quotationStatus,
        quotationId: d.quotationId ? String(d.quotationId) : undefined,
        engagementId: d.engagementId ? String(d.engagementId) : undefined,
        meetingJoinedAt: d.meetingJoinedAt,
        attendanceStatus: d.attendanceStatus,
        scheduledBy: d.scheduledBy ? String(d.scheduledBy) : undefined,
        expertResponse: d.expertResponse,
        businessCounterResponse: d.businessCounterResponse,
      } as SeekerDiscussion;
    });
  }

  /**
   * Request a scheduled discussion (platform-controlled meeting)
   */
  async requestScheduledDiscussion(data: {
    expertId: string;
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
    }>('/v1/scheduled-discussions/request', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Failed to request discussion');
    }
    return response.data.data;
  }

  async acceptScheduledDiscussion(discussionId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/scheduled-discussions/${discussionId}/accept`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to accept discussion');
    }
  }

  async cancelDiscussion(discussionId: string, reason: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/scheduled-discussions/${discussionId}/cancel`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to cancel discussion');
    }
  }

  async rescheduleScheduledDiscussion(discussionId: string, proposedTimeIso: string): Promise<void> {
    const response = await apiClient.post<{
      success: boolean;
      error?: string;
      message?: string;
      data?: { rescheduleAttempts?: number };
    }>(`/v1/scheduled-discussions/${discussionId}/reschedule`, {
      proposedTime: proposedTimeIso,
    });
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to propose new time');
    }
  }

  async confirmScheduledReschedule(discussionId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string; message?: string }>(
      `/v1/scheduled-discussions/${discussionId}/confirm-reschedule`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to confirm reschedule');
    }
  }

  async getExpertBookedSlots(expertId: string, date?: string): Promise<{ id?: string; start: string; duration: number; end?: string }[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const response = await apiClient.get<{
      success: boolean;
      bookedSessions: { id?: string; start: string; duration: number; end?: string }[];
    }>(`/v1/scheduled-discussions/expert/${expertId}/booked-slots${query}`);
    return response.data.bookedSessions || [];
  }

  /**
   * REQUEST QUOTATION (New Flow)
   */
  async requestQuotation(discussionId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      '/v1/quotations/request',
      { discussionId }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to request quotation');
    }
  }

  /**
   * COMPLETE DISCUSSION (New Flow)
   */
  async completeDiscussion(discussionId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/scheduled-discussions/${discussionId}/complete`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to complete discussion');
    }
  }

  /**
   * CHASE DISCUSSION (New Flow)
   */
  async chaseDiscussion(discussionId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/scheduled-discussions/${discussionId}/chase`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to chase discussion');
    }
  }

  /**
   * Accept quotation
   */
  async acceptQuotation(quotationId: string): Promise<{ engagementId: string; quotationId: string }> {
    const response = await apiClient.post<{ success: boolean; data?: { engagementId: string; quotationId?: string }; message?: string; error?: string }>(
      `/v1/quotations/${quotationId}/accept`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to accept quotation');
    }
    if (!response.data.data || !response.data.data.engagementId) {
      throw new Error('Invalid response from server');
    }
    return {
      engagementId: response.data.data.engagementId,
      quotationId: quotationId,
    };
  }

  /**
   * Reject quotation
   */
  async rejectQuotation(quotationId: string, reason: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/quotations/${quotationId}/reject`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to reject quotation');
    }
  }

  /**
   * Request quotation revision
   */
  async requestQuotationRevision(quotationId: string, feedback: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/quotations/${quotationId}/request-revision`,
      { feedback }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to request revision');
    }
  }

  /**
   * Reschedule meeting (reopen discussion)
   */
  async rescheduleMeeting(quotationId: string): Promise<{ discussionId: string }> {
    const response = await apiClient.post<{ success: boolean; data?: { discussionId: string }; message?: string; error?: string }>(
      `/v1/quotations/${quotationId}/reschedule-meeting`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to reschedule meeting');
    }
    if (!response.data.data) {
      throw new Error('Invalid response from server');
    }
    return response.data.data;
  }

  /**
   * Approve milestone
   * Requires idempotency key and timestamp headers for financial safety
   */
  async approveMilestone(milestoneSubmissionId: string, data?: ApproveMilestoneRequest): Promise<void> {
    const idempotencyKey = `milestone-approve-${milestoneSubmissionId}-${Date.now()}`;
    const timestamp = Date.now().toString();

    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/milestones/${milestoneSubmissionId}/approve`,
      data || {},
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
          'X-Request-Timestamp': timestamp,
        },
      }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to approve milestone');
    }
  }

  /**
   * Request milestone revision
   */
  async requestRevision(milestoneSubmissionId: string, data: RevisionMilestoneRequest): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/milestones/${milestoneSubmissionId}/revision`,
      { comment: data.feedback }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to request revision');
    }
  }

  /**
   * Get detailed milestone submission (for seeker review)
   */
  async getMilestoneSubmission(submissionId: string): Promise<{
    id: string;
    milestoneNumber: number;
    title: string;
    submissionContent: string;
    submissionFiles: string[];
    submittedAt: string;
    autoReleaseEligibleAt?: string;
    expertName: string;
    status: string;
  }> {
    const response = await apiClient.get<{ success: boolean; data?: any; message?: string; error?: string }>(
      `/v1/seeker/milestone-submissions/${submissionId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Failed to fetch milestone submission');
    }
    return response.data.data;
  }

  /**
   * Reject milestone
   */
  async rejectMilestone(milestoneSubmissionId: string, data: RejectMilestoneRequest): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/milestones/${milestoneSubmissionId}/reject`,
      { comment: data.reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to reject milestone');
    }
  }

  /**
   * Complete compliance
   */
  async completeCompliance(engagementId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/engagements/${engagementId}/complete-compliance`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to complete compliance');
    }
  }

  /**
   * Complete engagement
   */
  async completeEngagement(engagementId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/engagements/${engagementId}/complete`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to complete engagement');
    }
  }

  /**
   * Archive discussion
   */
  async archiveDiscussion(discussionId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/discussions/${discussionId}/archive`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to archive discussion');
    }
  }

  /**
   * Schedule follow-up discussion
   */
  async scheduleFollowUpDiscussion(expertId: string, subject: string, description: string): Promise<{ id: string }> {
    return this.createDiscussion({ expertId, subject, description });
  }

  /**
   * Close engagement
   */
  async closeEngagement(engagementId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/engagements/${engagementId}/close`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to close engagement');
    }
  }

  /**
   * Initiate deposit
   */
  async initiateDeposit(engagementId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/engagements/${engagementId}/initiate-deposit`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to initiate deposit');
    }
  }

  /**
   * Create discussion
   */
  async createDiscussion(data: {
    expertId: string;
    subject: string;
    description: string;
    checklistItems?: string[]; // Added support for checklist items
  }): Promise<{ id: string; refreshed?: boolean }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message?: string;
        data?: { id: string; refreshed?: boolean };
        error?: string;
      }>('/v1/discussions', data);
      if (!response.data.success) {
        throw new Error(response.data.error || response.data.message || 'Failed to create discussion');
      }
      if (!response.data.data) {
        throw new Error('Invalid response from server');
      }
      return response.data.data;
    } catch (err: unknown) {
      const ax = err as {
        response?: { status?: number; data?: { error?: string; data?: { id?: string } } };
      };
      if (ax.response?.status === 409 && ax.response.data?.data?.id) {
        const conflict = new Error(
          ax.response.data.error || 'An open discussion already exists with this expert'
        );
        (conflict as Error & { isConflict: boolean; existingDiscussionId: string }).isConflict = true;
        (conflict as Error & { isConflict: boolean; existingDiscussionId: string }).existingDiscussionId =
          ax.response.data.data.id;
        throw conflict;
      }
      throw err;
    }
  }

  /**
   * Get discussion
   */
  async getDiscussion(discussionId: string): Promise<SeekerDiscussion> {
    const response = await apiClient.get<{ success: boolean; data: SeekerDiscussion }>(
      `/v1/scheduled-discussions/${discussionId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch discussion');
    }
    const d: any = response.data.data;
    const scheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : null;
    
    // Get expertId correctly whether it's an object or a string
    let finalExpertId: string | undefined;
    if (typeof d.expertId === 'object' && d.expertId !== null && '_id' in d.expertId) {
      finalExpertId = String(d.expertId._id);
    } else if (typeof d.expertId === 'string') {
      finalExpertId = d.expertId;
    }

    return {
      id: String(d._id || d.id),
      purpose: d.purpose,
      agenda: d.agenda,
      status: d.status,
      scheduledAt: d.scheduledAt,
      scheduledDate: scheduledAt ? scheduledAt.toISOString() : '',
      scheduledTime: scheduledAt
        ? scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : '',
      seekerName: d.businessId?.fullName || d.businessId?.email || 'Business',
      expertName: d.expertId?.fullName || d.expertId?.email || 'Expert',
      expertId: finalExpertId,
      createdAt: d.createdAt,
      closedAt: d.completedAt,
      quotationUnlockedForBusiness: d.quotationUnlockedForBusiness,
      quotationRequestedAt: d.quotationRequestedAt,
      duration: d.duration,
      jitsiLink: d.jitsiLink ?? null,
      rescheduleAttempts: d.rescheduleAttempts ?? 0,
      expertResponse: d.expertResponse,
      checklist: d.checklist,
      quotationStatus: d.quotationStatus,
      quotationId: d.quotationId ? String(d.quotationId) : undefined,
      engagementId: d.engagementId ? String(d.engagementId) : undefined,
      meetingJoinedAt: d.meetingJoinedAt,
      attendanceStatus: d.attendanceStatus,
    } as SeekerDiscussion;
  }

  /**
   * Acknowledge auto-release policy (P0 compliance)
   */
  async acknowledgeAutoRelease(): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      '/v1/seeker/acknowledge-auto-release'
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to acknowledge auto-release policy');
    }
  }

  /**
   * Acknowledge approval irreversibility (P0 compliance)
   */
  async acknowledgeApprovalIrreversibility(): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      '/v1/seeker/acknowledge-approval-irreversibility'
    );
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to acknowledge approval irreversibility');
    }
  }

  /**
   * Get milestone submission details (P0 - for submission viewer)
   */
  async getMilestoneSubmissionDetails(submissionId: string): Promise<{
    id: string;
    milestoneNumber: number;
    title: string;
    submissionContent: string;
    submissionFiles: string[];
    submittedAt: string;
    autoReleaseEligibleAt?: string;
    expertName: string;
    status: string;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        id: string;
        milestoneNumber: number;
        title: string;
        submissionContent: string;
        submissionFiles: string[];
        submittedAt: string;
        autoReleaseEligibleAt?: string;
        expertName: string;
        status: string;
      };
    }>(`/v1/seeker/milestone-submissions/${submissionId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch milestone submission details');
    }
    return response.data.data;
  }

  /**
   * Validate billing details (Compliance Check)
   */
  async validateBillingDetails(): Promise<{ isValid: boolean; errors: string[] }> {
    const response = await apiClient.get<{ success: boolean; isValid: boolean; errors: string[] }>(
      '/v1/seeker/profile/billing-validation'
    );
    if (!response.data.success) {
      throw new Error('Failed to validate billing details');
    }
    return {
      isValid: response.data.isValid,
      errors: response.data.errors,
    };
  }

  /**
   * Save seeker onboarding draft
   */
  async saveOnboardingDraft(data: { formData: any; currentStep: number }): Promise<{ currentStep: number; lastSavedAt: string }> {
    const response = await apiClient.put<{
      success: boolean;
      message?: string;
      data?: { currentStep: number; lastSavedAt: string };
      error?: string;
    }>('/v1/seeker/onboarding/draft', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to save draft');
    }
    return response.data.data;
  }

  /**
   * Get seeker onboarding draft
   */
  async getOnboardingDraft(): Promise<{ formData: any; currentStep: number; lastSavedAt: string } | null> {
    const response = await apiClient.get<{
      success: boolean;
      data?: {
        formData: any;
        currentStep: number;
        lastSavedAt: string;
      } | null;
      message?: string;
    }>('/v1/seeker/onboarding/draft');
    if (!response.data.success) {
      throw new Error('Failed to retrieve draft');
    }
    return response.data.data || null;
  }
}

export const seekerService = new SeekerService();

