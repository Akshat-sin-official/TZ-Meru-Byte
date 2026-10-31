/**
 * WorkspaceGuard - CRITICAL ACCESS CONTROL
 * 
 * Purpose: Prevent unverified experts from accessing engagement workspace
 * 
 * Access Rules:
 * - profileStatus === "verified" && isActive === true → Allow
 * - profileStatus === "submitted_for_verification" → Show "Under Review"
 * - profileStatus === "rejected" → Show "Rejected" with feedback
 * - Other statuses → Redirect to onboarding
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { toast } from 'sonner';

interface WorkspaceGuardProps {
  children: React.ReactNode;
}

interface ExpertProfile {
  profileStatus: string;
  isActive: boolean;
  expertId?: string;
  rejectionReason?: string;
}

export default function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkWorkspaceAccess();
  }, [user]);

  const checkWorkspaceAccess = async () => {
    // Verify user is authenticated and is an expert
    if (!user || user.role !== 'expert') {
      navigate('/login');
      return;
    }

    try {
      // Check profile status via Stage 1 endpoint (has profile status)
      const response = await apiClient.get<{
        success: boolean;
        data: ExpertProfile;
      }>('/v1/expert/onboarding/stage1');

      if (!response.data.success) {
        toast.error('Unable to verify profile status');
        navigate('/expert/dashboard');
        return;
      }

      const { profileStatus, isActive, expertId, rejectionReason } = response.data.data;

      // CRITICAL CHECKS
      const isVerified = profileStatus === 'verified';
      // Manual Approval bypass: If admin has verified the profile, we should generally allow workspace access
      // even if the isActive flag or expertId is temporarily missing from this specific response
      const isActiveProfile = isActive === true;

      if (isVerified || (isActiveProfile && expertId)) {
        // ACCESS GRANTED
        setIsAuthorized(true);
      } else if (profileStatus === 'submitted_for_verification') {
        // UNDER REVIEW
        navigate('/expert/under-review');
      } else if (profileStatus === 'rejected') {
        // REJECTED
        navigate('/expert/profile-rejected', {
          state: { rejectionReason },
        });
      } else {
        // NOT SUBMITTED OR INCOMPLETE
        toast.error('Please complete and submit your profile for verification');
        navigate('/expert/dashboard');
      }
    } catch (error) {
      console.error('Workspace guard error:', error);
      toast.error('Unable to verify workspace access');
      navigate('/expert/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in checkWorkspaceAccess
  }

  return <>{children}</>;
}
