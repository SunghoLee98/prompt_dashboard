import { apiClient } from './client';
import type {
  Notification,
  NotificationCountResponse,
  MarkReadResponse,
  PageResponse
} from '../types';

// Get notifications
export const getNotifications = async (
  page: number = 0,
  size: number = 20,
  unreadOnly: boolean = false
): Promise<PageResponse<Notification>> => {
  const response = await apiClient.get<PageResponse<Notification>>('/api/notifications', {
    params: { page, size, unreadOnly }
  });
  return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (id: number): Promise<MarkReadResponse> => {
  const response = await apiClient.put<MarkReadResponse>(`/api/notifications/${id}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<MarkReadResponse> => {
  const response = await apiClient.put<MarkReadResponse>('/api/notifications/read-all');
  return response.data;
};

// Delete notification
export const deleteNotification = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/notifications/${id}`);
};

// Get unread notification count
export const getUnreadNotificationCount = async (): Promise<NotificationCountResponse> => {
  const response = await apiClient.get<NotificationCountResponse>('/api/notifications/unread-count');
  return response.data;
};