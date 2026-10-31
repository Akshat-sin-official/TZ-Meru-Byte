import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// API Base URL configuration
// In production, use relative path /api (proxied by Nginx)
// In development, use localhost:6001 (proxied by Vite)
function getApiBaseUrl(): string {
  // If explicitly set in env, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // In production (not localhost), use relative path
  // Nginx will proxy /api to http://localhost:6001
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }

  // Development: use localhost:6001 (Vite proxy handles /api)
  return 'http://localhost:6001/api';
}

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private processQueue(error: any, token: string | null = null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token!);
      }
    });
    this.failedQueue = [];
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Normalize API versioning: ensure relative paths target /v1
        if (config.url && !config.url.startsWith('/v1') && !config.url.startsWith('http') && !config.url.startsWith('//')) {
          config.url = `/v1${config.url.startsWith('/') ? '' : '/'}${config.url}`;
        }

        // Add auth token if available
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't attempt refresh for auth endpoints themselves, or when account is inactive/deactivated
          const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/register') ||
            originalRequest?.url?.includes('/auth/refresh') ||
            originalRequest?.url?.includes('/auth/me');

          const isInactive = error.response?.data?.code === 'USER_INACTIVE' ||
            error.response?.data?.code === 'ACCOUNT_DEACTIVATED' ||
            error.response?.data?.code === 'SESSION_LOGGED_OUT';

          if (isAuthEndpoint || isInactive) {
            if (isInactive) {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
            return Promise.reject(error);
          }

          const refreshToken = localStorage.getItem('refreshToken');

          if (!refreshToken) {
            // No refresh token available, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            // Queue this request while refresh is in progress
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshResponse = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
              refreshToken,
            });

            const newAccessToken = refreshResponse.data?.data?.accessToken;

            if (!newAccessToken) {
              throw new Error('No access token in refresh response');
            }

            localStorage.setItem('accessToken', newAccessToken);

            // If a new refresh token is provided, update it too
            if (refreshResponse.data?.data?.refreshToken) {
              localStorage.setItem('refreshToken', refreshResponse.data.data.refreshToken);
            }

            this.processQueue(null, newAccessToken);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            // Refresh failed — clear tokens and redirect
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        const status = error.response?.status;
        const data = error.response?.data;
        const apiError = data?.error;

        const method = typeof error.config?.method === 'string' ? error.config.method.toUpperCase() : undefined;
        const url = typeof error.config?.url === 'string' ? error.config.url : undefined;

        let message: string | undefined;
        let code: string | undefined;
        let details: unknown;
        let originalError: unknown;

        if (error?.code === 'ECONNABORTED') {
          message = 'Request timed out. Please try again.';
        } else if (error?.code === 'ERR_NETWORK' || !error.response) {
          message = 'Unable to connect to server. Please check your internet connection.';
        } else if (typeof apiError === 'string') {
          message = apiError;
        } else if (apiError && typeof apiError === 'object') {
          message = typeof (apiError as any).message === 'string' ? (apiError as any).message : undefined;
          code = typeof (apiError as any).code === 'string' ? (apiError as any).code : undefined;
          details = (apiError as any).details;
          originalError = (apiError as any).originalError;
        } else if (data && typeof data === 'object' && typeof (data as any).message === 'string') {
          message = (data as any).message;
        } else if (typeof error.message === 'string' && error.message.trim()) {
          message = error.message;
        }

        // Map HTTP status codes to user-friendly messages when no specific message is available
        if (!message && status) {
          switch (status) {
            case 400:
              message = 'The request was invalid. Please check your input and try again.';
              break;
            case 401:
              message = 'Your session has expired. Please log in again.';
              break;
            case 403:
              message = 'You don\'t have permission to perform this action.';
              break;
            case 404:
              message = 'The requested resource was not found.';
              break;
            case 409:
              message = 'This action conflicts with existing data. Please refresh and try again.';
              break;
            case 413:
              message = 'The file or data you\'re sending is too large. Please reduce the size.';
              break;
            case 422:
              message = 'The data provided is incomplete or invalid. Please review your input.';
              break;
            case 429:
              message = 'Too many requests. Please wait a moment and try again.';
              break;
            case 500:
              message = 'Something went wrong on our end. Please try again in a moment.';
              break;
            case 502:
            case 503:
            case 504:
              message = 'The server is temporarily unavailable. Please try again in a few minutes.';
              break;
            default:
              message = 'Something went wrong. Please try again.';
          }
        }

        const finalMessage = message || 'Something went wrong. Please try again.';
        error.message = finalMessage;

        // Show user-friendly toast notification for unhandled server / network errors.
        // Skip global toast for:
        // 1. Silent/background requests (X-Silent-Error: true)
        // 2. 401 Unauthorized (handled by session redirect/refresh)
        // 3. Auth endpoints (/auth/*) which have dedicated, form-level error handling in Login/Register
        // 4. 4xx Client/Validation errors (400, 403, 404, 409, 422), which are caught and displayed by calling components
        const isSilent = originalRequest?.headers?.['X-Silent-Error'] === 'true';
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/') ||
          originalRequest?.url?.includes('/v1/auth/');
        const isClientError = typeof status === 'number' && status >= 400 && status < 500;
        const forceGlobalToast = originalRequest?.headers?.['X-Show-Global-Error'] === 'true';

        if (!isSilent && status !== 401 && !isAuthEndpoint && (!isClientError || forceGlobalToast)) {
          toast.error(finalMessage, {
            id: `api-error-${finalMessage}`,
            duration: 5000,
            description: status === 500 ? 'If this persists, please contact support.' : undefined,
          });
        }

        const prefix = [
          'API Error',
          status ? String(status) : undefined,
          method,
          url,
        ]
          .filter(Boolean)
          .join(' ');

        console.error(`${prefix}: ${finalMessage}`, {
          code,
          originalError,
          details,
        });

        return Promise.reject(error);
      }
    );
  }

  public get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  public post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  public put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  public patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
