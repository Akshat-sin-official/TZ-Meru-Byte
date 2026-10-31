/**
 * Quotation Types
 * 
 * CRITICAL: Deposit-based terminology (NOT payment)
 */

export enum QuotationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  REJECTED = 'rejected', // Backward compatibility
  REVISION_REQUESTED = 'revision_requested',
  EXPIRED = 'expired',
}

export enum GSTStatus {
  REGISTERED = 'registered',
  NOT_REGISTERED = 'not_registered',
}

export enum DepositModel {
  MILESTONE_BASED = 'milestone_based',
}

export interface Milestone {
  milestoneNumber: number;
  name: string;
  scope: string;
  timeline: string;
  numberOfRevisions?: string;
  depositPercentage: number;
  depositAmount: number;
}

export interface PlaceOfSupply {
  city?: string;
  state: string;
  country: string;
}

export interface GSTContext {
  clientGSTStatus: GSTStatus;
  clientGSTIN?: string;
  expertGSTStatus: GSTStatus;
  expertGSTIN?: string;
}

export interface Exclusions {
  outOfScopeItems: string[];
  thirdPartyCosts: string;
  changeRequestHandling: string;
}

export interface RevisionHistory {
  requestedAt: string;
  requestedBy: 'business';
  reason: string;
  previousVersion: any;
}
export interface EngagementAlignment {
  businessStage?: string;
  businessType?: string;
  customerType?: string;
  engagementModel?: string;
  pricingModel?: string;
  deliveryMode?: string;
  turnaroundTime?: string;
}

export interface Quotation {
  _id: string;
  
  // Client Context
  businessId: {
    _id: string;
    fullName: string;
    email: string;
  };
  businessName: string;
  serviceCategory: string;
  discussionId: string;
  expertId: {
    _id: string;
    fullName: string;
    email: string;
  };
  expertProfileId: {
    _id: string;
    expertId: string;
    businessName: string;
  };
  quotationDate: string;
  
  // Alignment
  engagementAlignment?: EngagementAlignment;

  // Place of Supply & Tax
  placeOfSupply: PlaceOfSupply;
  gstContext: GSTContext;
  
  // Milestones
  milestones: Milestone[];
  
  // Commercials
  totalEngagementValue: number;
  depositModel: DepositModel;
  totalDepositPayable: number;
  
  // Timelines
  engagementStartDate: string;
  estimatedEndDate: string;
  dependenciesAndAssumptions?: string;
  
  // Exclusions
  exclusions: Exclusions;
  
  // Validity
  validUntil: string;
  additionalNotes?: string;
  
  // State
  status: QuotationStatus;
  sentAt?: string;
  
  // Acceptance
  acceptedAt?: string;
  acceptedBy?: string;
  declinedAt?: string;
  declinedBy?: string;
  declineReason?: string;
  
  // Revision
  revisionHistory: RevisionHistory[];
  currentRevision: number;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotationPayload {
  discussionId: string;
  serviceCategory: string;
  engagementAlignment?: EngagementAlignment;
  placeOfSupply: PlaceOfSupply;
  gstContext: GSTContext;
  milestones: Milestone[];
  totalEngagementValue: number;
  engagementStartDate: string;
  estimatedEndDate: string;
  dependenciesAndAssumptions?: string;
  exclusions: Exclusions;
  validUntil: string;
  additionalNotes?: string;
}

export interface RequestRevisionPayload {
  reason: string;
}

export interface DeclineQuotationPayload {
  reason?: string;
}
