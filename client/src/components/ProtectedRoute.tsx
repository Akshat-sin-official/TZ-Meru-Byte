/**
 * Protected Route Component
 * 
 * Handles authentication and role-based routing
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/services';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

// Module-level cache for onboarding status keyed by user ID
const onboardingCache = new Map<string, boolean>();

export const setOnboardingCache = (userId: string, isComplete: boolean) => {
  onboardingCache.set(userId, isComplete);
};

export const ProtectedRoute = ({
  children,
  requiredRole,
  redirectTo = '/login'
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const lastCheckedUserId = useRef<string | null>(null);

  // Check seeker onboarding completion — cached per user session
  useEffect(() => {
    const checkSeekerOnboarding = async () => {
      if (!user || (user.role !== 'seeker' && user.role !== 'seeker_candidate')) {
        setOnboardingComplete(true);
        return;
      }

      // Use cached result if available for this user
      if (onboardingCache.has(user.id)) {
        setOnboardingComplete(onboardingCache.get(user.id)!);
        return;
      }

      // Skip if we already checked for this user in this component instance
      if (lastCheckedUserId.current === user.id && onboardingComplete !== null) {
        return;
      }

      setIsCheckingOnboarding(true);
      try {
        const response = await apiClient.get<{
          success: boolean;
          data: { isProfileComplete?: boolean };
        }>('/v1/seeker/profile');

        if (response.data.success) {
          const isComplete = response.data.data?.isProfileComplete ?? false;
          setOnboardingComplete(isComplete);
          onboardingCache.set(user.id, isComplete);
          lastCheckedUserId.current = user.id;

          if (!isComplete && location.pathname !== '/seeker/onboarding') {
            toast.info('Please complete your profile to continue');
          }
        } else {
          setOnboardingComplete(false);
          onboardingCache.set(user.id, false);
          lastCheckedUserId.current = user.id;
        }
      } catch (error) {
        setOnboardingComplete(false);
        onboardingCache.set(user.id, false);
        lastCheckedUserId.current = user.id;
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    if (isAuthenticated && user) {
      checkSeekerOnboarding();
    }
  }, [user?.id, isAuthenticated]);

  // Show loading state while checking authentication or onboarding
  if (isLoading || isCheckingOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user role
      if (user.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (user.role === 'expert') {
        return <Navigate to="/expert/dashboard" replace />;
      } else if (user.role === 'expert_candidate') {
        // Expert candidates need to complete profile setup
        return <Navigate to="/expert/profile" replace />;
      } else if (user.role === 'seeker') {
        return <Navigate to="/seeker/dashboard" replace />;
      } else if (user.role === 'seeker_candidate') {
        return <Navigate to="/seeker/onboarding" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  // For experts, enforce approval status
  // Note: there is no standalone /expert/onboarding route — the in-app wizard lives at /expert/profile
  const expertWizardAllowed = (p: string) =>
    p.startsWith('/expert/profile') ||
    p.startsWith('/expert/onboarding') ||
    p === '/service-expert-register' ||
    p.startsWith('/expert/update-documents');

  if (user.role === 'expert' || user.role === 'expert_candidate') {
    const status = user.profileStatus;
    const path = location.pathname;

    const isExpertRoute = path.startsWith('/expert') || path === '/service-expert-register';

    if (isExpertRoute) {
      if (status === 'suspended') {
        if (path !== '/expert/suspended') {
          return <Navigate to="/expert/suspended" replace />;
        }
      } else if (path === '/expert/suspended') {
        return <Navigate to={status === 'verified' ? "/expert/dashboard" : "/expert/profile"} replace />;
      } else if (status === 'verified') {
        const isRestrictedPage =
          path === '/expert/under-review' || 
          path === '/expert/status/pending' || 
          path === '/expert/profile-rejected';
        if (isRestrictedPage) {
          return <Navigate to="/expert/dashboard" replace />;
        }
      } else if (status === 'submitted_for_verification') {
        // Submitted & pending admin approval: restrict access to profile review & account pages
        if (!expertWizardAllowed(path) && !path.startsWith('/expert/settings') && !path.startsWith('/expert/help-support') && path !== '/expert/under-review') {
          return <Navigate to="/expert/profile" replace />;
        }
      } else if (status === 'rejected') {
        if (path !== '/expert/profile-rejected' && !expertWizardAllowed(path)) {
          return <Navigate to="/expert/profile-rejected" replace />;
        }
      } else {
        // Draft / stage* / undefined profileStatus — restrict to onboarding wizard & account settings
        if (!expertWizardAllowed(path) && !path.startsWith('/expert/settings') && !path.startsWith('/expert/help-support')) {
          return <Navigate to="/expert/profile" replace />;
        }
      }
    }
  }

  // For seekers, enforce onboarding completion before accessing dashboard and workspaces
  if ((user.role === 'seeker' || user.role === 'seeker_candidate') && onboardingComplete === false) {
    if (location.pathname !== '/seeker/onboarding') {
      return <Navigate to="/seeker/onboarding" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};

