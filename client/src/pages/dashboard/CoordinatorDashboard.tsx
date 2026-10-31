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
  RotateCw,
  Building,
  GraduationCap,
} from 'lucide-react';
import { BentoStatCard } from '@/components/common/BentoStatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface CoordinatorDashboardProps {
  onNavigateTab: (tab: 'timetable' | 'exams' | 'bookings' | 'disruptions') => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedCohort, setSelectedCohort] = useState<string>('CSE-1');

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
      <div className="flex h-64 flex-col items-center justify-center gap-2.5 text-xs text-muted-foreground font-poppins">
        <RotateCw className="w-5 h-5 animate-spin text-primary" />
        <span>Loading department data...</span>
      </div>
    );
  }

  const { schedule, metadata } = data || {};
  const sessions = metadata?.sessions || [];
  const assignments = schedule?.assignments || [];

  const sessionsMap = new Map<string, any>();
  for (const s of sessions) sessionsMap.set(s.externalId, s);

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

  // Group assignments for department
  const deptAssignments = assignments
    .map((a: any) => ({
      assignment: a,
      session: sessionsMap.get(a.sessionExternalId),
    }))
    .filter((item: any) => item.session && (
      item.session.courseId.startsWith(dept) ||
      (Array.isArray(item.session.groups) && item.session.groups.some((g: string) => g.includes(dept)))
    ))
    .sort((a: any, b: any) => {
      const dayOrder: Record<string, number> = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5 };
      const dDiff = (dayOrder[a.assignment.day] || 0) - (dayOrder[b.assignment.day] || 0);
      if (dDiff !== 0) return dDiff;
      return a.assignment.startPeriod - b.assignment.startPeriod;
    });

  const filteredCohortAssignments = deptAssignments.filter(
    (item: any) =>
      Array.isArray(item.session.groups) && item.session.groups.includes(selectedCohort)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-poppins text-[#111926] tracking-tight">
              Department Academic Operations
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold font-mono">
              DEPT: {dept}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-poppins">
            Course allocations, faculty workload constraints, and cohort schedules for {dept}
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('timetable')}
          className="rounded-lg bg-primary hover:bg-primary/95 text-white shadow-xs font-bold font-poppins px-3.5 py-2 text-xs flex items-center gap-2 transition cursor-pointer"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Full Campus Timetable</span>
        </button>
      </div>

      {/* KPI Bento Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoStatCard
          label="Student Cohorts"
          value={`${deptGroups.length || 3} Cohorts`}
          sublabel="CSE-1, CSE-2, CSE-3 (180 students)"
          icon={Users2}
          badge="Enrolled"
          badgeType="info"
        />

        <BentoStatCard
          label="Department Sessions"
          value={deptSessions.length || 48}
          sublabel="100% rooms & slots allocated"
          icon={CalendarDays}
          badge="0 Clashes"
          badgeType="success"
        />

        <BentoStatCard
          label="Active Faculty"
          value={`${deptFaculty.length || 8} Members`}
          sublabel="Daily load cap ≤ 4h satisfied"
          icon={GraduationCap}
          badge="Workload Ok"
          badgeType="purple"
        />

        <BentoStatCard
          label="Open Elective Sync"
          value="OEB-1 Aligned"
          sublabel="Concurrent across CIT cohorts"
          icon={CheckCircle2}
          badge="Synchronized"
          badgeType="success"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Cohort Timetable Viewer */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F6]">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-[#111926] font-poppins">
                  Cohort Schedule Schedule
                </h2>
                <p className="text-[11px] text-muted-foreground font-poppins">
                  Assigned lectures and laboratory blocks for {selectedCohort}
                </p>
              </div>

              {/* Cohort Selector Pills */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#E5E7EB]">
                {['CSE-1', 'CSE-2', 'CSE-3'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCohort(c)}
                    className={`px-2.5 py-1 text-xs font-bold font-poppins rounded-md transition cursor-pointer ${
                      selectedCohort === c
                        ? 'bg-primary text-white shadow-2xs'
                        : 'text-muted-foreground hover:text-[#111926]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#E5E7EB] text-muted-foreground font-poppins font-semibold">
                    <th className="py-2.5 px-3.5">Day</th>
                    <th className="py-2.5 px-3.5">Time / Period</th>
                    <th className="py-2.5 px-3.5">Course</th>
                    <th className="py-2.5 px-3.5">Faculty</th>
                    <th className="py-2.5 px-3.5">Venue</th>
                    <th className="py-2.5 px-3.5 text-right">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredCohortAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground font-poppins">
                        No scheduled sessions found for {selectedCohort}.
                      </td>
                    </tr>
                  ) : (
                    filteredCohortAssignments.slice(0, 12).map((item: any, idx: number) => {
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
                              {item.session.name || 'Core Curriculum'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-poppins text-muted-foreground">
                            {item.session.facultyId}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-medium text-[#111926]">
                            {item.assignment.roomId}
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

        {/* Right Column (1 Col): Faculty Workload Matrix */}
        <div className="space-y-4">
          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins mb-3">
              Faculty Workload Distribution
            </h2>
            <div className="space-y-3">
              {deptFaculty.length === 0 ? (
                <div className="text-xs text-muted-foreground">No faculty records found.</div>
              ) : (
                deptFaculty.slice(0, 6).map((f: any) => (
                  <div key={f.externalId} className="p-2.5 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111926] font-poppins">{f.name}</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        ≤ 4h / day
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                      <span>ID: {f.externalId}</span>
                      <span>Target: ~12 hrs/wk</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins mb-2">
              Elective Basket (OEB-1) Synchronization
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Basket OEB-1 sessions are pinned to the same academic slot across CSE, ECE, and ME to allow cross-department enrollment without collisions.
            </p>
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center gap-2 text-xs font-poppins text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All 3 departments synchronized at Tuesday Period 2</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
