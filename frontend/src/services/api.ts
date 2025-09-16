import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, removeTokens, isTokenExpired } from '../utils/auth';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9090',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh and error handling
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        removeTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:9090'}/api/auth/refresh`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        saveTokens(accessToken, newRefreshToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API service methods
export const authService = {
  register: async (data: { email: string; password: string; nickname: string }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data);
    const { accessToken, refreshToken } = response.data;
    saveTokens(accessToken, refreshToken);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeTokens();
      window.location.href = '/login';
    }
  },

  refreshToken: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post('/api/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    saveTokens(accessToken, newRefreshToken);
    return response.data;
  },
};

export const userService = {
  getCurrentUser: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  updateProfile: async (data: { nickname: string }) => {
    const response = await api.put('/api/users/me', data);
    return response.data;
  },

  getUserById: async (id: number) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  getUserRatings: async (userId: number, params?: any) => {
    const response = await api.get(`/api/users/${userId}/ratings`, { params });
    return response.data;
  },
};

export const promptService = {
  getPrompts: async (params?: any) => {
    const response = await api.get('/api/prompts', { params });
    return response.data;
  },

  getPrompt: async (id: number) => {
    const response = await api.get(`/api/prompts/${id}`);
    return response.data;
  },

  createPrompt: async (data: any) => {
    const response = await api.post('/api/prompts', data);
    return response.data;
  },

  updatePrompt: async (id: number, data: any) => {
    const response = await api.put(`/api/prompts/${id}`, data);
    return response.data;
  },

  deletePrompt: async (id: number) => {
    const response = await api.delete(`/api/prompts/${id}`);
    return response.data;
  },

  likePrompt: async (id: number) => {
    const response = await api.post(`/api/prompts/${id}/like`);
    return response.data;
  },

  // Note: The API uses POST for both like and unlike (toggle)
  unlikePrompt: async (id: number) => {
    const response = await api.post(`/api/prompts/${id}/like`);
    return response.data;
  },

  ratePrompt: async (id: number, rating: number) => {
    const response = await api.post(`/api/prompts/${id}/ratings`, { rating });
    return response.data;
  },

  updateRating: async (promptId: number, rating: number) => {
    const response = await api.put(`/api/prompts/${promptId}/ratings`, { rating });
    return response.data;
  },

  deleteRating: async (promptId: number) => {
    const response = await api.delete(`/api/prompts/${promptId}/ratings`);
    return response.data;
  },

  getUserRating: async (promptId: number) => {
    const response = await api.get(`/api/prompts/${promptId}/ratings/user`);
    return response.data;
  },

  getRatings: async (promptId: number, params?: any) => {
    const response = await api.get(`/api/prompts/${promptId}/ratings`, { params });
    return response.data;
  },

  getRatingStats: async (promptId: number) => {
    const response = await api.get(`/api/prompts/${promptId}/ratings/stats`);
    return response.data;
  },
};

export const categoryService = {
  getCategories: async () => {
    const response = await api.get('/api/v1/categories');
    return response.data;
  },
};

export default api;