import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, string[]>;
}

/**
 * Extract error message from various error formats
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof AxiosError) {
    // Handle axios errors
    if (error.response?.data) {
      const data = error.response.data;
      
      // Handle standard error response format
      if (data.message) {
        return data.message;
      }
      
      // Handle error field (Spring Boot style)
      if (data.error) {
        return data.error;
      }
      
      // Handle validation errors
      if (data.errors) {
        if (typeof data.errors === 'string') {
          return data.errors;
        }
        if (Array.isArray(data.errors)) {
          return data.errors.join(', ');
        }
        if (typeof data.errors === 'object') {
          return Object.values(data.errors).flat().join(', ');
        }
      }
      
      // Handle field-specific errors
      if (data.fieldErrors) {
        return Object.entries(data.fieldErrors)
          .map(([field, errors]: [string, any]) => {
            if (Array.isArray(errors)) {
              return errors.join(', ');
            }
            return `${field}: ${errors}`;
          })
          .join(', ');
      }
      
      // Handle details field
      if (data.details) {
        if (typeof data.details === 'string') {
          return data.details;
        }
        if (typeof data.details === 'object') {
          return Object.values(data.details).flat().join(', ');
        }
      }
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    }
    if (!error.response) {
      return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
    }
    
    // Handle HTTP status codes with the backend's actual response message if available
    const responseMessage = error.response?.data?.message || error.response?.data?.error;
    if (responseMessage) {
      return responseMessage;
    }
    
    // Fallback to status code based messages
    switch (error.response?.status) {
      case 400:
        return '잘못된 요청입니다. 입력 내용을 확인해주세요.';
      case 401:
        return '이메일 또는 비밀번호가 올바르지 않습니다.';
      case 403:
        return '이 작업을 수행할 권한이 없습니다.';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.';
      case 409:
        return '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.';
      case 422:
        return '입력한 정보를 다시 확인해주세요.';
      case 429:
        return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.';
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 502:
      case 503:
        return '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
      default:
        return error.message || '예기치 않은 오류가 발생했습니다.';
    }
  }

  if (error?.message) {
    return error.message;
  }

  return '예기치 않은 오류가 발생했습니다.';
};

/**
 * Extract field-specific validation errors
 */
export const getFieldErrors = (error: any): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};

  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data;
    
    // Handle field-specific validation errors
    if (data.fieldErrors) {
      Object.entries(data.fieldErrors).forEach(([field, errors]: [string, any]) => {
        if (Array.isArray(errors)) {
          fieldErrors[field] = errors[0];
        } else if (typeof errors === 'string') {
          fieldErrors[field] = errors;
        }
      });
    }
    
    // Handle validation errors with field information
    if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      Object.entries(data.errors).forEach(([field, errors]: [string, any]) => {
        if (Array.isArray(errors)) {
          fieldErrors[field] = errors[0];
        } else if (typeof errors === 'string') {
          fieldErrors[field] = errors;
        }
      });
    }
  }

  return fieldErrors;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return error instanceof AxiosError && !error.response;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error instanceof AxiosError && error.response?.status === 401;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: any): boolean => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    return status === 400 || status === 422;
  }
  return false;
};