import { apiClient, tokenManager } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

export const authApi = {
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<User>('/api/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    tokenManager.setTokens(response.data);
    return response.data;
  },

  logout: () => {
    tokenManager.clearTokens();
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/users/me');
    return response.data;
  },

  updateProfile: async (data: { nickname: string }): Promise<User> => {
    const response = await apiClient.put<User>('/api/users/me', data);
    return response.data;
  },
};