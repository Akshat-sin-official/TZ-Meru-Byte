/**
 * Admin Service
 * 
 * API client for admin endpoints
 */

import { apiClient } from './apiClient';

export interface UserListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface VerificationQueueItem {
  userId: string;
  name: string;
  email: string;
  submittedAt: string;
  status: string;
  isProfileComplete: boolean;
  profileCompletion?: number;
  missingFields?: string[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
  } | string;
}

export interface OperationsEngagementItem {
  id: string;
  engagementReference: string;
  seekerName: string;
  expertName: string;
  category: string;
  currentMilestone: string;
  milestoneNumber: number;
  depositStatus: string;
  daysIdle: number;
  riskFlag: boolean;
  status: string;
  amount: number;
  nextAction: string;
}

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  expertId: string;
  engagementId?: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
  transactionId?: string;
}

export interface PayoutListResponse {
  data: Payout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BankValidationResponse {
  isValid: boolean;
  accountName?: string;
  bankName?: string;
  branchName?: string;
  ifsc?: string;
  message?: string;
}

export interface PriorityAlert {
  type: string;
  message: string;
  count: number;
  severity: 'warning' | 'critical' | 'info';
}

export interface AdminStats {
  // KPI Cards
  totalPlatformVisits?: number;
  /** Logged-in expert / expert_candidate page views (subset of total). */
  platformVisitsExperts?: number;
  /** Logged-in seeker / seeker_candidate page views (subset of total). */
  platformVisitsSeekers?: number;
  /** Guests, admins, or unidentified (subset of total). */
  platformVisitsOther?: number;
  activeSeekers?: number;
  activeExperts?: number;
  activeEngagements?: number;
  successfulEngagements?: number;
  milestonesPendingApproval?: number;
  milestonesPendingAutoRelease?: number;
  totalHeld: number;
  totalReleased: number;
  totalCommission?: number;
  pendingVerifications: number;
  pendingReleases: number;
  complianceHolds?: number;
  disputedEngagements?: number;
  // Priority Alerts
  priorityAlerts?: PriorityAlert[];
}

export interface PendingRelease {
  id: string;
  milestoneSubmissionId: string;
  milestoneTitle: string;
  milestoneNumber: number;
  amount: number;
  expertName: string;
  expertEmail?: string; // Added for frontend display
  seekerName: string;
  seekerEmail?: string; // Added for completeness
  engagementId: string;
  submittedAt: string;
  autoReleaseDate: string;
  status: 'awaiting_approval' | 'released';
}

export interface AdminAction {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  targetUser?: string;
  engagementId?: string;
  reason: string;
  details?: Record<string, unknown>;
}

export interface AdminActionsResponse {
  actions: AdminAction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReleaseMilestoneRequest {
  milestoneSubmissionId: string;
  reason: string;
}

export interface ExpertListItem {
  userId: string;
  expertId?: string;
  email: string;
  name: string;
  businessName?: string;
  isActive: boolean;
  isProfileComplete: boolean;
  kycVerified: boolean;
  coreServiceCategories: string[];
  location: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  profileStatus: string;
}

export interface SeekerListItem {
  userId: string;
  email: string;
  name: string;
  seekerId?: string;
  businessName?: string;
  isActive: boolean;
  identityVerified: boolean;
  authorizationVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getStats(): Promise<AdminStats> {
    const response = await apiClient.get<{ success: boolean; data: AdminStats }>('/v1/admin/stats');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch admin stats');
    }
    return response.data.data;
  }

  /**
   * Get pending milestone releases
   */
  async getPendingReleases(): Promise<PendingRelease[]> {
    const response = await apiClient.get<{ success: boolean; data: PendingRelease[] }>('/v1/admin/releases/pending');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch pending releases');
    }
    return response.data.data;
  }

