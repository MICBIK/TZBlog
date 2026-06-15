import { apiGet, apiPost, apiPut } from '@/lib/api/client';
import type {
  AuthSession,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
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

/** 更新用户资料（需 token） */
export async function updateProfile(
  body: UpdateProfileRequest,
): Promise<AuthUser> {
  return apiPut<AuthUser>('/auth/profile', body);
}

/** 修改密码（需 token，成功后 token 将被撤销） */
export async function changePassword(
  body: ChangePasswordRequest,
): Promise<void> {
  await apiPut<void>('/auth/password', body);
}
