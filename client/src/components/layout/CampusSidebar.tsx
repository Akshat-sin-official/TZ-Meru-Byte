import React from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  PartyPopper,
  AlertTriangle,
  Bot,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Users2,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export type CampusTab = 'dashboard' | 'timetable' | 'exams' | 'bookings' | 'disruptions';

interface CampusSidebarProps {
  activeTab: CampusTab;
  setActiveTab: (tab: CampusTab) => void;
  openCopilot: () => void;
}

export const CampusSidebar: React.FC<CampusSidebarProps> = ({
  activeTab,
  setActiveTab,
  openCopilot,
}) => {
  const { user, logout, loginDemo } = useCampusAuth();

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return ShieldCheck;
      case 'department_coordinator':
        return Users2;
      case 'faculty':
        return GraduationCap;
      case 'club':
        return Sparkles;
      default:
        return Users2;
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'department_coordinator':
        return 'Dept Coordinator';
      case 'faculty':
        return 'Faculty Member';
      case 'club':
        return 'Club Representative';
      default:
        return 'Campus User';
    }
  };

  const RoleIcon = getRoleIcon(user?.role);

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans z-30 select-none">
      {/* Top Header */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-poppins font-bold text-xs shadow-xs">
              CIT
            </div>
            <div>
              <div className="font-poppins font-bold text-sm text-[#111827] tracking-tight flex items-center gap-1.5">
                CampusOS
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[10px] text-[#71717A] font-mono">cit-public-v1</div>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white border border-[#E5E7EB] text-primary shadow-2xs">
            <RoleIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-xs text-[#111827] truncate font-heading">
              {user?.name || 'Authorized User'}
            </div>
            <div className="text-[10px] text-[#71717A] truncate">
              {getRoleLabel(user?.role)}
              {user?.department ? ` · ${user.department}` : ''}
              {user?.clubName ? ` · ${user.clubName}` : ''}
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-2 space-y-6 overflow-y-auto">
          {/* Main Section */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider font-poppins">
              Main Workspace
            </div>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-[#4B5563] hover:bg-[#FAF9F6] hover:text-[#111827]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="flex-1 text-left">Dashboard</span>
              {activeTab === 'dashboard' && <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setActiveTab('timetable')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'timetable'
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-[#4B5563] hover:bg-[#FAF9F6] hover:text-[#111827]'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="flex-1 text-left">Academic Timetable</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === 'timetable' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#71717A]'
                }`}
              >
                189
              </span>
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'exams'
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-[#4B5563] hover:bg-[#FAF9F6] hover:text-[#111827]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="flex-1 text-left">Midsem Examinations</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === 'exams' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#71717A]'
                }`}
              >
                41
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'bookings'
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-[#4B5563] hover:bg-[#FAF9F6] hover:text-[#111827]'
              }`}
            >
              <PartyPopper className="w-4 h-4" />
              <span className="flex-1 text-left">Spectra Week</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#71717A]'
                }`}
              >
                25
              </span>
            </button>
          </div>

          {/* Operations Section */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider font-poppins">
              Operations & Tools
            </div>

            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('disruptions')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'disruptions'
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-[#4B5563] hover:bg-[#FAF9F6] hover:text-[#111827]'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="flex-1 text-left">Disruptions & Repair</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                  Active
                </span>
              </button>
            )}

            <button
              onClick={openCopilot}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#4B5563] hover:bg-purple-50 hover:text-primary transition-all group"
            >
              <Bot className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="flex-1 text-left">CIT Copilot</span>
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-primary">
                AI
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Switcher & Sign Out */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#FAF9F6] space-y-2.5">
        <div className="flex items-center justify-between text-[10px] text-[#71717A] font-semibold uppercase tracking-wider px-1">
          <span>Switch Demo Role</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => loginDemo('admin')}
            className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition ${
              user?.role === 'admin'
                ? 'bg-primary text-white border-primary shadow-2xs font-semibold'
                : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:border-primary/50 hover:text-[#111827]'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => loginDemo('department_coordinator')}
            className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition ${
              user?.role === 'department_coordinator'
                ? 'bg-primary text-white border-primary shadow-2xs font-semibold'
                : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:border-primary/50 hover:text-[#111827]'
            }`}
          >
            Coordinator
          </button>
          <button
            onClick={() => loginDemo('faculty')}
            className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition ${
              user?.role === 'faculty'
                ? 'bg-primary text-white border-primary shadow-2xs font-semibold'
                : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:border-primary/50 hover:text-[#111827]'
            }`}
          >
            Faculty
          </button>
          <button
            onClick={() => loginDemo('club')}
            className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition ${
              user?.role === 'club'
                ? 'bg-primary text-white border-primary shadow-2xs font-semibold'
                : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:border-primary/50 hover:text-[#111827]'
            }`}
          >
            Club
          </button>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#71717A] hover:text-red-600 hover:border-red-200 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
