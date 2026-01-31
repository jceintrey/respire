export interface User {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  recaptchaToken?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  recaptchaToken?: string | null;
}
