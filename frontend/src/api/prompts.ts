import { apiClient } from './client';
import type {
  Prompt,
  CreatePromptRequest,
  UpdatePromptRequest,
  PageResponse,
  LikeResponse,
  Category,
} from '../types';

interface GetPromptsParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  category?: string;
}

export const promptsApi = {
  getPrompts: async (params: GetPromptsParams = {}): Promise<PageResponse<Prompt>> => {
    const response = await apiClient.get<PageResponse<Prompt>>('/api/prompts', { params });
    return response.data;
  },

  getPrompt: async (id: number): Promise<Prompt> => {
    const response = await apiClient.get<Prompt>(`/api/prompts/${id}`);
    return response.data;
  },

  createPrompt: async (data: CreatePromptRequest): Promise<Prompt> => {
    const response = await apiClient.post<Prompt>('/api/prompts', data);
    return response.data;
  },

  updatePrompt: async (id: number, data: UpdatePromptRequest): Promise<Prompt> => {
    const response = await apiClient.put<Prompt>(`/api/prompts/${id}`, data);
    return response.data;
  },

  deletePrompt: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/prompts/${id}`);
  },

  toggleLike: async (id: number): Promise<LikeResponse> => {
    const response = await apiClient.post<LikeResponse>(`/api/prompts/${id}/like`);
    return response.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/api/v1/categories');
    return response.data;
  },
};