import { apiGet, apiPost } from '@/lib/api/client';
import type { Category } from '@/types/article';

/** 分类列表（公开） */
export async function getCategories(): Promise<Category[]> {
  return apiGet<Category[]>('/categories');
}

/** 分类详情（公开） */
export async function getCategoryById(id: number): Promise<Category> {
  return apiGet<Category>(`/categories/${id}`);
}

/** 创建分类 [需管理员] */
export async function createCategory(body: {
  name: string;
  slug: string;
  description?: string;
}): Promise<Category> {
  return apiPost<Category>('/categories', body);
}
