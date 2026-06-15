/**
 * 认证相关类型定义
 * 字段对齐后端 internal/domain/user 模型（实测 camelCase）。
 */

/** 当前登录用户（后端 GET /auth/me 返回） */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  status: string;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 登录请求（后端 LoginDTO，字段 email） */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 注册请求 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

/** 认证响应（登录/注册成功返回） */
export interface AuthSession {
  user: AuthUser;
  token: string;
}

/** 更新用户资料请求 */
export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

/** 修改密码请求 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
