import React, { useState } from 'react';
import { CampusAuthProvider, useCampusAuth } from '@/contexts/CampusAuthContext';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AppDashboardLayout, CampusTab } from '@/components/layout/AppDashboardLayout';
import { RoleDashboardRouter } from '@/pages/dashboard/RoleDashboardRouter';
import { TimetableDashboard } from '@/pages/campus/TimetableDashboard';
import { ExamsView } from '@/pages/campus/ExamsView';
import { SpectraBookingsView } from '@/pages/campus/SpectraBookingsView';
import { DisruptionsView } from '@/pages/campus/DisruptionsView';
import { AICopilotDrawer } from '@/components/campus/AICopilotDrawer';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RotateCw } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, loading } = useCampusAuth();
  const [activeTab, setActiveTab] = useState<CampusTab>('dashboard');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-3">
        <RotateCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-semibold font-poppins text-ink-soft">
          Connecting to CIT CampusOS...
        </p>
      </div>
    );
  }

  // If not authenticated, render the dedicated high-end Login Screen
  if (!user) {
    return (
      <>
        <LoginPage onSuccess={handleRefreshData} />
        <Sonner position="top-right" richColors />
      </>
    );
  }

  return (
    <AppDashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      openCopilot={() => setCopilotOpen(true)}
      onRefreshData={handleRefreshData}
    >
      <div key={refreshKey}>
        {activeTab === 'dashboard' && (
          <RoleDashboardRouter
            onNavigateTab={setActiveTab}
            openCopilot={() => setCopilotOpen(true)}
          />
        )}
        {activeTab === 'timetable' && <TimetableDashboard />}
        {activeTab === 'exams' && <ExamsView />}
        {activeTab === 'bookings' && <SpectraBookingsView />}
        {activeTab === 'disruptions' && <DisruptionsView />}
      </div>

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        onBookingSubmitted={handleRefreshData}
      />

      {/* Toast Notifications */}
      <Sonner position="top-right" richColors />
    </AppDashboardLayout>
  );
};

export default function App() {
  return (
    <TooltipProvider>
      <CampusAuthProvider>
        <AppContent />
      </CampusAuthProvider>
    </TooltipProvider>
  );
}
