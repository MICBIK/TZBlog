/**
 * API 统一响应与错误类型定义
 * 对应后端 docs/superpowers/specs/api-design.md 中的响应格式规范。
 */

/** 分页/列表元信息 */
export interface ApiMetadata {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/** 后端统一错误体 */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: string[];
}

/** 后端统一响应信封 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorBody | null;
  metadata?: ApiMetadata;
}

/** 列表响应：data 为数组，附带分页元信息 */
export type ApiListResponse<T> = ApiResponse<T[]>;

/**
 * 前端可捕获的 API 错误。
 * 包装 axios 错误，统一暴露 status / code / message，便于 UI 层处理。
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: string[];

  constructor(
    message: string,
    options: { status: number; code: string; details?: string[] },
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}
