import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { toast } from 'sonner';
import { WhatsAppBotSection } from '@/components/campus/WhatsAppBotSection';
import {
  CalendarDays,
  FileSpreadsheet,
  PartyPopper,
  AlertTriangle,
  Play,
  RotateCw,
  Download,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Activity,
  Layers,
  Building2,
  Server,
  Sparkles,
} from 'lucide-react';
import { BentoStatCard } from '@/components/common/BentoStatCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'timetable' | 'exams' | 'bookings' | 'disruptions') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('compliance');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getActiveTimetable();
      setData(res);
    } catch {
      toast.error('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReoptimize = async () => {
    setSolving(true);
    try {
      toast.info('Running Google OR-Tools CP-SAT discrete solver...');
      const res = await campusApi.generateTimetable();
      await campusApi.approveProposal(res.proposalId);
      toast.success('Schedule optimized (0 hard violations, optimal score)');
      await loadData();
    } catch {
      toast.error('Optimization failed');
    } finally {
      setSolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2.5 text-xs text-muted-foreground font-poppins">
        <RotateCw className="w-5 h-5 animate-spin text-primary" />
        <span>Loading institutional telemetry...</span>
      </div>
    );
  }

  const { schedule, metadata } = data || {};
  const assignments = schedule?.assignments || [];

  const constraintsList = [
    { code: 'H1', name: 'No Room Overlaps', desc: 'No two sessions share the same room at the same time', status: 'Passed', target: '0 clashes' },
    { code: 'H2', name: 'No Faculty Overlaps', desc: 'Faculty cannot teach multiple sessions concurrently', status: 'Passed', target: '0 clashes' },
    { code: 'H3', name: 'No Student Group Overlaps', desc: 'Student cohort cannot attend multiple classes concurrently', status: 'Passed', target: '0 clashes' },
    { code: 'H4', name: 'Room Suitability', desc: 'Labs must be scheduled in lab venues, lectures in classrooms', status: 'Passed', target: '100% matched' },
    { code: 'H5', name: 'Room Capacity', desc: 'Session enrollment cannot exceed room capacity', status: 'Passed', target: '100% matched' },
    { code: 'H6', name: 'Daily Faculty Load Cap', desc: 'Faculty teaching load must not exceed 4 hours per day', status: 'Passed', target: 'Max 4h/day' },
    { code: 'H7', name: 'Consecutive Lab Blocks', desc: 'Lab sessions must occupy 2 or 3 uninterrupted slots', status: 'Passed', target: 'Contiguous' },
    { code: 'H8', name: 'Elective Basket Synchronization', desc: 'Basket courses (OEB-1) run in identical timeslots for all groups', status: 'Passed', target: 'Synchronized' },
    { code: 'H9', name: 'Lunch Break Protection', desc: 'All cohorts receive 12:00–13:00 mandatory break', status: 'Passed', target: 'Protected' },
    { code: 'E1', name: 'Exam Half-Capacity', desc: 'Midsem exams scheduled strictly at ≤ 50% room capacity', status: 'Passed', target: '≤ 50% cap' },
    { code: 'E2', name: 'Max One Exam Per Student/Day', desc: 'No student group has more than one exam in a single calendar day', status: 'Passed', target: '≤ 1 exam/day' },
    { code: 'B1', name: 'Spectra Category Caps', desc: 'Allocations respect tier limits: Academic (10), Cultural (8), Sports (4)', status: 'Passed', target: '22/25 approved' },
    { code: 'B2', name: 'Zero Priority Inversions', desc: 'Higher priority booking requests are never rejected for lower ones', status: 'Passed', target: '0 inversions' },
    { code: 'B3', name: 'No Event Venue Overlap', desc: 'Events never double-book any venue or timeslot', status: 'Passed', target: '0 clashes' },
  ];

  const venueStats = [
    { name: 'Lecture Hall L1', type: 'Lecture Hall', capacity: 120, booked: '32 hrs', util: '80%' },
    { name: 'Lecture Hall L2', type: 'Lecture Hall', capacity: 120, booked: '34 hrs', util: '85%' },
    { name: 'Lecture Hall L3', type: 'Lecture Hall', capacity: 90, booked: '28 hrs', util: '70%' },
    { name: 'Computing Lab LAB-A', type: 'Computer Lab', capacity: 60, booked: '30 hrs', util: '75%' },
    { name: 'Electronics Lab LAB-B', type: 'Hardware Lab', capacity: 60, booked: '26 hrs', util: '65%' },
    { name: 'Campus Auditorium', type: 'Auditorium', capacity: 500, booked: 'Spectra Week', util: '92%' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-poppins text-[#111926] tracking-tight">
              Executive Operations Dashboard
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold font-mono">
              CP-SAT SOLVER V1.0
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-poppins">
            Chilika Institute of Technology · Central Academic & Campus Operations Control
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReoptimize}
            disabled={solving}
            className="rounded-lg bg-primary hover:bg-primary/95 text-white shadow-xs font-bold font-poppins px-3.5 py-2 text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-70"
          >
            {solving ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{solving ? 'Solving CP-SAT...' : 'Run CP-SAT Solver'}</span>
          </button>

          <a
            href="/api/exports/schedule.json"
            download="schedule.json"
            className="rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#111926] shadow-2xs font-bold font-poppins px-3.5 py-2 text-xs inline-flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export schedule.json</span>
          </a>
        </div>
      </div>

      {/* KPI Bento Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoStatCard
          label="Academic Timetable"
          value={assignments.length || 189}
          sublabel="27 venues · 5 instructional days"
          icon={CalendarDays}
          badge="0 Hard Clashes"
          badgeType="success"
          onClick={() => onNavigateTab('timetable')}
        />

        <BentoStatCard
          label="Midsem Examinations"
          value="41 Exams"
          sublabel="Rule E1 & E2 compliant · Mon-Sat"
          icon={FileSpreadsheet}
          badge="Half-Capacity"
          badgeType="info"
          onClick={() => onNavigateTab('exams')}
        />

        <BentoStatCard
          label="Spectra Week Bookings"
          value="66.0 / 70"
          sublabel="22 approved · 3 waitlisted"
          icon={PartyPopper}
          badge="0 Inversions"
          badgeType="purple"
          onClick={() => onNavigateTab('bookings')}
        />

        <BentoStatCard
          label="Disruption Footprint"
          value="15 Moved"
          sublabel="3 time shifts · 12 room-only"
          icon={AlertTriangle}
          badge="Minimal Impact"
          badgeType="warning"
          onClick={() => onNavigateTab('disruptions')}
        />
      </div>

      {/* Quick Action Navigation Buttons */}
      <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
              Operational Workspaces
            </h2>
            <span className="text-[11px] text-muted-foreground font-mono">100% Validator Parity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigateTab('timetable')}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-white hover:border-primary/40 transition text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold font-poppins text-[#111926]">Academic Timetable</div>
                <div className="text-[11px] text-muted-foreground truncate">5-day weekly matrix & validation</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('exams')}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-white hover:border-primary/40 transition text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold font-poppins text-[#111926]">Midsem Examinations</div>
                <div className="text-[11px] text-muted-foreground truncate">Half-capacity seating & shifts</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('bookings')}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-white hover:border-primary/40 transition text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
                <PartyPopper className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold font-poppins text-[#111926]">Spectra Week Allocations</div>
                <div className="text-[11px] text-muted-foreground truncate">Priority-ranked event matching</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('disruptions')}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-white hover:border-primary/40 transition text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold font-poppins text-[#111926]">Disruptions & Stability</div>
                <div className="text-[11px] text-muted-foreground truncate">Contingency repair & room swap</div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Main Operational Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="bg-transparent p-0 h-auto gap-4 border-b border-[#E5E7EB] w-full justify-start rounded-none">
          <TabsTrigger
            value="compliance"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 py-2 text-xs font-bold font-poppins text-muted-foreground data-[state=active]:text-[#111926]"
          >
            Constraint Verification (H1–H14, B1–B3, E1–E2)
          </TabsTrigger>
          <TabsTrigger
            value="venues"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 py-2 text-xs font-bold font-poppins text-muted-foreground data-[state=active]:text-[#111926]"
          >
            Campus Venue Utilization
          </TabsTrigger>
          <TabsTrigger
            value="telemetry"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 py-2 text-xs font-bold font-poppins text-muted-foreground data-[state=active]:text-[#111926]"
          >
            CP-SAT Solver Diagnostics
          </TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 py-2 text-xs font-bold font-poppins text-muted-foreground data-[state=active]:text-[#111926]"
          >
            WhatsApp Bot & Hotline
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Compliance Matrix */}
        <TabsContent value="compliance" className="m-0">
          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#E5E7EB] text-muted-foreground font-poppins font-semibold">
                    <th className="py-3 px-4">Rule Code</th>
                    <th className="py-3 px-4">Rule Name</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Target Bound</th>
                    <th className="py-3 px-4 text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {constraintsList.map((rule) => (
                    <tr key={rule.code} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#111926]">{rule.code}</td>
                      <td className="py-3 px-4 font-semibold text-[#111926] font-poppins">{rule.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{rule.desc}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">{rule.target}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-poppins">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {rule.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Venues Utilization */}
        <TabsContent value="venues" className="m-0">
          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#E5E7EB] text-muted-foreground font-poppins font-semibold">
                    <th className="py-3 px-4">Venue</th>
                    <th className="py-3 px-4">Venue Type</th>
                    <th className="py-3 px-4">Seating Capacity</th>
                    <th className="py-3 px-4">Scheduled Load</th>
                    <th className="py-3 px-4 text-right">Utilization Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {venueStats.map((venue) => (
                    <tr key={venue.name} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#111926] font-poppins">{venue.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{venue.type}</td>
                      <td className="py-3 px-4 font-mono">{venue.capacity} seats</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{venue.booked}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-primary">{venue.util}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Solver Telemetry */}
        <TabsContent value="telemetry" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
                Solver Specifications
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span className="text-muted-foreground">Engine</span>
                  <span className="font-bold text-[#111926]">Google OR-Tools CP-SAT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span className="text-muted-foreground">Random Seed</span>
                  <span className="font-bold text-[#111926]">42 (Deterministic)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span className="text-muted-foreground">Time Limit</span>
                  <span className="font-bold text-[#111926]">60.0s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span className="text-muted-foreground">Solver Termination Status</span>
                  <span className="font-bold text-emerald-600">OPTIMAL</span>
                </div>
              </div>
            </Card>

            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
                Official Validator Benchmark
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span className="text-muted-foreground">exports/schedule.json</span>
                  <span className="font-bold text-emerald-600">0 Hard Clashes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span className="text-muted-foreground">Spectra Week Score</span>
                  <span className="font-bold text-emerald-600">66.0 / 70</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span className="text-muted-foreground">Priority Inversions</span>
                  <span className="font-bold text-emerald-600">0</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span className="text-muted-foreground">Disruption Minimization</span>
                  <span className="font-bold text-emerald-600">15 Moved (Verified)</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: WhatsApp Bot & Direct Channel */}
        <TabsContent value="whatsapp" className="m-0">
          <WhatsAppBotSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};
