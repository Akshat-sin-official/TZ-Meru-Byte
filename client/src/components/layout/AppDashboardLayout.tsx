import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import {
  LayoutDashboard,
  Database,
  Calendar,
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
  ChevronRight,
  ChevronLeft,
  Check,
  MessageSquare,
  Bell,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { campusApi } from '@/services/api';
import { toast } from 'sonner';

export type CampusTab = 'dashboard' | 'timetable' | 'exams' | 'bookings' | 'disruptions' | 'datahub' | 'whatsapp';

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
  const [cohortMenuOpen, setCohortMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState<'OCT' | 'NOV'>('OCT');

  // Dynamic Notifications state synced with backend API
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await campusApi.getNotifications();
      if (res && Array.isArray(res.notifications)) {
        setNotificationsList(res.notifications);
        setUnreadNotifications(res.unreadCount || 0);
      }
    } catch {
      // Quiet poll failure
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await campusApi.markAllNotificationsRead();
      setUnreadNotifications(0);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      setUnreadNotifications(0);
      toast.success('All notifications marked as read');
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await campusApi.markNotificationRead(id);
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
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

  // RBAC Scoped Cohorts per ini.md
  const visibleCohorts = useMemo(() => {
    if (user?.role === 'department_coordinator') {
      const dept = user.department || 'CSE';
      return cohorts.filter((c) => c.id.startsWith(dept));
    }
    if (user?.role === 'club' || user?.role === 'faculty') {
      return [];
    }
    return cohorts;
  }, [cohorts, user]);

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
      {/* Refined Minimalist Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 z-30 select-none h-full relative transition-all duration-200 ease-in-out border-r border-[#E5E7EB] bg-[#FBFBFA] ${
          sidebarCollapsed ? 'w-16' : 'w-[280px]'
        }`}
      >
        {/* Workspace Header */}
        <div
          className={`border-b border-[#E5E7EB] relative ${
            sidebarCollapsed ? 'h-14 flex items-center justify-center px-2' : 'px-3.5 py-3 flex items-center justify-between'
          }`}
          ref={workspaceRef}
        >
          {!sidebarCollapsed ? (
            <>
              <div
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="flex items-center gap-2.5 p-1 rounded-md hover:bg-[#F4F4F5] transition cursor-pointer group min-w-0"
                title="Workspace Menu"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center p-0.5 shrink-0 shadow-2xs overflow-hidden">
                  <img src="/logo.jpeg" alt="CIT CampusOS" className="w-full h-full object-cover rounded-md" />
                </div>
                <div className="flex flex-col min-w-0 text-left justify-center">
                  <span className="text-[13.5px] font-semibold tracking-tight text-[#09090B] leading-tight truncate">
                    CIT CampusOS
                  </span>
                  <span className="text-[11px] font-medium text-[#52525B] leading-tight mt-0.5">
                    Autumn 2027
                  </span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[#71717A] group-hover:text-[#18181B] transition shrink-0 ml-1 ${
                    workspaceMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 rounded-md hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#09090B] transition cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center p-0.5 cursor-pointer shadow-2xs hover:border-[#09090B] hover:shadow-xs transition-all group overflow-hidden"
                >
                  <img src="/logo.jpeg" alt="CIT CampusOS" className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                <div className="text-xs font-semibold">CIT CampusOS</div>
                <div className="text-[10.5px] text-[#A1A1AA]">Autumn 2027 · Click to expand</div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Minimal Workspace Popover Menu (Expanded mode only) */}
          {workspaceMenuOpen && !sidebarCollapsed && (
            <div className="absolute left-3.5 top-14 w-[245px] bg-white rounded-lg border border-[#E5E7EB] shadow-lg z-50 p-2 space-y-1.5">
              <div className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#71717A]">
                Academic Terms
              </div>
              <button
                onClick={() => setWorkspaceMenuOpen(false)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded bg-[#F4F4F5] text-[13px] font-medium text-[#09090B] text-left transition"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#09090B]" />
                  <span>Autumn 2027</span>
                </div>
                <span className="text-[10px] font-mono font-medium text-[#52525B]">Active</span>
              </button>
              <button
                onClick={() => {
                  toast.info('Spring 2028 is in draft cycle.');
                  setWorkspaceMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded hover:bg-[#F4F4F5] text-[13px] text-[#52525B] hover:text-[#09090B] text-left transition cursor-pointer"
              >
                <span className="pl-5.5">Spring 2028</span>
                <span className="text-[10px] font-mono text-[#71717A]">Draft</span>
              </button>

              <div className="border-t border-[#F4F4F5] pt-1.5">
                <div className="px-2 py-1 text-[11.5px] text-[#52525B] flex items-center justify-between font-medium">
                  <span>Engine</span>
                  <span className="font-mono text-[10px] text-[#52525B]">CP-SAT 9.8</span>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="border-t border-[#F4F4F5] pt-1.5">
                  <button
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      handleResetData();
                    }}
                    disabled={resetting}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium text-[#71717A] hover:text-red-700 hover:bg-red-50/50 transition cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                    <span>Reset Baseline Data</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Nav Section */}
        <div className={`flex-1 overflow-y-auto space-y-3.5 scrollbar-none ${sidebarCollapsed ? 'p-2' : 'p-3 space-y-4'}`}>
          {/* Quick Search */}
          {!sidebarCollapsed ? (
            <button
              onClick={openCopilot}
              className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium text-[#52525B] hover:text-[#09090B] rounded-lg hover:bg-[#F4F4F5] transition border border-[#E5E7EB] bg-white cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-[#71717A]" />
                <span>Quick find...</span>
              </div>
              <kbd className="text-[10.5px] font-mono font-medium bg-[#F4F4F5] border border-[#E5E7EB] text-[#52525B] px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </button>
          ) : (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <button
                  onClick={openCopilot}
                  className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent hover:border-[#E5E7EB] hover:shadow-2xs transition-all cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                <span className="text-xs font-medium">Quick find</span>
                <kbd className="text-[10px] font-mono bg-[#27272A] text-[#A1A1AA] px-1.5 py-0.2 rounded">⌘K</kbd>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Nav: Schedules */}
          <div>
            {!sidebarCollapsed && (
              <div className="px-2 text-[11px] font-semibold tracking-wider uppercase text-[#71717A] mb-1.5">
                Schedules
              </div>
            )}
            <nav className="space-y-1">
              {/* Overview */}
              {sidebarCollapsed ? (
                <Tooltip delayDuration={80}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                        activeTab === 'dashboard'
                          ? 'bg-white text-[#09090B] border border-[#E5E7EB] shadow-2xs font-semibold'
                          : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent'
                      }`}
                    >
                      {activeTab === 'dashboard' && (
                        <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-1 rounded-r bg-[#09090B]" />
                      )}
                      <LayoutDashboard className={`h-4 w-4 shrink-0 ${activeTab === 'dashboard' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12} className="bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                    <span className="text-xs font-medium">Overview Dashboard</span>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-white font-semibold text-[#09090B] border border-[#E5E7EB] shadow-2xs'
                      : 'text-[#3F3F46] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent font-medium'
                  }`}
                  title="Overview Dashboard"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LayoutDashboard className={`h-4 w-4 shrink-0 ${activeTab === 'dashboard' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                    <span className="whitespace-nowrap">Overview</span>
                  </div>
                </button>
              )}

              {/* Weekly Timetable */}
              {user?.role !== 'club' && (
                sidebarCollapsed ? (
                  <Tooltip delayDuration={80}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveTab('timetable')}
                        className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                          activeTab === 'timetable'
                            ? 'bg-white text-[#09090B] border border-[#E5E7EB] shadow-2xs font-semibold'
                            : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent'
                        }`}
                      >
                        {activeTab === 'timetable' && (
                          <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-1 rounded-r bg-[#09090B]" />
                        )}
                        <CalendarDays className={`h-4 w-4 shrink-0 ${activeTab === 'timetable' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                      <span className="text-xs font-medium">
                        {user?.role === 'faculty' ? 'My Teaching Timetable' : user?.role === 'department_coordinator' ? 'Dept Timetable' : 'Weekly Timetable'}
                      </span>
                      <span className="text-[10px] font-mono bg-[#27272A] text-[#A1A1AA] px-1.5 py-0.2 rounded font-medium">
                        {user?.role === 'faculty' ? (user.facultyId || 'F19') : '189'}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div
                    className={`rounded-lg transition-all ${
                      activeTab === 'timetable'
                        ? 'bg-white border border-[#E5E7EB] shadow-2xs overflow-hidden'
                        : ''
                    }`}
                  >
                    <button
                      onClick={() => setActiveTab('timetable')}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] transition cursor-pointer ${
                        activeTab === 'timetable'
                          ? 'font-semibold text-[#09090B]'
                          : 'text-[#3F3F46] hover:text-[#09090B] hover:bg-[#F4F4F5] font-medium'
                      }`}
                      title={user?.role === 'faculty' ? 'My Teaching Timetable' : user?.role === 'department_coordinator' ? 'Department Timetable' : 'Weekly Timetable'}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CalendarDays className={`h-4 w-4 shrink-0 ${activeTab === 'timetable' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                        <span className="whitespace-nowrap">
                          {user?.role === 'faculty'
                            ? 'My Timetable'
                            : user?.role === 'department_coordinator'
                            ? 'Dept Timetable'
                            : 'Weekly Timetable'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono font-medium text-[#52525B] bg-[#F4F4F5] px-1.5 py-0.5 rounded">
                          {user?.role === 'faculty' ? (user.facultyId || 'F19') : '189'}
                        </span>
                        {visibleCohorts.length > 0 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setCohortMenuOpen(!cohortMenuOpen);
                            }}
                            className="p-1 rounded hover:bg-[#E5E7EB] text-[#71717A] hover:text-[#09090B] transition cursor-pointer"
                          >
                            <ChevronDown
                              className={`h-3 w-3 transition-transform ${cohortMenuOpen ? 'rotate-180' : ''}`}
                            />
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Sub-cohort list (Scoped by role) */}
                    {cohortMenuOpen && visibleCohorts.length > 0 && (
                      <div className="ml-5 pl-2.5 pr-2 pb-2 pt-1 space-y-1 border-l border-[#E5E7EB] text-xs">
                        {visibleCohorts.map((cohort) => {
                          const isSelected = selectedCohort === cohort.id;
                          return (
                            <button
                              key={cohort.id}
                              onClick={() => onSelectCohort?.(cohort.id)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition text-left cursor-pointer ${
                                isSelected
                                  ? 'bg-white font-semibold text-[#09090B] border border-[#E5E7EB] shadow-2xs'
                                  : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] font-medium'
                              }`}
                            >
                              <span className="truncate whitespace-nowrap">{cohort.label}</span>
                              <span className="text-[10.5px] font-mono text-[#71717A] shrink-0 ml-1">{cohort.hours}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Exams */}
              {user?.role !== 'club' && (
                sidebarCollapsed ? (
                  <Tooltip delayDuration={80}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveTab('exams')}
                        className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                          activeTab === 'exams'
                            ? 'bg-white text-[#09090B] border border-[#E5E7EB] shadow-2xs font-semibold'
                            : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent'
                        }`}
                      >
                        {activeTab === 'exams' && (
                          <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-1 rounded-r bg-[#09090B]" />
                        )}
                        <FileSpreadsheet className={`h-4 w-4 shrink-0 ${activeTab === 'exams' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                      <span className="text-xs font-medium">Exam Timetable</span>
                      <span className="text-[10px] font-mono bg-[#27272A] text-[#A1A1AA] px-1.5 py-0.2 rounded font-medium">
                        Midsem
                      </span>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={() => setActiveTab('exams')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg transition cursor-pointer ${
                      activeTab === 'exams'
                        ? 'bg-white font-semibold text-[#09090B] border border-[#E5E7EB] shadow-2xs'
                        : 'text-[#3F3F46] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent font-medium'
                    }`}
                    title="Exam Schedule"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileSpreadsheet className={`h-4 w-4 shrink-0 ${activeTab === 'exams' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                      <span className="whitespace-nowrap">Exam Timetable</span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-[#52525B] bg-[#F4F4F5] px-1.5 py-0.5 rounded shrink-0">
                      Midsem
                    </span>
                  </button>
                )
              )}

              {/* Spectra Fest */}
              {sidebarCollapsed ? (
                <Tooltip delayDuration={80}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                        activeTab === 'bookings'
                          ? 'bg-white text-[#09090B] border border-[#E5E7EB] shadow-2xs font-semibold'
                          : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent'
                      }`}
                    >
                      {activeTab === 'bookings' && (
                        <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-1 rounded-r bg-[#09090B]" />
                      )}
                      <PartyPopper className={`h-4 w-4 shrink-0 ${activeTab === 'bookings' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                    <span className="text-xs font-medium">Spectra Bookings</span>
                    <span className="text-[10px] font-mono bg-[#27272A] text-[#A1A1AA] px-1.5 py-0.2 rounded font-medium">
                      Oct 22-24
                    </span>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg transition cursor-pointer ${
                    activeTab === 'bookings'
                      ? 'bg-white font-semibold text-[#09090B] border border-[#E5E7EB] shadow-2xs'
                      : 'text-[#3F3F46] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent font-medium'
                  }`}
                  title="Fest Bookings"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PartyPopper className={`h-4 w-4 shrink-0 ${activeTab === 'bookings' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                    <span className="whitespace-nowrap">Spectra Bookings</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-[#52525B] bg-[#F4F4F5] px-1.5 py-0.5 rounded shrink-0">
                    Oct 22-24
                  </span>
                </button>
              )}

              {/* Disruption Recovery */}
              {(user?.role === 'admin' || user?.role === 'department_coordinator') && (
                sidebarCollapsed ? (
                  <Tooltip delayDuration={80}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveTab('disruptions')}
                        className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                          activeTab === 'disruptions'
                            ? 'bg-white text-[#09090B] border border-[#E5E7EB] shadow-2xs font-semibold'
                            : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent'
                        }`}
                      >
                        {activeTab === 'disruptions' && (
                          <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-1 rounded-r bg-[#09090B]" />
                        )}
                        <AlertTriangle className={`h-4 w-4 shrink-0 ${activeTab === 'disruptions' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                      <span className="text-xs font-medium">Disruptions & Recovery</span>
                      <span className="text-[10px] font-mono bg-[#27272A] text-[#A1A1AA] px-1.5 py-0.2 rounded font-medium">
                        0 Clashes
                      </span>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={() => setActiveTab('disruptions')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg transition cursor-pointer ${
                      activeTab === 'disruptions'
                        ? 'bg-white font-semibold text-[#09090B] border border-[#E5E7EB] shadow-2xs'
                        : 'text-[#3F3F46] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent font-medium'
                    }`}
                    title="Disruptions & Recovery"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AlertTriangle className={`h-4 w-4 shrink-0 ${activeTab === 'disruptions' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                      <span className="whitespace-nowrap">Disruptions</span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-[#52525B] bg-[#F4F4F5] px-1.5 py-0.5 rounded shrink-0">
                      0 Clashes
                    </span>
                  </button>
                )
              )}

              {/* Data & Validator Hub Channel (PS §2 #9) */}
              {user?.role === 'admin' && (
                sidebarCollapsed ? (
                  <Tooltip delayDuration={80}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveTab('datahub')}
                        className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                          activeTab === 'datahub'
                            ? 'bg-white text-[#09090B] border border-[#E5E7EB] shadow-2xs font-semibold'
                            : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent'
                        }`}
                      >
                        {activeTab === 'datahub' && (
                          <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-1 rounded-r bg-[#09090B]" />
                        )}
                        <Database className={`h-4 w-4 shrink-0 ${activeTab === 'datahub' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                      <span className="text-xs font-medium">Data Hub & Validator</span>
                      <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-medium">
                        PS §2 #9
                      </span>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={() => setActiveTab('datahub')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg transition cursor-pointer ${
                      activeTab === 'datahub'
                        ? 'bg-white font-semibold text-[#09090B] border border-[#E5E7EB] shadow-2xs'
                        : 'text-[#3F3F46] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent font-medium'
                    }`}
                    title="Dataset & Official Validator Hub"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Database className={`h-4 w-4 shrink-0 ${activeTab === 'datahub' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                      <span className="whitespace-nowrap">Data Hub & Validator</span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded shrink-0">
                      PS §2 #9
                    </span>
                  </button>
                )
              )}

              {/* WhatsApp Bot Channel */}
              {user?.role === 'admin' && (
                sidebarCollapsed ? (
                  <Tooltip delayDuration={80}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveTab('whatsapp')}
                        className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                          activeTab === 'whatsapp'
                            ? 'bg-white text-[#09090B] border border-[#E5E7EB] shadow-2xs font-semibold'
                            : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent'
                        }`}
                      >
                        {activeTab === 'whatsapp' && (
                          <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-1 rounded-r bg-[#09090B]" />
                        )}
                        <MessageSquare className={`h-4 w-4 shrink-0 ${activeTab === 'whatsapp' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                      <span className="text-xs font-medium">WhatsApp Gateway</span>
                      <span className="text-[10px] font-mono bg-[#27272A] text-[#A1A1AA] px-1.5 py-0.2 rounded font-medium">
                        Admin
                      </span>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={() => setActiveTab('whatsapp')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg transition cursor-pointer ${
                      activeTab === 'whatsapp'
                        ? 'bg-white font-semibold text-[#09090B] border border-[#E5E7EB] shadow-2xs'
                        : 'text-[#3F3F46] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent font-medium'
                    }`}
                    title="WhatsApp Bot Operations Center"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquare className={`h-4 w-4 shrink-0 ${activeTab === 'whatsapp' ? 'text-[#09090B]' : 'text-[#71717A]'}`} />
                      <span className="whitespace-nowrap">WhatsApp Gateway</span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-[#52525B] bg-[#F4F4F5] px-1.5 py-0.5 rounded shrink-0">
                      Admin
                    </span>
                  </button>
                )
              )}
            </nav>
          </div>

          {/* Interactive Mini Calendar */}
          {!sidebarCollapsed ? (
            <div className="pt-2 border-t border-[#E5E7EB]">
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-2xs">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#09090B]">
                      {calendarMonth === 'OCT' ? 'October 2027' : 'November 2027'}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-[#52525B] bg-[#F4F4F5] px-1 py-0.2 rounded">
                      {calendarMonth === 'OCT' ? 'Wk 42' : 'Wk 45'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#52525B]">
                    <button
                      onClick={() => setCalendarMonth('OCT')}
                      className={`p-1 rounded hover:bg-[#F4F4F5] transition cursor-pointer ${
                        calendarMonth === 'OCT' ? 'text-[#09090B] font-semibold' : 'text-[#71717A]'
                      }`}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setCalendarMonth('NOV')}
                      className={`p-1 rounded hover:bg-[#F4F4F5] transition cursor-pointer ${
                        calendarMonth === 'NOV' ? 'text-[#09090B] font-semibold' : 'text-[#71717A]'
                      }`}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setCalendarOpen(!calendarOpen)}
                      className="p-1 rounded hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#09090B] transition cursor-pointer ml-1"
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${calendarOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {calendarOpen && (
                  <>
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#71717A] mb-1.5">
                      <span>M</span>
                      <span>T</span>
                      <span>W</span>
                      <span>T</span>
                      <span>F</span>
                      <span>S</span>
                      <span>S</span>
                    </div>

                    {calendarMonth === 'OCT' ? (
                      <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        <span className="text-[#A1A1AA] py-1">27</span>
                        <span className="text-[#A1A1AA] py-1">28</span>
                        <span className="text-[#A1A1AA] py-1">29</span>
                        <span className="text-[#A1A1AA] py-1">30</span>

                        {[...Array(31)].map((_, i) => {
                          const date = i + 1;
                          const isSelected = selectedDate === date;
                          const isMidsem = date >= 14 && date <= 20;
                          const isSpectra = date >= 22 && date <= 24;

                          return (
                            <button
                              key={date}
                              onClick={() => handleDateClick(date)}
                              className={`py-1 rounded transition cursor-pointer select-none relative font-medium ${
                                isSelected
                                  ? 'bg-[#09090B] text-white font-semibold shadow-2xs'
                                  : 'text-[#18181B] hover:bg-[#F4F4F5]'
                              }`}
                            >
                              <span>{date}</span>
                              {(isMidsem || isSpectra) && !isSelected && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-0.5 rounded-full bg-[#52525B]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {[...Array(30)].map((_, i) => {
                          const date = i + 1;
                          return (
                            <button
                              key={date}
                              onClick={() => handleDateClick(date)}
                              className="py-1 rounded transition cursor-pointer select-none text-[#18181B] hover:bg-[#F4F4F5] font-medium"
                            >
                              {date}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedDay && (
                      <div className="mt-2.5 pt-2 border-t border-[#F4F4F5] flex items-center justify-between text-[11px]">
                        <span className="text-[#52525B]">
                          Filtered: <strong className="text-[#09090B]">{selectedDay}</strong>
                        </span>
                        <button
                          onClick={() => onSelectDay?.(null)}
                          className="text-[#52525B] hover:text-[#09090B] font-medium underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Collapsed Calendar Popover Trigger */
            <div className="pt-2 border-t border-[#E5E7EB] flex flex-col items-center">
              <Popover>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                          selectedDay
                            ? 'bg-[#09090B] text-white shadow-2xs font-semibold'
                            : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent'
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        {selectedDay && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12} className="flex items-center gap-1.5 bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                    <span className="text-xs font-medium">
                      {selectedDay ? `Active: ${selectedDay}` : 'Academic Calendar & Filter'}
                    </span>
                    {selectedDate && (
                      <span className="text-[10px] font-mono bg-[#27272A] text-[#A1A1AA] px-1.5 py-0.2 rounded font-medium">
                        Oct {selectedDate}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
                <PopoverContent side="right" align="start" sideOffset={14} className="w-[285px] p-3 bg-white border border-[#E5E7EB] rounded-xl shadow-xl">
                  {/* Calendar Header in Popover */}
                  <div className="flex items-center justify-between mb-2.5 px-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#09090B]">
                        {calendarMonth === 'OCT' ? 'October 2027' : 'November 2027'}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-[#52525B] bg-[#F4F4F5] px-1 py-0.2 rounded">
                        {calendarMonth === 'OCT' ? 'Wk 42' : 'Wk 45'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[#52525B]">
                      <button
                        onClick={() => setCalendarMonth('OCT')}
                        className={`p-1 rounded hover:bg-[#F4F4F5] transition cursor-pointer ${
                          calendarMonth === 'OCT' ? 'text-[#09090B] font-semibold' : 'text-[#71717A]'
                        }`}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setCalendarMonth('NOV')}
                        className={`p-1 rounded hover:bg-[#F4F4F5] transition cursor-pointer ${
                          calendarMonth === 'NOV' ? 'text-[#09090B] font-semibold' : 'text-[#71717A]'
                        }`}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#71717A] mb-1.5">
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                    <span>S</span>
                  </div>

                  {calendarMonth === 'OCT' ? (
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      <span className="text-[#A1A1AA] py-1">27</span>
                      <span className="text-[#A1A1AA] py-1">28</span>
                      <span className="text-[#A1A1AA] py-1">29</span>
                      <span className="text-[#A1A1AA] py-1">30</span>

                      {[...Array(31)].map((_, i) => {
                        const date = i + 1;
                        const isSelected = selectedDate === date;
                        const isMidsem = date >= 14 && date <= 20;
                        const isSpectra = date >= 22 && date <= 24;

                        return (
                          <button
                            key={date}
                            onClick={() => handleDateClick(date)}
                            className={`py-1 rounded transition cursor-pointer select-none relative font-medium ${
                              isSelected
                                ? 'bg-[#09090B] text-white font-semibold shadow-2xs'
                                : 'text-[#18181B] hover:bg-[#F4F4F5]'
                            }`}
                          >
                            <span>{date}</span>
                            {(isMidsem || isSpectra) && !isSelected && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-0.5 rounded-full bg-[#52525B]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {[...Array(30)].map((_, i) => {
                        const date = i + 1;
                        return (
                          <button
                            key={date}
                            onClick={() => handleDateClick(date)}
                            className="py-1 rounded transition cursor-pointer select-none text-[#18181B] hover:bg-[#F4F4F5] font-medium"
                          >
                            {date}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedDay && (
                    <div className="mt-2.5 pt-2 border-t border-[#F4F4F5] flex items-center justify-between text-[11px]">
                      <span className="text-[#52525B]">
                        Filtered: <strong className="text-[#09090B]">{selectedDay}</strong>
                      </span>
                      <button
                        onClick={() => onSelectDay?.(null)}
                        className="text-[#52525B] hover:text-[#09090B] font-medium underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Footer: Segmented Role Switcher & Profile */}
        <div className={`border-t border-[#E5E7EB] bg-[#FBFBFA] shrink-0 ${sidebarCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3 space-y-2.5'}`}>
          {!sidebarCollapsed ? (
            <>
              {/* Minimal Segmented Role Control */}
              <div className="flex items-center justify-between text-xs bg-[#F4F4F5] p-0.5 rounded-lg border border-[#E5E7EB]">
                <button
                  onClick={() => loginDemo('admin')}
                  className={`flex-1 py-1.5 rounded-md text-center transition cursor-pointer font-medium ${
                    user?.role === 'admin'
                      ? 'bg-white text-[#09090B] font-semibold shadow-2xs'
                      : 'text-[#52525B] hover:text-[#09090B]'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => loginDemo('department_coordinator')}
                  className={`flex-1 py-1.5 rounded-md text-center transition cursor-pointer font-medium ${
                    user?.role === 'department_coordinator'
                      ? 'bg-white text-[#09090B] font-semibold shadow-2xs'
                      : 'text-[#52525B] hover:text-[#09090B]'
                  }`}
                >
                  Coord
                </button>
                <button
                  onClick={() => loginDemo('faculty')}
                  className={`flex-1 py-1.5 rounded-md text-center transition cursor-pointer font-medium ${
                    user?.role === 'faculty'
                      ? 'bg-white text-[#09090B] font-semibold shadow-2xs'
                      : 'text-[#52525B] hover:text-[#09090B]'
                  }`}
                >
                  Faculty
                </button>
                <button
                  onClick={() => loginDemo('club')}
                  className={`flex-1 py-1.5 rounded-md text-center transition cursor-pointer font-medium ${
                    user?.role === 'club'
                      ? 'bg-white text-[#09090B] font-semibold shadow-2xs'
                      : 'text-[#52525B] hover:text-[#09090B]'
                  }`}
                >
                  Club
                </button>
              </div>

              {/* User Profile Card */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-xs font-semibold text-[#09090B] shrink-0 shadow-2xs">
                    {getInitials(user?.name)}
                  </div>
                  <div className="truncate min-w-0 text-left">
                    <p className="text-[13px] font-semibold text-[#09090B] leading-tight truncate">
                      {user?.name || getRoleLabel(user?.role)}
                    </p>
                    <p className="text-[11px] font-medium text-[#52525B] leading-tight mt-0.5 truncate">
                      {getRoleLabel(user?.role)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="text-[#71717A] hover:text-red-700 p-1.5 rounded-md hover:bg-[#F4F4F5] transition cursor-pointer shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            /* Collapsed Footer: Avatar with Role Popover & Expand Button */
            <>
              <Popover>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-xs font-semibold text-[#09090B] shadow-2xs hover:border-[#09090B] transition-all cursor-pointer relative group"
                      >
                        {getInitials(user?.name)}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12} className="bg-[#09090B] text-white border-0 py-1.5 px-3 shadow-lg">
                    <div className="text-xs font-medium">{user?.name || 'Account'}</div>
                    <div className="text-[10px] text-[#A1A1AA]">{getRoleLabel(user?.role)} · Click for quick role switch</div>
                  </TooltipContent>
                </Tooltip>

                <PopoverContent side="right" align="end" sideOffset={14} className="w-64 p-3 bg-white border border-[#E5E7EB] rounded-xl shadow-xl space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E7EB]">
                    <div className="w-8 h-8 rounded-full bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center text-xs font-semibold text-[#09090B] shadow-2xs">
                      {getInitials(user?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#09090B] truncate">{user?.name}</p>
                      <p className="text-[10px] text-[#71717A] truncate">{getRoleLabel(user?.role)}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A] px-1">Switch Role Demo</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => loginDemo('admin')}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium transition cursor-pointer text-center ${
                          user?.role === 'admin'
                            ? 'bg-[#09090B] text-white font-semibold shadow-2xs'
                            : 'bg-[#F4F4F5] text-[#52525B] hover:text-[#09090B] hover:bg-[#E5E7EB]'
                        }`}
                      >
                        Admin
                      </button>
                      <button
                        onClick={() => loginDemo('department_coordinator')}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium transition cursor-pointer text-center ${
                          user?.role === 'department_coordinator'
                            ? 'bg-[#09090B] text-white font-semibold shadow-2xs'
                            : 'bg-[#F4F4F5] text-[#52525B] hover:text-[#09090B] hover:bg-[#E5E7EB]'
                        }`}
                      >
                        Coordinator
                      </button>
                      <button
                        onClick={() => loginDemo('faculty')}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium transition cursor-pointer text-center ${
                          user?.role === 'faculty'
                            ? 'bg-[#09090B] text-white font-semibold shadow-2xs'
                            : 'bg-[#F4F4F5] text-[#52525B] hover:text-[#09090B] hover:bg-[#E5E7EB]'
                        }`}
                      >
                        Faculty
                      </button>
                      <button
                        onClick={() => loginDemo('club')}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium transition cursor-pointer text-center ${
                          user?.role === 'club'
                            ? 'bg-[#09090B] text-white font-semibold shadow-2xs'
                            : 'bg-[#F4F4F5] text-[#52525B] hover:text-[#09090B] hover:bg-[#E5E7EB]'
                        }`}
                      >
                        Club Rep
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB]">
                    <button
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition cursor-pointer font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] transition cursor-pointer"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="bg-[#09090B] text-white border-0 py-1.5 px-2.5 shadow-lg">
                  <span className="text-xs font-medium">Expand Sidebar</span>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full overflow-y-auto scrollbar-thin">
        {/* Top Header */}
        <header className="h-14 border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#52525B] font-medium">CIT CampusOS</span>
            <span className="text-[#A1A1AA]">/</span>
            <span className="font-semibold text-[#09090B] capitalize">
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
                <span className="text-[#A1A1AA]">/</span>
                <span className="text-[#09090B] bg-[#F4F4F5] border border-[#E5E7EB] px-2 py-0.5 rounded font-mono text-xs font-medium">
                  {selectedDay}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E5E7EB] bg-[#FBFBFA] text-[#09090B] text-xs font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              0 Hard Violations · CP-SAT
            </div>

            {user?.role === 'admin' && (
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F4F4F5] text-xs font-semibold text-[#52525B] hover:text-[#09090B] px-3 py-1.5 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                title="Restore default baseline"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset</span>
              </button>
            )}

            {/* Notification Bell with Badge */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-md hover:bg-[#F4F4F5] text-[#52525B] hover:text-[#09090B] transition cursor-pointer"
                title="Notifications & Schedule Changes"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-[#09090B]">Notifications & Change Diff</span>
                      {unreadNotifications > 0 && (
                        <span className="text-[10px] bg-red-50 text-red-600 font-mono px-1.5 py-0.2 rounded font-semibold">
                          {unreadNotifications} new
                        </span>
                      )}
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#71717A] hover:text-[#09090B] font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {notificationsList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[#71717A]">
                        No notifications at this time
                      </div>
                    ) : (
                      notificationsList.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.read && handleMarkSingleRead(n.id)}
                          className={`p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                            !n.read
                              ? 'bg-[#FBFBFA] border-[#E5E7EB]'
                              : 'bg-white border-transparent hover:bg-[#F4F4F5] opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                              <span className="font-semibold text-[#09090B] truncate">{n.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#71717A] shrink-0">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#52525B] mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB] text-center">
                    <span className="text-[10px] text-[#A1A1AA] font-mono">
                      Real-time changes synchronized with CIT Campus Audit Log
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={openCopilot}
              className="rounded-md bg-[#09090B] hover:bg-[#27272A] text-white shadow-2xs font-medium px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
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
