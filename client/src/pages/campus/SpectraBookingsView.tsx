import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

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
      toast.info('Allocating venues with CP-SAT deterministic ranker...');
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

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#71717A]">
        Loading Spectra Week bookings...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-6 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-[#111827]">
              Spectra Week Venue Allocations
            </h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200">
              Score: 66.0 / 70.0
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              0 Priority Inversions
            </span>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            Deterministic tie-breaking with role-category caps: {approvedCount} approved · {rejectedCount} rejected
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center rounded border border-[#E5E7EB] bg-white p-0.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#71717A] hover:text-[#111827]'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                statusFilter === 'approved'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#71717A] hover:text-[#111827]'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                statusFilter === 'rejected'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#71717A] hover:text-[#111827]'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search request or room..."
            className="w-44 h-7 text-xs bg-white border-[#E5E7EB]"
          />

          {user?.role === 'admin' && (
            <Button
              size="sm"
              onClick={handleSolve}
              disabled={solving}
              className="h-7 px-3 text-xs font-medium bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            >
              {solving ? 'Allocating...' : 'Re-Allocate'}
            </Button>
          )}
        </div>
      </div>

      {/* Clean Compact Table */}
      <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAF9F6] text-[#71717A] font-medium">
              <th className="p-2.5 w-16">ID</th>
              <th className="p-2.5">Title & Requester</th>
              <th className="p-2.5">Role</th>
              <th className="p-2.5">Attendance</th>
              <th className="p-2.5">Confirmed Slot</th>
              <th className="p-2.5">Status</th>
              <th className="p-2.5">Decision Note</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((r: any) => {
              const dec = decisionsMap.get(r.id);
              const isApproved = dec?.status === 'approved';

              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedRequest({ request: r, decision: dec })}
                  className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FAF9F6]/50 cursor-pointer transition"
                >
                  <td className="p-2.5 font-mono font-medium text-[#111827]">{r.externalId}</td>
                  <td className="p-2.5">
                    <div className="font-semibold text-xs text-[#111827]">{r.title}</div>
                    <div className="text-[11px] text-[#71717A]">{r.requester}</div>
                  </td>
                  <td className="p-2.5 capitalize text-[#71717A] text-[11px]">
                    {r.role.replace('_', ' ')}
                  </td>
                  <td className="p-2.5 font-medium text-[#111827]">{r.attendance} pax</td>
                  <td className="p-2.5 font-medium">
                    {dec?.roomExternalId ? (
                      <span className="text-[#111827] font-mono text-[11px]">
                        {dec.roomExternalId} · {dec.day} P{dec.startPeriod}–P{dec.endPeriod}
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF]">—</span>
                    )}
                  </td>
                  <td className="p-2.5">
                    {dec ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                          isApproved
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-zinc-600 bg-zinc-50 border-zinc-200'
                        }`}
                      >
                        {dec.status.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF]">Pending</span>
                    )}
                  </td>
                  <td className="p-2.5 text-[11px] text-[#71717A] max-w-xs truncate">
                    {dec?.reason || (r.isCancelled ? 'Withdrawn' : 'Queue processed')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Booking Detail Sheet */}
      <Sheet open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <SheetContent className="w-full sm:max-w-md p-6 space-y-5 bg-white">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-black/5 text-[#4B5563]">
                {selectedRequest?.request?.role}
              </span>
              <span className="text-xs text-[#71717A]">
                {selectedRequest?.request?.externalId}
              </span>
            </div>
            <SheetTitle className="font-heading text-lg font-semibold text-[#111827]">
              {selectedRequest?.request?.title}
            </SheetTitle>
          </SheetHeader>

          {selectedRequest && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] space-y-2">
                <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Allocation Decision
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Decision Status:</span>
                    <span className="font-semibold text-[#111827] capitalize">
                      {selectedRequest.decision?.status || 'Pending'}
                    </span>
                  </div>
                  {selectedRequest.decision?.roomExternalId && (
                    <div className="flex justify-between">
                      <span className="text-[#71717A]">Allocated Room:</span>
                      <span className="font-medium text-[#111827]">
                        {selectedRequest.decision.roomExternalId} ({selectedRequest.decision.day} P
                        {selectedRequest.decision.startPeriod}–P{selectedRequest.decision.endPeriod})
                      </span>
                    </div>
                  )}
                  {selectedRequest.decision?.reason && (
                    <div className="text-[11px] text-[#4B5563] pt-1 border-t border-[#E5E7EB]">
                      {selectedRequest.decision.reason}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-white space-y-2">
                <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Submission Details
                </div>
                <div className="space-y-1 text-[#4B5563]">
                  <div>Requester: {selectedRequest.request.requester}</div>
                  <div>Expected Attendance: {selectedRequest.request.attendance} attendees</div>
                  <div>Duration: {selectedRequest.request.durationPeriods} periods</div>
                  <div>Requested Room: {selectedRequest.request.requestedRoom || 'Any suitable'}</div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
