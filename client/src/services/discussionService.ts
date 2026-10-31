/**
 * Scheduled Discussion Service
 * 
 * API client for discussion scheduling
 */

import { apiClient } from './apiClient';
import {
  ScheduledDiscussion,
  RequestDiscussionPayload,
  RescheduleDiscussionPayload,
  DeclineDiscussionPayload,
} from '../types/discussion';

/**
 * Request a discussion (Business → Expert)
 */
export async function requestDiscussion(
  payload: RequestDiscussionPayload
): Promise<{ discussionId: string; status: string; scheduledAt: string }> {
  const response = await apiClient.post('/discussions/request', payload);
  return (response.data as any).data;
}

/**
 * Accept discussion (Expert)
 */
export async function acceptDiscussion(
  discussionId: string
): Promise<{ discussionId: string; status: string; jitsiLink: string }> {
  const response = await apiClient.post(`/discussions/${discussionId}/accept`);
  return (response.data as any).data;
}

/**
 * Decline discussion (Expert)
 */
export async function declineDiscussion(
  discussionId: string,
  payload: DeclineDiscussionPayload
): Promise<{ discussionId: string; status: string }> {
  const response = await apiClient.post(`/discussions/${discussionId}/decline`, payload);
  return (response.data as any).data;
}

/**
 * Propose new time (Expert)
 */
export async function rescheduleDiscussion(
  discussionId: string,
  payload: RescheduleDiscussionPayload
): Promise<{ discussionId: string; status: string; proposedTime: string }> {
  const response = await apiClient.post(`/discussions/${discussionId}/reschedule`, payload);
  return (response.data as any).data;
}

/**
 * Get my discussions
 */
export async function getMyDiscussions(params?: {
  status?: string;
  upcoming?: boolean;
}): Promise<ScheduledDiscussion[]> {
  const response = await apiClient.get('/discussions/my', { params });
  return (response.data as any).data;
}

/**
 * Get specific discussion
 */
export async function getDiscussion(discussionId: string): Promise<ScheduledDiscussion> {
  const response = await apiClient.get(`/discussions/${discussionId}`);
  return (response.data as any).data;
}

/**
 * Mark discussion as completed
 */
export async function completeDiscussion(
  discussionId: string
): Promise<{ discussionId: string; quotationUnlocked: boolean }> {
  const response = await apiClient.post(`/discussions/${discussionId}/complete`);
  return (response.data as any).data;
}

/**
 * Update discussion checklist
 */
export async function updateDiscussionChecklist(
  discussionId: string,
  checklist: {
    items: Array<{ id: string; label: string; checked: boolean }>;
    notes?: string;
  }
): Promise<{ checklist: any }> {
  const response = await apiClient.put(`/v1/discussions/${discussionId}/checklist`, checklist);
  return (response.data as any).data;
}
