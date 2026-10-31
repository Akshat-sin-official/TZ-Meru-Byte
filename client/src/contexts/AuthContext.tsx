import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from '@/services/apiClient';

export type UserRole = 'visitor' | 'seeker' | 'seeker_candidate' | 'expert' | 'expert_candidate' | 'admin';

export interface User {
  id: string;
  userId?: string;
  _id?: string;
  name: string;
  fullName?: string;
  email: string;
  mobile: string;
  role: UserRole;
  isVerified: boolean;
  profileComplete?: boolean;
  registrationStatus?: 'registration_started' | 'verified'; // Registration status
  profileStatus?: string; // Expert profile status
  expertId?: string; // Expert profile ID
  documentsRequested?: boolean; // Flag for pending docs
  documentsRequestedReason?: string; // Reason for pending docs
  rejectionReason?: string; // Reason for rejection
  suspensionReason?: string; // Reason for suspension
  welcomeAcknowledged?: boolean; // Expert welcome modal acknowledged
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  verifyOTP: (otp: string, emailOverride?: string) => Promise<boolean>;
  setUserRole: (role: UserRole) => void;
  getDashboardPath: () => string;
  refreshUser: (tokenOverride?: string) => Promise<void>;
  confirmRole: () => Promise<void>;
  acknowledgeWelcome: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  password?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseAuthErrorMessage(error: unknown, defaultMessage: string): string {
  if (!error) return defaultMessage;
  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    const axiosError = error as any;
    if (axiosError.code === 'ECONNABORTED') {
      return 'Server request timed out. Please try again later.';
    }

    const data = axiosError.response?.data;
    if (data) {
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error;
      }
      if (data.error && typeof data.error === 'object' && typeof data.error.message === 'string' && data.error.message.trim()) {
        return data.error.message;
      }
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
      if (Array.isArray(data.details) && data.details.length > 0) {
        return data.details.map((d: any) => (typeof d === 'string' ? d : d.message || JSON.stringify(d))).join(', ');
      }
    }

    if (axiosError.request && !axiosError.response) {
      return 'Unable to connect to server. Please check your internet connection.';
    }

    if (error.message && typeof error.message === 'string' && error.message.trim() && error.message !== '[object Object]') {
      return error.message;
    }
  }

  return defaultMessage;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Cross-domain cookie helpers for .martechadda.com
const getCookieDomain = (): string => {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname.includes('martechadda.com')) {
    return '; domain=.martechadda.com';
  }
  return '';
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

const setCookie = (name: string, value: string, maxAgeSeconds: number): void => {
  if (typeof document === 'undefined') return;
  const domain = getCookieDomain();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}${domain}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
};

