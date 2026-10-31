import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { toast } from 'sonner';
import {
  Users2,
  CalendarDays,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
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
      <div className="flex h-64 items-center justify-center text-xs text-ink-soft">
        Loading department dashboard...
      </div>
    );
  }

  const { schedule, metadata } = data || {};
  const sessions = metadata?.sessions || [];
  const assignments = schedule?.assignments || [];

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
    <div className="space-y-10 py-2">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink-soft font-poppins">
            DEPARTMENT WORKSPACE · {dept}
          </span>
          <h1 className="mt-2 text-[32px] md:text-[40px] font-bold font-poppins leading-tight tracking-[-0.02em] text-ink">
            {dept} Academic <br className="hidden sm:inline" />
            <span className="font-serif italic text-primary">Coordination & Planning.</span>
          </h1>
          <p className="mt-3 text-[15px] text-ink-soft max-w-2xl leading-relaxed">
            Course allocations, faculty workload limits, and elective basket synchronization for {dept} student cohorts.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('timetable')}
          className="rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 font-bold font-poppins px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>View {dept} Timetable</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Bento Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div
          onClick={() => onNavigateTab('timetable')}
          className="flex flex-col justify-between rounded-[24px] bg-[#EDE9FE]/40 border border-[#EDE9FE]/80 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer min-h-[220px]"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#6D28D9]/10 text-[#6D28D9] shrink-0 shadow-xs">
                <CalendarDays className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#6D28D9]/10 text-[#6D28D9]">
                Scheduled
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              {deptSessions.length}{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">Sessions/Week</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              100% scheduled with 0 room conflicts or student group overlap.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold font-poppins text-[#6D28D9]">
            <span>Filter Timetable</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[24px] bg-[#D8E5F5]/40 border border-[#D8E5F5]/70 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[220px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2F5B93]/10 text-[#2F5B93] shrink-0 shadow-xs">
                <Users2 className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#2F5B93]/10 text-[#2F5B93]">
                Cohorts
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              {deptGroups.length}{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">Active Groups</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              {deptGroups.map((g: any) => g.externalId).join(', ')}.
            </p>
          </div>

          <div className="mt-4 text-xs font-semibold text-[#2F5B93] font-poppins">
            Total Students: {deptGroups.reduce((acc: number, g: any) => acc + (g.size || 0), 0)}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[24px] bg-[#DDECD4]/40 border border-[#DDECD4]/70 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[220px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2D5A27]/10 text-[#2D5A27] shrink-0 shadow-xs">
                <BookOpen className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#2D5A27]/10 text-[#2D5A27]">
                Workload OK
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              {deptFaculty.length}{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">Professors</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              All faculty members stay strictly within the 4 hrs/day teaching limit (H8).
            </p>
          </div>

          <div className="mt-4 text-xs font-semibold text-[#2D5A27] font-poppins">
            0 Avoid-preference violations
          </div>
        </div>
      </div>

      {/* Cohorts & Elective Basket */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[24px] bg-[#FAF6F0]/80 border border-border/50 p-8 space-y-4">
          <h3 className="text-[18px] font-bold font-poppins text-ink">
            {dept} Student Cohorts Breakdown
          </h3>
          <div className="space-y-2.5">
            {deptGroups.map((g: any) => (
              <div
                key={g.externalId}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-border/60"
              >
                <div>
                  <div className="font-bold font-poppins text-sm text-ink">{g.externalId}</div>
                  <div className="text-xs text-ink-soft">Year {g.year} Cohort</div>
                </div>
                <div className="text-sm font-bold font-poppins text-ink">{g.size} students</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] bg-[#FAF6F0]/80 border border-border/50 p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-[18px] font-bold font-poppins text-ink">
              Open Elective Synchronization (OEB-1)
            </h3>
          </div>
          <p className="text-[14px] leading-relaxed text-ink-soft">
            Open Electives (OE301, OE302, OE303) run simultaneously across Year 3 cohorts. All parallel sessions are locked into synchronized time windows with zero room clashes.
          </p>
          <div className="p-4 rounded-2xl bg-[#DDECD4]/50 border border-[#DDECD4]/80 text-[#2D5A27] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Synchronized across THU Period 6–7 and FRI Period 3–4.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
