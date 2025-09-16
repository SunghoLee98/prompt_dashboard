import { apiClient } from './client';
import type {
  Rating,
  CreateRatingRequest,
  UpdateRatingRequest,
  RatingStatistics,
  RatingResponse,
  DeleteRatingResponse,
  RatingPage,
  RatingPageRequest,
} from '../types/rating';

// Helper function to normalize rating statistics from backend
const normalizeRatingStatistics = (data: any): RatingStatistics => {
  return {
    averageRating: data?.averageRating ?? 0,
    totalRatings: data?.totalRatings ?? data?.ratingCount ?? 0, // Handle both field names
    ratingCount: data?.ratingCount ?? data?.totalRatings ?? 0, // Keep both for compatibility
    distribution: data?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    userRating: data?.userRating ?? null,
  };
};

export const ratingApi = {
  // Get rating statistics for a prompt
  getRatingStatistics: async (promptId: number): Promise<RatingStatistics> => {
    const response = await apiClient.get<any>(`/api/prompts/${promptId}/ratings/stats`);
    return normalizeRatingStatistics(response.data);
  },

  // Get all ratings for a prompt (paginated)
  getRatings: async (promptId: number, params?: RatingPageRequest): Promise<RatingPage> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);

    const response = await apiClient.get<RatingPage>(
      `/api/prompts/${promptId}/ratings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  },

  // Get ratings with comments only (paginated)
  getRatingsWithComments: async (promptId: number, params?: RatingPageRequest): Promise<RatingPage> => {
    const queryParams = new URLSearchParams();
    queryParams.append('hasComment', 'true');
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);

    const response = await apiClient.get<RatingPage>(
      `/api/prompts/${promptId}/ratings?${queryParams.toString()}`
    );
    return response.data;
  },

  // Create a new rating
  createRating: async (promptId: number, data: CreateRatingRequest): Promise<RatingResponse> => {
    const response = await apiClient.post<any>(`/api/prompts/${promptId}/ratings`, data);
    return {
      rating: response.data.rating,
      statistics: normalizeRatingStatistics(response.data.statistics),
    };
  },

  // Update an existing rating
  updateRating: async (promptId: number, data: UpdateRatingRequest): Promise<RatingResponse> => {
    const response = await apiClient.put<any>(`/api/prompts/${promptId}/ratings`, data);
    return {
      rating: response.data.rating,
      statistics: normalizeRatingStatistics(response.data.statistics),
    };
  },

  // Delete a rating
  deleteRating: async (promptId: number): Promise<DeleteRatingResponse> => {
    const response = await apiClient.delete<any>(`/api/prompts/${promptId}/ratings`);
    return {
      deleted: response.data.deleted ?? true,
      statistics: normalizeRatingStatistics(response.data.statistics),
    };
  },

  // Get user's rating for a prompt
  getUserRating: async (promptId: number): Promise<Rating | null> => {
    try {
      const response = await apiClient.get<Rating>(`/api/prompts/${promptId}/ratings/user`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 204 || error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};