/**
 * DEPOSIT & ENGAGEMENT SERVICE
 * 
 * API client for deposit collection, milestone management, engagement lifecycle
 * 
 * CRITICAL TERMINOLOGY:
 * - All functions use "deposit" (NOT payment)
 * - All milestones require explicit approval (NO auto-release from UI)
 * - Platform is neutral (no judgment logic)
 */

import { apiClient } from './apiClient';
import {
  InitiateDepositPayload,
  ConfirmDepositPayload,
  SubmitMilestonePayload,
  RequestRevisionPayload,
  RejectMilestonePayload,
  FlagMilestonePayload,
  DepositInitiateResponse,
  DepositConfirmResponse,
  MilestoneSubmitResponse,
  MilestoneApproveResponse,
  DepositLedger,
  Engagement,
  MilestoneSubmission,
} from '../types/deposit';

// ==================== DEPOSIT COLLECTION ====================

/**
 * Initiate deposit (Business)
 * Prepares for deposit collection, verifies consent and tax context
 */
export const initiateDeposit = async (
  payload: InitiateDepositPayload
): Promise<DepositInitiateResponse> => {
  const response = await apiClient.post<{ data: DepositInitiateResponse }>(
    '/v1/deposit/initiate',
    payload
  );
  return response.data.data;
};

/**
 * Confirm deposit (System/Business)
 * Called after payment gateway success
 * Creates ledger entry, activates engagement
 */
export const confirmDeposit = async (
  payload: ConfirmDepositPayload
): Promise<DepositConfirmResponse> => {
  const response = await apiClient.post<{ data: DepositConfirmResponse }>(
    '/v1/deposit/confirm',
    payload
  );
  return response.data.data;
};

/**
 * Get deposit ledger by quotation ID
 */
export const getDepositLedger = async (quotationId: string): Promise<DepositLedger> => {
  const response = await apiClient.get<{ data: DepositLedger }>(`/v1/deposit/ledger/${quotationId}`);
  return response.data.data;
};

/**
 * Get deposit ledger by engagement ID
 */
export const getDepositLedgerByEngagement = async (engagementId: string): Promise<DepositLedger> => {
  const response = await apiClient.get<{ data: DepositLedger }>(`/v1/deposit/ledger/engagement/${engagementId}`);
  return response.data.data;
};

// ==================== ENGAGEMENT MANAGEMENT ====================

/**
 * Get engagement by ID
 */
export const getEngagement = async (engagementId: string): Promise<Engagement> => {
  const response = await apiClient.get<{ data: Engagement }>(`/v1/engagements/${engagementId}`);
  return response.data.data;
};

/**
 * Get engagement by quotation ID
 */
export const getEngagementByQuotation = async (quotationId: string): Promise<Engagement> => {
  const response = await apiClient.get<{ data: Engagement }>(`/v1/engagements/quotation/${quotationId}`);
  return response.data.data;
};

/**
 * Get my engagements (filtered by role)
 */
export const getMyEngagements = async (filters?: {
  status?: string;
  role?: 'expert' | 'seeker';
}): Promise<Engagement[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.role) params.append('role', filters.role);
  
  const response = await apiClient.get<{ data: Engagement[] }>(`/api/v1/engagements?${params.toString()}`);
  return response.data.data;
};

// ==================== MILESTONE MANAGEMENT ====================

/**
 * Submit milestone completion (Expert)
 * Requests deposit release for milestone
 */
export const submitMilestone = async (
  payload: SubmitMilestonePayload
): Promise<MilestoneSubmitResponse> => {
  const response = await apiClient.post<{ data: MilestoneSubmitResponse }>(
    '/v1/milestones/submit',
    payload
  );
  return response.data.data;
};

/**
 * Approve milestone (Business)
 * CRITICAL: Triggers deposit release to expert
 */
export const approveMilestone = async (
  submissionId: string
): Promise<MilestoneApproveResponse> => {
  const response = await apiClient.post<{ data: MilestoneApproveResponse }>(
    `/v1/milestones/${submissionId}/approve`
  );
  return response.data.data;
};

/**
 * Request milestone revision (Business)
 * Expert must resubmit
 */
export const requestMilestoneRevision = async (
  submissionId: string,
  payload: RequestRevisionPayload
): Promise<void> => {
  await apiClient.post(`/api/v1/milestones/${submissionId}/request-revision`, payload);
};

/**
 * Reject milestone (Business)
 * Does NOT release deposit
 */
export const rejectMilestone = async (
  submissionId: string,
  payload: RejectMilestonePayload
): Promise<void> => {
  await apiClient.post(`/api/v1/milestones/${submissionId}/reject`, payload);
};

