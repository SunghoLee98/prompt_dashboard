// User types
export interface User {
  id: number;
  email: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

// Prompt types
export interface Author {
  id: number;
  nickname: string;
}

export interface Prompt {
  id: number;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  author: Author;
  likeCount: number;
  viewCount: number;
  isLiked?: boolean;
  averageRating: number;
  ratingCount: number;
  userRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptRequest {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
}

export interface UpdatePromptRequest extends CreatePromptRequest {}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}