const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  const domain = getCookieDomain();
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  if (domain) {
    document.cookie = `${name}=; domain=.martechadda.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
};

// Token storage helpers
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

const setAuthToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
  deleteCookie('mta_logged_out');
  setCookie('mta_auth', '1', 7 * 86400);
};

const removeAuthToken = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null); // Store email for OTP verification
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh user data from backend
  const refreshUser = async (tokenOverride?: string): Promise<void> => {
    // Determine which token to use for the check
    const tokenToCheck = tokenOverride || getAuthToken();
    
    if (!tokenToCheck) {
      setUser(null);
      return;
    }

    try {
      // Use the provided token explicitly in the header for this call to ensure freshness
      const response = await apiClient.get<{ 
        success: boolean; 
        data: { 
          userId: string; 
          role: string; 
          fullName?: string; 
          isEmailVerified: boolean; 
          isActive: boolean; 
          registrationStatus?: 'registration_started' | 'verified'; 
          profileStatus?: string; 
          expertId?: string; 
          documentsRequested?: boolean; 
          documentsRequestedReason?: string; 
          rejectionReason?: string;
          suspensionReason?: string;
          welcomeAcknowledged?: boolean;
        } 
      }>('/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${tokenToCheck}`
        }
      });

      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid session');
      }

      const userData = response.data.data;

      // Backend /me endpoint returns: userId, role, fullName, isEmailVerified, isActive
      // Full profile (email, mobile) will be fetched from profile endpoints later
      setUser((prevUser) => ({
        id: userData.userId,
        name: userData.fullName || 'User', // Use fullName from backend
        email: prevUser?.email || '', // Preserve existing email if available
        mobile: prevUser?.mobile || '', // Preserve existing mobile if available
        role: userData.role as UserRole,
        isVerified: userData.isEmailVerified,
        profileComplete: false, // Will be determined from profile data
        registrationStatus: userData.registrationStatus, // Include registration status
        profileStatus: userData.profileStatus, // Include expert profile status
        expertId: userData.expertId, // Include expert profile ID
        documentsRequested: userData.documentsRequested,
        documentsRequestedReason: userData.documentsRequestedReason,
        rejectionReason: userData.rejectionReason,
        suspensionReason: (userData as any).suspensionReason,
        welcomeAcknowledged: userData.welcomeAcknowledged ?? prevUser?.welcomeAcknowledged ?? true,
      }));
    } catch {
      // Token invalid, clear it
      removeAuthToken();
      setUser(null);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      // Extract token from URL if returned from OAuth redirect
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        setAuthToken(urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check if user was logged out on another domain/tab
      const hasLoggedOutCookie = getCookie('mta_logged_out');
      const hasAuthCookie = getCookie('mta_auth');
      if (hasLoggedOutCookie && !hasAuthCookie && !urlToken) {
        removeAuthToken();
        setUser(null);
        setIsLoading(false);
        return;
      }

      const token = urlToken || getAuthToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get<{ 
          success: boolean; 
          data: { 
            userId: string; 
            role: string; 
            fullName?: string; 
            email?: string;
            mobile?: string;
            isEmailVerified: boolean; 
            isActive: boolean; 
            registrationStatus?: 'registration_started' | 'verified'; 
            profileStatus?: string; 
            expertId?: string; 
            documentsRequested?: boolean; 
            documentsRequestedReason?: string; 
            rejectionReason?: string;
            suspensionReason?: string;
          } 
        }>('/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.data.success || !response.data.data) {
          throw new Error('Invalid session');
        }

        const userData = response.data.data;

        setUser((prevUser) => ({
          id: userData.userId,
          name: userData.fullName || 'User',
          fullName: userData.fullName || prevUser?.fullName || 'User',
          email: userData.email || prevUser?.email || '',
          mobile: userData.mobile || prevUser?.mobile || '',
          role: userData.role as UserRole,
          isVerified: userData.isEmailVerified,
          profileComplete: false,
          registrationStatus: userData.registrationStatus,
          profileStatus: userData.profileStatus,
          expertId: userData.expertId,
          documentsRequested: userData.documentsRequested,
          documentsRequestedReason: userData.documentsRequestedReason,
          rejectionReason: userData.rejectionReason,
          suspensionReason: (userData as any).suspensionReason,
          welcomeAcknowledged: (userData as any).welcomeAcknowledged ?? false,
        }));
      } catch {
        removeAuthToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Listen for cross-domain / cross-tab logout events on focus & visibilitychange
  useEffect(() => {
    const handleSyncAuth = () => {
      const hasLoggedOutCookie = getCookie('mta_logged_out');
      const hasAuthCookie = getCookie('mta_auth');
      const localToken = getAuthToken();

      if (hasLoggedOutCookie && !hasAuthCookie && localToken) {
        removeAuthToken();
        setUser(null);
        setPendingUser(null);
      }
    };

    window.addEventListener('focus', handleSyncAuth);
    document.addEventListener('visibilitychange', handleSyncAuth);

    return () => {
      window.removeEventListener('focus', handleSyncAuth);
      document.removeEventListener('visibilitychange', handleSyncAuth);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data?: {
          userId: string;
          role: string;
          accessToken: string;
          refreshToken: string
        };
        error?: string
      }>('/v1/auth/login', {
        emailOrMobile: email,
        password
      });

      // Check if response is successful
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Login failed');
      }

      const { data } = response.data;

      // Store tokens
      setAuthToken(data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Fetch user details using the token
      const userResponse = await apiClient.get<{
        success: boolean;
        data: {
          userId: string;
          role: string;
          fullName?: string;
          isEmailVerified: boolean;
          isActive: boolean;
          profileStatus?: string;
          expertId?: string;
          documentsRequested?: boolean;
          documentsRequestedReason?: string;
          rejectionReason?: string;
          suspensionReason?: string;
        }
      }>('/v1/auth/me');

      if (!userResponse.data.success || !userResponse.data.data) {
        throw new Error('Failed to fetch user session');
      }

      const userData = userResponse.data.data;

      // Set user (backend returns userId, role, fullName, isEmailVerified, isActive)
      // Full profile (email, mobile) will be fetched from profile endpoints later
      setUser({
        id: userData.userId,
        name: userData.fullName || 'User', // Use fullName from backend
        email: email, // Use email from login form
        mobile: '', // Will be fetched from profile endpoint
        role: userData.role as UserRole,
        isVerified: userData.isEmailVerified,
        profileComplete: false, // Will be determined from profile data
        profileStatus: userData.profileStatus, // Include expert profile status
        expertId: userData.expertId, // Include expert profile ID
        documentsRequested: userData.documentsRequested,
        documentsRequestedReason: userData.documentsRequestedReason,
        rejectionReason: userData.rejectionReason,
        suspensionReason: userData.suspensionReason,
        welcomeAcknowledged: (userData as any).welcomeAcknowledged ?? false,
      });
    } catch (error: unknown) {
      throw new Error(parseAuthErrorMessage(error, 'Invalid credentials'));
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data?: { email: string; expiresIn: number };
        error?: string;
      }>('/v1/auth/register', {
        fullName: data.name,
        email: data.email,
        mobile: data.mobile && data.mobile.trim() && data.mobile.trim().toUpperCase() !== 'N/A' ? data.mobile.trim() : undefined,
        role: data.role,
        ...(data.password && { password: data.password }),
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed');
      }

      // Store pending registration info locally for OTP verification
      setPendingEmail(data.email);
      setPendingUser({
        id: '',
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        role: data.role,
        isVerified: false,
        profileComplete: false,
      });

      // Do NOT set auth tokens or user state yet — account is created ONLY upon successful OTP verification
    } catch (error: unknown) {
      throw new Error(parseAuthErrorMessage(error, 'Registration failed'));
    }
  };

  const verifyOTP = async (otp: string, emailOverride?: string) => {
    try {
      const targetEmail = emailOverride || pendingEmail || pendingUser?.email;

      if (!targetEmail) {
        throw new Error('No pending registration found. Please register again.');
      }

      const response = await apiClient.post<{
        success: boolean;
        message?: string;
        error?: string;
        data?: {
          userId: string;
          role: string;
          accessToken: string;
          refreshToken: string;
          isEmailVerified: boolean;
        };
      }>('/v1/auth/verify-otp', {
        email: targetEmail,
        otp: otp.trim(),
        type: 'email_verification',
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'OTP verification failed');
      }

      const { accessToken, refreshToken } = response.data.data;

      if (accessToken) {
        setAuthToken(accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
      }

      setPendingUser(null);
      setPendingEmail(null);

      // Refresh session user state using the newly issued access token
      await refreshUser(accessToken);
      return true;
    } catch (error: unknown) {
      throw new Error(parseAuthErrorMessage(error, 'OTP verification failed'));
    }
  };

  const confirmRole = async () => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data?: { accessToken: string; profileId?: string };
        error?: string;
      }>('/v1/auth/confirm-role');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Role confirmation failed');
      }

      // If we got a new access token, store it
      if (response.data.data.accessToken) {
        setAuthToken(response.data.data.accessToken);
        // Also update local storage just in case AuthContext isn't re-reading yet
        localStorage.setItem('accessToken', response.data.data.accessToken);
      }

      // Refresh user data with the NEW token explicitly to ensure state is based on it
      await refreshUser(response.data.data.accessToken);
    } catch (error: unknown) {
      throw new Error(parseAuthErrorMessage(error, 'Failed to confirm role'));
    }
  };

  const logout = async () => {
    try {
      const token = getAuthToken();
      deleteCookie('mta_auth');
      setCookie('mta_logged_out', Date.now().toString(), 86400);

      if (token) {
        await apiClient.post('/v1/auth/logout');
      }
    } catch {
      // Continue with logout even if API call fails
    } finally {
      deleteCookie('mta_auth');
      setCookie('mta_logged_out', Date.now().toString(), 86400);
      removeAuthToken();
      setUser(null);
      setPendingUser(null);

      // Clear expert registration draft to prevent data leakage between users
      localStorage.removeItem('expertRegistrationDraft');

      // Clear any user-specific draft keys (for future userId-based isolation)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('expertRegistrationDraft_')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  const setUserRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  // Role-based redirect helper (memoized to prevent unnecessary re-render loops in consumer useEffect hooks)
  const getDashboardPath = useCallback((): string => {
    if (!user) {
      return '/login';
    }

    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'expert':
      case 'expert_candidate':
        if (user.profileStatus === 'suspended') {
          return '/expert/suspended';
        }
        if (user.profileStatus === 'submitted_for_verification') {
          return '/expert/status/pending';
        }
        if (user.profileStatus === 'verified') {
          return '/expert/dashboard';
        }
        if (user.profileStatus === 'rejected') {
          return '/expert/profile-rejected';
        }
        // If profileStatus is a draft/stage status, go to profile workspace wizard
        if (user.profileStatus === 'profile_draft' || (user.profileStatus && user.profileStatus.includes('stage'))) {
          return '/expert/profile';
        }
        // Default: if profileStatus is undefined/null, default to expert dashboard
        return '/expert/dashboard';
      case 'seeker':
        return '/seeker/dashboard';
      default:
        return '/';
    }
  }, [user]);

  const acknowledgeWelcome = useCallback(async (): Promise<void> => {
    try {
      await apiClient.post('/v1/auth/acknowledge-welcome');
      setUser((prev) => (prev ? { ...prev, welcomeAcknowledged: true } : null));
    } catch (error) {
      console.error('Failed to acknowledge welcome screen:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        verifyOTP,
        setUserRole,
        getDashboardPath,
        refreshUser,
        confirmRole,
        acknowledgeWelcome,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
