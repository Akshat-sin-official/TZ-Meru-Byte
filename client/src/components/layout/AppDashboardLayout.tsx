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
  ChevronLeft,
  ChevronRight,
  RotateCw,
  LogOut,
  Bot,
  Sparkles,
  Users,
  GraduationCap,
  Building2,
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
    <div className="flex h-screen overflow-hidden bg-notion-canvas text-notion-text font-sans antialiased selection:bg-[#E8DEEE] selection:text-[#37352F]">
      {/* Atelier Monolith Notion Sidebar */}
      <aside
        className={`sidebar-transition ${
          sidebarOpen ? 'w-64 border-r border-notion-border' : 'w-0 border-r-0'
        } bg-notion-sidebar flex flex-col shrink-0 z-30 select-none h-full relative overflow-hidden`}
      >
        <div className="w-64 flex flex-col h-full">
          {/* Top Workspace Selector & Collapse Toggle */}
          <div className="px-3.5 py-3 border-b border-notion-border/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-notion-hover transition text-notion-text group min-w-0">
              <div className="w-5 h-5 rounded bg-notion-hover border border-notion-border flex items-center justify-center text-xs shrink-0">
                🏛
              </div>
              <span className="text-xs font-semibold tracking-tight truncate">CIT Campus</span>
              <ChevronDown className="w-3 h-3 text-notion-tertiary group-hover:text-notion-secondary transition shrink-0" />
            </div>

            {/* Sidebar Toggle Button [ ◨ ] */}
            <button
              className="p-1.5 rounded-md hover:bg-notion-hover text-notion-secondary hover:text-notion-text transition"
              onClick={() => setSidebarOpen(false)}
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Nav Section */}
          <div className="p-2.5 flex-1 overflow-y-auto space-y-4 scrollbar-thin">
            {/* Quick Search / Copilot Bar */}
            <button
              onClick={openCopilot}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-notion-secondary hover:text-notion-text rounded-md hover:bg-notion-hover transition border border-transparent"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-notion-tertiary" />
                <span className="font-medium">Search &amp; Quick find</span>
              </div>
              <kbd className="text-[10px] font-mono bg-white border border-notion-border text-notion-tertiary px-1 rounded shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Schedules Section */}
            <div>
              <div className="px-2 text-[10px] font-medium tracking-wide uppercase text-notion-tertiary">
                Schedules
              </div>
              <nav className="mt-1 space-y-1">
                {/* Weekly Schedule */}
                <div
                  className={`rounded-md overflow-hidden transition-all ${
                    activeTab === 'timetable'
                      ? 'bg-white border border-notion-border shadow-2xs'
                      : 'hover:bg-notion-hover/50'
                  }`}
                >
                  <button
                    onClick={() => setActiveTab('timetable')}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-notion-text cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className={`w-3.5 h-3.5 ${activeTab === 'timetable' ? 'text-primary' : 'text-notion-secondary'}`} />
                      <span>Weekly Schedule</span>
                    </div>
                    <span className="text-[10px] text-notion-tertiary font-mono">Autumn</span>
                  </button>

                  {/* Sub-cohort list when active */}
                  {activeTab === 'timetable' && (
                    <div className="pl-4 pr-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-notion-border/40 bg-notion-subtle/30 text-[11px]">
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-white font-medium text-notion-text border border-notion-border/70 shadow-2xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">CSE — Yr 2 (Sec A)</span>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 rounded text-notion-secondary hover:text-notion-text hover:bg-notion-hover/70 transition">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-notion-tertiary/50 shrink-0" />
                          <span className="truncate">ECE — Year 3</span>
                        </div>
                        <span className="text-[9px] font-mono text-notion-tertiary">42h</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 rounded text-notion-secondary hover:text-notion-text hover:bg-notion-hover/70 transition">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-notion-tertiary/50 shrink-0" />
                          <span className="truncate">Mech — Year 1</span>
                        </div>
                        <span className="text-[9px] font-mono text-notion-tertiary">38h</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exam Timetable */}
                <button
                  onClick={() => setActiveTab('exams')}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                    activeTab === 'exams'
                      ? 'bg-white font-medium text-notion-text border border-notion-border shadow-2xs'
                      : 'text-notion-secondary hover:text-notion-text hover:bg-notion-hover'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === 'exams' ? 'text-primary' : 'text-notion-tertiary'}`} />
                    <span>Exam Timetable</span>
                  </div>
                  <span className="text-[10px] text-notion-tertiary font-mono">Midsem</span>
                </button>

                {/* Fest & Event Allocations */}
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                    activeTab === 'bookings'
                      ? 'bg-white font-medium text-notion-text border border-notion-border shadow-2xs'
                      : 'text-notion-secondary hover:text-notion-text hover:bg-notion-hover'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PartyPopper className={`w-3.5 h-3.5 ${activeTab === 'bookings' ? 'text-primary' : 'text-notion-tertiary'}`} />
                    <span>Fest &amp; Event Allocations</span>
                  </div>
                  <span className="text-[10px] text-notion-tertiary font-mono">Spectra</span>
                </button>
              </nav>
            </div>

            {/* Operations Section */}
            <div>
              <div className="px-2 text-[10px] font-medium tracking-wide uppercase text-notion-tertiary">
                Operations
              </div>
              <nav className="mt-1 space-y-0.5">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-white font-medium text-notion-text border border-notion-border shadow-2xs'
                      : 'text-notion-secondary hover:text-notion-text hover:bg-notion-hover'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className={`w-3.5 h-3.5 ${activeTab === 'dashboard' ? 'text-primary' : 'text-notion-tertiary'}`} />
                    <span>Campus Overview</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded">
                    Live
                  </span>
                </button>

                {(user?.role === 'admin' || user?.role === 'department_coordinator') && (
                  <button
                    onClick={() => setActiveTab('disruptions')}
                    className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                      activeTab === 'disruptions'
                        ? 'bg-white font-medium text-notion-text border border-notion-border shadow-2xs'
                        : 'text-notion-secondary hover:text-notion-text hover:bg-notion-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-3.5 h-3.5 ${activeTab === 'disruptions' ? 'text-amber-500' : 'text-notion-tertiary'}`} />
                      <span>Disruptions &amp; Repair</span>
                    </div>
                    <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1 rounded">
                      CP-SAT
                    </span>
                  </button>
                )}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="space-y-1.5 pt-0.5">
              <div className="px-2 text-[10px] font-medium tracking-wide uppercase text-notion-tertiary">
                Quick Actions
              </div>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                <button
                  onClick={openCopilot}
                  className="flex items-center justify-center gap-1.5 py-1 px-1.5 text-[11px] font-medium text-notion-text bg-white border border-notion-border rounded hover:bg-notion-hover transition shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Ask Copilot</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={handleResetData}
                    disabled={resetting}
                    className="flex items-center justify-center gap-1.5 py-1 px-1.5 text-[11px] font-medium text-notion-secondary hover:text-notion-text bg-white border border-notion-border rounded hover:bg-notion-hover transition shadow-2xs cursor-pointer"
                  >
                    <RotateCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
                    <span>Reset Data</span>
                  </button>
                )}
              </div>
            </div>

            {/* Directories */}
            <div>
              <div className="px-2 text-[10px] font-medium tracking-wide uppercase text-notion-tertiary">
                Directories
              </div>
              <nav className="mt-1 space-y-0.5">
                <div className="flex items-center justify-between px-2 py-1.5 text-xs text-notion-secondary hover:text-notion-text rounded-md hover:bg-notion-hover transition">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-notion-tertiary" />
                    <span>Cohorts &amp; Batches</span>
                  </div>
                  <span className="text-[10px] font-mono text-notion-tertiary">14</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 text-xs text-notion-secondary hover:text-notion-text rounded-md hover:bg-notion-hover transition">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-notion-tertiary" />
                    <span>Faculty Directory</span>
                  </div>
                  <span className="text-[10px] font-mono text-notion-tertiary">40</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 text-xs text-notion-secondary hover:text-notion-text rounded-md hover:bg-notion-hover transition">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-notion-tertiary" />
                    <span>Rooms &amp; Labs</span>
                  </div>
                  <span className="text-[10px] font-mono text-notion-tertiary">27</span>
                </div>
              </nav>
            </div>

            {/* Mini Embedded Month Calendar */}
            <div className="pt-1">
              <div className="bg-white border border-notion-border rounded-lg p-2.5 shadow-2xs">
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <span className="text-xs font-semibold text-notion-text tracking-tight flex items-center gap-1.5">
                    <span>October 2025</span>
                    <span className="text-[9px] font-normal text-notion-tertiary bg-notion-subtle px-1 py-0.5 rounded border border-notion-border">
                      Wk 42
                    </span>
                  </span>
                  <div className="flex items-center gap-1 text-notion-secondary">
                    <button className="p-0.5 hover:bg-notion-subtle text-notion-secondary hover:text-notion-text rounded transition" title="Previous month">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-0.5 hover:bg-notion-subtle text-notion-secondary hover:text-notion-text rounded transition" title="Next month">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-notion-tertiary mb-1">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                  <span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                  <span className="text-notion-tertiary/40 py-0.5">29</span>
                  <span className="text-notion-tertiary/40 py-0.5">30</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">1</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">2</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">3</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">4</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">5</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">6</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">7</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">8</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">9</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">10</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">11</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">12</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">13</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">14</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">15</span>
                  <span className="text-white bg-notion-text font-semibold py-0.5 rounded shadow-2xs cursor-pointer">16</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">17</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">18</span>
                  <span className="text-notion-text py-0.5 rounded hover:bg-notion-hover cursor-pointer transition">19</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Profile Pill & Stakeholder Perspective Switcher */}
          <div className="p-3 border-t border-notion-border/70 space-y-2.5 bg-notion-sidebar shrink-0">
            {/* Role Switcher Perspective Toggle */}
            <div className="flex items-center justify-between text-[11px] bg-notion-subtle p-0.5 rounded-md border border-notion-border">
              <button
                onClick={() => loginDemo('admin')}
                className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                  user?.role === 'admin'
                    ? 'bg-white text-notion-text font-medium shadow-2xs'
                    : 'text-notion-secondary hover:text-notion-text'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => loginDemo('department_coordinator')}
                className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                  user?.role === 'department_coordinator'
                    ? 'bg-white text-notion-text font-medium shadow-2xs'
                    : 'text-notion-secondary hover:text-notion-text'
                }`}
              >
                Coord
              </button>
              <button
                onClick={() => loginDemo('faculty')}
                className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                  user?.role === 'faculty'
                    ? 'bg-white text-notion-text font-medium shadow-2xs'
                    : 'text-notion-secondary hover:text-notion-text'
                }`}
              >
                Faculty
              </button>
              <button
                onClick={() => loginDemo('club')}
                className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                  user?.role === 'club'
                    ? 'bg-white text-notion-text font-medium shadow-2xs'
                    : 'text-notion-secondary hover:text-notion-text'
                }`}
              >
                Club
              </button>
            </div>

            {/* Profile Row */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 rounded-full bg-notion-subtle border border-notion-border flex items-center justify-center text-[10px] font-semibold text-notion-text shadow-2xs shrink-0">
                  {getInitials(user?.role, user?.name)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium text-notion-text truncate">
                    {user?.name || getRoleLabel(user?.role)}
                  </p>
                  <p className="text-[10px] text-notion-tertiary truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Autumn 2025 · CIT Campus</span>
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-notion-tertiary hover:text-red-600 p-1 rounded hover:bg-notion-hover transition cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-notion-canvas">
        {/* Top Breadcrumb & Quiet Actions Bar */}
        <header className="h-11 border-b border-notion-border px-4 lg:px-6 flex items-center justify-between shrink-0 bg-white z-20">
          <div className="flex items-center gap-2 text-xs">
            {/* Expand button if collapsed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 rounded hover:bg-notion-hover text-notion-secondary hover:text-notion-text mr-1 transition cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <span className="text-notion-secondary">CIT Campus</span>
            <span className="text-notion-tertiary">/</span>
            <span className="font-medium text-notion-text capitalize">
              {activeTab === 'timetable'
                ? 'Timetable Matrix'
                : activeTab === 'exams'
                ? 'Midsem Exam Schedule'
                : activeTab === 'bookings'
                ? 'Spectra Allocations'
                : activeTab === 'disruptions'
                ? 'Disruption Repair'
                : 'Campus Overview'}
            </span>
            <span className="text-[10px] text-notion-tertiary font-mono bg-notion-subtle px-1.5 py-0.5 rounded border border-notion-border hidden sm:inline-block">
              v2.4-opt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              0 Hard Violations · CP-SAT Online
            </span>

            {user?.role === 'admin' && (
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="text-xs font-medium text-notion-secondary hover:text-notion-text bg-white border border-notion-border px-2.5 py-1 rounded hover:bg-notion-hover transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Restore clean baseline"
              >
                <RotateCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Reset Baseline</span>
              </button>
            )}

            <button
              onClick={openCopilot}
              className="text-xs font-medium text-white bg-notion-text hover:bg-black px-2.5 py-1 rounded shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
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
