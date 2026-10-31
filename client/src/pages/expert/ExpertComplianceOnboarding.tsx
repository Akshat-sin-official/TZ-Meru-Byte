import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { WorkspaceTrustTab } from '@/components/expert/WorkspaceTrustTab';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { expertService } from '@/services/expertService';

/**
 * Dedicated Compliance Onboarding page for Experts
 * Parallels the Seeker Compliance Onboarding workflow (/seeker/onboarding)
 */
export default function ExpertComplianceOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const sidebarSections = useAppSidebar();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['expertProfile'],
    queryFn: () => expertService.getProfile(),
  });

  if (isLoading) {
    return (
      <AppDashboardLayout
        user={{ name: user?.name || 'Expert', role: 'Marketing Expert' }}
        sections={sidebarSections}
        headerTitle="Compliance Onboarding"
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppDashboardLayout>
    );
  }

  return (
    <AppDashboardLayout
      user={{ name: user?.name || 'Expert', role: 'Marketing Expert' }}
      sections={sidebarSections}
      headerTitle="Compliance Onboarding"
      onSignOut={() => {
        logout();
        navigate('/login');
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header Area */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Compliance Onboarding</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Complete your legal entity details, identity verification, and payout bank accounts to unlock project payouts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/expert/dashboard')}
              className="h-9"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm">
          <WorkspaceTrustTab
            initialData={profile}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['expertProfile'] });
              queryClient.invalidateQueries({ queryKey: ['session'] });
            }}
          />
        </div>
      </div>
    </AppDashboardLayout>
  );
}
