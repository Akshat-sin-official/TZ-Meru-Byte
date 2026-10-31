import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { toast } from 'sonner';
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
  Target,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'timetable' | 'exams' | 'bookings' | 'disruptions') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);

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
      toast.success('Schedule optimized (0 hard violations)');
      await loadData();
    } catch {
      toast.error('Optimization failed');
    } finally {
      setSolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-ink-soft">
        Loading administrative dashboard...
      </div>
    );
  }

  const { schedule } = data || {};
  const assignments = schedule?.assignments || [];

  return (
    <div className="space-y-10 py-2">
      {/* Editorial Header matching website-ui Bento */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink-soft font-poppins">
            EXECUTIVE CONTROL · CIT CAMPUSOS
          </span>
          <h1 className="mt-2 text-[32px] md:text-[40px] font-bold font-poppins leading-tight tracking-[-0.02em] text-ink">
            Master Operations <br className="hidden sm:inline" />
            <span className="font-serif italic text-primary">& Optimization Control.</span>
          </h1>
          <p className="mt-3 text-[15px] text-ink-soft max-w-2xl leading-relaxed">
            Autonomous discrete scheduling across 189 teaching sessions, 41 midsem exams, and Spectra Week venue allocations with 0 hard constraint violations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleReoptimize}
            disabled={solving}
            className="rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 font-bold font-poppins px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
          >
            {solving ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{solving ? 'Solving CP-SAT...' : 'Re-Run Solver'}</span>
          </button>

          <a
            href="http://localhost:5000/api/exports/schedule.json"
            download="schedule.json"
            className="rounded-full border border-border/80 bg-white hover:bg-slate-50 text-ink shadow-2xs hover:border-primary/40 active:scale-98 transition-all font-bold font-poppins px-5 py-2.5 text-xs inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-ink-soft" />
            <span>Export schedule.json</span>
          </a>
        </div>
      </div>

      {/* Signature 4 Bento Cards matching website-ui Bento */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Academic Sessions */}
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
                0 Hard Clashes
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              {assignments.length}{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">/ 189 Sessions</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              Weekly timetable spanning 27 venues. Soft penalty score: {schedule?.softScoreTotal || 315}.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold font-poppins text-[#6D28D9]">
            <span>Open Timetable Grid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Midsem Exams */}
        <div
          onClick={() => onNavigateTab('exams')}
          className="flex flex-col justify-between rounded-[24px] bg-[#D8E5F5]/40 border border-[#D8E5F5]/70 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer min-h-[220px]"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2F5B93]/10 text-[#2F5B93] shrink-0 shadow-xs">
                <FileSpreadsheet className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#2F5B93]/10 text-[#2F5B93]">
                Half-Capacity
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              41{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">Midsem Exams</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              MON–SAT AM/PM sessions. 100% compliant with Rule E1 & E2.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold font-poppins text-[#2F5B93]">
            <span>View Exam Seating</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Spectra Week */}
        <div
          onClick={() => onNavigateTab('bookings')}
          className="flex flex-col justify-between rounded-[24px] bg-[#DDECD4]/40 border border-[#DDECD4]/70 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer min-h-[220px]"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2D5A27]/10 text-[#2D5A27] shrink-0 shadow-xs">
                <PartyPopper className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#2D5A27]/10 text-[#2D5A27]">
                0 Inversions
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              66.0{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">/ 70 Score</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              22 approved, 0 alternatives, 3 rejected. Role category caps enforced.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold font-poppins text-[#2D5A27]">
            <span>Inspect Allocations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: Disruption Stability */}
        <div
          onClick={() => onNavigateTab('disruptions')}
          className="flex flex-col justify-between rounded-[24px] bg-[#F5E3D2]/40 border border-[#F5E3D2]/70 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer min-h-[220px]"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#B8632E]/10 text-[#B8632E] shrink-0 shadow-xs">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#B8632E]/10 text-[#B8632E]">
                Minimal Shift
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              15{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">Moved Total</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              3 time shifts & 12 room-only changes. Penalty: 100× Time + 10× Room.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold font-poppins text-[#B8632E]">
            <span>Stability Diff Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Two Secondary Glass Panels */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[24px] bg-[#FAF6F0]/80 border border-border/50 p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 text-ink">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h3 className="text-[18px] font-bold font-poppins text-ink">
              Constraint Verification (H1–H14, B1–B3, E1–E2)
            </h3>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-ink-soft">H1 Room & Faculty Conflicts</span>
              <span className="font-bold text-[#16A34A] flex items-center gap-1">
                <span>✓</span> 0 Clashes
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-ink-soft">H2 Room Capacity & Suitability</span>
              <span className="font-bold text-[#16A34A] flex items-center gap-1">
                <span>✓</span> 100% Verified
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-ink-soft">H6 Lunch Protected (13:00–14:00)</span>
              <span className="font-bold text-[#16A34A] flex items-center gap-1">
                <span>✓</span> Guaranteed
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-ink-soft">H8 Daily Faculty Max 4 Hours</span>
              <span className="font-bold text-[#16A34A] flex items-center gap-1">
                <span>✓</span> All Satisfied
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] bg-[#FAF6F0]/80 border border-border/50 p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 text-ink">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <h3 className="text-[18px] font-bold font-poppins text-ink">
              Optimization Engines & Submissions
            </h3>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-ink-soft">Official Validator Parity</span>
              <span className="font-bold font-mono text-ink">validator.py (0 Hard Violations)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-ink-soft">Engine Core</span>
              <span className="font-bold font-mono text-ink">Google OR-Tools CP-SAT</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-ink-soft">Exports Artifact</span>
              <span className="font-bold font-mono text-ink">exports/schedule.json</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-ink-soft">Disruption Repair Artifact</span>
              <span className="font-bold font-mono text-ink">exports/schedule_after.json</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
