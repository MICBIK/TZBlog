import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TOKEN_STORAGE_KEY } from '@/lib/constants';
import { ApiRequestError } from '@/types/api';

import {
  apiClient,
  apiDelete,
  apiGet,
  apiGetList,
  apiPost,
  apiPut,
  clearAuthAndRedirect,
} from './client';

// Mock axios
vi.mock('axios', () => {
  const actualAxios = vi.importActual('axios') as any;
  const mockCreate = vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn((onFulfilled) => {
          // 存储拦截器以便测试
          (mockCreate as any).requestInterceptor = onFulfilled;
        }),
      },
      response: {
        use: vi.fn((onFulfilled, onRejected) => {
          (mockCreate as any).responseInterceptor = onFulfilled;
          (mockCreate as any).responseErrorInterceptor = onRejected;
        }),
      },
    },
  }));

  return {
    ...actualAxios,
    default: {
      ...actualAxios.default,
      create: mockCreate,
    },
    create: mockCreate,
  };
});

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  describe('Request Interceptor', () => {
    it('should inject Authorization header when token exists', () => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, 'test-token');

      const config = {
        headers: {
          set: vi.fn(),
        },
      };

      const interceptor = (axios.create as any).requestInterceptor;
      interceptor(config);

      expect(config.headers.set).toHaveBeenCalledWith(
        'Authorization',
        'Bearer test-token',
      );
    });

    it('should not inject Authorization header when no token', () => {
      const config = {
        headers: {
          set: vi.fn(),
        },
      };

      const interceptor = (axios.create as any).requestInterceptor;
      interceptor(config);

      expect(config.headers.set).not.toHaveBeenCalled();
    });
  });

  describe('Response Interceptor', () => {
    it('should unwrap successful response', () => {
      const response = {
        data: {
          success: true,
          data: { id: 1, name: 'Test' },
          metadata: { total: 10, page: 1 },
        },
        status: 200,
      };

      const interceptor = (axios.create as any).responseInterceptor;
      const result = interceptor(response);

      expect(result.data).toEqual({
        data: { id: 1, name: 'Test' },
        metadata: { total: 10, page: 1 },
      });
    });

    it('should reject when success=false', async () => {
      const response = {
        data: {
          success: false,
          error: {
            message: 'Business error',
            code: 'INVALID_INPUT',
          },
        },
        status: 200,
      };

      const interceptor = (axios.create as any).responseInterceptor;

      await expect(interceptor(response)).rejects.toThrow(ApiRequestError);
      await expect(interceptor(response)).rejects.toMatchObject({
        message: 'Business error',
        code: 'INVALID_INPUT',
      });
    });

    it('should handle 401 error and clear auth', () => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, 'test-token');
      const originalHref = window.location.href;

      const error = {
        response: {
          status: 401,
          data: {},
        },
        message: 'Unauthorized',
      };

      const errorInterceptor = (axios.create as any).responseErrorInterceptor;

      expect(() => errorInterceptor(error)).rejects.toThrow();
      expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });

    it('should normalize error response', () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: { field: 'email' },
            },
          },
        },
        message: 'Request failed',
      };

      const errorInterceptor = (axios.create as any).responseErrorInterceptor;

      expect(() => errorInterceptor(error)).rejects.toMatchObject({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' },
      });
    });
  });

  describe('clearAuthAndRedirect', () => {
    it('should clear token and redirect to login', () => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, 'test-token');

      clearAuthAndRedirect();

      expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
      expect(window.location.href).toBe('/login');
    });
  });

  describe('Convenience Methods', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('apiGet should return unwrapped data', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockData },
      } as any);

      const result = await apiGet('/test');
      expect(result).toEqual(mockData);
    });

    it('apiGetList should return items and metadata', async () => {
      const mockItems = [{ id: 1 }, { id: 2 }];
      const mockMetadata = { total: 10, page: 1, limit: 10 };
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockItems, metadata: mockMetadata },
      } as any);

      const result = await apiGetList('/test');
      expect(result).toEqual({
        items: mockItems,
        metadata: mockMetadata,
      });
    });

    it('apiPost should return unwrapped data', async () => {
      const mockData = { id: 1, name: 'Created' };
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockData },
      } as any);

      const result = await apiPost('/test', { name: 'Created' });
      expect(result).toEqual(mockData);
    });

    it('apiPut should return unwrapped data', async () => {
      const mockData = { id: 1, name: 'Updated' };
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { data: mockData },
      } as any);

      const result = await apiPut('/test/1', { name: 'Updated' });
      expect(result).toEqual(mockData);
    });

    it('apiDelete should return unwrapped data', async () => {
      const mockData = { success: true };
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { data: mockData },
      } as any);

      const result = await apiDelete('/test/1');
      expect(result).toEqual(mockData);
    });
  });
});
