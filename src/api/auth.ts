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

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  me: async (): Promise<UserInfo> => {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },
};

export default authApi;
