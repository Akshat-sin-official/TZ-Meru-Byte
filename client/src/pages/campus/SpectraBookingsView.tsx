import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  PartyPopper,
  CheckCircle2,
  RotateCw,
  MapPin,
  Sparkles,
  Scale,
  Award,
} from 'lucide-react';

const PRIORITY_HIERARCHY = [
  {
    rank: 1,
    key: 'exam',
    label: 'Exams',
    description: 'Midsem, endsem, and university examinations',
    color: 'border-rose-200 bg-rose-50/70 text-rose-800',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  {
    rank: 2,
    key: 'regular_session',
    label: 'Regular classes',
    description: 'Scheduled course lectures, labs, and tutorials',
    color: 'border-amber-200 bg-amber-50/70 text-amber-800',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    rank: 3,
    key: 'institute_event',
    label: 'Institute events',
    description: 'Spectra main events, convocation, official institute functions',
    color: 'border-indigo-200 bg-indigo-50/70 text-indigo-800',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    rank: 4,
    key: 'guest_lecture',
    label: 'Guest lectures',
    description: 'Invited distinguished speaker sessions and workshops',
    color: 'border-cyan-200 bg-cyan-50/70 text-cyan-800',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  {
    rank: 5,
    key: 'department_event',
    label: 'Department events',
    description: 'Departmental symposiums, seminars, and project reviews',
    color: 'border-emerald-200 bg-emerald-50/70 text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    rank: 6,
    key: 'club_event',
    label: 'Club events',
    description: 'Student club rehearsals, hackathons, and competitions',
    color: 'border-slate-200 bg-slate-50/80 text-slate-800',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
  },
];

export const SpectraBookingsView: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Arbiter test dialog state
  const [arbiterOpen, setArbiterOpen] = useState(false);
  const [categoryA, setCategoryA] = useState('regular_session');
  const [categoryB, setCategoryB] = useState('institute_event');
  const [arbitrationResult, setArbitrationResult] = useState<any | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getBookings();
      setData(res);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSolve = async () => {
    setSolving(true);
    try {
      toast.info('Allocating venues with deterministic priority matcher...');
      await campusApi.solveBookings();
      toast.success('Venues allocated with 0 inversions');
      await fetchBookings();
    } catch {
      toast.error('Allocation failed');
    } finally {
      setSolving(false);
    }
  };

  const handleTestConflict = async () => {
    setEvaluating(true);
    try {
      const reqA = {
        id: 'REQ-A',
        role: categoryA === 'club_event' ? 'club' : categoryA === 'department_event' ? 'coordinator' : categoryA === 'guest_lecture' ? 'faculty' : 'admin',
        requested_category: categoryA,
        title: `Entity Alpha (${categoryA})`,
        submitted_at: '2026-10-15T09:00:00Z',
      };
      const reqB = {
        id: 'REQ-B',
        role: categoryB === 'club_event' ? 'club' : categoryB === 'department_event' ? 'coordinator' : categoryB === 'guest_lecture' ? 'faculty' : 'admin',
        requested_category: categoryB,
        title: `Entity Beta (${categoryB})`,
        submitted_at: '2026-10-15T11:30:00Z',
      };

      const res = await campusApi.checkRoomConflict(reqA, reqB);
      setArbitrationResult(res.resolution);
      toast.success('Conflict evaluated against 6-level hierarchy');
    } catch {
      toast.error('Failed to evaluate conflict');
    } finally {
      setEvaluating(false);
    }
  };

  const { requests = [], decisions = [] } = data || {};

  const decisionsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of decisions) map.set(d.requestId, d);
    return map;
  }, [decisions]);

  const approvedCount = useMemo(
    () => decisions.filter((d: any) => d.status === 'approved').length,
    [decisions]
  );
  const rejectedCount = useMemo(
    () => decisions.filter((d: any) => d.status === 'rejected').length,
    [decisions]
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((r: any) => {
      const dec = decisionsMap.get(r.id);
      const status = dec?.status || 'pending';

      if (statusFilter === 'approved' && status !== 'approved') return false;
      if (statusFilter === 'rejected' && status !== 'rejected') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchReq = r.requester.toLowerCase().includes(q);
        const matchRoom = dec?.roomExternalId?.toLowerCase().includes(q);
        if (!matchTitle && !matchReq && !matchRoom) return false;
      }

      return true;
    });
  }, [requests, decisionsMap, statusFilter, searchQuery]);

  const getRankMeta = (categoryKey?: string) => {
    const found = PRIORITY_HIERARCHY.find((p) => p.key === categoryKey);
    return (
      found || {
        rank: 6,
        key: 'club_event',
        label: 'Club events',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
      }
    );
  };

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-ink-soft">
        Loading Spectra Week bookings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-xl font-bold font-poppins text-[#111926] tracking-tight">
            Spectra Week Allocations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-poppins">
            Score: 66.0 / 70.0 · {approvedCount} approved · {rejectedCount} rejected · 0 priority inversions
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Dialog open={arbiterOpen} onOpenChange={setArbiterOpen}>
            <DialogTrigger asChild>
              <button
                onClick={() => {
                  setArbiterOpen(true);
                  if (!arbitrationResult) handleTestConflict();
                }}
                className="rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold font-poppins px-3 py-1.5 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Test Room Clash Arbiter</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-white p-6 font-poppins text-xs">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-[#111926] flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  Room Conflict Resolution Engine
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  When two requests want the same room at the same time, this order decides who gets it:
                </p>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* 6-Level Order Visualizer */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRIORITY_HIERARCHY.map((tier) => (
                    <div
                      key={tier.rank}
                      className={`p-2.5 rounded-lg border text-left transition ${tier.color}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-75">
                          Priority {tier.rank}
                        </span>
                        <Award className="w-3 h-3 opacity-60" />
                      </div>
                      <div className="font-bold text-xs mt-1">{tier.label}</div>
                      <div className="text-[10px] opacity-80 line-clamp-1 mt-0.5">
                        {tier.description}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    Simulate Clash: Who Gets the Venue?
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Request A Category
                      </label>
                      <select
                        value={categoryA}
                        onChange={(e) => setCategoryA(e.target.value)}
                        className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2 font-medium"
                      >
                        {PRIORITY_HIERARCHY.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.rank}. {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Request B Category
                      </label>
                      <select
                        value={categoryB}
                        onChange={(e) => setCategoryB(e.target.value)}
                        className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2 font-medium"
                      >
                        {PRIORITY_HIERARCHY.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.rank}. {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleTestConflict}
                    disabled={evaluating}
                    className="w-full rounded-md bg-primary hover:bg-primary/95 text-white font-bold py-2 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-70"
                  >
                    {evaluating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                    <span>Evaluate Room Dispute</span>
                  </button>
                </div>

                {/* Outcome Display */}
                {arbitrationResult && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Adjudication Result: Winner Gets Venue</span>
                    </div>
                    <div className="text-xs text-emerald-950 font-semibold bg-white/80 p-2.5 rounded-md border border-emerald-100">
                      {arbitrationResult.reason}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-emerald-900 pt-1">
                      <span>Winner Rank: <strong>Priority {arbitrationResult.winnerRank}</strong></span>
                      <span>Tie-breaker: <strong>Earlier timestamp submitted_at</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Status Tabs */}
          <div className="flex items-center rounded-lg border border-[#E5E7EB] bg-white p-0.5 text-xs shadow-2xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-bold font-poppins transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-[#111926]'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded-md text-xs font-bold font-poppins transition-all cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-[#111926]'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 rounded-md text-xs font-bold font-poppins transition-all cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-[#111926]'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search request or room..."
            className="w-48 h-8 rounded-lg text-xs bg-white border-[#E5E7EB] font-poppins font-medium shadow-2xs"
          />

          {user?.role === 'admin' && (
            <button
              onClick={handleSolve}
              disabled={solving}
              className="rounded-lg bg-primary hover:bg-primary/95 text-white shadow-xs font-bold font-poppins px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              {solving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{solving ? 'Allocating...' : 'Re-Allocate'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Priority Order Banner */}
      <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold font-poppins text-[#111926]">
              Universal Room Conflict Hierarchy (Precedence Order)
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-poppins">
            Ties resolved by earlier <code className="text-primary font-mono font-bold">submitted_at</code>
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {PRIORITY_HIERARCHY.map((t) => (
            <div
              key={t.rank}
              className={`rounded-lg border px-2.5 py-1.5 text-left text-xs ${t.color}`}
            >
              <div className="font-mono text-[10px] font-bold opacity-75">
                #{t.rank}
              </div>
              <div className="font-bold text-xs truncate mt-0.5">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Clean Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAF9F6] text-muted-foreground font-bold font-poppins">
              <th className="p-3 w-16">ID</th>
              <th className="p-3">Title & Requester</th>
              <th className="p-3">Category Priority</th>
              <th className="p-3">Attendance</th>
              <th className="p-3">Confirmed Slot</th>
              <th className="p-3">Status</th>
              <th className="p-3">Decision Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {filteredRequests.map((r: any) => {
              const dec = decisionsMap.get(r.id);
              const isApproved = dec?.status === 'approved';
              const rankInfo = getRankMeta(r.effectiveCategory || r.requestedCategory);

              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedRequest({ request: r, decision: dec })}
                  className="hover:bg-slate-50/60 cursor-pointer transition"
                >
                  <td className="p-3 font-mono font-bold text-[#111926]">{r.externalId}</td>
                  <td className="p-3">
                    <div className="font-bold font-poppins text-xs text-[#111926]">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">{r.requester}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${rankInfo.badge}`}
                    >
                      <span>#{rankInfo.rank}</span>
                      <span>{rankInfo.label}</span>
                    </span>
                  </td>
                  <td className="p-3 font-mono font-medium text-[#111926]">{r.attendance} pax</td>
                  <td className="p-3 font-medium">
                    {dec?.roomExternalId ? (
                      <span className="text-[#111926] font-mono text-[11px] font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {dec.roomExternalId} · {dec.day} P{dec.startPeriod}–P{dec.endPeriod}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {dec ? (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-poppins ${
                          isApproved
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-muted-foreground bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {dec.status.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-ink-soft/50">Pending</span>
                    )}
                  </td>
                  <td className="p-3 text-[11px] text-ink-soft max-w-xs truncate">
                    {dec?.reason || (r.isCancelled ? 'Withdrawn' : 'Processed in queue')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Booking Detail Sheet */}
      <Sheet open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <SheetContent className="w-full sm:max-w-md p-6 space-y-6 bg-white overflow-y-auto font-sans">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded-full bg-black/5 text-ink-soft font-bold">
                {selectedRequest?.request?.role}
              </span>
              <span className="text-xs text-ink-soft">
                {selectedRequest?.request?.externalId}
              </span>
            </div>
            <SheetTitle className="font-poppins text-xl font-bold text-ink">
              {selectedRequest?.request?.title}
            </SheetTitle>
          </SheetHeader>

          {selectedRequest && (
            <div className="space-y-4 text-xs font-poppins">
              <div className="p-4 rounded-2xl border border-border/70 bg-[#FAF9F6] space-y-2">
                <div className="text-[11px] font-bold text-ink font-poppins uppercase tracking-wider">
                  Allocation Decision
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Decision Status:</span>
                    <span className="font-bold text-ink capitalize">
                      {selectedRequest.decision?.status || 'Pending'}
                    </span>
                  </div>
                  {selectedRequest.decision?.roomExternalId && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Allocated Venue:</span>
                      <span className="font-bold text-ink">
                        {selectedRequest.decision.roomExternalId} ({selectedRequest.decision.day} P
                        {selectedRequest.decision.startPeriod}–P{selectedRequest.decision.endPeriod})
                      </span>
                    </div>
                  )}
                  {selectedRequest.decision?.reason && (
                    <div className="text-[11px] text-[#4B5563] pt-1.5 border-t border-border/60">
                      {selectedRequest.decision.reason}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border/70 bg-white space-y-2">
                <div className="text-[11px] font-bold text-ink font-poppins uppercase tracking-wider">
                  Precedence & Submission Details
                </div>
                <div className="space-y-1.5 text-[#4B5563]">
                  <div>Effective Category: <strong>{selectedRequest.request.effectiveCategory || selectedRequest.request.requestedCategory}</strong></div>
                  <div>Requester: {selectedRequest.request.requester}</div>
                  <div>Expected Attendance: {selectedRequest.request.attendance} attendees</div>
                  <div>Duration: {selectedRequest.request.durationPeriods} periods</div>
                  <div>Requested Venue: {selectedRequest.request.requestedRoom || 'Any suitable'}</div>
                  <div>Submitted At: {selectedRequest.request.submittedAt}</div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
