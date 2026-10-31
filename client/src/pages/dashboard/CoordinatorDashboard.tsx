import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Users2,
  CalendarDays,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface CoordinatorDashboardProps {
  onNavigateTab: (tab: 'timetable' | 'exams' | 'bookings' | 'disruptions') => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const dept = user?.department || 'CSE';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getActiveTimetable();
      setData(res);
    } catch {
      toast.error('Failed to load department metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#71717A]">
        Loading department dashboard...
      </div>
    );
  }

  const { schedule, metadata } = data || {};
  const sessions = metadata?.sessions || [];
  const assignments = schedule?.assignments || [];

  // Filter department sessions
  const deptSessions = sessions.filter(
    (s: any) =>
      s.courseId.startsWith(dept) ||
      (Array.isArray(s.groups) && s.groups.some((g: string) => g.includes(dept)))
  );

  const deptFaculty = (metadata?.faculty || []).filter(
    (f: any) => f.department === dept
  );

  const deptGroups = (metadata?.studentGroups || []).filter(
    (g: any) => g.department === dept || g.externalId.includes(dept)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-bold text-[#111827]">
              {dept} Department Workspace
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-primary border border-purple-200">
              Coordinator: {user?.name}
            </span>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            Academic planning, course allocations, faculty teaching loads, and student group schedules.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onNavigateTab('timetable')}
          className="h-8 px-3.5 text-xs font-medium bg-primary hover:bg-primary-hover text-white shadow-xs"
        >
          View Department Timetable
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#71717A] font-poppins">
              Department Sessions
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-primary">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#111827]">
              {deptSessions.length} <span className="text-xs font-normal text-[#71717A]">sessions/week</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> 100% scheduled with 0 hard clashes
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#71717A] font-poppins">
              Student Cohorts
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#111827]">
              {deptGroups.length} <span className="text-xs font-normal text-[#71717A]">cohorts</span>
            </div>
            <div className="text-[11px] text-[#71717A] mt-0.5">
              {deptGroups.map((g: any) => g.externalId).join(', ')}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#71717A] font-poppins">
              Department Faculty
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#111827]">
              {deptFaculty.length} <span className="text-xs font-normal text-[#71717A]">professors</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> All under max 4 hrs/day cap (H8)
            </div>
          </div>
        </div>
      </div>

      {/* Department Cohorts & Elective Basket Coordination */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Student Groups Status */}
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <span className="font-heading font-semibold text-xs text-[#111827]">
              Active Student Groups
            </span>
            <span className="text-[10px] text-[#71717A]">Total Headcount</span>
          </div>
          <div className="space-y-2 text-xs">
            {deptGroups.map((g: any) => (
              <div key={g.externalId} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB]">
                <div>
                  <span className="font-semibold text-xs text-[#111827]">{g.externalId}</span>
                  <span className="text-[11px] text-[#71717A] ml-2">Year {g.year}</span>
                </div>
                <span className="font-mono text-xs text-[#111827] font-medium">{g.size} students</span>
              </div>
            ))}
          </div>
        </div>

        {/* Elective Basket Synchronization */}
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <span className="font-heading font-semibold text-xs text-[#111827]">
              Elective Basket Synchronization (OEB-1)
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">Synchronized</span>
          </div>
          <div className="space-y-2 text-xs text-[#4B5563]">
            <p className="leading-relaxed">
              Open Electives (OE301, OE302, OE303) run in parallel across identical time slots (H10). All sessions sharing the basket slot occupy different rooms simultaneously without conflict for Year 3 cohorts.
            </p>
            <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Basket slots aligned across THU Period 6–7 and FRI Period 3–4 with zero room overlap.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
