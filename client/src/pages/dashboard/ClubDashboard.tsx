import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  PartyPopper,
  CalendarDays,
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
      <div className="flex h-64 items-center justify-center text-xs text-[#71717A]">
        Loading club workspace...
      </div>
    );
  }

  const { requests = [], decisions = [] } = data || {};
  const decisionsMap = new Map<string, any>();
  for (const d of decisions) decisionsMap.set(d.requestId, d);

  // Filter requests submitted by this club or requester
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-bold text-[#111827]">
              {clubName} Portal
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-primary border border-purple-200">
              Spectra Week '27 (Week 7)
            </span>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            Event venue requests, stage & auditorium allocations, and scheduling priority tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={openCopilot}
            className="h-8 px-3.5 text-xs font-medium bg-primary hover:bg-primary-hover text-white shadow-xs"
          >
            <Bot className="w-3.5 h-3.5 mr-1.5" />
            Book with CIT Copilot
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateTab('bookings')}
            className="h-8 px-3 text-xs border-[#E5E7EB] bg-white text-[#111827]"
          >
            All Campus Allocations
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#71717A] font-poppins">
              Approved Venues
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#111827]">
              {approvedMyRequests.length} <span className="text-xs font-normal text-[#71717A]">venues confirmed</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Fully locked for Spectra Week
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#71717A] font-poppins">
              Priority Compliance
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#111827]">
              0 <span className="text-xs font-normal text-[#71717A]">priority inversions</span>
            </div>
            <div className="text-[11px] text-purple-700 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Role category caps verified (B3)
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#71717A] font-poppins">
              Event Windows
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#111827]">
              P10–P13 <span className="text-xs font-normal text-[#71717A]">18:00–22:00</span>
            </div>
            <div className="text-[11px] text-[#71717A] mt-0.5">
              Dedicated evening slots for cultural fest
            </div>
          </div>
        </div>
      </div>

      {/* Club Booking Decisions */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <span className="font-heading font-semibold text-xs text-[#111827]">
            My Club Booking Requests
          </span>
          <span className="text-[10px] text-[#71717A]">Spectra Week Status</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAF9F6] text-[#71717A] font-medium">
              <th className="p-3">Event Title</th>
              <th className="p-3">Expected Size</th>
              <th className="p-3">Confirmed Slot</th>
              <th className="p-3">Status</th>
              <th className="p-3">Venue Features</th>
            </tr>
          </thead>
          <tbody>
            {myRequests.map((r: any) => {
              const dec = decisionsMap.get(r.id);
              const isApproved = dec?.status === 'approved';

              return (
                <tr key={r.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FAF9F6]/50">
                  <td className="p-3">
                    <div className="font-semibold text-xs text-[#111827]">{r.title}</div>
                    <div className="text-[10px] font-mono text-[#71717A]">{r.externalId}</div>
                  </td>
                  <td className="p-3 font-medium text-[#111827]">{r.attendance} attendees</td>
                  <td className="p-3">
                    {dec?.roomExternalId ? (
                      <span className="font-medium text-[#111827] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {dec.roomExternalId} ({dec.day} P{dec.startPeriod}–P{dec.endPeriod})
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF]">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                        isApproved
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-zinc-600 bg-zinc-50 border-zinc-200'
                      }`}
                    >
                      {dec ? dec.status : 'Pending'}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-[#71717A]">
                    {(r.needs || []).join(', ') || 'Standard hall'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
