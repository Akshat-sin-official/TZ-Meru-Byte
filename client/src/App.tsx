import React, { useState } from 'react';
import { CampusAuthProvider, useCampusAuth } from '@/contexts/CampusAuthContext';
import { LoginPage } from '@/pages/auth/LoginPage';
import { CampusSidebar, CampusTab } from '@/components/layout/CampusSidebar';
import { RoleDashboardRouter } from '@/pages/dashboard/RoleDashboardRouter';
import { TimetableDashboard } from '@/pages/campus/TimetableDashboard';
import { ExamsView } from '@/pages/campus/ExamsView';
import { SpectraBookingsView } from '@/pages/campus/SpectraBookingsView';
import { DisruptionsView } from '@/pages/campus/DisruptionsView';
import { AICopilotDrawer } from '@/components/campus/AICopilotDrawer';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { RotateCw, Bot, Sparkles } from 'lucide-react';

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

  const getPageTitle = (tab: CampusTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'timetable':
        return 'Academic Timetable';
      case 'exams':
        return 'Midsem Examinations';
      case 'bookings':
        return "Spectra Week '27 Allocations";
      case 'disruptions':
        return 'Disruption Recovery & Stability';
      default:
        return 'CampusOS Workspace';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111827] flex font-sans">
      {/* Left Persistent Sidebar */}
      <CampusSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCopilot={() => setCopilotOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Subtle Top Utility Bar */}
        <header className="h-14 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#71717A] font-poppins">Workspace</span>
            <span className="text-[#E5E7EB]">/</span>
            <span className="font-semibold text-[#111827] font-poppins">
              {getPageTitle(activeTab)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCopilotOpen(true)}
              className="h-8 px-3 text-xs border-[#E5E7EB] bg-[#FAF9F6] hover:bg-white text-primary flex items-center gap-1.5 shadow-2xs font-medium cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask Copilot</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </Button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-medium font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CP-SAT Online
            </div>
          </div>
        </header>

        {/* View Container */}
        <main className="p-8 max-w-7xl w-full mx-auto" key={refreshKey}>
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
        </main>
      </div>

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        onBookingSubmitted={handleRefreshData}
      />

      {/* Toast Notifications */}
      <Sonner position="top-right" richColors />
    </div>
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
