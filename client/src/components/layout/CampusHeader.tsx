import React, { useState } from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Users2,
  LogOut,
  ChevronDown,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';
import { campusApi } from '@/services/api';
import { toast } from 'sonner';

export type CampusTab = 'dashboard' | 'timetable' | 'exams' | 'bookings' | 'disruptions';

interface CampusHeaderProps {
  activeTab: CampusTab;
  setActiveTab: (tab: CampusTab) => void;
  openCopilot: () => void;
  onRefreshData?: () => void;
}

export const CampusHeader: React.FC<CampusHeaderProps> = ({
  activeTab,
  setActiveTab,
  openCopilot,
  onRefreshData,
}) => {
  const { user, logout, loginDemo } = useCampusAuth();
  const [resetting, setResetting] = useState(false);

  const handleResetData = async () => {
    setResetting(true);
    try {
      toast.info('Resetting to baseline cit_public.json...');
      await campusApi.resetDemoData();
      toast.success('Database restored to clean baseline state');
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
        return 'CSE Coordinator';
      case 'faculty':
        return 'Dr. S. Rath (Faculty)';
      case 'club':
        return 'Dramatics Society';
      default:
        return 'Campus User';
    }
  };

  const navItems: Array<{ id: CampusTab; label: string; count?: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timetable', label: 'Timetable', count: '189' },
    { id: 'exams', label: 'Midsem Exams', count: '41' },
    { id: 'bookings', label: 'Spectra Week', count: '25' },
    ...(user?.role === 'admin'
      ? [{ id: 'disruptions' as CampusTab, label: 'Disruptions', count: 'Active' }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-[#FAF9F6]/90 backdrop-blur-xl shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)] transition-all">
      <div className="mx-auto flex max-w-[1280px] h-16 items-center justify-between px-6">
        {/* Left: Brand Identity matching website-ui */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-poppins font-bold text-xs shadow-xs">
            CIT
          </div>
          <div className="flex flex-col">
            <div className="text-[16px] font-bold tracking-tight text-ink font-poppins flex items-center gap-1.5">
              CampusOS
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            </div>
            <div className="text-[10px] text-ink-soft/70 font-mono tracking-wider">
              cit-public-v1
            </div>
          </div>
        </div>

        {/* Center: Navigation Pills matching website-ui Nav */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-white/70 rounded-full border border-border/50 shadow-2xs backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold font-poppins transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-ink text-white shadow-xs'
                    : 'text-ink-soft hover:text-ink hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                {item.count && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-ink-soft'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions, Copilot & Role Selector matching website-ui */}
        <div className="flex items-center gap-2.5">
          {/* Ask Copilot Button with Gradient & Glow */}
          <button
            onClick={openCopilot}
            className="rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 font-bold font-poppins px-4 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-white" />
            <span>Ask Copilot</span>
            <Sparkles className="w-3 h-3 text-amber-300" />
          </button>

          {/* Profile Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border/80 bg-white px-3.5 py-1.5 text-xs font-bold font-poppins text-ink hover:border-primary/50 transition-all shadow-2xs cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="max-w-[140px] truncate">{getRoleLabel(user?.role)}</span>
                <ChevronDown className="w-3 h-3 text-ink-soft opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl border-border/80 bg-white shadow-lg font-sans">
              <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-bold font-poppins text-ink-soft uppercase tracking-wider">
                Switch Evaluation Role
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => loginDemo('admin')}
                className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Admin (Dean Office)</span>
                </div>
                {user?.role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => loginDemo('department_coordinator')}
                className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Users2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>CSE Coordinator</span>
                </div>
                {user?.role === 'department_coordinator' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => loginDemo('faculty')}
                className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dr. S. Rath (Faculty)</span>
                </div>
                {user?.role === 'faculty' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => loginDemo('club')}
                className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Dramatics Society</span>
                </div>
                {user?.role === 'club' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-border/40" />

              {user?.role === 'admin' && (
                <DropdownMenuItem
                  onClick={handleResetData}
                  disabled={resetting}
                  className="rounded-xl px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 cursor-pointer flex items-center gap-2"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                  <span>Reset Demo Dataset</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={logout}
                className="rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
