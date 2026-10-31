import React, { useState, useRef, useEffect } from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  PartyPopper,
  AlertTriangle,
  Bot,
  LogOut,
  Sparkles,
  ChevronDown,
  RotateCw,
  Search,
  PanelLeftClose,
  PanelLeft,
  Calendar,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Building,
  GraduationCap,
  Users2,
  Clock,
  Layers,
  Check,
  CalendarCheck,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { campusApi } from '@/services/api';
import { toast } from 'sonner';

export type CampusTab = 'dashboard' | 'timetable' | 'exams' | 'bookings' | 'disruptions';

interface AppDashboardLayoutProps {
  activeTab: CampusTab;
  setActiveTab: (tab: CampusTab) => void;
  openCopilot: () => void;
  onRefreshData?: () => void;
  selectedDay?: string | null;
  onSelectDay?: (day: string | null, date?: number) => void;
  selectedDate?: number | null;
  selectedCohort?: string;
  onSelectCohort?: (cohortId: string) => void;
  quickFilter?: 'all' | 'labs' | 'lectures' | 'tutorials';
  onSelectQuickFilter?: (qf: 'all' | 'labs' | 'lectures' | 'tutorials') => void;
  children: React.ReactNode;
}

export const AppDashboardLayout: React.FC<AppDashboardLayoutProps> = ({
  activeTab,
  setActiveTab,
  openCopilot,
  onRefreshData,
  selectedDay,
  onSelectDay,
  selectedDate,
  selectedCohort = 'CSE-2',
  onSelectCohort,
  quickFilter = 'all',
  onSelectQuickFilter,
  children,
}) => {
  const { user, logout, loginDemo } = useCampusAuth();
  const [resetting, setResetting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Dynamic Collapsible Sections
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [cohortMenuOpen, setCohortMenuOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState<'OCT' | 'NOV'>('OCT');

  const workspaceRef = useRef<HTMLDivElement>(null);

  // Close workspace dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResetData = async () => {
    setResetting(true);
    try {
      toast.info('Restoring database to baseline cit_public.json...');
      await campusApi.resetDemoData();
      toast.success('Clean baseline restored successfully (189 sessions, 0 clashes)');
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
        return 'Campus User';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'DA';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const cohorts = [
    { id: 'CSE-2', label: 'CSE — Yr 2', sub: 'Section A & B', hours: '40h' },
    { id: 'ECE-2', label: 'ECE — Year 2', sub: 'Signal & Systems', hours: '42h' },
    { id: 'ME-2', label: 'Mech — Year 2', sub: 'Thermodynamics', hours: '38h' },
    { id: 'Y1-A', label: 'First Year — Sec A', sub: 'Foundations', hours: '36h' },
  ];

  // Calendar Day of Week Calculation:
  // October 2027: Oct 1 is Friday (index 4 in M-T-W-T-F-S-S)
  const getOctDayOfWeek = (date: number): { day: string; isWeekend: boolean; label: string } => {
    const dayIndex = (date - 1 + 4) % 7; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    switch (dayIndex) {
      case 0:
        return { day: 'MON', isWeekend: false, label: 'Monday' };
      case 1:
        return { day: 'TUE', isWeekend: false, label: 'Tuesday' };
      case 2:
        return { day: 'WED', isWeekend: false, label: 'Wednesday' };
      case 3:
        return { day: 'THU', isWeekend: false, label: 'Thursday' };
      case 4:
        return { day: 'FRI', isWeekend: false, label: 'Friday' };
      case 5:
        return { day: 'SAT', isWeekend: true, label: 'Saturday' };
      default:
        return { day: 'SUN', isWeekend: true, label: 'Sunday' };
    }
  };

  // November 2027: Nov 1 is Monday (index 0)
  const getNovDayOfWeek = (date: number): { day: string; isWeekend: boolean; label: string } => {
    const dayIndex = (date - 1) % 7;
    switch (dayIndex) {
      case 0:
        return { day: 'MON', isWeekend: false, label: 'Monday' };
      case 1:
        return { day: 'TUE', isWeekend: false, label: 'Tuesday' };
      case 2:
        return { day: 'WED', isWeekend: false, label: 'Wednesday' };
      case 3:
        return { day: 'THU', isWeekend: false, label: 'Thursday' };
      case 4:
        return { day: 'FRI', isWeekend: false, label: 'Friday' };
      case 5:
        return { day: 'SAT', isWeekend: true, label: 'Saturday' };
      default:
        return { day: 'SUN', isWeekend: true, label: 'Sunday' };
    }
  };

  const handleDateClick = (date: number) => {
    if (calendarMonth === 'OCT') {
      const { day, isWeekend, label } = getOctDayOfWeek(date);
      if (isWeekend) {
        toast.info(
          `October ${date} is a weekend (${label})${
            date >= 22 && date <= 24 ? ' · Spectra Fest Weekend' : ''
          }. Focusing Friday schedule.`
        );
        onSelectDay?.('FRI', date);
      } else {
        toast.success(`Focused timetable on ${label}, October ${date}`);
        onSelectDay?.(day, date);
      }
    } else {
      const { day, isWeekend, label } = getNovDayOfWeek(date);
      if (isWeekend) {
        toast.info(`November ${date} is a weekend (${label}). Focusing Friday schedule.`);
        onSelectDay?.('FRI', date);
      } else {
        toast.success(`Focused timetable on ${label}, November ${date}`);
        onSelectDay?.(day, date);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F6] font-sans antialiased text-[#1E293B]">
      {/* Human-Crafted Institutional Workspace Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 z-30 select-none h-full relative transition-all duration-200 ease-in-out border-r border-[#EAE8E3] bg-[#FBFBFA] ${
          sidebarCollapsed ? 'w-16' : 'w-[276px]'
        }`}
      >
        {/* 1. Top Workspace Selector with Dynamic Dropdown */}
        <div className="px-3.5 py-3 border-b border-[#EAE8E3] flex items-center justify-between relative" ref={workspaceRef}>
          {!sidebarCollapsed ? (
            <div
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#F1F1EF] transition cursor-pointer group min-w-0"
              title="Workspace Menu & Semester Selector"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 text-amber-300 flex items-center justify-center text-xs flex-shrink-0 shadow-sm border border-slate-700/40">
                🏛️
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-bold tracking-tight text-[#0F172A] group-hover:text-primary transition truncate">
                  CIT CampusOS
                </span>
                <span className="text-[10px] text-[#64748B] font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Autumn 2027
                </span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#94A3B8] group-hover:text-[#475569] transition shrink-0 ml-0.5 ${
                  workspaceMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          ) : (
            <div
              onClick={() => setSidebarCollapsed(false)}
              className="mx-auto w-7 h-7 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 text-amber-300 flex items-center justify-center text-xs shadow-sm cursor-pointer"
              title="Expand CIT CampusOS"
            >
              🏛️
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-[#F1F1EF] text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>

          {/* Dynamic Workspace Popover Menu */}
          {workspaceMenuOpen && !sidebarCollapsed && (
            <div className="absolute left-3.5 top-14 w-[252px] bg-white rounded-xl border border-[#E2E8F0] shadow-xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Academic Terms
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setWorkspaceMenuOpen(false)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50/70 text-emerald-950 border border-emerald-200/80 text-xs font-semibold text-left transition"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Autumn 2027</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded font-bold">
                    Active
                  </span>
                </button>
                <button
                  onClick={() => {
                    toast.info('Spring 2028 is currently in read-only planning cycle.');
                    setWorkspaceMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-[#64748B] text-xs font-medium text-left transition cursor-pointer"
                >
                  <span className="pl-5">Spring 2028</span>
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                    Draft
                  </span>
                </button>
              </div>

              <div className="border-t border-[#F1F5F9] pt-2 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  System & Engine
                </div>
                <div className="px-2 py-1 text-[11px] text-[#475569] flex items-center justify-between">
                  <span>Solver</span>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                    CP-SAT v9.8
                  </span>
                </div>
                <div className="px-2 py-1 text-[11px] text-[#475569] flex items-center justify-between">
                  <span>Sessions</span>
                  <span className="font-mono text-[10px] text-slate-600">189 Scheduled</span>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="border-t border-[#F1F5F9] pt-1.5">
                  <button
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      handleResetData();
                    }}
                    disabled={resetting}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                    <span>Reset to cit_public.json</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Nav Section */}
        <div className="p-3 flex-1 overflow-y-auto space-y-4 scrollbar-none">
          {/* Quick Search & Copilot Command Pill */}
          {!sidebarCollapsed ? (
            <button
              onClick={openCopilot}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#64748B] hover:text-[#0F172A] rounded-xl bg-white hover:bg-[#F8FAFC] transition border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-[#94A3B8] group-hover:text-primary transition" />
                <span className="text-[11.5px] font-medium">Quick find or ask AI...</span>
              </div>
              <kbd className="text-[10px] font-mono bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B] px-1.5 py-0.5 rounded shadow-2xs font-semibold">
                ⌘K
              </kbd>
            </button>
          ) : (
            <button
              onClick={openCopilot}
              className="w-full flex items-center justify-center py-2 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-[#F1F1EF] transition cursor-pointer"
              title="Search & Copilot (⌘K)"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Nav Section: Core Schedules */}
          <div>
            {!sidebarCollapsed && (
              <div className="px-2 text-[10px] font-bold tracking-wider uppercase text-[#94A3B8] mb-1.5 flex items-center justify-between">
                <span>Schedules & Operations</span>
                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  Live
                </span>
              </div>
            )}
            <nav className="space-y-1.5">
              {/* Executive Overview */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white font-bold text-[#0F172A] border border-[#CBD5E1] shadow-[0_2px_6px_rgba(0,0,0,0.05)] border-l-4 border-l-indigo-600'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/80 border border-transparent'
                }`}
                title="Overview Dashboard"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      activeTab === 'dashboard'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-indigo-50/70 text-indigo-600 border border-indigo-100/60'
                    }`}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                  </div>
                  {!sidebarCollapsed && <span>Dashboard Overview</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                    Home
                  </span>
                )}
              </button>

              {/* Weekly Timetable with Interactive Sub-Cohort Tree */}
              <div
                className={`rounded-xl transition-all ${
                  activeTab === 'timetable'
                    ? 'bg-white border border-[#CBD5E1] shadow-[0_2px_6px_rgba(0,0,0,0.05)] border-l-4 border-l-sky-600 overflow-hidden'
                    : 'hover:bg-white/80'
                }`}
              >
                <button
                  onClick={() => {
                    setActiveTab('timetable');
                    setCohortMenuOpen(true);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs transition cursor-pointer ${
                    activeTab === 'timetable'
                      ? 'font-bold text-[#0F172A]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                  title="Weekly Academic Timetable"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        activeTab === 'timetable'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-sky-50/70 text-sky-600 border border-sky-100/60'
                      }`}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                    </div>
                    {!sidebarCollapsed && <span>Weekly Timetable</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-bold">
                        189
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setCohortMenuOpen(!cohortMenuOpen);
                        }}
                        className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                      >
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${cohortMenuOpen ? 'rotate-180' : ''}`}
                        />
                      </span>
                    </div>
                  )}
                </button>

                {/* Sub-cohort list when expanded */}
                {!sidebarCollapsed && cohortMenuOpen && (
                  <div className="pl-4 pr-2 pb-2 pt-1 space-y-1 border-t border-[#F1F5F9] bg-[#FAF9F5] text-[11px]">
                    {cohorts.map((cohort) => {
                      const isSelected = selectedCohort === cohort.id;
                      return (
                        <button
                          key={cohort.id}
                          onClick={() => onSelectCohort?.(cohort.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition text-left cursor-pointer ${
                            isSelected
                              ? 'bg-white font-bold text-sky-950 border border-sky-200 shadow-2xs'
                              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-sky-600 ring-2 ring-sky-300' : 'bg-[#94A3B8]'
                              }`}
                            />
                            <div className="flex flex-col truncate">
                              <span className="truncate leading-tight">{cohort.label}</span>
                              <span className="text-[9px] text-slate-400 font-mono leading-none">
                                {cohort.sub}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              isSelected
                                ? 'text-sky-700 bg-sky-50 border border-sky-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {cohort.hours}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Midsem Examinations */}
              <button
                onClick={() => setActiveTab('exams')}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition-all cursor-pointer ${
                  activeTab === 'exams'
                    ? 'bg-white font-bold text-[#0F172A] border border-[#CBD5E1] shadow-[0_2px_6px_rgba(0,0,0,0.05)] border-l-4 border-l-amber-500'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/80 border border-transparent'
                }`}
                title="Midsem Examinations"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      activeTab === 'exams'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-amber-50/70 text-amber-600 border border-amber-200/60'
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                  </div>
                  {!sidebarCollapsed && <span>Midsem Exam Schedule</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">
                    Oct 14-20
                  </span>
                )}
              </button>

              {/* Spectra Week Bookings */}
              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition-all cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'bg-white font-bold text-[#0F172A] border border-[#CBD5E1] shadow-[0_2px_6px_rgba(0,0,0,0.05)] border-l-4 border-l-fuchsia-600'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/80 border border-transparent'
                }`}
                title="Spectra Week Allocations"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      activeTab === 'bookings'
                        ? 'bg-fuchsia-100 text-fuchsia-700'
                        : 'bg-fuchsia-50/70 text-fuchsia-600 border border-fuchsia-200/60'
                    }`}
                  >
                    <PartyPopper className="h-3.5 w-3.5" />
                  </div>
                  {!sidebarCollapsed && <span>Spectra Fest Bookings</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[10px] font-mono text-fuchsia-800 bg-fuchsia-50 px-1.5 py-0.5 rounded border border-fuchsia-200 font-bold">
                    Oct 22-24
                  </span>
                )}
              </button>

              {/* Disruption Recovery */}
              {(user?.role === 'admin' || user?.role === 'department_coordinator') && (
                <button
                  onClick={() => setActiveTab('disruptions')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition-all cursor-pointer ${
                    activeTab === 'disruptions'
                      ? 'bg-white font-bold text-[#0F172A] border border-[#CBD5E1] shadow-[0_2px_6px_rgba(0,0,0,0.05)] border-l-4 border-l-rose-500'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/80 border border-transparent'
                  }`}
                  title="Disruptions & Emergency Repair"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        activeTab === 'disruptions'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-rose-50/70 text-rose-600 border border-rose-200/60'
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    {!sidebarCollapsed && <span>Disruption Recovery</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                      0 Clashes
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* 2. Dynamic Quick View Filters Accordion (Shows on Timetable & Bookings) */}
          {!sidebarCollapsed && (activeTab === 'timetable' || activeTab === 'bookings') && (
            <div className="pt-2 border-t border-[#EAE8E3] animate-in fade-in duration-200">
              <div className="px-2 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-[#94A3B8] mb-1.5">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3 h-3 text-[#94A3B8]" />
                  <span>Session Filters</span>
                </div>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {filtersOpen && (
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  <button
                    onClick={() => onSelectQuickFilter?.('all')}
                    className={`px-2 py-1 text-[11px] rounded-lg border transition flex items-center justify-center gap-1.5 cursor-pointer font-medium ${
                      quickFilter === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <span>All</span>
                  </button>
                  <button
                    onClick={() => onSelectQuickFilter?.('labs')}
                    className={`px-2 py-1 text-[11px] rounded-lg border transition flex items-center justify-center gap-1.5 cursor-pointer font-medium ${
                      quickFilter === 'labs'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-2xs font-bold'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Labs Only</span>
                  </button>
                  <button
                    onClick={() => onSelectQuickFilter?.('lectures')}
                    className={`px-2 py-1 text-[11px] rounded-lg border transition flex items-center justify-center gap-1.5 cursor-pointer font-medium ${
                      quickFilter === 'lectures'
                        ? 'bg-sky-700 text-white border-sky-700 shadow-2xs font-bold'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span>Lectures</span>
                  </button>
                  <button
                    onClick={() => onSelectQuickFilter?.('tutorials')}
                    className={`px-2 py-1 text-[11px] rounded-lg border transition flex items-center justify-center gap-1.5 cursor-pointer font-medium ${
                      quickFilter === 'tutorials'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-bold'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Tutorials</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Dynamic Interactive Month Calendar Widget */}
          {!sidebarCollapsed && (
            <div className="pt-2 border-t border-[#EAE8E3]">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-xs">
                {/* Calendar Header with Month Navigation & Toggle */}
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-[#0F172A] tracking-tight">
                      {calendarMonth === 'OCT' ? 'October 2027' : 'November 2027'}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                      {calendarMonth === 'OCT' ? 'Wk 42' : 'Wk 45'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#64748B]">
                    <button
                      onClick={() => setCalendarMonth('OCT')}
                      className={`p-1 rounded hover:bg-slate-100 transition cursor-pointer ${
                        calendarMonth === 'OCT' ? 'text-indigo-600 font-bold' : 'text-slate-400'
                      }`}
                      title="Previous: October 2027"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setCalendarMonth('NOV')}
                      className={`p-1 rounded hover:bg-slate-100 transition cursor-pointer ${
                        calendarMonth === 'NOV' ? 'text-indigo-600 font-bold' : 'text-slate-400'
                      }`}
                      title="Next: November 2027"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setCalendarOpen(!calendarOpen)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer ml-0.5"
                      title={calendarOpen ? 'Minimize Calendar' : 'Expand Calendar'}
                    >
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${calendarOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {calendarOpen && (
                  <>
                    {/* Day Headers (M T W T F S S) */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#94A3B8] mb-1.5">
                      <span>M</span>
                      <span>T</span>
                      <span>W</span>
                      <span>T</span>
                      <span>F</span>
                      <span className="text-rose-400">S</span>
                      <span className="text-rose-400">S</span>
                    </div>

                    {/* October 2027 Grid */}
                    {calendarMonth === 'OCT' ? (
                      <div className="grid grid-cols-7 gap-1 text-center text-[10.5px]">
                        {/* Days from Sept: Mon-Thu 27, 28, 29, 30 */}
                        <span className="text-slate-300 py-1">27</span>
                        <span className="text-slate-300 py-1">28</span>
                        <span className="text-slate-300 py-1">29</span>
                        <span className="text-slate-300 py-1">30</span>

                        {/* Oct 1 to 31 */}
                        {[...Array(31)].map((_, i) => {
                          const date = i + 1;
                          const isSelected = selectedDate === date;
                          const isMidsem = date >= 14 && date <= 20;
                          const isSpectra = date >= 22 && date <= 24;

                          return (
                            <button
                              key={date}
                              onClick={() => handleDateClick(date)}
                              title={
                                isSpectra
                                  ? `Oct ${date}: Spectra Fest`
                                  : isMidsem
                                  ? `Oct ${date}: Midsem Exam Period`
                                  : `Oct ${date}: Click to filter timetable to this day`
                              }
                              className={`py-1 rounded-md transition-all cursor-pointer select-none font-medium ${
                                isSelected
                                  ? 'bg-[#0F172A] text-white font-bold ring-2 ring-indigo-400/80 shadow-xs scale-105 z-10'
                                  : isSpectra
                                  ? 'bg-purple-100 text-purple-900 font-bold hover:bg-purple-200 border border-purple-200'
                                  : isMidsem
                                  ? 'bg-amber-100 text-amber-900 font-bold hover:bg-amber-200 border border-amber-200'
                                  : 'text-[#334155] hover:bg-slate-100 hover:text-[#0F172A]'
                              }`}
                            >
                              {date}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* November 2027 Grid (Nov 1 is Monday) */
                      <div className="grid grid-cols-7 gap-1 text-center text-[10.5px]">
                        {[...Array(30)].map((_, i) => {
                          const date = i + 1;
                          return (
                            <button
                              key={date}
                              onClick={() => handleDateClick(date)}
                              className="py-1 rounded-md transition-all cursor-pointer select-none text-[#334155] hover:bg-slate-100 hover:text-[#0F172A] font-medium"
                            >
                              {date}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Interactive Legend & Quick Reset */}
                    <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[9.5px]">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-amber-800 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Midsem
                        </span>
                        <span className="flex items-center gap-1 text-purple-800 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          Spectra
                        </span>
                      </div>
                      {selectedDay && (
                        <button
                          onClick={() => onSelectDay?.(null)}
                          className="text-indigo-600 hover:text-indigo-900 font-bold underline cursor-pointer"
                        >
                          Clear Day
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Role Switcher & Profile Card */}
        <div className="p-3 border-t border-[#EAE8E3] space-y-2.5 bg-[#FBFBFA] flex-shrink-0">
          {!sidebarCollapsed ? (
            <>
              {/* Segmented Desktop Role Perspective Switcher */}
              <div className="space-y-1">
                <span className="px-1 text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Switch Role Perspective
                </span>
                <div className="flex items-center justify-between text-[11px] bg-[#F1F5F9] p-0.5 rounded-xl border border-[#E2E8F0]">
                  <button
                    onClick={() => loginDemo('admin')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer font-medium ${
                      user?.role === 'admin'
                        ? 'bg-white text-[#0F172A] font-bold shadow-xs border border-[#CBD5E1]'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                    title="Switch to Admin (Dean Office)"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => loginDemo('department_coordinator')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer font-medium ${
                      user?.role === 'department_coordinator'
                        ? 'bg-white text-[#0F172A] font-bold shadow-xs border border-[#CBD5E1]'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                    title="Switch to CSE Dept Coordinator"
                  >
                    Coord
                  </button>
                  <button
                    onClick={() => loginDemo('faculty')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer font-medium ${
                      user?.role === 'faculty'
                        ? 'bg-white text-[#0F172A] font-bold shadow-xs border border-[#CBD5E1]'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                    title="Switch to Faculty (Dr. S. Rath)"
                  >
                    Faculty
                  </button>
                  <button
                    onClick={() => loginDemo('club')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer font-medium ${
                      user?.role === 'club'
                        ? 'bg-white text-[#0F172A] font-bold shadow-xs border border-[#CBD5E1]'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                    title="Switch to Club Lead"
                  >
                    Club
                  </button>
                </div>
              </div>

              {/* User Profile Card */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0 ring-2 ring-indigo-200">
                    {getInitials(user?.name)}
                  </div>
                  <div className="truncate min-w-0 text-left">
                    <p className="text-xs font-bold text-[#0F172A] truncate">
                      {user?.name || getRoleLabel(user?.role)}
                    </p>
                    <p className="text-[10px] text-[#64748B] truncate flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {getRoleLabel(user?.role)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="text-[#94A3B8] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-sm cursor-pointer"
                title={`${user?.name} (${getRoleLabel(user?.role)})`}
              >
                {getInitials(user?.name)}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="text-[#94A3B8] hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full overflow-y-auto scrollbar-thin">
        {/* Top Operational Header Bar */}
        <header className="h-14 border-b border-[#EAE8E3] bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B] font-semibold">CIT CampusOS</span>
            <span className="text-[#CBD5E1]">/</span>
            <span className="font-bold text-[#0F172A] capitalize">
              {activeTab === 'timetable'
                ? 'Weekly Timetable'
                : activeTab === 'exams'
                ? 'Midsem Examinations'
                : activeTab === 'bookings'
                ? 'Spectra Fest Allocations'
                : activeTab === 'disruptions'
                ? 'Disruption Recovery'
                : 'Executive Overview'}
            </span>
            {selectedDay && (
              <>
                <span className="text-[#CBD5E1]">/</span>
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-bold font-mono text-[11px]">
                  Focused on {selectedDay}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              0 Hard Violations · CP-SAT Online
            </div>

            {user?.role === 'admin' && (
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="rounded-lg border border-[#E2E8F0] bg-[#FAF9F5] hover:bg-white text-xs font-semibold text-[#475569] hover:text-[#0F172A] px-3 py-1.5 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                title="Restore default cit_public baseline"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset Data</span>
              </button>
            )}

            <button
              onClick={openCopilot}
              className="rounded-lg bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white shadow-xs font-semibold px-3.5 py-1.5 text-xs flex items-center gap-2 cursor-pointer transition border border-slate-800"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-300" />
              <span>Ask Copilot</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
