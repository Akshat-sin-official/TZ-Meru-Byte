import React, { useState } from 'react';
import { CampusAuthProvider, useCampusAuth } from '@/contexts/CampusAuthContext';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AppDashboardLayout, CampusTab } from '@/components/layout/AppDashboardLayout';
import { RoleDashboardRouter } from '@/pages/dashboard/RoleDashboardRouter';
import { TimetableDashboard } from '@/pages/campus/TimetableDashboard';
import { ExamsView } from '@/pages/campus/ExamsView';
import { SpectraBookingsView } from '@/pages/campus/SpectraBookingsView';
import { DisruptionsView } from '@/pages/campus/DisruptionsView';
import { WhatsAppBotSection } from '@/components/campus/WhatsAppBotSection';
import { AICopilotDrawer } from '@/components/campus/AICopilotDrawer';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RotateCw } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, loading } = useCampusAuth();
  const [activeTab, setActiveTab] = useState<CampusTab>('dashboard');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cross-component dynamic workspace state (Sidebar <-> Timetable)
  const [highlightDay, setHighlightDay] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<string>('CSE-2');
  const [quickFilter, setQuickFilter] = useState<'all' | 'labs' | 'lectures' | 'tutorials'>('all');

  const handleRefreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSelectDay = (day: string | null, date?: number) => {
    setHighlightDay(day);
    if (date !== undefined) setSelectedDate(date);
    setActiveTab('timetable');
  };

  const handleSelectCohort = (cohortId: string) => {
    setSelectedCohort(cohortId);
    setActiveTab('timetable');
  };

  const handleSelectQuickFilter = (qf: 'all' | 'labs' | 'lectures' | 'tutorials') => {
    setQuickFilter(qf);
    setActiveTab('timetable');
  };

  // RBAC route enforcement per ini.md
  React.useEffect(() => {
    if (user?.role === 'club' && (activeTab === 'timetable' || activeTab === 'exams' || activeTab === 'disruptions' || activeTab === 'whatsapp')) {
      setActiveTab('bookings');
    }
    if (user?.role === 'faculty' && (activeTab === 'disruptions' || activeTab === 'whatsapp')) {
      setActiveTab('timetable');
    }
    if (user?.role === 'department_coordinator' && activeTab === 'whatsapp') {
      setActiveTab('dashboard');
    }
  }, [user?.role, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-3">
        <RotateCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-semibold font-poppins text-ink-soft">
          Connecting to Campora...
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
      selectedDay={highlightDay}
      onSelectDay={handleSelectDay}
      selectedDate={selectedDate}
      selectedCohort={selectedCohort}
      onSelectCohort={handleSelectCohort}
      quickFilter={quickFilter}
      onSelectQuickFilter={handleSelectQuickFilter}
    >
      <div key={refreshKey}>
        {activeTab === 'dashboard' && (
          <RoleDashboardRouter
            onNavigateTab={setActiveTab}
            openCopilot={() => setCopilotOpen(true)}
          />
        )}
        {activeTab === 'timetable' && (
          <TimetableDashboard
            highlightDay={highlightDay}
            onSelectDay={setHighlightDay}
            externalCohort={user?.role === 'faculty' ? undefined : selectedCohort}
            onCohortChange={setSelectedCohort}
            externalQuickFilter={quickFilter}
            onQuickFilterChange={setQuickFilter}
            selectedDate={selectedDate}
          />
        )}
        {activeTab === 'exams' && <ExamsView />}
        {activeTab === 'bookings' && <SpectraBookingsView />}
        {activeTab === 'disruptions' && <DisruptionsView />}
        {activeTab === 'whatsapp' && (
          user?.role === 'admin' ? (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-poppins text-[#111926] tracking-tight">
                  WhatsApp Operations Center
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 font-poppins">
                  Evolution-Go v2 Gateway · Live QR Device Pairing · Campus Phone & Role Directory
                </p>
              </div>
              <WhatsAppBotSection />
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center max-w-md mx-auto my-16 space-y-3 shadow-xs">
              <h3 className="text-base font-semibold text-[#09090B]">Access Restricted</h3>
              <p className="text-xs text-[#52525B]">
                WhatsApp Bot Operations Center is restricted to Dean / Academic Affairs Administrators.
              </p>
            </div>
          )
        )}
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
