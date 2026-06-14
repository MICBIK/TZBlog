import { apiGet, apiPost } from '@/lib/api/client';
import type { Tag } from '@/types/article';

/** 标签列表（公开） */
export async function getTags(): Promise<Tag[]> {
  return apiGet<Tag[]>('/tags');
}

/** 标签详情（公开） */
export async function getTagById(id: number): Promise<Tag> {
  return apiGet<Tag>(`/tags/${id}`);
}

/** 创建标签 [需管理员] */
export async function createTag(body: {
  name: string;
  slug: string;
}): Promise<Tag> {
  return apiPost<Tag>('/tags', body);
}
