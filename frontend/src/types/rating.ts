// Rating types
export interface Rating {
  id: number;
  promptId: number;
  userId: number;
  userNickname: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRatingRequest {
  rating: number; // 1-5
  comment?: string;
}

export interface UpdateRatingRequest {
  rating: number; // 1-5
  comment?: string;
}

export interface RatingStatistics {
  averageRating: number;
  totalRatings?: number; // Frontend naming
  ratingCount?: number; // Backend naming
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  userRating?: Rating | null; // Current user's rating if exists
}

export interface RatingResponse {
  rating: Rating;
  statistics: RatingStatistics;
}

export interface DeleteRatingResponse {
  deleted: boolean;
  statistics: RatingStatistics;
}

export interface RatingPage {
  content: Rating[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}

export interface RatingPageRequest {
  page?: number;
  size?: number;
  sort?: string;
}