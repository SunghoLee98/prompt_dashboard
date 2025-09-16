import { apiClient } from './client';
import type {
  UserProfile,
  FollowStatus,
  FollowUser,
  FollowResponse,
  PageResponse
} from '../types';

// Follow/Unfollow a user
export const followUser = async (userId: number): Promise<FollowResponse> => {
  const response = await apiClient.post<FollowResponse>(`/api/users/${userId}/follow`);
  return response.data;
};

export const unfollowUser = async (userId: number): Promise<FollowResponse> => {
  const response = await apiClient.delete<FollowResponse>(`/api/users/${userId}/follow`);
  return response.data;
};

// Check follow status
export const getFollowStatus = async (userId: number): Promise<FollowStatus> => {
  const response = await apiClient.get<FollowStatus>(`/api/users/${userId}/follow/status`);
  return response.data;
};

// Get followers list
export const getFollowers = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUser>> => {
  const response = await apiClient.get<PageResponse<FollowUser>>(
    `/api/users/${userId}/followers`,
    {
      params: { page, size }
    }
  );
  return response.data;
};

// Get following list
export const getFollowing = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUser>> => {
  const response = await apiClient.get<PageResponse<FollowUser>>(
    `/api/users/${userId}/following`,
    {
      params: { page, size }
    }
  );
  return response.data;
};

// Get user profile with follow stats
export const getUserProfile = async (userId: number): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>(`/api/users/${userId}/profile`);
  return response.data;
};

// Get personalized feed from followed users
export const getPersonalizedFeed = async (
  page: number = 0,
  size: number = 20
): Promise<PageResponse<any>> => {
  const response = await apiClient.get<PageResponse<any>>(
    '/api/users/me/feed',
    {
      params: { page, size }
    }
  );
  return response.data;
};