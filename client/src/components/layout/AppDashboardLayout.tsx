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
  ChevronDown,
  RotateCw,
  Search,
  PanelLeftClose,
  PanelLeft,
  Calendar,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Check,
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
      toast.info('Restoring baseline...');
      await campusApi.resetDemoData();
      toast.success('Clean baseline restored');
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
    { id: 'CSE-2', label: 'CSE — Yr 2', sub: 'Sec A & B', hours: '40h' },
    { id: 'ECE-2', label: 'ECE — Year 2', sub: 'Sec A', hours: '42h' },
    { id: 'ME-2', label: 'Mech — Year 2', sub: 'Sec A', hours: '38h' },
    { id: 'Y1-A', label: 'First Year', sub: 'Sec A', hours: '36h' },
  ];

  // Calendar Day Calculation (Oct 1, 2027 is Friday)
  const getOctDayOfWeek = (date: number): { day: string; isWeekend: boolean; label: string } => {
    const dayIndex = (date - 1 + 4) % 7;
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
        toast.info(`Oct ${date} is a weekend (${label}). Highlighting Friday.`);
        onSelectDay?.('FRI', date);
      } else {
        toast.success(`Showing ${label}, Oct ${date}`);
        onSelectDay?.(day, date);
      }
    } else {
      const { day, isWeekend, label } = getNovDayOfWeek(date);
      if (isWeekend) {
        toast.info(`Nov ${date} is a weekend (${label}). Highlighting Friday.`);
        onSelectDay?.('FRI', date);
      } else {
        toast.success(`Showing ${label}, Nov ${date}`);
        onSelectDay?.(day, date);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F6] font-sans antialiased text-[#18181B]">
      {/* Minimal Notion/Linear Styled Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 z-30 select-none h-full relative transition-all duration-200 ease-in-out border-r border-[#E5E7EB] bg-[#FBFBFA] ${
          sidebarCollapsed ? 'w-14' : 'w-[260px]'
        }`}
      >
        {/* Workspace Header */}
        <div className="px-3 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between relative" ref={workspaceRef}>
          {!sidebarCollapsed ? (
            <div
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-[#F4F4F5] transition cursor-pointer group min-w-0"
              title="Workspace Menu"
            >
              <div className="w-5 h-5 rounded bg-white border border-[#E5E7EB] flex items-center justify-center text-[10px] font-semibold text-[#18181B] shrink-0 shadow-2xs">
                🏛
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-semibold tracking-tight text-[#18181B] truncate">
                  CIT CampusOS
                </span>
                <span className="text-[10px] text-[#71717A] font-mono leading-none">
                  Autumn 2027
                </span>
              </div>
              <ChevronDown
                className={`h-3 w-3 text-[#A1A1AA] group-hover:text-[#18181B] transition shrink-0 ml-0.5 ${
                  workspaceMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          ) : (
            <div
              onClick={() => setSidebarCollapsed(false)}
              className="mx-auto w-6 h-6 rounded bg-white border border-[#E5E7EB] flex items-center justify-center text-[10px] font-semibold text-[#18181B] cursor-pointer shadow-2xs"
            >
              🏛
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-md hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B] transition cursor-pointer"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Minimal Workspace Popover Menu */}
          {workspaceMenuOpen && !sidebarCollapsed && (
            <div className="absolute left-3 top-12 w-[236px] bg-white rounded-lg border border-[#E5E7EB] shadow-lg z-50 p-1.5 space-y-1.5">
              <div className="px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[#A1A1AA]">
                Academic Terms
              </div>
              <button
                onClick={() => setWorkspaceMenuOpen(false)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-[#F4F4F5] text-xs font-medium text-[#18181B] text-left transition"
              >
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#18181B]" />
                  <span>Autumn 2027</span>
                </div>
                <span className="text-[9px] font-mono text-[#71717A]">Active</span>
              </button>
              <button
                onClick={() => {
                  toast.info('Spring 2028 is in draft cycle.');
                  setWorkspaceMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#F4F4F5] text-xs text-[#71717A] hover:text-[#18181B] text-left transition cursor-pointer"
              >
                <span className="pl-4.5">Spring 2028</span>
                <span className="text-[9px] font-mono text-[#A1A1AA]">Draft</span>
              </button>

              <div className="border-t border-[#F4F4F5] pt-1">
                <div className="px-2 py-1 text-[10px] text-[#71717A] flex items-center justify-between">
                  <span>Engine</span>
                  <span className="font-mono text-[9px] text-[#71717A]">CP-SAT 9.8</span>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="border-t border-[#F4F4F5] pt-1">
                  <button
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      handleResetData();
                    }}
                    disabled={resetting}
                    className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition cursor-pointer"
                  >
                    <RotateCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
                    <span>Reset Baseline</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Nav Section */}
        <div className="p-2 flex-1 overflow-y-auto space-y-3 scrollbar-none">
          {/* Quick Search */}
          {!sidebarCollapsed ? (
            <button
              onClick={openCopilot}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-[#71717A] hover:text-[#18181B] rounded-md hover:bg-[#F4F4F5] transition border border-transparent hover:border-[#E5E7EB] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-[#A1A1AA]" />
                <span className="text-[11.5px]">Quick find...</span>
              </div>
              <kbd className="text-[10px] font-mono bg-white border border-[#E5E7EB] text-[#71717A] px-1 py-0.2 rounded shadow-2xs">
                ⌘K
              </kbd>
            </button>
          ) : (
            <button
              onClick={openCopilot}
              className="w-full flex items-center justify-center py-1.5 text-[#71717A] hover:text-[#18181B] rounded-md hover:bg-[#F4F4F5] transition cursor-pointer"
              title="Search (⌘K)"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Nav: Schedules */}
          <div>
            {!sidebarCollapsed && (
              <div className="px-2 text-[9.5px] font-medium tracking-wider uppercase text-[#A1A1AA] mb-1">
                Schedules
              </div>
            )}
            <nav className="space-y-0.5">
              {/* Overview */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white font-medium text-[#18181B] border border-[#E5E7EB] shadow-2xs'
                    : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] border border-transparent'
                }`}
                title="Overview Dashboard"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-3.5 w-3.5 text-[#71717A]" />
                  {!sidebarCollapsed && <span>Overview</span>}
                </div>
              </button>

              {/* Weekly Timetable */}
              <div
                className={`rounded-md transition-all ${
                  activeTab === 'timetable'
                    ? 'bg-white border border-[#E5E7EB] shadow-2xs overflow-hidden'
                    : ''
                }`}
              >
                <button
                  onClick={() => {
                    setActiveTab('timetable');
                    setCohortMenuOpen(true);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs transition cursor-pointer ${
                    activeTab === 'timetable'
                      ? 'font-medium text-[#18181B]'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                  }`}
                  title="Weekly Timetable"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-[#71717A]" />
                    {!sidebarCollapsed && <span>Weekly Timetable</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-[#71717A]">189</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setCohortMenuOpen(!cohortMenuOpen);
                        }}
                        className="p-0.5 rounded hover:bg-[#F4F4F5] text-[#A1A1AA] transition"
                      >
                        <ChevronDown
                          className={`h-2.5 w-2.5 transition-transform ${cohortMenuOpen ? 'rotate-180' : ''}`}
                        />
                      </span>
                    </div>
                  )}
                </button>

                {/* Sub-cohort list */}
                {!sidebarCollapsed && cohortMenuOpen && (
                  <div className="pl-4 pr-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-[#F4F4F5] bg-[#FBFBFA] text-[11px]">
                    {cohorts.map((cohort) => {
                      const isSelected = selectedCohort === cohort.id;
                      return (
                        <button
                          key={cohort.id}
                          onClick={() => onSelectCohort?.(cohort.id)}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded transition text-left cursor-pointer ${
                            isSelected
                              ? 'bg-white font-medium text-[#18181B] border border-[#E5E7EB] shadow-2xs'
                              : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                          }`}
                        >
                          <span className="truncate">{cohort.label}</span>
                          <span className="text-[9px] font-mono text-[#A1A1AA]">{cohort.hours}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Exams */}
              <button
                onClick={() => setActiveTab('exams')}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                  activeTab === 'exams'
                    ? 'bg-white font-medium text-[#18181B] border border-[#E5E7EB] shadow-2xs'
                    : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] border border-transparent'
                }`}
                title="Exam Schedule"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#71717A]" />
                  {!sidebarCollapsed && <span>Exam Timetable</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[10px] font-mono text-[#71717A]">Midsem</span>
                )}
              </button>

              {/* Spectra Fest */}
              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'bg-white font-medium text-[#18181B] border border-[#E5E7EB] shadow-2xs'
                    : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] border border-transparent'
                }`}
                title="Fest Bookings"
              >
                <div className="flex items-center gap-2">
                  <PartyPopper className="h-3.5 w-3.5 text-[#71717A]" />
                  {!sidebarCollapsed && <span>Spectra Bookings</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[10px] font-mono text-[#71717A]">Oct 22-24</span>
                )}
              </button>

              {/* Disruption Recovery */}
              {(user?.role === 'admin' || user?.role === 'department_coordinator') && (
                <button
                  onClick={() => setActiveTab('disruptions')}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                    activeTab === 'disruptions'
                      ? 'bg-white font-medium text-[#18181B] border border-[#E5E7EB] shadow-2xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] border border-transparent'
                  }`}
                  title="Disruptions & Recovery"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#71717A]" />
                    {!sidebarCollapsed && <span>Disruptions</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-[9px] font-mono text-[#71717A]">0 Clashes</span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Quick Filters (only on timetable or bookings) */}
          {!sidebarCollapsed && (activeTab === 'timetable' || activeTab === 'bookings') && (
            <div className="pt-2 border-t border-[#E5E7EB]">
              <div className="px-2 flex items-center justify-between text-[9.5px] font-medium tracking-wider uppercase text-[#A1A1AA] mb-1">
                <span>View Filters</span>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="text-[#A1A1AA] hover:text-[#18181B] p-0.5 cursor-pointer"
                >
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {filtersOpen && (
                <div className="grid grid-cols-2 gap-1 px-0.5">
                  {(['all', 'labs', 'lectures', 'tutorials'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => onSelectQuickFilter?.(filterKey)}
                      className={`px-2 py-1 text-[11px] rounded border transition text-center capitalize cursor-pointer ${
                        quickFilter === filterKey
                          ? 'bg-white text-[#18181B] border-[#E5E7EB] font-medium shadow-2xs'
                          : 'bg-transparent border-transparent text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                      }`}
                    >
                      {filterKey === 'all' ? 'All Slots' : filterKey}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interactive Mini Calendar */}
          {!sidebarCollapsed && (
            <div className="pt-2 border-t border-[#E5E7EB]">
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-2.5 shadow-2xs">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#18181B]">
                      {calendarMonth === 'OCT' ? 'October 2027' : 'November 2027'}
                    </span>
                    <span className="text-[9px] font-mono text-[#71717A]">
                      {calendarMonth === 'OCT' ? 'Wk 42' : 'Wk 45'}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[#71717A]">
                    <button
                      onClick={() => setCalendarMonth('OCT')}
                      className={`p-0.5 rounded hover:bg-[#F4F4F5] transition cursor-pointer ${
                        calendarMonth === 'OCT' ? 'text-[#18181B]' : 'text-[#A1A1AA]'
                      }`}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setCalendarMonth('NOV')}
                      className={`p-0.5 rounded hover:bg-[#F4F4F5] transition cursor-pointer ${
                        calendarMonth === 'NOV' ? 'text-[#18181B]' : 'text-[#A1A1AA]'
                      }`}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setCalendarOpen(!calendarOpen)}
                      className="p-0.5 rounded hover:bg-[#F4F4F5] text-[#A1A1AA] hover:text-[#18181B] transition cursor-pointer ml-1"
                    >
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${calendarOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {calendarOpen && (
                  <>
                    <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-[#A1A1AA] mb-1">
                      <span>M</span>
                      <span>T</span>
                      <span>W</span>
                      <span>T</span>
                      <span>F</span>
                      <span>S</span>
                      <span>S</span>
                    </div>

                    {calendarMonth === 'OCT' ? (
                      <div className="grid grid-cols-7 gap-0.5 text-center text-[10.5px]">
                        <span className="text-[#D4D4D8] py-0.5">27</span>
                        <span className="text-[#D4D4D8] py-0.5">28</span>
                        <span className="text-[#D4D4D8] py-0.5">29</span>
                        <span className="text-[#D4D4D8] py-0.5">30</span>

                        {[...Array(31)].map((_, i) => {
                          const date = i + 1;
                          const isSelected = selectedDate === date;
                          const isMidsem = date >= 14 && date <= 20;
                          const isSpectra = date >= 22 && date <= 24;

                          return (
                            <button
                              key={date}
                              onClick={() => handleDateClick(date)}
                              className={`py-0.5 rounded transition cursor-pointer select-none relative ${
                                isSelected
                                  ? 'bg-[#18181B] text-white font-medium shadow-2xs'
                                  : 'text-[#18181B] hover:bg-[#F4F4F5]'
                              }`}
                            >
                              <span>{date}</span>
                              {(isMidsem || isSpectra) && !isSelected && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-0.5 rounded-full bg-[#71717A]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 gap-0.5 text-center text-[10.5px]">
                        {[...Array(30)].map((_, i) => {
                          const date = i + 1;
                          return (
                            <button
                              key={date}
                              onClick={() => handleDateClick(date)}
                              className="py-0.5 rounded transition cursor-pointer select-none text-[#18181B] hover:bg-[#F4F4F5]"
                            >
                              {date}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedDay && (
                      <div className="mt-2 pt-1.5 border-t border-[#F4F4F5] flex items-center justify-between text-[10px]">
                        <span className="text-[#71717A]">
                          Filtered: <strong className="text-[#18181B]">{selectedDay}</strong>
                        </span>
                        <button
                          onClick={() => onSelectDay?.(null)}
                          className="text-[#71717A] hover:text-[#18181B] underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Segmented Role Switcher & Profile */}
        <div className="p-2.5 border-t border-[#E5E7EB] space-y-2 bg-[#FBFBFA] shrink-0">
          {!sidebarCollapsed ? (
            <>
              {/* Minimal Segmented Role Control */}
              <div className="flex items-center justify-between text-[11px] bg-[#F4F4F5] p-0.5 rounded-md border border-[#E5E7EB]">
                <button
                  onClick={() => loginDemo('admin')}
                  className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                    user?.role === 'admin'
                      ? 'bg-white text-[#18181B] font-medium shadow-2xs'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => loginDemo('department_coordinator')}
                  className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                    user?.role === 'department_coordinator'
                      ? 'bg-white text-[#18181B] font-medium shadow-2xs'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  Coord
                </button>
                <button
                  onClick={() => loginDemo('faculty')}
                  className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                    user?.role === 'faculty'
                      ? 'bg-white text-[#18181B] font-medium shadow-2xs'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  Faculty
                </button>
                <button
                  onClick={() => loginDemo('club')}
                  className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                    user?.role === 'club'
                      ? 'bg-white text-[#18181B] font-medium shadow-2xs'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  Club
                </button>
              </div>

              {/* User Profile Card */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[10px] font-semibold text-[#18181B] shrink-0 shadow-2xs">
                    {getInitials(user?.name)}
                  </div>
                  <div className="truncate min-w-0 text-left">
                    <p className="text-xs font-medium text-[#18181B] truncate">
                      {user?.name || getRoleLabel(user?.role)}
                    </p>
                    <p className="text-[10px] text-[#71717A] truncate">
                      {getRoleLabel(user?.role)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="text-[#71717A] hover:text-[#18181B] p-1 rounded hover:bg-[#F4F4F5] transition cursor-pointer shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-6 h-6 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[10px] font-semibold text-[#18181B] shadow-2xs cursor-pointer"
                title={`${user?.name} (${getRoleLabel(user?.role)})`}
              >
                {getInitials(user?.name)}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="text-[#71717A] hover:text-[#18181B] p-1 rounded hover:bg-[#F4F4F5] transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full overflow-y-auto scrollbar-thin">
        {/* Top Header */}
        <header className="h-13 border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#71717A]">CIT CampusOS</span>
            <span className="text-[#D4D4D8]">/</span>
            <span className="font-medium text-[#18181B] capitalize">
              {activeTab === 'timetable'
                ? 'Weekly Timetable'
                : activeTab === 'exams'
                ? 'Midsem Examinations'
                : activeTab === 'bookings'
                ? 'Spectra Fest Allocations'
                : activeTab === 'disruptions'
                ? 'Disruption Recovery'
                : 'Overview'}
            </span>
            {selectedDay && (
              <>
                <span className="text-[#D4D4D8]">/</span>
                <span className="text-[#18181B] bg-[#F4F4F5] px-1.5 py-0.5 rounded font-mono text-[10.5px]">
                  {selectedDay}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#E5E7EB] bg-[#FBFBFA] text-[#18181B] text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              0 Hard Violations · CP-SAT
            </div>

            {user?.role === 'admin' && (
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F4F4F5] text-xs font-medium text-[#71717A] hover:text-[#18181B] px-2.5 py-1 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                title="Restore default baseline"
              >
                <RotateCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={openCopilot}
              className="rounded-md bg-[#18181B] hover:bg-[#27272A] text-white shadow-2xs font-medium px-3 py-1 text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask Copilot</span>
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
