/**
 * OnboardingGuard - Route Protection for Expert Onboarding Stages
 *
 * Ensures proper stage progression:
 * - Stage 1: Always accessible for experts
 * - Stage 2: Only accessible after Stage 1 completion
 * - Stage 3: Only accessible after Stage 2 completion
 * - Stage 4: Only accessible after Stage 3 completion
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { toast } from 'sonner';

interface OnboardingGuardProps {
  children: React.ReactNode;
  requiredStage?: 'stage1' | 'stage2' | 'stage3' | 'stage4';
}

interface ProfileStatus {
  profileStatus: 
    | 'profile_draft' 
    | 'stage1_completed' 
    | 'stage2_completed' 
    | 'stage3_completed' 
    | 'stage4_completed'
    | 'submitted_for_verification'
    | 'verified'
    | 'rejected';
}

export default function OnboardingGuard({ children, requiredStage }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [user, requiredStage]);

  const checkAccess = async () => {
    // Verify user is authenticated and is an expert
    if (!user || user.role !== 'expert') {
      navigate('/login');
      return;
    }

    // If no specific stage required, allow access
    if (!requiredStage) {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    try {
      // Check current profile status
      const response = await apiClient.get<{
        success: boolean;
        data: ProfileStatus;
      }>('/v1/expert/onboarding/stage1');

      if (!response.data.success) {
        toast.error('Unable to verify profile status');
        navigate('/expert/dashboard');
        return;
      }

      const { profileStatus } = response.data.data;

      // Stage access rules
      const stageRequirements = {
        stage1: ['profile_draft', 'stage1_completed', 'stage2_completed', 'stage3_completed', 'stage4_completed'], // Always accessible
        stage2: ['stage1_completed', 'stage2_completed', 'stage3_completed', 'stage4_completed'], // Need Stage 1 done
        stage3: ['stage2_completed', 'stage3_completed', 'stage4_completed'], // Need Stage 2 done
        stage4: ['stage3_completed', 'stage4_completed'], // Need Stage 3 done
      };

      const allowedStatuses = stageRequirements[requiredStage];

      if (allowedStatuses.includes(profileStatus)) {
        setIsAuthorized(true);
      } else {
        // Redirect to appropriate stage
        if (profileStatus === 'profile_draft') {
          toast.error('Please complete Stage 1 first');
          navigate('/expert/onboarding/stage1');
        } else if (profileStatus === 'stage1_completed' && requiredStage === 'stage3') {
          toast.error('Please complete Stage 2 first');
          navigate('/expert/onboarding/stage2');
        } else if (profileStatus === 'stage2_completed' && requiredStage === 'stage4') {
          toast.error('Please complete Stage 3 first');
          navigate('/expert/onboarding/stage3');
        } else {
          toast.error('Access denied. Please complete previous stages first.');
          navigate('/expert/dashboard');
        }
      }
    } catch (error) {
      console.error('Onboarding guard error:', error);
      toast.error('Unable to verify access permissions');
      navigate('/expert/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <p className="text-center text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in checkAccess
  }

  return <>{children}</>;
}