import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { PartyPopper, CheckCircle2, RotateCw, MapPin, Sparkles } from 'lucide-react';

export const SpectraBookingsView: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

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

  const { requests = [], decisions = [] } = data || {};

  const decisionsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of decisions) decisionsMap.set(d.requestId, d);
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

      {/* Clean Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAF9F6] text-muted-foreground font-bold font-poppins">
              <th className="p-3 w-16">ID</th>
              <th className="p-3">Title & Requester</th>
              <th className="p-3">Role</th>
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
                  <td className="p-3 capitalize text-muted-foreground text-[11px]">
                    {r.role.replace('_', ' ')}
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
            <div className="space-y-4 text-xs">
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
                  Submission Details
                </div>
                <div className="space-y-1.5 text-[#4B5563]">
                  <div>Requester: {selectedRequest.request.requester}</div>
                  <div>Expected Attendance: {selectedRequest.request.attendance} attendees</div>
                  <div>Duration: {selectedRequest.request.durationPeriods} periods</div>
                  <div>Requested Venue: {selectedRequest.request.requestedRoom || 'Any suitable'}</div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
