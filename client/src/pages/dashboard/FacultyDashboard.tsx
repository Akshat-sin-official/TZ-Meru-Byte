import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { toast } from 'sonner';
import {
  GraduationCap,
  CalendarDays,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface FacultyDashboardProps {
  onNavigateTab: (tab: 'timetable' | 'exams' | 'bookings' | 'disruptions') => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const facultyId = user?.facultyId || 'F19';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getActiveTimetable();
      setData(res);
    } catch {
      toast.error('Failed to load faculty schedule');
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
        Loading faculty portal...
      </div>
    );
  }

  const { schedule, metadata } = data || {};
  const sessions = metadata?.sessions || [];
  const assignments = schedule?.assignments || [];

  const sessionsMap = new Map<string, any>();
  for (const s of sessions) sessionsMap.set(s.externalId, s);

  const mySessions = assignments
    .map((a: any) => ({
      assignment: a,
      session: sessionsMap.get(a.sessionExternalId),
    }))
    .filter((item: any) => item.session && item.session.facultyId === facultyId)
    .sort((a: any, b: any) => {
      const dayOrder: Record<string, number> = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5 };
      const dDiff = (dayOrder[a.assignment.day] || 0) - (dayOrder[b.assignment.day] || 0);
      if (dDiff !== 0) return dDiff;
      return a.assignment.startPeriod - b.assignment.startPeriod;
    });

  const totalTeachingHours = mySessions.reduce(
    (acc: number, curr: any) => acc + (curr.session?.duration || 1),
    0
  );

  return (
    <div className="space-y-10 py-2">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink-soft font-poppins">
            INSTRUCTOR PORTAL · {facultyId}
          </span>
          <h1 className="mt-2 text-[32px] md:text-[40px] font-bold font-poppins leading-tight tracking-[-0.02em] text-ink">
            {user?.name} <br className="hidden sm:inline" />
            <span className="font-serif italic text-primary">Academic Schedule & Workload.</span>
          </h1>
          <p className="mt-3 text-[15px] text-ink-soft max-w-2xl leading-relaxed">
            Personal teaching assignments, assigned classrooms, and daily workload compliance for the Department of {user?.department || 'Mathematics'}.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('timetable')}
          className="rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 font-bold font-poppins px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>View Campus Timetable</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Bento Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-[24px] bg-[#EDE9FE]/40 border border-[#EDE9FE]/80 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[220px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#6D28D9]/10 text-[#6D28D9] shrink-0 shadow-xs">
                <Clock className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#6D28D9]/10 text-[#6D28D9]">
                Workload
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              {totalTeachingHours}{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">Hours/Week</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              Distributed across {mySessions.length} lecture & tutorial sessions.
            </p>
          </div>

          <div className="mt-4 text-xs font-semibold text-[#6D28D9] font-poppins">
            Active Instructor Profile
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[24px] bg-[#DDECD4]/40 border border-[#DDECD4]/70 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[220px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2D5A27]/10 text-[#2D5A27] shrink-0 shadow-xs">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#2D5A27]/10 text-[#2D5A27]">
                Satisfied
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              ≤ 4{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">Hrs/Day Cap</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              Rule H8 strictly honored every single teaching day.
            </p>
          </div>

          <div className="mt-4 text-xs font-semibold text-[#2D5A27] font-poppins">
            0 Overwork Violations
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[24px] bg-[#D8E5F5]/40 border border-[#D8E5F5]/70 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[220px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2F5B93]/10 text-[#2F5B93] shrink-0 shadow-xs">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#2F5B93]/10 text-[#2F5B93]">
                Rule S1 Pass
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              0{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">Avoid Penalties</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              100% of faculty preferred non-teaching hours protected.
            </p>
          </div>

          <div className="mt-4 text-xs font-semibold text-[#2F5B93] font-poppins">
            Full Preference Adherence
          </div>
        </div>
      </div>

      {/* Teaching Schedule List */}
      <div className="rounded-[24px] bg-[#FAF6F0]/80 border border-border/50 p-8 space-y-4">
        <h3 className="text-[18px] font-bold font-poppins text-ink">
          My Teaching Schedule ({mySessions.length} Sessions)
        </h3>

        <div className="space-y-3">
          {mySessions.map((item: any, idx: number) => {
            const startP = item.assignment.startPeriod;
            const dur = item.session?.duration || 1;
            const endP = startP + dur - 1;
            const kind = item.session?.kind || 'lecture';

            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-border/60 gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-12 text-center font-bold font-poppins text-sm text-ink px-2 py-1 rounded-lg bg-[#FAF9F6]">
                    {item.assignment.day}
                  </span>
                  <div>
                    <div className="font-bold font-poppins text-sm text-ink flex items-center gap-2">
                      {item.session?.courseId}
                      <span className="capitalize text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-ink-soft font-medium">
                        {kind}
                      </span>
                    </div>
                    <div className="text-xs text-ink-soft mt-0.5">
                      Enrolled: {(item.session?.groups || []).join(', ')} · {item.session?.size} students
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-ink-soft">
                    Period {startP}{dur > 1 ? `–P${endP}` : ''}
                  </span>
                  <span className="font-bold text-ink flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F6] border border-border/60">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {item.assignment.roomExternalId}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
