import { apiGet, apiPost } from '@/lib/api/client';
import type {
  AuthSession,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth';

/**
 * 认证相关 API。
 * 失败时抛出 ApiRequestError（含 status / code / message）。
 */

/** 登录（字段 email，与后端 LoginDTO 对齐） */
export async function login(body: LoginRequest): Promise<AuthSession> {
  return apiPost<AuthSession>('/auth/login', body);
}

/** 注册 */
export async function register(body: RegisterRequest): Promise<AuthSession> {
  return apiPost<AuthSession>('/auth/register', body);
}

/** 获取当前登录用户（需 token） */
export async function getCurrentUser(): Promise<AuthUser> {
  return apiGet<AuthUser>('/auth/me');
}

/** 登出（需 token） */
export async function logout(): Promise<void> {
  await apiPost<void>('/auth/logout');
}