  /**
   * Get admin action audit log
   */
  async getAdminActions(page: number = 1, limit: number = 50): Promise<AdminActionsResponse> {
    const response = await apiClient.get<{ success: boolean; data: AdminActionsResponse }>(
      `/v1/admin/actions?page=${page}&limit=${limit}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch admin actions');
    }
    return response.data.data;
  }

  /**
   * Execute milestone release (admin)
   * Requires Idempotency-Key and X-Request-Timestamp headers
   */
  async releaseMilestone(
    milestoneSubmissionId: string,
    reason: string,
    idempotencyKey: string,
    timestamp: string
  ): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      '/v1/admin/milestones/release',
      {
        milestoneSubmissionId,
        reason,
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
          'X-Request-Timestamp': timestamp,
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to release milestone');
    }
  }

  /**
   * Get experts list
   */
  async getExpertsList(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive' | 'under_review';
    category?: string;
    location?: string;
    kycVerified?: boolean | string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserListResponse<ExpertListItem>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.kycVerified !== undefined) queryParams.append('kycVerified', params.kycVerified.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<{ success: boolean; data: ExpertListItem[]; pagination: any }>(
      `/v1/admin/users/experts?${queryParams.toString()}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch experts list');
    }
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get expert detail
   */
  async getExpertDetail(userId: string): Promise<any> {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/v1/admin/users/experts/${userId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch expert detail');
    }
    return response.data.data;
  }

  /**
   * Get seekers list
   */
  async getSeekersList(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive';
    identityVerified?: boolean;
    authorizationVerified?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserListResponse<SeekerListItem>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.identityVerified !== undefined) queryParams.append('identityVerified', params.identityVerified.toString());
    if (params?.authorizationVerified !== undefined) queryParams.append('authorizationVerified', params.authorizationVerified.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<{ success: boolean; data: SeekerListItem[]; pagination: any }>(
      `/v1/admin/users/seekers?${queryParams.toString()}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch seekers list');
    }
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get seeker detail
   */
  async getSeekerDetail(userId: string): Promise<any> {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/v1/admin/users/seekers/${userId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch seeker detail');
    }
    return response.data.data;
  }

  /**
   * Approve expert profile
   */
  async approveExpertProfile(userId: string, reason?: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/approve`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to approve expert profile');
    }
  }

  /**
   * Reject expert profile with reason
   */
  async rejectExpertProfile(userId: string, rejectionReason: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/reject`,
      { rejectionReason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to reject expert profile');
    }
  }

  /**
   * Request documents from expert
   */
  async requestExpertDocuments(userId: string, requirements: string, requestedDocs?: string[]): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/request-documents`,
      { requirements, requestedDocs }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to request documents');
    }
  }

