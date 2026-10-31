/**
 * Protected Route for Onboarding Stages
 * 
 * Purpose: Route guard to ensure stages are completed in order
 * Stage 1 must be completed before Stage 2, etc.
 */

import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/apiClient';

interface OnboardingGuardProps {
  children: React.ReactNode;
  requiredStage: 'stage1' | 'stage2' | 'stage3' | 'stage4';
}

export function OnboardingGuard({ children, requiredStage }: OnboardingGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  useEffect(() => {
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { profileStatus: string };
      }>('/v1/expert/onboarding/stage1');

      if (response.data.success) {
        setProfileStatus(response.data.data.profileStatus);
      }
    } catch {
      setProfileStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Map required stages to profile status
  const stageRequirements: Record<string, string[]> = {
    stage1: ['profile_draft', 'stage1_completed', 'stage2_completed', 'stage3_completed', 'stage4_completed'],
    stage2: ['stage1_completed', 'stage2_completed', 'stage3_completed', 'stage4_completed'],
    stage3: ['stage2_completed', 'stage3_completed', 'stage4_completed'],
    stage4: ['stage3_completed', 'stage4_completed'],
  };

  const allowedStatuses = stageRequirements[requiredStage] || [];
  
  if (!profileStatus || !allowedStatuses.includes(profileStatus)) {
    // Redirect to appropriate stage
    if (!profileStatus || profileStatus === 'profile_draft') {
      return <Navigate to="/expert/onboarding/stage1" replace />;
    }
    if (profileStatus === 'stage1_completed') {
      return <Navigate to="/expert/onboarding/stage2" replace />;
    }
    if (profileStatus === 'stage2_completed') {
      return <Navigate to="/expert/onboarding/stage3" replace />;
    }
    if (profileStatus === 'stage3_completed') {
      return <Navigate to="/expert/onboarding/stage4" replace />;
    }
  }

  return <>{children}</>;
}
