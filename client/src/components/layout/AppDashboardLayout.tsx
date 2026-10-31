import React, { useState } from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState('CSE-Y2-A');

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
        return 'Campus User';
    }
  };

  const getRoleTag = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'department_coordinator':
        return 'Coord';
      case 'faculty':
        return 'Faculty';
      case 'club':
        return 'Club';
      default:
        return 'User';
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
    { id: 'CSE-Y2-A', label: 'CSE — Yr 2 (Sec A)', status: 'Active', hours: '40h' },
    { id: 'ECE-Y3', label: 'ECE — Year 3', status: '42h', hours: '42h' },
    { id: 'ME-Y1', label: 'Mech — Year 1', status: '38h', hours: '38h' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F6] font-sans antialiased text-[#37352F]">
      {/* Human-Crafted Institutional Sidebar (Inspired by Atelier Monolith & Samvad Engine) */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 z-30 select-none h-full relative transition-all duration-200 ease-in-out border-r border-[#EBEBEA] bg-[#FBFBFA] ${
          sidebarCollapsed ? 'w-16' : 'w-[268px]'
        }`}
      >
        {/* Top Workspace Selector & Header */}
        <div className="px-3.5 py-3 border-b border-[#EBEBEA] flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 p-1 rounded-md hover:bg-[#F1F1EF] transition text-[#37352F] cursor-pointer group min-w-0">
              <div className="w-6 h-6 rounded bg-[#F7F6F3] border border-[#EBEBEA] flex items-center justify-center text-xs flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-semibold">
                🏛️
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold tracking-tight text-[#37352F] truncate">
                  CIT CampusOS
                </span>
                <span className="text-[10px] text-[#9B9A97] font-mono leading-none">
                  Autumn 2027
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-[#9B9A97] group-hover:text-[#787774] transition shrink-0 ml-0.5" />
            </div>
          ) : (
            <div className="mx-auto w-7 h-7 rounded bg-[#F7F6F3] border border-[#EBEBEA] flex items-center justify-center text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              🏛️
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-md hover:bg-[#F1F1EF] text-[#787774] hover:text-[#37352F] transition cursor-pointer"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Scrollable Nav Section */}
        <div className="p-2.5 flex-1 overflow-y-auto space-y-4 scrollbar-none">
          {/* Quick Find / Ask Search Button */}
          {!sidebarCollapsed ? (
            <button
              onClick={openCopilot}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-[#787774] hover:text-[#37352F] rounded-md hover:bg-[#F1F1EF] transition border border-transparent hover:border-[#EBEBEA] group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-[#9B9A97] group-hover:text-[#37352F] transition" />
                <span className="text-[11.5px]">Quick find or ask...</span>
              </div>
              <kbd className="text-[10px] font-mono bg-white border border-[#EBEBEA] text-[#9B9A97] px-1.5 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                ⌘K
              </kbd>
            </button>
          ) : (
            <button
              onClick={openCopilot}
              className="w-full flex items-center justify-center py-2 text-[#787774] hover:text-[#37352F] rounded-md hover:bg-[#F1F1EF] transition cursor-pointer"
              title="Search / Copilot (⌘K)"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Nav Section: Core Schedules */}
          <div>
            {!sidebarCollapsed && (
              <div className="px-2 text-[10px] font-semibold tracking-wider uppercase text-[#9B9A97] mb-1">
                Schedules & Timetables
              </div>
            )}
            <nav className="space-y-1">
              {/* Executive Overview */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white font-semibold text-[#37352F] border border-[#EBEBEA] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                    : 'text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF] border border-transparent'
                }`}
                title="Dashboard Overview"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard
                    className={`h-4 w-4 ${
                      activeTab === 'dashboard' ? 'text-[#37352F]' : 'text-[#9B9A97]'
                    }`}
                  />
                  {!sidebarCollapsed && <span>Overview Dashboard</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/60">
                    Online
                  </span>
                )}
              </button>

              {/* Weekly Timetable with Collapsible Cohort Sub-tree */}
              <div
                className={`rounded-md transition-all ${
                  activeTab === 'timetable'
                    ? 'bg-white border border-[#EBEBEA] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden'
                    : 'hover:bg-[#F1F1EF]'
                }`}
              >
                <button
                  onClick={() => setActiveTab('timetable')}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs transition cursor-pointer ${
                    activeTab === 'timetable'
                      ? 'font-semibold text-[#37352F]'
                      : 'text-[#787774] hover:text-[#37352F]'
                  }`}
                  title="Weekly Timetable"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      className={`h-4 w-4 ${
                        activeTab === 'timetable' ? 'text-[#37352F]' : 'text-[#9B9A97]'
                      }`}
                    />
                    {!sidebarCollapsed && <span>Weekly Timetable</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-[10px] text-[#9B9A97] font-mono">Autumn</span>
                  )}
                </button>

                {/* Sub-cohort list when active */}
                {!sidebarCollapsed && activeTab === 'timetable' && (
                  <div className="pl-4 pr-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-[#EBEBEA]/80 bg-[#FAF9F5] text-[11px]">
                    {cohorts.map((cohort) => {
                      const isSelected = selectedCohort === cohort.id;
                      return (
                        <button
                          key={cohort.id}
                          onClick={() => setSelectedCohort(cohort.id)}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded transition text-left cursor-pointer ${
                            isSelected
                              ? 'bg-white font-medium text-[#37352F] border border-[#EBEBEA] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                              : 'text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-emerald-500' : 'bg-[#9B9A97]/60'
                              }`}
                            />
                            <span className="truncate">{cohort.label}</span>
                          </div>
                          <span
                            className={`text-[9px] font-mono px-1 rounded ${
                              isSelected
                                ? 'text-emerald-700 bg-emerald-50'
                                : 'text-[#9B9A97]'
                            }`}
                          >
                            {cohort.status}
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
                className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                  activeTab === 'exams'
                    ? 'bg-white font-semibold text-[#37352F] border border-[#EBEBEA] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                    : 'text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF] border border-transparent'
                }`}
                title="Midsem Examinations"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet
                    className={`h-4 w-4 ${
                      activeTab === 'exams' ? 'text-[#37352F]' : 'text-[#9B9A97]'
                    }`}
                  />
                  {!sidebarCollapsed && <span>Exam Timetable</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[10px] text-[#9B9A97] font-mono">Midsem (41)</span>
                )}
              </button>

              {/* Spectra Week Bookings */}
              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'bg-white font-semibold text-[#37352F] border border-[#EBEBEA] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                    : 'text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF] border border-transparent'
                }`}
                title="Spectra Week Allocations"
              >
                <div className="flex items-center gap-2">
                  <PartyPopper
                    className={`h-4 w-4 ${
                      activeTab === 'bookings' ? 'text-[#37352F]' : 'text-[#9B9A97]'
                    }`}
                  />
                  {!sidebarCollapsed && <span>Spectra Fest Bookings</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[10px] text-[#9B9A97] font-mono">Oct 22-24</span>
                )}
              </button>

              {/* Disruption Recovery (Admin or Authorized) */}
              {(user?.role === 'admin' || user?.role === 'department_coordinator') && (
                <button
                  onClick={() => setActiveTab('disruptions')}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition cursor-pointer ${
                    activeTab === 'disruptions'
                      ? 'bg-white font-semibold text-[#37352F] border border-[#EBEBEA] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                      : 'text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF] border border-transparent'
                  }`}
                  title="Disruptions & Emergency Repair"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        activeTab === 'disruptions' ? 'text-amber-600' : 'text-[#9B9A97]'
                      }`}
                    />
                    {!sidebarCollapsed && <span>Disruption Recovery</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200/60">
                      0 Clashes
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Quick View Filters & Status */}
          {!sidebarCollapsed && (
            <div className="space-y-2 pt-1 border-t border-[#EBEBEA]">
              <div className="px-2 flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase text-[#9B9A97]">
                <span>Quick Views</span>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-mono">
                  Live
                </span>
              </div>
              <div className="flex flex-wrap gap-1 px-1">
                <button
                  onClick={() => setActiveTab('timetable')}
                  className="px-2 py-0.5 text-[11px] rounded border border-[#EBEBEA] bg-white text-[#37352F] hover:bg-[#F1F1EF] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition flex items-center gap-1 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Labs Only
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="px-2 py-0.5 text-[11px] rounded border border-[#EBEBEA] bg-white text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition flex items-center gap-1 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  Spectra 25
                </button>
                <button
                  onClick={() => setActiveTab('exams')}
                  className="px-2 py-0.5 text-[11px] rounded border border-[#EBEBEA] bg-white text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition flex items-center gap-1 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  No Clashes
                </button>
              </div>
            </div>
          )}

          {/* Mini Month Calendar Widget */}
          {!sidebarCollapsed && (
            <div className="pt-1">
              <div className="bg-white border border-[#EBEBEA] rounded-lg p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <span className="text-xs font-semibold text-[#37352F] tracking-tight flex items-center gap-1.5">
                    <span>October 2027</span>
                    <span className="text-[9px] font-normal text-[#9B9A97] bg-[#F7F6F3] px-1 py-0.5 rounded border border-[#EBEBEA]">
                      Wk 42
                    </span>
                  </span>
                  <div className="flex items-center gap-1 text-[#787774]">
                    <span className="text-[10px] font-mono text-emerald-600 font-medium">Midsem</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-[#9B9A97] mb-1">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                  <span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                  <span className="text-[#9B9A97]/40 py-0.5">27</span>
                  <span className="text-[#9B9A97]/40 py-0.5">28</span>
                  <span className="text-[#9B9A97]/40 py-0.5">29</span>
                  <span className="text-[#9B9A97]/40 py-0.5">30</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">1</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">2</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">3</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">4</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">5</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">6</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">7</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">8</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">9</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">10</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">11</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">12</span>
                  <span className="text-[#37352F] py-0.5 rounded hover:bg-[#F1F1EF] transition">13</span>
                  <span className="text-white bg-[#37352F] font-semibold py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.1)] cursor-pointer">
                    14
                  </span>
                  <span className="text-[#37352F] bg-emerald-50 text-emerald-800 font-medium py-0.5 rounded">
                    15
                  </span>
                  <span className="text-[#37352F] bg-emerald-50 text-emerald-800 font-medium py-0.5 rounded">
                    16
                  </span>
                  <span className="text-[#37352F] bg-emerald-50 text-emerald-800 font-medium py-0.5 rounded">
                    17
                  </span>
                  <span className="text-[#37352F] bg-emerald-50 text-emerald-800 font-medium py-0.5 rounded">
                    18
                  </span>
                  <span className="text-[#37352F] bg-emerald-50 text-emerald-800 font-medium py-0.5 rounded">
                    19
                  </span>
                  <span className="text-[#37352F] bg-emerald-50 text-emerald-800 font-medium py-0.5 rounded">
                    20
                  </span>
                  <span className="text-[#37352F] py-0.5 rounded">21</span>
                  <span className="text-purple-700 bg-purple-50 font-bold py-0.5 rounded" title="Spectra Day 1">
                    22
                  </span>
                  <span className="text-purple-700 bg-purple-50 font-bold py-0.5 rounded" title="Spectra Day 2">
                    23
                  </span>
                  <span className="text-purple-700 bg-purple-50 font-bold py-0.5 rounded" title="Spectra Day 3">
                    24
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Role Switcher & Profile Card */}
        <div className="p-3 border-t border-[#EBEBEA] space-y-2.5 bg-[#FBFBFA] flex-shrink-0">
          {!sidebarCollapsed ? (
            <>
              {/* Segmented Desktop Role Perspective Switcher */}
              <div className="flex items-center justify-between text-[11px] bg-[#F1F1EF] p-0.5 rounded-lg border border-[#EBEBEA]">
                <button
                  onClick={() => loginDemo('admin')}
                  className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                    user?.role === 'admin'
                      ? 'bg-white text-[#37352F] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-[#EBEBEA]'
                      : 'text-[#787774] hover:text-[#37352F]'
                  }`}
                  title="Switch to Admin (Dean Office)"
                >
                  Admin
                </button>
                <button
                  onClick={() => loginDemo('department_coordinator')}
                  className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                    user?.role === 'department_coordinator'
                      ? 'bg-white text-[#37352F] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-[#EBEBEA]'
                      : 'text-[#787774] hover:text-[#37352F]'
                  }`}
                  title="Switch to CSE Dept Coordinator"
                >
                  Coord
                </button>
                <button
                  onClick={() => loginDemo('faculty')}
                  className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                    user?.role === 'faculty'
                      ? 'bg-white text-[#37352F] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-[#EBEBEA]'
                      : 'text-[#787774] hover:text-[#37352F]'
                  }`}
                  title="Switch to Faculty (Dr. S. Rath)"
                >
                  Faculty
                </button>
                <button
                  onClick={() => loginDemo('club')}
                  className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                    user?.role === 'club'
                      ? 'bg-white text-[#37352F] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-[#EBEBEA]'
                      : 'text-[#787774] hover:text-[#37352F]'
                  }`}
                  title="Switch to Club Lead"
                >
                  Club
                </button>
              </div>

              {/* User Profile Card */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-white border border-[#EBEBEA] flex items-center justify-center text-[10.5px] font-semibold text-[#37352F] shadow-[0_1px_2px_rgba(0,0,0,0.04)] shrink-0">
                    {getInitials(user?.name)}
                  </div>
                  <div className="truncate min-w-0">
                    <p className="text-xs font-medium text-[#37352F] truncate">
                      {user?.name || getRoleLabel(user?.role)}
                    </p>
                    <p className="text-[10px] text-[#9B9A97] truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {getRoleLabel(user?.role)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="text-[#9B9A97] hover:text-red-600 p-1.5 rounded-md hover:bg-[#F1F1EF] transition cursor-pointer shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-7 h-7 rounded-full bg-white border border-[#EBEBEA] flex items-center justify-center text-[10.5px] font-semibold text-[#37352F] shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer"
                title={`${user?.name} (${getRoleLabel(user?.role)})`}
              >
                {getInitials(user?.name)}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="text-[#9B9A97] hover:text-red-600 p-1 rounded-md hover:bg-[#F1F1EF] transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full overflow-y-auto scrollbar-thin">
        {/* Top Operational Header Bar */}
        <header className="h-14 border-b border-[#EBEBEA] bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#787774] font-medium">CIT CampusOS</span>
            <span className="text-[#9B9A97]">/</span>
            <span className="font-semibold text-[#37352F] capitalize">
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
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-medium font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              0 Hard Violations · CP-SAT Online
            </div>

            {user?.role === 'admin' && (
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="rounded-md border border-[#EBEBEA] bg-[#FAF9F5] hover:bg-white text-xs font-medium text-[#787774] hover:text-[#37352F] px-3 py-1.5 flex items-center gap-1.5 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
                title="Restore default cit_public baseline"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset Data</span>
              </button>
            )}

            <button
              onClick={openCopilot}
              className="rounded-md bg-[#37352F] hover:bg-[#201F1D] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] font-medium px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <Bot className="w-3.5 h-3.5 text-white/90" />
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