  /**
   * Suspend expert profile
   */
  async suspendExpertProfile(userId: string, reason: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/suspend`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to suspend expert profile');
    }
  }

  /**
   * Reactivate expert profile
   */
  async reactivateExpertProfile(userId: string, reason?: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/reactivate`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to reactivate expert profile');
    }
  }

  /**
   * Verify expert KYC
   */
  async verifyExpertKYC(userId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/verify-kyc`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to verify KYC');
    }
  }

  /**
   * Verify expert certification
   */
  async verifyExpertCertification(userId: string, certificationId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/verify-certification`,
      { certificationId }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to verify certification');
    }
  }

  /**
   * Lock compliance fields
   */
  async lockComplianceFields(userId: string, fields: string[]): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/lock-compliance`,
      { fields }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to lock compliance fields');
    }
  }

  /**
   * Verify seeker identity (Toggle)
   */
  async verifySeekerIdentity(userId: string, status: boolean = true): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/seekers/${userId}/verify-identity`,
      { status }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update seeker identity status');
    }
  }

  /**
   * Get operations engagements list
   */
  async getOperationsEngagements(params?: {
    page?: number;
    limit?: number;
    engagementStatus?: string;
    search?: string;
  }): Promise<UserListResponse<OperationsEngagementItem>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.engagementStatus) queryParams.append('engagementStatus', params.engagementStatus);
    if (params?.search) queryParams.append('search', params.search);

    const response = await apiClient.get<{ success: boolean; data: OperationsEngagementItem[]; pagination: any }>(
      `/v1/admin/operations/engagements?${queryParams.toString()}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch operations engagements');
    }
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Verify seeker authorization (Toggle)
   */
  async verifySeekerAuthorization(userId: string, status: boolean = true): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/seekers/${userId}/verify-authorization`,
      { status }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update seeker authorization status');
    }
  }

  /**
   * Lock billing details
   */
  async lockBillingDetails(userId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/seekers/${userId}/lock-billing`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to lock billing details');
    }
  }

  /**
   * Get verification queue
   */
  async getVerificationQueue(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserListResponse<VerificationQueueItem>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<{ success: boolean; data: VerificationQueueItem[]; pagination: any }>(
      `/v1/admin/verification/queue?${queryParams.toString()}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch verification queue');
    }
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get expert detail for verification
   */
  async getExpertForVerification(userId: string): Promise<any> {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/v1/admin/verification/experts/${userId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch expert for verification');
    }
    return response.data.data;
  }

  /**
   * Get financial ledger
   */
  async getFinancialLedger(params?: {
    page?: number;
    limit?: number;
    engagementId?: string;
    entryType?: 'deposit' | 'release';
    startDate?: string;
    endDate?: string;
  }): Promise<{
    data: Array<{
      id: string;
      engagementId: string;
      quotationId?: string;
      entryType: string;
      amount: number;
      currency: string;
      description: string;
      createdAt: string;
      triggerSource?: string;
      milestoneSubmissionId?: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.engagementId) queryParams.append('engagementId', params.engagementId);
    if (params?.entryType) queryParams.append('entryType', params.entryType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get<{ success: boolean; data: any[]; pagination: any }>(
      `/v1/admin/finance/ledger?${queryParams.toString()}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch financial ledger');
    }
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get payout details
   */
  async getPayout(payoutId: string): Promise<Payout> {
    const response = await apiClient.get<{ success: boolean; data: Payout }>(
      `/v1/admin/payouts/${payoutId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch payout details');
    }
    return response.data.data;
  }

  /**
   * List payouts
   */
  async getPayouts(params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
    expertId?: string;
    engagementId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PayoutListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.expertId) queryParams.append('expertId', params.expertId);
    if (params?.engagementId) queryParams.append('engagementId', params.engagementId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get<{ success: boolean; data: Payout[]; pagination: any }>(
      `/v1/admin/payouts?${queryParams.toString()}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch payouts');
    }
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Retry failed payout
   */
  async retryPayout(payoutId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/payouts/${payoutId}/retry`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to retry payout');
    }
  }

  /**
   * Sync payout status from gateway
   */
  async syncPayoutStatus(payoutId: string): Promise<{
    id: string;
    status: string;
    gatewayPayoutId?: string;
    utr?: string;
    failureReason?: string;
  }> {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/v1/admin/payouts/${payoutId}/sync`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to sync payout status');
    }
    return response.data.data;
  }

  /**
   * Validate expert bank details
   */
  async validateBankDetails(expertId: string): Promise<BankValidationResponse> {
    const response = await apiClient.get<{ success: boolean; data: BankValidationResponse }>(
      `/v1/admin/payouts/validate-bank/${expertId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to validate bank details');
    }
    return response.data.data;
  }

  /**
   * Delete expert user
   */
  async deleteExpert(userId: string, reason: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/delete`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete expert');
    }
  }

  /**
   * Delete seeker user
   */
  async deleteSeeker(userId: string, reason: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/seekers/${userId}/delete`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete seeker');
    }
  }

  /**
   * Update expert KYC status (toggle)
   */
  async updateExpertKYCStatus(userId: string, status: boolean): Promise<void> {
    const response = await apiClient.patch<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/kyc`,
      { status }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update KYC status');
    }
  }

  /**
   * Update expert admin notes
   */
  async updateExpertNotes(userId: string, notes: string): Promise<void> {
    const response = await apiClient.patch<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/experts/${userId}/notes`,
      { notes }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update admin notes');
    }
  }

  /**
   * Update seeker admin notes
   */
  async updateSeekerNotes(userId: string, notes: string): Promise<void> {
    const response = await apiClient.patch<{ success: boolean; message?: string; error?: string }>(
      `/v1/admin/users/seekers/${userId}/notes`,
      { notes }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update admin notes');
    }
  }
  /**
   * Analytics Intelligence
   */
  async getSupplySummary(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/v1/admin/analytics/supply-summary');
    return response.data;
  }

  async getGeoIntelligence(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/v1/admin/analytics/geo-intelligence');
    return response.data;
  }

  async getDiscoveryAnalytics(): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get<{ success: boolean; data: any }>('/v1/admin/analytics/discovery');
    return response.data;
  }

  async getMarketplacePerformance(): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get<{ success: boolean; data: any }>('/v1/admin/analytics/marketplace-performance');
    return response.data;
  }

  async getUserActivity(userId: string): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(`/v1/admin/users/${userId}/activity`);
    return response.data;
  }

  /**
   * Approve expert pending profile updates
   */
  async approveProfileUpdate(userId: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string }>(
      `/v1/admin/users/experts/${userId}/approve-update`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to approve profile update');
    }
  }

  /**
   * Reject expert pending profile updates (clears pendingData)
   */
  async rejectProfileUpdate(userId: string, reason: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string }>(
      `/v1/admin/users/experts/${userId}/reject-update`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to reject profile update');
    }
  }

  /**
   * Request changes for pending profile updates (keeps pendingData)
   */
  async requestProfileUpdateChanges(userId: string, reason: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string }>(
      `/v1/admin/users/experts/${userId}/request-update-changes`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to request profile update changes');
    }
  }

  /**
   * Update Expert Industry Taxonomy manually by Admin
   */
  async updateExpertTaxonomy(userId: string, data: { industrySector?: string; industrySectors?: string[]; industrySubSectors?: string[] }): Promise<void> {
    const response = await apiClient.patch<{ success: boolean; error?: string }>(
      `/v1/admin/users/experts/${userId}/taxonomy`,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update expert taxonomy');
    }
  }

  /**
   * Admin: Review Legal Name Change Request
   */
  async reviewLegalNameChange(profileId: string, action: 'approve' | 'reject', rejectionReason?: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string }>(
      `/v1/admin/governance/legal-name-change/${profileId}`,
      { action, rejectionReason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to review legal name change');
    }
  }

  /**
   * Admin: Review Mobile Number Change Request
   */
  async reviewMobileChange(profileId: string, action: 'approve' | 'reject', rejectionReason?: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string }>(
      `/v1/admin/governance/mobile-change/${profileId}`,
      { action, rejectionReason }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to review mobile change');
    }
  }
  /**
   * Admin: Update any user profile and fields (Expert or Seeker)
   */
  async updateUserProfile(
    userId: string,
    payload: {
      userUpdates?: Record<string, any>;
      profileUpdates?: Record<string, any>;
      reason?: string;
      [key: string]: any;
    }
  ): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.patch<{ success: boolean; data: any; message?: string; error?: string }>(
      `/v1/admin/users/${userId}/profile`,
      payload
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update user profile');
    }
    return response.data;
  }
}

export const adminService = new AdminService();

