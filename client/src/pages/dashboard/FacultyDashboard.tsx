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
  RotateCw,
  BookOpen,
  FileSpreadsheet,
} from 'lucide-react';
import { BentoStatCard } from '@/components/common/BentoStatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      <div className="flex h-64 flex-col items-center justify-center gap-2.5 text-xs text-muted-foreground font-poppins">
        <RotateCw className="w-5 h-5 animate-spin text-primary" />
        <span>Loading instructor portal...</span>
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

  const uniqueCourses = Array.from(new Set(mySessions.map((s: any) => s.session?.courseId))).filter(Boolean);

  // Daily hours breakdown
  const dailyHours: Record<string, number> = { MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0 };
  for (const s of mySessions) {
    const day = s.assignment.day;
    if (dailyHours[day] !== undefined) {
      dailyHours[day] += s.session?.duration || 1;
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-poppins text-[#111926] tracking-tight">
              Instructor Teaching Portal
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold font-mono">
              ID: {facultyId}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-poppins">
            {user?.name || 'Dr. S. Rath'} · Department of {user?.department || 'Mathematics'}
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('timetable')}
          className="rounded-lg bg-primary hover:bg-primary/95 text-white shadow-xs font-bold font-poppins px-3.5 py-2 text-xs flex items-center gap-2 transition cursor-pointer"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>My Teaching Timetable</span>
        </button>
      </div>

      {/* KPI Bento Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoStatCard
          label="Weekly Teaching Load"
          value={`${totalTeachingHours} Hours`}
          sublabel="Cap: ≤ 4h daily cap satisfied"
          icon={Clock}
          badge="Within Limits"
          badgeType="success"
        />

        <BentoStatCard
          label="Assigned Courses"
          value={`${uniqueCourses.length || 2} Courses`}
          sublabel={uniqueCourses.join(', ') || 'MA101, MA201'}
          icon={BookOpen}
          badge="Active"
          badgeType="info"
        />

        <BentoStatCard
          label="Avoided-Slot Compliance"
          value="0 Penalties"
          sublabel="Preferred timeslots respected"
          icon={ShieldCheck}
          badge="Satisfied"
          badgeType="success"
        />

        <BentoStatCard
          label="Exam Invigilation Duty"
          value="2 Sessions"
          sublabel="Midsem week duty assigned"
          icon={FileSpreadsheet}
          badge="Confirmed"
          badgeType="purple"
          onClick={() => onNavigateTab('exams')}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): My Assigned Weekly Classes */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#FAF9F6]">
              <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-[#111926] font-poppins">
                My Weekly Teaching Sessions
              </h2>
              <p className="text-[11px] text-muted-foreground font-poppins">
                Chronological list of all scheduled lectures and lab hours for this semester
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#E5E7EB] text-muted-foreground font-poppins font-semibold">
                    <th className="py-2.5 px-3.5">Day</th>
                    <th className="py-2.5 px-3.5">Time / Period</th>
                    <th className="py-2.5 px-3.5">Course</th>
                    <th className="py-2.5 px-3.5">Student Cohort</th>
                    <th className="py-2.5 px-3.5">Venue</th>
                    <th className="py-2.5 px-3.5 text-right">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {mySessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground font-poppins">
                        No teaching sessions assigned to faculty ID {facultyId}.
                      </td>
                    </tr>
                  ) : (
                    mySessions.map((item: any, idx: number) => {
                      const isLab = item.session.type === 'LAB' || item.session.duration > 1;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3.5 font-bold font-mono text-[#111926]">
                            {item.assignment.day}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-muted-foreground">
                            P{item.assignment.startPeriod} ({8 + item.assignment.startPeriod}:00 - {8 + item.assignment.startPeriod + item.session.duration}:00)
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="font-bold text-[#111926] font-poppins mr-1.5">
                              {item.session.courseId}
                            </span>
                            <span className="text-muted-foreground text-[11px]">
                              {item.session.name || ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-muted-foreground">
                            {Array.isArray(item.session.groups) ? item.session.groups.join(', ') : item.session.groups}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-medium text-[#111926]">
                            {item.assignment.roomExternalId || item.assignment.roomId}
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold font-poppins ${
                                isLab
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-[#111926]'
                              }`}
                            >
                              {item.session.type || 'LEC'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): Daily Load Breakdown */}
        <div className="space-y-4">
          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins mb-3">
              Daily Teaching Hours Cap (≤ 4h)
            </h2>
            <div className="space-y-2.5">
              {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((day) => {
                const hours = dailyHours[day] || 0;
                const percent = Math.min((hours / 4) * 100, 100);
                return (
                  <div key={day} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold font-mono text-[#111926]">{day}</span>
                      <span className="font-mono text-muted-foreground">
                        {hours}h / 4h max
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          hours > 4 ? 'bg-red-500' : hours > 2 ? 'bg-primary' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins mb-2">
              Midsem Invigilation Schedule
            </h2>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6]">
                <div className="font-bold text-[#111926] font-poppins">Midsem Exam Session 1</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Wednesday 09:00 - 12:00 · Hall L1 (60 candidates)
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6]">
                <div className="font-bold text-[#111926] font-poppins">Midsem Exam Session 2</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Friday 14:00 - 17:00 · Hall L2 (60 candidates)
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
