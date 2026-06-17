import axios, { type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

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

interface HeaderConfig {
  headers: {
    set: Mock<(name: string, value: string) => void>;
  };
}

interface MockAxiosCreate extends Mock<() => unknown> {
  requestInterceptor?: (config: HeaderConfig) => HeaderConfig;
  responseInterceptor?: (response: {
    data: unknown;
    status: number;
  }) => AxiosResponse<unknown> | Promise<never>;
  responseErrorInterceptor?: (error: unknown) => Promise<never>;
}

function unwrappedResponse<T>(
  data: T,
  metadata?: Record<string, number>,
): AxiosResponse<{ data: T; metadata?: Record<string, number> }> {
  return { data: { data, metadata } } as AxiosResponse<{
    data: T;
    metadata?: Record<string, number>;
  }>;
}

function getRequestInterceptor(): (config: HeaderConfig) => HeaderConfig {
  const interceptor = (axios.create as MockAxiosCreate).requestInterceptor;
  if (!interceptor) {
    throw new Error('request interceptor was not registered');
  }
  return interceptor;
}

function getResponseInterceptor(): NonNullable<
  MockAxiosCreate['responseInterceptor']
> {
  const interceptor = (axios.create as MockAxiosCreate).responseInterceptor;
  if (!interceptor) {
    throw new Error('response interceptor was not registered');
  }
  return interceptor;
}

function getResponseErrorInterceptor(): NonNullable<
  MockAxiosCreate['responseErrorInterceptor']
> {
  const interceptor = (axios.create as MockAxiosCreate)
    .responseErrorInterceptor;
  if (!interceptor) {
    throw new Error('response error interceptor was not registered');
  }
  return interceptor;
}

// Mock axios
vi.mock('axios', async () => {
  const actualAxios = await vi.importActual<typeof import('axios')>('axios');
  const mockCreate = vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn((onFulfilled) => {
          // 存储拦截器以便测试
          mockCreate.requestInterceptor = onFulfilled;
        }),
      },
      response: {
        use: vi.fn((onFulfilled, onRejected) => {
          mockCreate.responseInterceptor = onFulfilled;
          mockCreate.responseErrorInterceptor = onRejected;
        }),
      },
    },
  })) as MockAxiosCreate;

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

      const interceptor = getRequestInterceptor();
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

      const interceptor = getRequestInterceptor();
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

      const interceptor = getResponseInterceptor();
      const result = interceptor(response) as AxiosResponse<{
        data: unknown;
        metadata?: unknown;
      }>;

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

      const interceptor = getResponseInterceptor();

      await expect(interceptor(response)).rejects.toThrow(ApiRequestError);
      await expect(interceptor(response)).rejects.toMatchObject({
        message: 'Business error',
        code: 'INVALID_INPUT',
      });
    });

    it('should handle 401 error and clear auth', () => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, 'test-token');

      const error = {
        response: {
          status: 401,
          data: {},
        },
        message: 'Unauthorized',
      };

      const errorInterceptor = getResponseErrorInterceptor();

      expect(() => errorInterceptor(error)).rejects.toThrow();
      expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });

    it('should not clear auth on 401 when no token exists', () => {
      const error = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid email or password',
              code: 'INVALID_CREDENTIALS',
            },
          },
        },
        message: 'Unauthorized',
      };

      const errorInterceptor = getResponseErrorInterceptor();

      expect(() => errorInterceptor(error)).rejects.toMatchObject({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
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

      const errorInterceptor = getResponseErrorInterceptor();

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
      vi.mocked(apiClient.get).mockResolvedValue(unwrappedResponse(mockData));

      const result = await apiGet('/test');
      expect(result).toEqual(mockData);
    });

    it('apiGetList should return items and metadata', async () => {
      const mockItems = [{ id: 1 }, { id: 2 }];
      const mockMetadata = { total: 10, page: 1, limit: 10 };
      vi.mocked(apiClient.get).mockResolvedValue(
        unwrappedResponse(mockItems, mockMetadata),
      );

      const result = await apiGetList('/test');
      expect(result).toEqual({
        items: mockItems,
        metadata: mockMetadata,
      });
    });

    it('apiPost should return unwrapped data', async () => {
      const mockData = { id: 1, name: 'Created' };
      vi.mocked(apiClient.post).mockResolvedValue(unwrappedResponse(mockData));

      const result = await apiPost('/test', { name: 'Created' });
      expect(result).toEqual(mockData);
    });

    it('apiPut should return unwrapped data', async () => {
      const mockData = { id: 1, name: 'Updated' };
      vi.mocked(apiClient.put).mockResolvedValue(unwrappedResponse(mockData));

      const result = await apiPut('/test/1', { name: 'Updated' });
      expect(result).toEqual(mockData);
    });

    it('apiDelete should return unwrapped data', async () => {
      const mockData = { success: true };
      vi.mocked(apiClient.delete).mockResolvedValue(unwrappedResponse(mockData));

      const result = await apiDelete('/test/1');
      expect(result).toEqual(mockData);
    });
  });
});
