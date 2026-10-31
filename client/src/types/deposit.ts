/**
 * DEPOSIT & ENGAGEMENT TYPES
 * 
 * CRITICAL TERMINOLOGY:
 * - DEPOSIT (NOT payment, salary, invoice)
 * - RELEASE (NOT payout)
 * - HOLD (NOT escrow externally)
 * - MILESTONE APPROVAL (explicit business action)
 * 
 * PRINCIPLES:
 * - Business controls all releases
 * - Platform is neutral (no judgment, no auto-release)
 * - Full audit trail
 * - One quotation = one ledger
 */

// ==================== ENUMS ====================

export enum DepositLedgerStatus {
  NOT_COLLECTED = 'not_collected',
  HELD = 'held',
  PARTIALLY_RELEASED = 'partially_released',
  FULLY_RELEASED = 'fully_released',
  FROZEN = 'frozen', // Admin intervention
}

export enum EngagementStatus {
  QUOTATION_SENT = 'quotation_sent',
  QUOTATION_ACCEPTED = 'quotation_accepted',
  PENDING_COMPLIANCE = 'pending_compliance',
  PENDING_DEPOSIT = 'pending_deposit',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum MilestoneSubmissionStatus {
  PENDING = 'pending', // Submitted, awaiting business approval
  APPROVED = 'approved', // Approved by business → triggers release
  REJECTED = 'rejected', // Rejected by business
  AUTO_RELEASED = 'auto_released', // Auto-released after timeout
  REVISION_REQUESTED = 'revision_requested', // Business requested changes
}

export enum DepositMethod {
  UPI = 'UPI',
  NET_BANKING = 'NetBanking',
  BANK_TRANSFER = 'BankTransfer',
  OTHER = 'Other',
}

// ==================== INTERFACES ====================

/**
 * DEPOSIT LEDGER
 * Core financial record (one per quotation)
 */
export interface DepositLedger {
  _id: string;
  ledgerId: string; // Human-readable ID (e.g., LDG-xxx)
  quotationId: string;
  businessId: {
    _id: string;
    fullName: string;
    email: string;
  };
  expertId: {
    _id: string;
    fullName: string;
    email: string;
  };
  
  // Financial amounts (in paisa)
  totalEngagementValue: number;
  totalDeposit: number;
  heldAmount: number;
  releasedAmount: number;
  
  // Status
  status: DepositLedgerStatus;
  
  // Deposit collection
  depositCollectedAt?: string;
  depositMethod?: DepositMethod;
  depositTransactionId?: string;
  
  // Milestone releases
  milestoneReleases: MilestoneRelease[];
  
  // Audit trail
  auditLog: AuditLogEntry[];
  
  // Admin intervention
  isFrozen: boolean;
  frozenReason?: string;
  frozenAt?: string;
  frozenBy?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneRelease {
  milestoneId: string;
  milestoneNumber: number;
  requestedAmount: number;
  releasedAmount: number;
  releasedAt: string;
  releaseTransactionId?: string;
}

export interface AuditLogEntry {
  action: string; // 'deposit_collected', 'release_approved', 'release_requested', 'flagged', 'frozen', 'unfrozen'
  performedBy: string;
  performedByRole: 'business' | 'expert' | 'admin';
  timestamp: string;
  details: string;
  description: string; // Human-readable description
  entryType: string; // DEPOSIT, RELEASE, REFUND, etc.
  amount: number; // Amount in transaction
  metadata?: Record<string, any>;
}

/**
 * ENGAGEMENT
 * Active project lifecycle
 */
export interface Engagement {
  _id: string;
  quotationId: string;
  seekerId: {
    _id: string;
    fullName: string;
    email: string;
  };
  expertId: {
    _id: string;
    fullName: string;
    email: string;
  };
  status: EngagementStatus;
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  disputeReason?: string;
  activatedAt?: string;
  isSuccessful: boolean;
  firstSuccessAt?: string;
  releasedMilestonesCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * MILESTONE SUBMISSION (Release Request)
 * Expert submits milestone, business approves
 */
export interface MilestoneSubmission {
  _id: string;
  engagementId: string;
  quotationId: string;
  milestoneNumber: number;
  expertId: string;
  seekerId: string;
  submissionContent: string;
  submissionFiles?: string[];
  submittedAt: string;
  status: MilestoneSubmissionStatus;
  seekerResponseAt?: string;
  seekerResponse?: string;
  reminderSentAt?: string;
  reminderCount: number;
  autoReleaseEligibleAt?: string;
  autoReleasedAt?: string;
  issueDetails?: {
    flaggedAt: string;
    flaggedBy: string;
    issueDescription: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ==================== PAYLOADS ====================

/**
 * DEPOSIT COLLECTION
 */
export interface InitiateDepositPayload {
  engagementId: string;
}

export interface ConfirmDepositPayload {
  engagementId: string;
  transactionId?: string;
}

/**
 * MILESTONE SUBMISSION
 */
export interface SubmitMilestonePayload {
  engagementId: string;
  quotationId?: string; // Optional quotation reference
  milestoneNumber: number;
  submissionContent: string;
  submissionFiles?: string[];
}

/**
 * MILESTONE APPROVAL
 */
export interface ApproveMilestonePayload {
  // No body, milestone ID in URL
}

export interface RequestRevisionPayload {
  revisionRequest?: string; // Feedback comment
  revisionNotes?: string; // Alternative property name
}

export interface RejectMilestonePayload {
  reason: string; // Rejection reason
}

export interface FlagMilestonePayload {
  issueDescription: string;
  flaggedBy?: string; // Optional, backend can infer from auth
}

// ==================== RESPONSES ====================

export interface DepositInitiateResponse {
  depositAmount: number;
  currency: string;
  engagementId: string;
}

export interface DepositConfirmResponse {
  ledgerId: string;
  engagementStatus: EngagementStatus;
}

export interface MilestoneSubmitResponse {
  submissionId: string;
}

export interface MilestoneApproveResponse {
  releaseAmount: number;
  releaseTransactionId?: string;
}

// ==================== UI STATE ====================

/**
 * Engagement workspace state
 */
export interface EngagementWorkspaceState {
  engagement: Engagement;
  ledger: DepositLedger;
  milestones: MilestoneSubmission[];
  quotation: any; // Reference to quotation
}

/**
 * Deposit collection UI state
 */
export interface DepositCollectionState {
  quotation: any;
  totalDeposit: number;
  depositMethod?: DepositMethod;
  isProcessing: boolean;
}

/**
 * Milestone approval UI state
 */
export interface MilestoneApprovalState {
  submission: MilestoneSubmission;
  milestone: any; // From quotation
  canApprove: boolean;
  canReject: boolean;
  canRequestRevision: boolean;
}
