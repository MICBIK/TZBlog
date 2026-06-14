import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  ROUTES,
  TOKEN_STORAGE_KEY,
} from '@/lib/constants';
import {
  type ApiMetadata,
  type ApiResponse,
  ApiRequestError,
} from '@/types/api';

/**
 * 解包后的成功响应。
 * 业务数据放在 data，列表类接口的分页信息放在 metadata。
 */
export interface UnwrappedResponse<T = unknown> {
  data: T;
  metadata?: ApiMetadata;
}

/**
 * 读取本地存储中的 JWT Token。
 * 仅在浏览器环境可用；SSR / 构建期间返回 null。
 */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    // 隐私模式或禁用 localStorage 时降级
    return null;
  }
}

/**
 * 清除本地 Token 并跳转登录页。
 * 在 401 / Token 失效时调用。
 */
export function clearAuthAndRedirect(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // 忽略存储异常
  }
  window.location.href = ROUTES.LOGIN;
}

/**
 * 从 axios 错误中构造统一的 ApiRequestError。
 * 优先采用后端返回的 error 体，其次回退到 HTTP 状态信息。
 */
function normalizeError(
  error: AxiosError<ApiResponse<unknown>>,
): ApiRequestError {
  const status = error.response?.status ?? 0;
  const body = error.response?.data?.error ?? undefined;

  return new ApiRequestError(
    body?.message ?? error.message ?? '请求失败，请稍后重试',
    {
      status,
      code: body?.code ?? 'UNKNOWN_ERROR',
      details: body?.details,
    },
  );
}

/**
 * 共享的 axios 实例。
 * - 请求拦截器：自动注入 Bearer Token
 * - 响应拦截器：解包 ApiResponse 信封，失败时抛 ApiRequestError
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动注入 Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：解包信封 + 统一错误处理
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const payload = response.data;
    // 后端业务层失败（HTTP 200 但 success=false）：转为错误抛出
    if (payload && payload.success === false) {
      return Promise.reject(
        new ApiRequestError(payload.error?.message ?? '请求失败，请稍后重试', {
          status: response.status,
          code: payload.error?.code ?? 'BUSINESS_ERROR',
          details: payload.error?.details,
        }),
      );
    }
    // 成功：把解包后的 { data, metadata } 放进 response.data
    // 这样调用方拿到的就是业务对象，同时可读取分页 metadata
    const unwrapped: UnwrappedResponse = {
      data: payload?.data ?? null,
      metadata: payload?.metadata,
    };
    response.data = unwrapped as unknown as typeof response.data;
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    // 401 未授权：清除登录态并跳转
    if (error.response?.status === 401) {
      clearAuthAndRedirect();
    }
    return Promise.reject(normalizeError(error));
  },
);

export default apiClient;

/* ------------------------------------------------------------------ *
 * 类型安全的请求便捷方法
 * 拦截器已将 response.data 解包为 { data, metadata }，
 * 以下方法直接返回业务数据 / 元信息，供业务层（如 TanStack Query）使用。
 * ------------------------------------------------------------------ */

/** GET：返回解包后的业务数据 */
export async function apiGet<T>(
  url: string,
  config?: Parameters<AxiosInstance['get']>[1],
): Promise<T> {
  const res = await apiClient.get<
    UnwrappedResponse<T>,
    AxiosResponse<UnwrappedResponse<T>>
  >(url, config);
  return res.data.data;
}

/** GET 列表：返回 { items, metadata }，便于分页 */
export async function apiGetList<T>(
  url: string,
  config?: Parameters<AxiosInstance['get']>[1],
): Promise<{ items: T[]; metadata: ApiMetadata | undefined }> {
  const res = await apiClient.get<
    UnwrappedResponse<T[]>,
    AxiosResponse<UnwrappedResponse<T[]>>
  >(url, config);
  return { items: res.data.data ?? [], metadata: res.data.metadata };
}

/** POST：返回解包后的业务数据 */
export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: Parameters<AxiosInstance['post']>[2],
): Promise<T> {
  const res = await apiClient.post<
    UnwrappedResponse<T>,
    AxiosResponse<UnwrappedResponse<T>>
  >(url, body, config);
  return res.data.data;
}

/** PUT：返回解包后的业务数据 */
export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: Parameters<AxiosInstance['put']>[2],
): Promise<T> {
  const res = await apiClient.put<
    UnwrappedResponse<T>,
    AxiosResponse<UnwrappedResponse<T>>
  >(url, body, config);
  return res.data.data;
}

/** DELETE：返回解包后的业务数据 */
export async function apiDelete<T>(
  url: string,
  config?: Parameters<AxiosInstance['delete']>[1],
): Promise<T> {
  const res = await apiClient.delete<
    UnwrappedResponse<T>,
    AxiosResponse<UnwrappedResponse<T>>
  >(url, config);
  return res.data.data;
}
