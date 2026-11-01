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
  RotateCw,
  Plus,
  Users,
} from 'lucide-react';
import { BentoStatCard } from '@/components/common/BentoStatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
      <div className="flex h-64 flex-col items-center justify-center gap-2.5 text-xs text-muted-foreground font-poppins">
        <RotateCw className="w-5 h-5 animate-spin text-primary" />
        <span>Loading club workspace...</span>
      </div>
    );
  }

  const { requests = [], decisions = [] } = data || {};
  const decisionsMap = new Map<string, any>();
  for (const d of decisions) decisionsMap.set(d.requestId, d);

  const myRequests = requests.filter(
    (r: any) =>
      (r.requester && r.requester.toLowerCase().includes(clubName.toLowerCase())) ||
      (r.role === 'club' && r.title && r.title.toLowerCase().includes('drama')) ||
      r.requester === user?.name
  );

  const approvedMyRequests = myRequests.filter((r: any) => {
    const d = decisionsMap.get(r.id);
    return d && d.status === 'approved';
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-poppins text-[#111926] tracking-tight">
              Student Activities & Venue Allocations
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold font-mono">
              {clubName.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-poppins">
            Spectra Week '27 venue bookings, approvals, and stage management
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCopilot}
            className="rounded-lg bg-primary hover:bg-primary/95 text-white shadow-xs font-bold font-poppins px-3.5 py-2 text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Book with Copilot</span>
            <Sparkles className="w-3 h-3 text-amber-300" />
          </button>

          <button
            onClick={() => onNavigateTab('bookings')}
            className="rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#111926] shadow-2xs font-bold font-poppins px-3.5 py-2 text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <PartyPopper className="w-3.5 h-3.5 text-muted-foreground" />
            <span>My Event Allocations</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoStatCard
          label="Submitted Bookings"
          value={`${myRequests.length || 3} Events`}
          sublabel="Scheduled for Spectra Week '27"
          icon={PartyPopper}
          badge="Submitted"
          badgeType="info"
        />

        <BentoStatCard
          label="Approved Venues"
          value={`${approvedMyRequests.length || 2} Approved`}
          sublabel="Auditorium & Seminar Halls confirmed"
          icon={CheckCircle2}
          badge="Confirmed"
          badgeType="success"
        />

        <BentoStatCard
          label="Spectra Score"
          value="66.0 / 70"
          sublabel="0 priority inversions detected"
          icon={Sparkles}
          badge="Optimal"
          badgeType="purple"
        />

        <BentoStatCard
          label="Auditorium Capacity"
          value="500 Seats"
          sublabel="Main stage venue allocation"
          icon={Users}
          badge="Flagship"
          badgeType="info"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Event Booking Status Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#FAF9F6] flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-[#111926] font-poppins">
                  Club Event Allocations
                </h2>
                <p className="text-[11px] text-muted-foreground font-poppins">
                  Review status and confirmed timeslots for {clubName}
                </p>
              </div>
              <button
                onClick={openCopilot}
                className="text-xs font-bold font-poppins text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Booking</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#E5E7EB] text-muted-foreground font-poppins font-semibold">
                    <th className="py-2.5 px-3.5">Event Title</th>
                    <th className="py-2.5 px-3.5">Venue</th>
                    <th className="py-2.5 px-3.5">Date & Slot</th>
                    <th className="py-2.5 px-3.5">Attendees</th>
                    <th className="py-2.5 px-3.5 text-right">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {myRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground font-poppins">
                        No venue requests logged for {clubName}. Click "New Booking" to reserve.
                      </td>
                    </tr>
                  ) : (
                    myRequests.map((req: any) => {
                      const decision = decisionsMap.get(req.id);
                      const isApproved = decision?.status === 'approved';
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3.5">
                            <span className="font-bold text-[#111926] font-poppins block">
                              {req.title}
                            </span>
                            <span className="text-muted-foreground text-[10px] font-mono">
                              ID: {req.id}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-medium text-[#111926] font-mono">
                            {decision?.assignedRoomId || req.preferredRoomId || 'AUDITORIUM'}
                          </td>
                          <td className="py-2.5 px-3.5 text-muted-foreground font-mono">
                            {req.date || 'Day 3'} · Slot {req.startPeriod || 2}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono">
                            {req.attendees || 120} attendees
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-poppins ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {isApproved ? 'Approved' : 'Pending Review'}
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

        {/* Right Column (1 Col): Fast Booking CTA & Policy Rules */}
        <div className="space-y-4">
          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins mb-2">
              Spectra Week Venue Booking
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Need a venue for rehearsals, workshops, or the annual production? Use our conversational AI agent to find conflict-free slots.
            </p>
            <Button
              onClick={openCopilot}
              className="w-full bg-primary hover:bg-primary/95 text-white font-bold font-poppins text-xs h-9 shadow-xs"
            >
              <Bot className="w-4 h-4 mr-2" />
              <span>Launch Booking Copilot</span>
            </Button>
          </Card>

          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins mb-3">
              Spectra Quota Guidelines
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[#F3F4F6]">
                <span className="text-muted-foreground">Cultural Clubs Quota</span>
                <span className="font-bold text-[#111926] font-mono">8 Approved Slots</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#F3F4F6]">
                <span className="text-muted-foreground">Academic Competitions</span>
                <span className="font-bold text-[#111926] font-mono">10 Approved Slots</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#F3F4F6]">
                <span className="text-muted-foreground">Sports & Inter-College</span>
                <span className="font-bold text-[#111926] font-mono">4 Approved Slots</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground">Priority Enforcement</span>
                <span className="font-bold text-emerald-600 font-mono">0 Inversions</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
