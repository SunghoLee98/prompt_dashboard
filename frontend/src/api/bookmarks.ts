import { apiClient } from './client';
import type {
  BookmarkFolder,
  CreateBookmarkFolderRequest,
  UpdateBookmarkFolderRequest,
  MoveBookmarkRequest,
  BookmarkToggleResponse,
  Bookmark,
  MoveBookmarkResponse,
  BookmarkStatus
} from '../types/bookmark';
import type { PageResponse, Prompt } from '../types';

// Toggle bookmark for a prompt
export const toggleBookmark = async (promptId: number): Promise<BookmarkToggleResponse> => {
  const response = await apiClient.post(`/prompts/${promptId}/bookmark`);
  return response.data;
};

// Get current user's bookmarks
export const getUserBookmarks = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
  folderId?: number;
  search?: string;
}): Promise<PageResponse<Bookmark>> => {
  const searchParams = new URLSearchParams();

  if (params?.page !== undefined) searchParams.append('page', params.page.toString());
  if (params?.size !== undefined) searchParams.append('size', params.size.toString());
  if (params?.sort) searchParams.append('sort', params.sort);
  if (params?.direction) searchParams.append('direction', params.direction);
  if (params?.folderId !== undefined) searchParams.append('folderId', params.folderId.toString());
  if (params?.search) searchParams.append('search', params.search);

  const response = await apiClient.get(`/users/me/bookmarks?${searchParams.toString()}`);
  return response.data;
};

// Create a bookmark folder
export const createBookmarkFolder = async (request: CreateBookmarkFolderRequest): Promise<BookmarkFolder> => {
  const response = await apiClient.post('/users/me/bookmark-folders', request);
  return response.data;
};

// Get user's bookmark folders
export const getUserBookmarkFolders = async (): Promise<BookmarkFolder[]> => {
  const response = await apiClient.get('/users/me/bookmark-folders');
  return response.data;
};

// Update a bookmark folder
export const updateBookmarkFolder = async (
  id: number,
  request: UpdateBookmarkFolderRequest
): Promise<BookmarkFolder> => {
  const response = await apiClient.put(`/users/me/bookmark-folders/${id}`, request);
  return response.data;
};

// Delete a bookmark folder
export const deleteBookmarkFolder = async (id: number): Promise<void> => {
  await apiClient.delete(`/users/me/bookmark-folders/${id}`);
};

// Move bookmark to folder
export const moveBookmark = async (
  bookmarkId: number,
  request: MoveBookmarkRequest
): Promise<MoveBookmarkResponse> => {
  const response = await apiClient.put(`/users/me/bookmarks/${bookmarkId}/folder`, request);
  return response.data;
};

// Get popular bookmarked prompts
export const getPopularBookmarkedPrompts = async (params?: {
  page?: number;
  size?: number;
  timeframe?: string;
}): Promise<PageResponse<Prompt>> => {
  const searchParams = new URLSearchParams();

  if (params?.page !== undefined) searchParams.append('page', params.page.toString());
  if (params?.size !== undefined) searchParams.append('size', params.size.toString());
  if (params?.timeframe) searchParams.append('timeframe', params.timeframe);

  const response = await apiClient.get(`/prompts/popular-bookmarks?${searchParams.toString()}`);
  return response.data;
};

// Check if prompt is bookmarked by current user
export const getBookmarkStatus = async (promptId: number): Promise<BookmarkStatus> => {
  const response = await apiClient.get(`/prompts/${promptId}/bookmark/status`);
  return response.data;
};