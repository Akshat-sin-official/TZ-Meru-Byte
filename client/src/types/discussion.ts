/**
 * Scheduled Discussion Types
 * 
 * Frontend types for discussion scheduling
 */

export enum DiscussionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  RESCHEDULED = 'rescheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum DiscussionPurpose {
  REQUIREMENT_DISCUSSION = 'requirement_discussion',
  CLARIFICATION = 'clarification',
  ALIGNMENT = 'alignment',
}

export interface ExpertResponse {
  respondedAt: Date;
  action: 'accepted' | 'declined' | 'rescheduled';
  declineReason?: string;
  proposedNewTime?: Date;
}

export interface ScheduledDiscussion {
  _id: string;
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
  expertProfileId: {
    _id: string;
    expertId: string;
    businessName: string;
  };
  purpose: DiscussionPurpose;
  agenda: string;
  scheduledAt: string;
  duration: number;
  status: DiscussionStatus;
  requestedAt: string;
  expertResponse?: ExpertResponse;
  jitsiRoomName?: string;
  jitsiLink?: string;
  jitsiLinkExpiresAt?: string;
  completedAt?: string;
  markedCompletedBy?: 'business' | 'expert' | 'system';
  quotationUnlockedForBusiness: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RequestDiscussionPayload {
  expertId: string;
  purpose: DiscussionPurpose;
  agenda: string;
  scheduledAt: string;
  duration?: number;
}

export interface RescheduleDiscussionPayload {
  proposedTime: string;
}

export interface DeclineDiscussionPayload {
  reason?: string;
}
