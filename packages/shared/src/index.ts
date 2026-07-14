export const APP_NAME = "Sentio";

// ── Roles ──
export type UserRole = "admin" | "presenter" | "participant";

// ── User ──
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
}

// ── Auth request / response contracts ──
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}
