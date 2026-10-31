/**
 * Engagement and Milestone Status Utility
 * 
 * Provides user-friendly labels, colors, and descriptions for all status states
 */

export type EngagementStatus =
  | 'QUOTATION_ACCEPTED'
  | 'PENDING_DEPOSIT'
  | 'PENDING_COMPLIANCE'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'quotation_accepted'
  | 'pending_deposit'
  | 'pending_compliance'
  | 'active'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type MilestoneStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'AUTO_RELEASED'
  | 'DISPUTED'
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'auto_released'
  | 'disputed';

export interface StatusConfig {
  label: string;
  description: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success';
  showDisputeBadge?: boolean;
  disableActions?: boolean;
}

/**
 * Engagement status configurations
 */
export const ENGAGEMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  QUOTATION_ACCEPTED: {
    label: 'Awaiting Deposit',
    description: 'Waiting for deposit to activate engagement',
    variant: 'outline',
  },
  PENDING_DEPOSIT: {
    label: 'Awaiting Deposit',
    description: 'Complete deposit payment to activate engagement',
    variant: 'warning',
  },
  PENDING_COMPLIANCE: {
    label: 'Awaiting Deposit',
    description: 'Complete compliance setup or deposit payment to activate engagement',
    variant: 'warning',
  },
  ACTIVE: {
    label: 'Active',
    description: 'Engagement is active - work in progress',
    variant: 'success',
  },
  COMPLETED: {
    label: 'Completed',
    description: 'All milestones approved and payments released',
    variant: 'default',
  },
  DISPUTED: {
    label: 'Dispute Active',
    description: 'Engagement paused - dispute under review',
    variant: 'destructive',
    showDisputeBadge: true,
    disableActions: true,
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Engagement cancelled by mutual agreement or admin',
    variant: 'secondary',
  },
};

/**
 * Format status label to friendly string
 */
export const formatStatusLabel = (status: string): string => {
  if (!status) return '';
  const normalizedStatus = status.toLowerCase();
  if (
    normalizedStatus === 'quotation_accepted' ||
    normalizedStatus === 'pending_deposit' ||
    normalizedStatus === 'pending_compliance'
  ) {
    return 'Awaiting Deposit';
  }
  
  const config = ENGAGEMENT_STATUS_CONFIG[status.toUpperCase()];
  if (config) {
    return config.label;
  }
  
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

/**
 * Milestone status configurations
 */
export const MILESTONE_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: {
    label: 'In Progress',
    description: 'Expert working on deliverable',
    variant: 'outline',
  },
  SUBMITTED: {
    label: 'Pending Approval',
    description: 'Awaiting your review and approval',
    variant: 'warning',
  },
  APPROVED: {
    label: 'Approved',
    description: 'Payment released to expert',
    variant: 'success',
  },
  REJECTED: {
    label: 'Revision Requested',
    description: 'Expert revising based on your feedback',
    variant: 'secondary',
  },
  AUTO_RELEASED: {
    label: 'Auto-Released',
    description: 'Payment released after 7-day review period',
    variant: 'default',
  },
  DISPUTED: {
    label: 'Disputed',
    description: 'Milestone under dispute review',
    variant: 'destructive',
    showDisputeBadge: true,
    disableActions: true,
  },
};

/**
 * Get engagement status configuration
 * Handles both uppercase and lowercase status values
 */
export const getEngagementStatus = (status: string): StatusConfig => {
  const normalizedStatus = status.toUpperCase();
  return (
    ENGAGEMENT_STATUS_CONFIG[normalizedStatus] ||
    ENGAGEMENT_STATUS_CONFIG.ACTIVE
  );
};

/**
 * Get milestone status configuration
 * Handles both uppercase and lowercase status values
 */
export const getMilestoneStatus = (status: string): StatusConfig => {
  const normalizedStatus = status.toUpperCase();
  return (
    MILESTONE_STATUS_CONFIG[normalizedStatus] ||
    MILESTONE_STATUS_CONFIG.PENDING
  );
};

/**
 * Check if engagement allows deposit actions
 */
export const canInitiateDeposit = (status: string): boolean => {
  const normalizedStatus = status.toUpperCase();
  return (
    normalizedStatus === 'QUOTATION_ACCEPTED' ||
    normalizedStatus === 'PENDING_DEPOSIT'
  );
};

/**
 * Check if engagement allows milestone submissions
 */
export const canSubmitMilestone = (status: string): boolean => {
  const normalizedStatus = status.toUpperCase();
  return normalizedStatus === 'ACTIVE';
};

/**
 * Check if engagement has active dispute
 */
export const hasActiveDispute = (status: string): boolean => {
  const normalizedStatus = status.toUpperCase();
  return normalizedStatus === 'DISPUTED';
};

/**
 * Get user-friendly message when action is blocked
 */
export const getBlockedActionMessage = (
  status: string,
  actionType: 'deposit' | 'milestone' | 'approval' | 'release'
): string => {
  if (hasActiveDispute(status)) {
    switch (actionType) {
      case 'deposit':
        return 'Deposit actions are paused due to an active dispute.';
      case 'milestone':
        return 'Milestone submissions are paused due to an active dispute.';
      case 'approval':
        return 'Milestone approvals are paused due to an active dispute.';
      case 'release':
        return 'Payment release is paused due to an active dispute.';
      default:
        return 'This action is paused due to an active dispute.';
    }
  }

  const config = getEngagementStatus(status);
  return `This action is not available for ${config.label.toLowerCase()} engagements.`;
};
