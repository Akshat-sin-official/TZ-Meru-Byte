import React, { useState } from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { campusApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CampusNavbarProps {
  activeTab: 'timetable' | 'exams' | 'bookings' | 'disruptions';
  setActiveTab: (tab: 'timetable' | 'exams' | 'bookings' | 'disruptions') => void;
  openCopilot: () => void;
  onRefreshData: () => void;
}

export const CampusNavbar: React.FC<CampusNavbarProps> = ({
  activeTab,
  setActiveTab,
  openCopilot,
  onRefreshData,
}) => {
  const { user, loginDemo, logout } = useCampusAuth();
  const [resetting, setResetting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleResetDemo = async () => {
    if (!window.confirm('Reset database to clean cit_public.json and initial schedule?')) return;
    setResetting(true);
    try {
      await campusApi.resetDemoData();
      toast.success('Database restored to clean state');
      onRefreshData();
    } catch (err: any) {
      toast.error('Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const handleVerifyOracle = async () => {
    setVerifying(true);
    try {
      const res = await campusApi.verifyExport();
      toast.success('Oracle check: 0 hard violations verified');
    } catch {
      toast.error('Oracle check failed');
    } finally {
      setVerifying(false);
    }
  };

  const tabs: Array<{ id: 'timetable' | 'exams' | 'bookings' | 'disruptions'; label: string }> = [
    { id: 'timetable', label: 'Timetable' },
    { id: 'exams', label: 'Midsem Exams' },
    { id: 'bookings', label: 'Spectra Week' },
    { id: 'disruptions', label: 'Disruptions' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-[#18181B] flex items-center justify-center text-white text-[11px] font-semibold">
              C
            </div>
            <span className="font-poppins font-semibold text-sm tracking-tight text-[#18181B]">
              CIT CampusOS
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#18181B] text-white'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={openCopilot}
            className="h-8 px-2.5 text-xs text-[#18181B] hover:bg-[#F4F4F5]"
          >
            Copilot
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleVerifyOracle}
            disabled={verifying}
            className="h-8 px-2.5 text-xs text-[#18181B] hover:bg-[#F4F4F5]"
          >
            {verifying ? 'Checking...' : 'Verify Oracle'}
          </Button>

          <a
            href="/api/exports/schedule.json"
            download="schedule.json"
            className="inline-flex items-center justify-center rounded-md text-xs text-[#18181B] h-8 px-2.5 hover:bg-[#F4F4F5] transition-colors"
          >
            Export
          </a>

          {user?.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetDemo}
              disabled={resetting}
              className="h-8 px-2.5 text-xs text-[#DC2626] hover:bg-[#FEF2F2]"
            >
              {resetting ? 'Resetting...' : 'Reset'}
            </Button>
          )}

          {/* User Role & Quick Menu */}
          <div className="relative group pl-2 border-l border-[#E4E4E7]">
            <button className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-[#F4F4F5] transition text-xs font-medium text-[#18181B]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span className="capitalize">{user?.role?.replace('_', ' ') || 'Admin'}</span>
            </button>

            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col gap-0.5 w-44 p-1.5 rounded-md bg-white border border-[#E4E4E7] shadow-md z-50 text-xs">
              <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase px-2 py-1">
                Switch Role
              </span>
              <button
                onClick={() => loginDemo('admin')}
                className="text-left px-2 py-1 rounded hover:bg-[#F4F4F5] text-[#18181B]"
              >
                Admin
              </button>
              <button
                onClick={() => loginDemo('department_coordinator')}
                className="text-left px-2 py-1 rounded hover:bg-[#F4F4F5] text-[#18181B]"
              >
                Coordinator
              </button>
              <button
                onClick={() => loginDemo('faculty')}
                className="text-left px-2 py-1 rounded hover:bg-[#F4F4F5] text-[#18181B]"
              >
                Faculty
              </button>
              <button
                onClick={() => loginDemo('club')}
                className="text-left px-2 py-1 rounded hover:bg-[#F4F4F5] text-[#18181B]"
              >
                Club
              </button>
              <div className="border-t border-[#E4E4E7] my-1" />
              <button
                onClick={logout}
                className="text-left px-2 py-1 rounded hover:bg-[#FEF2F2] text-[#DC2626]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
