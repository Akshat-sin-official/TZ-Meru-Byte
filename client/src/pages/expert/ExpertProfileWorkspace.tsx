import { Navigate, useSearchParams } from 'react-router-dom';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import ServiceExpert from '@/components/website/ServiceExpert';
import { useAppSidebar } from '@/hooks/useAppSidebar';

/** Expert-facing profile UI: same multi-step wizard as public registration, embedded in dashboard. */
export default function ExpertProfileWorkspace() {
  const [searchParams] = useSearchParams();
  const sidebarSections = useAppSidebar();

  if (searchParams.get('tab') === 'compliance') {
    return <Navigate to="/expert/onboarding" replace />;
  }

  return (
    <AppDashboardLayout sections={sidebarSections} headerTitle="Profile">
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-visible">
        <ServiceExpert variant="dashboard" />
      </div>
    </AppDashboardLayout>
  );
}
