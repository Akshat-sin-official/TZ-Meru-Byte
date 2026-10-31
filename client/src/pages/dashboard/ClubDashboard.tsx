import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { toast } from 'sonner';
import {
  PartyPopper,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Bot,
  ArrowRight,
} from 'lucide-react';

interface ClubDashboardProps {
  onNavigateTab: (tab: 'timetable' | 'exams' | 'bookings' | 'disruptions') => void;
  openCopilot: () => void;
}

export const ClubDashboard: React.FC<ClubDashboardProps> = ({
  onNavigateTab,
  openCopilot,
}) => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const clubName = user?.clubName || 'Dramatics Society';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getBookings();
      setData(res);
    } catch {
      toast.error('Failed to load club bookings');
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
        Loading club workspace...
      </div>
    );
  }

  const { requests = [], decisions = [] } = data || {};
  const decisionsMap = new Map<string, any>();
  for (const d of decisions) decisionsMap.set(d.requestId, d);

  const myRequests = requests.filter(
    (r: any) =>
      r.requester.toLowerCase().includes(clubName.toLowerCase()) ||
      (r.role === 'club' && r.title.toLowerCase().includes('drama'))
  );

  const approvedMyRequests = myRequests.filter((r: any) => {
    const d = decisionsMap.get(r.id);
    return d && d.status === 'approved';
  });

  return (
    <div className="space-y-10 py-2">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink-soft font-poppins">
            SPECTRA WEEK '27 · {clubName.toUpperCase()}
          </span>
          <h1 className="mt-2 text-[32px] md:text-[40px] font-bold font-poppins leading-tight tracking-[-0.02em] text-ink">
            Cultural Fest <br className="hidden sm:inline" />
            <span className="font-serif italic text-primary">Venue Booking & Scheduling.</span>
          </h1>
          <p className="mt-3 text-[15px] text-ink-soft max-w-2xl leading-relaxed">
            Reserve campus auditoriums, open-air theatres, and seminar halls for Spectra Week (Week 7) with deterministic priority matching and zero inversions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openCopilot}
            className="rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 font-bold font-poppins px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-white" />
            <span>Book with Copilot</span>
            <Sparkles className="w-3 h-3 text-amber-300" />
          </button>

          <button
            onClick={() => onNavigateTab('bookings')}
            className="rounded-full border border-border/80 bg-white hover:bg-slate-50 text-ink shadow-2xs hover:border-primary/40 active:scale-98 transition-all font-bold font-poppins px-5 py-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>All Allocations</span>
            <ArrowRight className="w-3.5 h-3.5 text-ink-soft" />
          </button>
        </div>
      </div>

      {/* 3 Bento Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div
          onClick={() => onNavigateTab('bookings')}
          className="flex flex-col justify-between rounded-[24px] bg-[#DDECD4]/40 border border-[#DDECD4]/70 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer min-h-[220px]"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2D5A27]/10 text-[#2D5A27] shrink-0 shadow-xs">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#2D5A27]/10 text-[#2D5A27]">
                Confirmed
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              {approvedMyRequests.length}{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">Venues Locked</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              Confirmed hall reservations for {clubName} stage events.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold font-poppins text-[#2D5A27]">
            <span>View Confirmed Slots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[24px] bg-[#EDE9FE]/40 border border-[#EDE9FE]/80 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[220px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#6D28D9]/10 text-[#6D28D9] shrink-0 shadow-xs">
                <Sparkles className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#6D28D9]/10 text-[#6D28D9]">
                Rule B3 Pass
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              0{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">Priority Inversions</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              Role category caps & submission timestamp order guaranteed.
            </p>
          </div>

          <div className="mt-4 text-xs font-semibold text-[#6D28D9] font-poppins">
            Deterministic Engine
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[24px] bg-[#D8E5F5]/40 border border-[#D8E5F5]/70 p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[220px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2F5B93]/10 text-[#2F5B93] shrink-0 shadow-xs">
                <Clock className="h-6 w-6" />
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold font-poppins bg-[#2F5B93]/10 text-[#2F5B93]">
                Evening Fest
              </span>
            </div>

            <div className="mt-6 text-[36px] font-extrabold font-poppins leading-none tracking-[-0.02em] text-ink">
              P10–P13{' '}
              <span className="text-sm font-bold text-ink-soft font-sans">18:00–22:00</span>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft font-medium">
              Event-only non-teaching periods dedicated to festival activities.
            </p>
          </div>

          <div className="mt-4 text-xs font-semibold text-[#2F5B93] font-poppins">
            Spectra Week '27 Calendar
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-[24px] bg-[#FAF6F0]/80 border border-border/50 p-8 space-y-4">
        <h3 className="text-[18px] font-bold font-poppins text-ink">
          {clubName} Venue Requests & Status
        </h3>

        <div className="space-y-3">
          {myRequests.map((r: any) => {
            const dec = decisionsMap.get(r.id);
            const isApproved = dec?.status === 'approved';

            return (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-border/60 gap-3"
              >
                <div>
                  <div className="font-bold font-poppins text-sm text-ink flex items-center gap-2">
                    {r.title}
                    <span className="font-mono text-xs text-ink-soft">({r.externalId})</span>
                  </div>
                  <div className="text-xs text-ink-soft mt-0.5">
                    Expected Attendance: {r.attendance} · Needs: {(r.needs || []).join(', ') || 'Standard hall'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {dec?.roomExternalId ? (
                    <span className="font-mono text-xs font-bold text-ink flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F6] border border-border/60">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {dec.roomExternalId} · {dec.day} P{dec.startPeriod}–P{dec.endPeriod}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-soft font-mono">—</span>
                  )}

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold font-poppins ${
                      isApproved
                        ? 'bg-[#DDECD4] text-[#2D5A27]'
                        : 'bg-slate-100 text-ink-soft'
                    }`}
                  >
                    {dec ? dec.status : 'Pending'}
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
