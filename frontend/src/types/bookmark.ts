// Bookmark types
export interface BookmarkFolder {
  id: number;
  name: string;
  description?: string;
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookmarkFolderRequest {
  name: string;
  description?: string;
}

export interface UpdateBookmarkFolderRequest {
  name: string;
  description?: string;
}

export interface MoveBookmarkRequest {
  folderId?: number;
}

export interface BookmarkToggleResponse {
  bookmarked: boolean;
  bookmarkCount: number;
}

export interface BookmarkedPromptInfo {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: {
    id: number;
    nickname: string;
  };
  likeCount: number;
  viewCount: number;
  averageRating?: number;
  ratingCount: number;
  createdAt: string;
}

export interface BookmarkFolderInfo {
  id: number;
  name: string;
}

export interface Bookmark {
  id: number;
  prompt: BookmarkedPromptInfo;
  folder?: BookmarkFolderInfo;
  createdAt: string;
}

// Alias for backward compatibility
export type UserBookmark = Bookmark;

export interface MoveBookmarkResponse {
  id: number;
  promptId: number;
  folderId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkStatus {
  bookmarked: boolean;
}