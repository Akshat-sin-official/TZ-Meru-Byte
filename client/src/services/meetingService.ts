/**
 * Meeting Service
 * 
 * API client for meeting endpoints
 */

import { apiClient } from './apiClient';

export interface MeetingAccess {
  roomUrl: string;
  token: string;
  displayName: string;
  role: 'moderator' | 'participant';
}

export interface EndMeetingResponse {
  engagementId: string | null;
  quotationId: string | null;
  discussionId: string;
  requiresQuotation?: boolean;
}

class MeetingService {
  /**
   * Get meeting access for a scheduled discussion
   * GET /api/v1/scheduled-discussions/:id/meeting-access
   */
  async getMeetingAccess(discussionId: string): Promise<MeetingAccess> {
    const response = await apiClient.get<{ success: boolean; data: MeetingAccess }>(
      `/v1/scheduled-discussions/${discussionId}/meeting-access`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get meeting access');
    }
    return response.data.data;
  }

  /**
   * End meeting and create engagement
   * POST /api/v1/discussions/:id/end-meeting
   */
  async endMeetingAndCreateEngagement(discussionId: string): Promise<EndMeetingResponse> {
    const response = await apiClient.post<{ success: boolean; data: EndMeetingResponse }>(
      `/v1/discussions/${discussionId}/end-meeting`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to end meeting and create engagement');
    }
    return response.data.data;
  }
  /**
   * Cancel scheduled discussion with reason
   * POST /api/v1/scheduled-discussions/:id/cancel
   */
  async cancelDiscussion(discussionId: string, reason: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
      `/v1/scheduled-discussions/${discussionId}/cancel`,
      { reason }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to cancel discussion');
    }
  }

  /**
   * Send in-meeting chat notification
   * POST /api/v1/scheduled-discussions/:id/chat-notification
   */
  async sendChatNotification(discussionId: string, message: string): Promise<void> {
    await apiClient.post<{ success: boolean }>(
      `/v1/scheduled-discussions/${discussionId}/chat-notification`,
      { message }
    );
  }
}

export const meetingService = new MeetingService();

