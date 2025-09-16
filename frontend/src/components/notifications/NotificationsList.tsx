import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  UserPlus,
  Heart,
  Star,
  MessageSquare,
  Check,
  CheckCheck,
  Trash2,
  Bell
} from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../../api/notifications';
import type { Notification } from '../../types';

interface NotificationsListProps {
  compact?: boolean;
  onUpdate?: () => void;
  onClose?: () => void;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  compact = false,
  onUpdate,
  onClose
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await getNotifications(page, compact ? 10 : 20);
      if (page === 0) {
        setNotifications(response.content);
      } else {
        setNotifications(prev => [...prev, ...response.content]);
      }
      setHasMore(!response.last);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      onUpdate?.();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      onUpdate?.();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'FOLLOW':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'LIKE':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'RATING':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'COMMENT':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    const content = (
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
            {notification.relatedUserNickname && (
              <Link
                to={`/users/${notification.relatedUserId}`}
                className="font-semibold text-blue-600 hover:text-blue-800"
                onClick={onClose}
              >
                {notification.relatedUserNickname}
              </Link>
            )}
            {' '}
            {notification.message}
            {notification.relatedPromptTitle && (
              <>
                {' '}
                <Link
                  to={`/prompts/${notification.relatedPromptId}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                  onClick={onClose}
                >
                  {notification.relatedPromptTitle}
                </Link>
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ko
            })}
          </p>
        </div>
        {!compact && (
          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <button
                onClick={() => handleMarkAsRead(notification.id)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Mark as read"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(notification.id)}
              className="p-1 text-gray-400 hover:text-red-600"
              aria-label="Delete notification"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );

    if (!notification.isRead && !compact) {
      return (
        <div
          className="bg-blue-50 border-l-4 border-blue-500 p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => handleMarkAsRead(notification.id)}
        >
          {content}
        </div>
      );
    }

    return <div className="p-4 hover:bg-gray-50 transition-colors">{content}</div>;
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'max-h-[500px] overflow-y-auto' : ''}`}>
      {!compact && notifications.some(n => !n.isRead) && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {notifications.map(notification => (
          <div key={notification.id}>
            {renderNotificationContent(notification)}
          </div>
        ))}
      </div>

      {hasMore && !compact && (
        <div className="p-4 text-center">
          <button
            onClick={() => setPage(page + 1)}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};