/**
 * Flag milestone issue (Business)
 * Escalates to admin, freezes ledger
 */
export const flagMilestoneIssue = async (
  submissionId: string,
  payload: FlagMilestonePayload
): Promise<void> => {
  await apiClient.post(`/api/v1/milestones/${submissionId}/flag`, payload);
};

/**
 * Get milestone submissions for engagement
 */
export const getMilestoneSubmissions = async (
  engagementId: string
): Promise<MilestoneSubmission[]> => {
  const response = await apiClient.get<{ data: MilestoneSubmission[] }>(
    `/v1/milestones/engagement/${engagementId}`
  );
  return response.data.data;
};

/**
 * Get milestone submission by ID
 */
export const getMilestoneSubmission = async (
  submissionId: string
): Promise<MilestoneSubmission> => {
  const response = await apiClient.get<{ data: MilestoneSubmission }>(`/v1/milestones/${submissionId}`);
  return response.data.data;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate remaining deposit amount
 */
export const calculateRemainingDeposit = (ledger: DepositLedger): number => {
  return ledger.heldAmount;
};

/**
 * Calculate total released amount
 */
export const calculateTotalReleased = (ledger: DepositLedger): number => {
  return ledger.releasedAmount;
};

/**
 * Check if all milestones released
 */
export const isFullyReleased = (ledger: DepositLedger): boolean => {
  return ledger.status === 'fully_released' || ledger.heldAmount === 0;
};

/**
 * Get deposit collection status label
 */
export const getDepositStatusLabel = (status: string): string => {
  switch (status) {
    case 'not_collected':
      return 'Deposit Not Collected';
    case 'held':
      return 'Deposit Held Securely';
    case 'partially_released':
      return 'Partially Released';
    case 'fully_released':
      return 'Fully Released';
    case 'frozen':
      return 'Frozen (Admin Review)';
    default:
      return status;
  }
};

/**
 * Get milestone status label
 */
export const getMilestoneStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Awaiting Your Approval';
    case 'approved':
      return 'Approved & Released';
    case 'rejected':
      return 'Rejected';
    case 'auto_released':
      return 'Auto-Released';
    case 'revision_requested':
      return 'Revision Requested';
    default:
      return status;
  }
};

/**
 * Get engagement status label
 */
export const getEngagementStatusLabel = (status: string): string => {
  switch (status) {
    case 'quotation_sent':
      return 'Quotation Sent';
    case 'quotation_accepted':
      return 'Quotation Accepted';
    case 'pending_compliance':
      return 'Pending Compliance';
    case 'pending_deposit':
      return 'Pending Deposit Collection';
    case 'active':
      return 'Active Engagement';
    case 'completed':
      return 'Completed';
    case 'closed':
      return 'Closed';
    case 'cancelled':
      return 'Cancelled';
    case 'disputed':
      return 'Under Dispute';
    default:
      return status;
  }
};

/**
 * Format currency (INR)
 */
export const formatDeposit = (amount: number): string => {
  return `₹${(amount / 100).toLocaleString('en-IN')}`;
};

/**
 * Check if business can approve milestone
 */
export const canApproveMilestone = (submission: MilestoneSubmission): boolean => {
  return submission.status === 'pending';
};

/**
 * Check if expert can submit milestone
 */
export const canSubmitMilestone = (
  milestoneNumber: number,
  submissions: MilestoneSubmission[]
): boolean => {
  const existing = submissions.find((s) => s.milestoneNumber === milestoneNumber);
  if (!existing) return true;
  return existing.status === 'rejected' || existing.status === 'revision_requested';
};

/**
 * Get next submittable milestone
 */
export const getNextSubmittableMilestone = (
  totalMilestones: number,
  submissions: MilestoneSubmission[]
): number | null => {
  for (let i = 1; i <= totalMilestones; i++) {
    if (canSubmitMilestone(i, submissions)) {
      return i;
    }
  }
  return null;
};

export default {
  // Deposit
  initiateDeposit,
  confirmDeposit,
  getDepositLedger,
  getDepositLedgerByEngagement,
  
  // Engagement
  getEngagement,
  getEngagementByQuotation,
  getMyEngagements,
  
  // Milestones
  submitMilestone,
  approveMilestone,
  requestMilestoneRevision,
  rejectMilestone,
  flagMilestoneIssue,
  getMilestoneSubmissions,
  getMilestoneSubmission,
  
  // Helpers
  calculateRemainingDeposit,
  calculateTotalReleased,
  isFullyReleased,
  getDepositStatusLabel,
  getMilestoneStatusLabel,
  getEngagementStatusLabel,
  formatDeposit,
  canApproveMilestone,
  canSubmitMilestone,
  getNextSubmittableMilestone,
};
