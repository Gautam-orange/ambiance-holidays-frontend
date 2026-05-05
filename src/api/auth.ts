import apiClient from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  country: string;
  city?: string;
  address?: string;
  businessType: 'TRAVEL_AGENCY' | 'FREELANCER' | 'CORPORATE';
  phone?: string;
  whatsapp?: string;
}

export interface AgentInfo {
  id: string;
  companyName: string;
  tier: string;
  status: string;
  country?: string;
  city?: string;
  address?: string;
  businessType?: 'TRAVEL_AGENCY' | 'FREELANCER' | 'CORPORATE';
  phone?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  agent?: AgentInfo;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

const authApi = {
  login: async (data: LoginRequest): Promise<AuthTokens> => {
    const res = await apiClient.post('/auth/login', data);
    return res.data.data;
  },

  signup: async (data: SignupRequest): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/signup', data);
    return res.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  /** Step 1 — request a 6-digit OTP to be emailed to the user. */
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  /** Step 2 — verify the OTP and obtain a short-lived verificationToken JWT. */
  verifyOtp: async (email: string, otp: string): Promise<{ verificationToken: string; expiresInSeconds: number }> => {
    const res = await apiClient.post('/auth/verify-otp', { email, otp });
    return res.data.data;
  },

  /** Step 3 — complete the reset using the verificationToken from step 2. */
  resetPassword: async (email: string, verificationToken: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { email, verificationToken, newPassword });
  },

  me: async (): Promise<UserInfo> => {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },
};

export default authApi;
