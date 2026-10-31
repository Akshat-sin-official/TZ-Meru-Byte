import { apiClient } from '@/services/apiClient';

interface InitiateResponse {
  success: boolean;
  message: string;
  data?: { expiresIn: number };
  error?: string;
}

interface VerifyResponse {
  success: boolean;
  message: string;
  data?: { newEmail: string };
  error?: string;
}

export const emailChangeService = {
  initiateEmailChange: (newEmail: string) =>
    apiClient.post<InitiateResponse>('/v1/auth/change-email/initiate', { newEmail }),

  verifyEmailChange: (otp: string) =>
    apiClient.post<VerifyResponse>('/v1/auth/change-email/verify', { otp }),
};
