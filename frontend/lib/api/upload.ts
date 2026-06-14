import { apiGet, apiPost } from '@/lib/api/client';

/** 上传配置（允许的格式与大小） */
export interface UploadConfig {
  allowedExtensions: string[];
  allowedTypes: string[];
  maxSize: number;
  storage: string;
}

/** 图片上传结果 */
export interface UploadResult {
  filename: string;
  url: string;
  size: number;
  message?: string;
}

/**
 * 图片上传 API。
 * 后端路由为 /uploads/images（multipart/form-data）。
 */

/** 获取上传配置（公开，用于前端校验） */
export async function getUploadConfig(): Promise<UploadConfig> {
  return apiGet<UploadConfig>('/uploads/config');
}

/** 上传图片 [需认证] */
export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiPost<UploadResult>('/uploads/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
