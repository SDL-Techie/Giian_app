import { User } from './user.types';

export interface LoginRequest {
  email: string;
  password: string;
}


export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phoneno?: string;
  email?: string;
}
