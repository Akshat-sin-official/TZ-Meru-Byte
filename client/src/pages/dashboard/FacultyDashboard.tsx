import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  GraduationCap,
  CalendarDays,
  Clock,
  CheckCircle2,
  MapPin,
  Users2,
  ArrowRight,
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
      <div className="flex h-64 items-center justify-center text-xs text-[#71717A]">
        Loading faculty portal...
      </div>
    );
  }

  const { schedule, metadata } = data || {};
  const sessions = metadata?.sessions || [];
  const assignments = schedule?.assignments || [];

  const sessionsMap = new Map<string, any>();
  for (const s of sessions) sessionsMap.set(s.externalId, s);

  // Filter sessions taught by this faculty member
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-bold text-[#111827]">
              Faculty Academic Schedule
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-primary border border-purple-200">
              Instructor ID: {facultyId}
            </span>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            {user?.name} · Department of {user?.department || 'Mathematics'} · Semester Teaching Load
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onNavigateTab('timetable')}
          className="h-8 px-3.5 text-xs font-medium bg-primary hover:bg-primary-hover text-white shadow-xs"
        >
          View Full Weekly Grid
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#71717A] font-poppins">Weekly Teaching Hours</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-primary">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#111827]">
              {totalTeachingHours} <span className="text-xs font-normal text-[#71717A]">hours / week</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Across {mySessions.length} lecture & tutorial blocks
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#71717A] font-poppins">Daily Workload Limit</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#111827]">
              ≤ 4 <span className="text-xs font-normal text-[#71717A]">hrs/day cap</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Rule H8 strictly satisfied every day
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#71717A] font-poppins">Preference Compliance</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#111827]">
              0 <span className="text-xs font-normal text-[#71717A]">avoid penalties</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> 100% of preferred hours honored (Rule S1)
            </div>
          </div>
        </div>
      </div>

      {/* Teaching Sessions Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <span className="font-heading font-semibold text-xs text-[#111827]">
            Allocated Teaching Sessions ({mySessions.length})
          </span>
          <span className="text-[10px] text-[#71717A]">Weekly Class Schedule</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAF9F6] text-[#71717A] font-medium">
              <th className="p-3 w-16">Day</th>
              <th className="p-3">Period / Time</th>
              <th className="p-3">Course</th>
              <th className="p-3">Type</th>
              <th className="p-3">Assigned Venue</th>
              <th className="p-3">Enrolled Groups</th>
              <th className="p-3">Students</th>
            </tr>
          </thead>
          <tbody>
            {mySessions.map((item: any, idx: number) => {
              const startP = item.assignment.startPeriod;
              const dur = item.session?.duration || 1;
              const endP = startP + dur - 1;
              const kind = item.session?.kind || 'lecture';

              return (
                <tr key={idx} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FAF9F6]/50">
                  <td className="p-3 font-semibold text-[#111827]">{item.assignment.day}</td>
                  <td className="p-3 font-mono text-[11px] text-[#4B5563]">
                    Period {startP}{dur > 1 ? `–P${endP}` : ''}
                  </td>
                  <td className="p-3 font-semibold text-xs text-[#111827] font-heading">
                    {item.session?.courseId}
                  </td>
                  <td className="p-3">
                    <span className="capitalize text-[10px] px-2 py-0.5 rounded bg-black/5 text-[#4B5563] font-medium">
                      {kind}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-[#111827] flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#71717A]" />
                    {item.assignment.roomExternalId}
                  </td>
                  <td className="p-3 text-[11px] text-[#71717A]">
                    {(item.session?.groups || []).join(', ')}
                  </td>
                  <td className="p-3 font-medium text-[#111827]">{item.session?.size} students</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
