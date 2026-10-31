/**
 * Notification Service
 *
 * Handles notification-related API calls
 */

import { apiClient } from './apiClient';

export interface Notification {
  _id: string;
  userId: string;
  type: 'discussion' | 'engagement' | 'quotation' | 'system' | 'payment' | 'admin';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Get user notifications
 */
export const getNotifications = async (
  page = 1,
  limit = 20,
  type?: string,
  read?: boolean
): Promise<NotificationListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (type) params.append('type', type);
  if (read !== undefined) params.append('read', read.toString());

  const response = await apiClient.get<NotificationListResponse>(
    `/v1/notifications?${params.toString()}`
  );
  return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.post(`/v1/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<{ count: number }> => {
  const response = await apiClient.post<{ success: boolean; message: string; data: { count: number } }>(
    '/v1/notifications/read-all'
  );
  return response.data.data;
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await apiClient.delete(`/v1/notifications/${notificationId}`);
};

/**
 * Mark a notification as read
 * Backend uses POST /api/v1/notifications/:id/read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.post(`/v1/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 * Backend uses POST /api/v1/notifications/read-all
 */
export const markAllAsRead = async (): Promise<void> => {
  await apiClient.post('/v1/notifications/read-all');
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<{ count: number }> => {
  const response = await apiClient.get<{ success: boolean; data: { count: number } }>(
    '/v1/notifications/unread-count'
  );
  return response.data.data;
};

export const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};