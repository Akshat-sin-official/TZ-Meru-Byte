import React, { useState } from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CalendarDays,
  FileSpreadsheet,
  PartyPopper,
  AlertTriangle,
  LayoutDashboard,
  Search,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ChevronRight,
  RotateCw,
  LogOut,
  Bot,
  Sparkles,
  Users2,
  GraduationCap,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { campusApi } from '@/services/api';
import { toast } from 'sonner';

export type CampusTab = 'dashboard' | 'timetable' | 'exams' | 'bookings' | 'disruptions';

interface AppDashboardLayoutProps {
  activeTab: CampusTab;
  setActiveTab: (tab: CampusTab) => void;
  openCopilot: () => void;
  onRefreshData?: () => void;
  children: React.ReactNode;
}

export const AppDashboardLayout: React.FC<AppDashboardLayoutProps> = ({
  activeTab,
  setActiveTab,
  openCopilot,
  onRefreshData,
  children,
}) => {
  const { user, logout, loginDemo } = useCampusAuth();
  const [resetting, setResetting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleResetData = async () => {
    setResetting(true);
    try {
      toast.info('Restoring database to baseline cit_public.json...');
      await campusApi.resetDemoData();
      toast.success('Clean baseline restored successfully');
      onRefreshData?.();
    } catch {
      toast.error('Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Dean Academic Office';
      case 'department_coordinator':
        return 'CSE Dept Coordinator';
      case 'faculty':
        return 'Dr. S. Rath (Faculty)';
      case 'club':
        return 'Dramatics Society';
      default:
        return 'Authorized Stakeholder';
    }
  };

  const getInitials = (role?: string, name?: string) => {
    if (role === 'admin') return 'DA';
    if (role === 'department_coordinator') return 'DC';
    if (role === 'faculty') return 'SR';
    if (role === 'club') return 'DS';
    if (!name) return 'CIT';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9FB] text-[#111926] font-sans antialiased selection:bg-primary/20 selection:text-primary">
      {/* Collapsible Modern Sidebar inspired by Stitch Monolith Workspace */}
      <aside
        className={`sidebar-transition ${
          sidebarOpen ? 'w-[260px] border-r border-[#E5E7EB]' : 'w-0 border-r-0'
        } bg-[#F9F9FB] flex flex-col shrink-0 z-30 select-none h-full relative overflow-hidden`}
      >
        <div className="w-[260px] flex flex-col h-full justify-between p-4">
          <div className="space-y-4">
            {/* Brand Workspace Header with Toggle */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 font-poppins">
                  CIT
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold tracking-tight text-[#111926] font-poppins flex items-center gap-1.5">
                    CampusOS
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Autumn 2025</span>
                </div>
              </div>

              {/* Sidebar Collapse Button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-[#111926] hover:bg-white hover:shadow-2xs transition cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Command & AI Search Bar */}
            <button
              onClick={openCopilot}
              className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl bg-white border border-[#E5E7EB] text-muted-foreground hover:text-[#111926] hover:border-primary/40 hover:shadow-2xs transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 font-medium">
                <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Quick Search &amp; AI</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="text-[10px] font-mono bg-[#F9F9FB] border border-[#E5E7EB] px-1.5 py-0.5 rounded text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            </button>

            {/* Navigation Groups */}
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-thin pr-1">
              {/* Schedules */}
              <div>
                <span className="px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/80 font-poppins">
                  Schedules
                </span>
                <nav className="mt-1.5 space-y-1">
                  {/* Weekly Academic Schedule */}
                  <div
                    className={`rounded-xl transition-all ${
                      activeTab === 'timetable'
                        ? 'bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                        : 'hover:bg-white/60'
                    }`}
                  >
                    <button
                      onClick={() => setActiveTab('timetable')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium cursor-pointer transition ${
                        activeTab === 'timetable' ? 'text-[#111926] font-bold font-poppins' : 'text-muted-foreground hover:text-[#111926]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CalendarDays className={`w-4 h-4 ${activeTab === 'timetable' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span>Academic Timetable</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                          activeTab === 'timetable'
                            ? 'bg-primary text-white font-bold'
                            : 'bg-slate-200/70 text-muted-foreground'
                        }`}
                      >
                        189
                      </span>
                    </button>

                    {/* Active cohort indicator */}
                    {activeTab === 'timetable' && (
                      <div className="px-3 pb-2 pt-0.5 border-t border-[#F1F1EF] text-[11px] space-y-1">
                        <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-emerald-50/80 border border-emerald-200/60 text-emerald-900 font-medium">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">CSE — Yr 2 (Sec A)</span>
                          </div>
                          <span className="text-[9px] font-mono bg-emerald-200/60 text-emerald-800 px-1 rounded">
                            Active
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Midsem Exams */}
                  <button
                    onClick={() => setActiveTab('exams')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition cursor-pointer ${
                      activeTab === 'exams'
                        ? 'bg-white text-[#111926] font-bold font-poppins border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                        : 'text-muted-foreground hover:bg-white/60 hover:text-[#111926]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'exams' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>Midsem Examinations</span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                        activeTab === 'exams'
                          ? 'bg-primary text-white font-bold'
                          : 'bg-slate-200/70 text-muted-foreground'
                      }`}
                    >
                      41
                    </span>
                  </button>

                  {/* Spectra Allocations */}
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition cursor-pointer ${
                      activeTab === 'bookings'
                        ? 'bg-white text-[#111926] font-bold font-poppins border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                        : 'text-muted-foreground hover:bg-white/60 hover:text-[#111926]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <PartyPopper className={`w-4 h-4 ${activeTab === 'bookings' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>Spectra Week Bookings</span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                        activeTab === 'bookings'
                          ? 'bg-primary text-white font-bold'
                          : 'bg-slate-200/70 text-muted-foreground'
                      }`}
                    >
                      25
                    </span>
                  </button>
                </nav>
              </div>

              {/* Operations & Intelligence */}
              <div>
                <span className="px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/80 font-poppins">
                  Intelligence &amp; Control
                </span>
                <nav className="mt-1.5 space-y-1">
                  {/* Dashboard Overview */}
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition cursor-pointer ${
                      activeTab === 'dashboard'
                        ? 'bg-white text-[#111926] font-bold font-poppins border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                        : 'text-muted-foreground hover:bg-white/60 hover:text-[#111926]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>Dashboard Overview</span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
                      Live
                    </span>
                  </button>

                  {/* Disruptions & Repair */}
                  {(user?.role === 'admin' || user?.role === 'department_coordinator') && (
                    <button
                      onClick={() => setActiveTab('disruptions')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition cursor-pointer ${
                        activeTab === 'disruptions'
                          ? 'bg-white text-[#111926] font-bold font-poppins border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                          : 'text-muted-foreground hover:bg-white/60 hover:text-[#111926]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className={`w-4 h-4 ${activeTab === 'disruptions' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        <span>Disruptions &amp; Repair</span>
                      </div>
                      <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/60">
                        CP-SAT
                      </span>
                    </button>
                  )}

                  {/* CIT Copilot trigger */}
                  <button
                    onClick={openCopilot}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl text-muted-foreground hover:bg-purple-50 hover:text-primary transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bot className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-poppins">CIT Copilot</span>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-primary">
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                      AI
                    </span>
                  </button>
                </nav>
              </div>

              {/* Campus Directories Quick Stats */}
              <div className="pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground block font-poppins">
                    Campus Directory
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="p-1 rounded-lg bg-[#F9F9FB] border border-[#F1F1EF]">
                      <span className="text-xs font-bold text-[#111926] block">14</span>
                      <span className="text-[9px] text-muted-foreground truncate block">Batches</span>
                    </div>
                    <div className="p-1 rounded-lg bg-[#F9F9FB] border border-[#F1F1EF]">
                      <span className="text-xs font-bold text-[#111926] block">40</span>
                      <span className="text-[9px] text-muted-foreground truncate block">Faculty</span>
                    </div>
                    <div className="p-1 rounded-lg bg-[#F9F9FB] border border-[#F1F1EF]">
                      <span className="text-xs font-bold text-[#111926] block">27</span>
                      <span className="text-[9px] text-muted-foreground truncate block">Venues</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer: Perspective Switcher & Profile Card */}
          <div className="pt-3 border-t border-[#E5E7EB] space-y-3 shrink-0">
            {/* Perspective Role Switcher */}
            <div className="space-y-1.5">
              <span className="px-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
                Perspective Role
              </span>
              <div className="grid grid-cols-4 gap-1 text-[11px] font-poppins bg-white p-1 rounded-xl border border-[#E5E7EB]">
                <button
                  onClick={() => loginDemo('admin')}
                  className={`py-1 rounded-lg text-center transition cursor-pointer ${
                    user?.role === 'admin'
                      ? 'bg-primary text-white font-bold shadow-2xs'
                      : 'text-muted-foreground hover:text-[#111926]'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => loginDemo('department_coordinator')}
                  className={`py-1 rounded-lg text-center transition cursor-pointer ${
                    user?.role === 'department_coordinator'
                      ? 'bg-primary text-white font-bold shadow-2xs'
                      : 'text-muted-foreground hover:text-[#111926]'
                  }`}
                >
                  Coord
                </button>
                <button
                  onClick={() => loginDemo('faculty')}
                  className={`py-1 rounded-lg text-center transition cursor-pointer ${
                    user?.role === 'faculty'
                      ? 'bg-primary text-white font-bold shadow-2xs'
                      : 'text-muted-foreground hover:text-[#111926]'
                  }`}
                >
                  Faculty
                </button>
                <button
                  onClick={() => loginDemo('club')}
                  className={`py-1 rounded-lg text-center transition cursor-pointer ${
                    user?.role === 'club'
                      ? 'bg-primary text-white font-bold shadow-2xs'
                      : 'text-muted-foreground hover:text-[#111926]'
                  }`}
                >
                  Club
                </button>
              </div>
            </div>

            {/* User Profile Card */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-8 w-8 border border-[#E5E7EB] shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs font-poppins">
                    {getInitials(user?.role, user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-[#111926] leading-none truncate font-poppins">
                    {user?.name || 'Authorized User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="text-muted-foreground hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white">
        {/* Top Operational Header Bar */}
        <header className="h-14 border-b border-[#E5E7EB] bg-white px-4 lg:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 text-xs">
            {/* Sidebar Expand Button when collapsed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9F9FB] text-muted-foreground hover:text-[#111926] mr-1 transition cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <span className="text-muted-foreground font-poppins">CIT CampusOS</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-bold text-[#111926] font-poppins capitalize">
              {activeTab === 'timetable'
                ? 'Academic Timetable Matrix'
                : activeTab === 'exams'
                ? 'Midsem Examination Schedule'
                : activeTab === 'bookings'
                ? 'Spectra Week Bookings'
                : activeTab === 'disruptions'
                ? 'Disruption Repair Engine'
                : 'Dashboard Overview'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-bold font-poppins">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              0 Hard Violations · CP-SAT Online
            </div>

            {user?.role === 'admin' && (
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-white text-xs font-bold font-poppins text-muted-foreground hover:text-[#111926] px-3 py-1.5 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                title="Reset database to clean baseline"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Reset Baseline</span>
              </button>
            )}

            <button
              onClick={openCopilot}
              className="rounded-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 text-white shadow-xs font-bold font-poppins px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-white" />
              <span>Ask Copilot</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
};
