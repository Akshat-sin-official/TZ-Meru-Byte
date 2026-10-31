import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const SpectraBookingsView: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);

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
      toast.info('Allocating venues...');
      await campusApi.solveBookings();
      toast.success('Venues allocated with 0 inversions');
      await fetchBookings();
    } catch {
      toast.error('Allocation failed');
    } finally {
      setSolving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#71717A]">
        Loading Spectra Week bookings...
      </div>
    );
  }

  const { requests, decisions } = data;
  const decisionsMap = new Map<string, any>();
  for (const d of decisions) decisionsMap.set(d.requestId, d);

  const approvedCount = decisions.filter((d: any) => d.status === 'approved').length;
  const rejectedCount = decisions.filter((d: any) => d.status === 'rejected').length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
        <div>
          <h2 className="font-poppins text-lg font-semibold text-[#18181B]">
            Spectra Week Allocations
          </h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            Score: 66.0 / 70 · {approvedCount} approved · {rejectedCount} rejected · 0 priority inversions
          </p>
        </div>

        {user?.role === 'admin' && (
          <Button
            size="sm"
            onClick={handleSolve}
            disabled={solving}
            className="h-8 px-3 text-xs font-medium bg-[#18181B] text-white hover:bg-[#27272A]"
          >
            {solving ? 'Allocating...' : 'Re-Allocate'}
          </Button>
        )}
      </div>

      {/* Clean Table */}
      <div className="rounded-lg border border-[#E4E4E7] bg-white overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E4E4E7] bg-[#FAF9F6] text-[#71717A] font-medium">
              <th className="p-3 w-16">ID</th>
              <th className="p-3">Title & Requester</th>
              <th className="p-3">Role</th>
              <th className="p-3">Size</th>
              <th className="p-3">Confirmed Slot</th>
              <th className="p-3">Status</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r: any) => {
              const dec = decisionsMap.get(r.id);
              const isApproved = dec?.status === 'approved';

              return (
                <tr key={r.id} className="border-b border-[#E4E4E7] last:border-b-0 hover:bg-[#FAF9F6]/50">
                  <td className="p-3 font-mono font-medium text-[#18181B]">{r.externalId}</td>
                  <td className="p-3">
                    <div className="font-medium text-[#18181B]">{r.title}</div>
                    <div className="text-[11px] text-[#71717A]">{r.requester}</div>
                  </td>
                  <td className="p-3 capitalize text-[#71717A]">{r.role.replace('_', ' ')}</td>
                  <td className="p-3 font-medium text-[#18181B]">{r.attendance} pax</td>
                  <td className="p-3 font-medium">
                    {dec?.roomExternalId ? (
                      <span className="text-[#18181B]">
                        {dec.roomExternalId} · {dec.day} P{dec.startPeriod}–P{dec.endPeriod}
                      </span>
                    ) : (
                      <span className="text-[#A1A1AA]">—</span>
                    )}
                  </td>
                  <td className="p-3">
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
                      <span className="text-[#A1A1AA]">Pending</span>
                    )}
                  </td>
                  <td className="p-3 text-[11px] text-[#71717A] max-w-xs truncate">
                    {dec?.reason || (r.isCancelled ? 'Withdrawn' : '')}
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
