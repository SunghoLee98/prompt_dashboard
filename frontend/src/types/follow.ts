// Follow system types
export interface UserProfile {
  id: number;
  nickname: string;
  email: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  promptCount: number;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FollowStatus {
  isFollowing: boolean;
  followerId: number;
  followingId: number;
  followedAt?: string;
}

export interface FollowUser {
  id: number;
  nickname: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
  followedAt?: string;
}

export interface FollowResponse {
  message: string;
  isFollowing: boolean;
}

// Notification types
export interface Notification {
  id: number;
  type: 'FOLLOW' | 'LIKE' | 'RATING' | 'COMMENT';
  message: string;
  relatedUserId?: number;
  relatedUserNickname?: string;
  relatedPromptId?: number;
  relatedPromptTitle?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationCountResponse {
  unreadCount: number;
}

export interface MarkReadResponse {
  message: string;
  readCount: number;
}