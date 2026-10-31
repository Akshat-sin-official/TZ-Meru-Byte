import React, { useState } from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  PartyPopper,
  AlertTriangle,
  Bot,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Users2,
  RotateCw,
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
        return 'Dean Office (Admin)';
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
    if (!name) return 'CIT';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const navItems: Array<{ id: CampusTab; label: string; icon: any; badge?: string | number; adminOnly?: boolean }> = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'timetable', label: 'Academic Timetable', icon: CalendarDays, badge: '189' },
    { id: 'exams', label: 'Midsem Examinations', icon: FileSpreadsheet, badge: '41' },
    { id: 'bookings', label: 'Spectra Week Bookings', icon: PartyPopper, badge: '25' },
    { id: 'disruptions', label: 'Disruptions & Repair', icon: AlertTriangle, badge: 'Active', adminOnly: true },
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user?.role === 'admin');

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9FB] font-sans antialiased text-[#111926]">
      {/* Desktop Sidebar matching docs/UI/app-ui */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 h-full flex-col justify-between bg-[#F9F9FB] px-4 py-5 border-r border-[#E5E7EB] select-none">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-poppins font-bold text-xs shadow-xs">
              CIT
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-[#111926] font-poppins flex items-center gap-1.5">
                CampusOS
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">cit-public-v1</span>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-poppins">
                Workspace
              </h3>
              <div className="space-y-1">
                {visibleNavItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#111926] shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-[#E5E7EB] font-bold font-poppins'
                          : 'text-muted-foreground hover:bg-white/60 hover:text-[#111926] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.badge !== undefined && (
                          <span
                            className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[9px] font-bold font-mono ${
                              isActive ? 'bg-primary text-white' : 'bg-slate-200/80 text-muted-foreground'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-poppins">
                AI Operations
              </h3>
              <button
                onClick={openCopilot}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-purple-50 hover:text-primary transition-all duration-200 cursor-pointer border border-transparent group"
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-poppins font-medium">CIT Copilot</span>
                </div>
                <span className="flex items-center gap-1 text-[9px] font-bold font-poppins px-1.5 py-0.5 rounded-full bg-purple-100 text-primary">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  AI
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Role Switcher & User Profile matching app-ui */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
          {/* Quick Demo Switcher */}
          <div className="space-y-1.5">
            <span className="px-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
              Demo Roles
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px] font-poppins">
              <button
                onClick={() => loginDemo('admin')}
                className={`py-1 px-2 rounded-lg border text-center transition cursor-pointer ${
                  user?.role === 'admin'
                    ? 'bg-primary text-white border-primary font-bold shadow-2xs'
                    : 'bg-white border-[#E5E7EB] text-muted-foreground hover:text-[#111926]'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => loginDemo('department_coordinator')}
                className={`py-1 px-2 rounded-lg border text-center transition cursor-pointer ${
                  user?.role === 'department_coordinator'
                    ? 'bg-primary text-white border-primary font-bold shadow-2xs'
                    : 'bg-white border-[#E5E7EB] text-muted-foreground hover:text-[#111926]'
                }`}
              >
                Coordinator
              </button>
              <button
                onClick={() => loginDemo('faculty')}
                className={`py-1 px-2 rounded-lg border text-center transition cursor-pointer ${
                  user?.role === 'faculty'
                    ? 'bg-primary text-white border-primary font-bold shadow-2xs'
                    : 'bg-white border-[#E5E7EB] text-muted-foreground hover:text-[#111926]'
                }`}
              >
                Faculty
              </button>
              <button
                onClick={() => loginDemo('club')}
                className={`py-1 px-2 rounded-lg border text-center transition cursor-pointer ${
                  user?.role === 'club'
                    ? 'bg-primary text-white border-primary font-bold shadow-2xs'
                    : 'bg-white border-[#E5E7EB] text-muted-foreground hover:text-[#111926]'
                }`}
              >
                Club
              </button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-8 w-8 border border-[#E5E7EB] shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs font-poppins">
                  {getInitials(user?.name)}
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
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full overflow-y-auto scrollbar-thin">
        {/* Top Operational Header Bar */}
        <header className="h-16 border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-poppins">CIT CampusOS</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-bold text-[#111926] font-poppins capitalize">
              {activeTab.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-bold font-poppins">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              0 Hard Violations · CP-SAT Online
            </div>

            {user?.role === 'admin' && (
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-white text-xs font-bold font-poppins text-muted-foreground hover:text-[#111926] px-3 py-1.5 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset Data</span>
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

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
