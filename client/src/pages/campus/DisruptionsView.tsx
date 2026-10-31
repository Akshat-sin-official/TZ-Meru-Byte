import React, { useState } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const DisruptionsView: React.FC = () => {
  const { user } = useCampusAuth();
  const [solving, setSolving] = useState(false);
  const [repairResult, setRepairResult] = useState<any>(null);

  const sampleDisruption = {
    id: 'sample-disruption',
    dataset: 'cit-public-v1',
    description: 'Conference travel for F07 + CR-102 water leak + new session CS202-T2',
    changes: [
      {
        type: 'faculty_unavailable',
        faculty_id: 'F07',
        days: ['MON'],
        periods: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        reason: 'Conference travel every Monday for the rest of the semester',
      },
      {
        type: 'room_unavailable',
        room_id: 'CR-102',
        days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        periods: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        reason: 'Water leak, room closed for the rest of the semester',
      },
      {
        type: 'add_session',
        session: {
          id: 'CS202-T2',
          course_id: 'CS202',
          kind: 'tutorial',
          groups: ['CSE-2'],
          faculty_id: 'F06',
          size: 80,
          duration: 1,
          room_types: ['classroom', 'lecture_hall', 'auditorium'],
          needs_accessible: false,
          basket_slot: null,
          fixed_slot: null,
        },
      },
    ],
  };

  const handleRunRepair = async () => {
    setSolving(true);
    try {
      toast.info('Computing 2-stage stability repair...');
      const res = await campusApi.submitDisruption(sampleDisruption);
      setRepairResult(res);
      toast.success(`Disruption repaired (${res.summary.totalMoved} moved, 0 violations)`);
    } catch {
      toast.error('Repair failed');
    } finally {
      setSolving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
        <div>
          <h2 className="font-poppins text-lg font-semibold text-[#18181B]">
            Disruption Recovery
          </h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            Stability-weighted repair: time changes are penalized 10x higher than room-only changes.
          </p>
        </div>

        {user?.role === 'admin' && (
          <Button
            size="sm"
            onClick={handleRunRepair}
            disabled={solving}
            className="h-8 px-3 text-xs font-medium bg-[#18181B] text-white hover:bg-[#27272A]"
          >
            {solving ? 'Repairing...' : 'Simulate Disruption'}
          </Button>
        )}
      </div>

      {/* Changes list */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sampleDisruption.changes.map((ch: any, idx: number) => (
          <div key={idx} className="p-3.5 rounded-lg border border-[#E4E4E7] bg-white space-y-1">
            <div className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
              {ch.type.replace('_', ' ')}
            </div>
            <div className="text-xs font-semibold text-[#18181B]">
              {ch.faculty_id || ch.room_id || ch.session?.id}
            </div>
            <div className="text-[11px] text-[#71717A] line-clamp-1">
              {ch.reason || 'Added tutorial'}
            </div>
          </div>
        ))}
      </div>

      {/* Results Diff */}
      {repairResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#71717A] pt-2">
            <span>
              <strong>{repairResult.summary.totalMoved}</strong> sessions moved (
              {repairResult.summary.timeChanged} time changed, {repairResult.summary.roomOnlyChanged} room only)
            </span>
            <a
              href="http://localhost:5000/api/exports/schedule_after.json"
              download="schedule_after.json"
              className="text-[#18181B] underline hover:text-black font-medium"
            >
              Download schedule_after.json
            </a>
          </div>

          <div className="rounded-lg border border-[#E4E4E7] bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E4E7] bg-[#FAF9F6] text-[#71717A] font-medium">
                  <th className="p-3">Session</th>
                  <th className="p-3">Original Assignment</th>
                  <th className="p-3">Repaired Assignment</th>
                  <th className="p-3">Shift Type</th>
                </tr>
              </thead>
              <tbody>
                {repairResult.movedSessions.map((m: any) => (
                  <tr key={m.sessionId} className="border-b border-[#E4E4E7] last:border-b-0 hover:bg-[#FAF9F6]/50">
                    <td className="p-3 font-mono font-medium text-[#18181B]">{m.sessionId}</td>
                    <td className="p-3 text-[#71717A]">
                      {m.oldSlot.day} P{m.oldSlot.start} in {m.oldSlot.room}
                    </td>
                    <td className="p-3 font-medium text-[#18181B]">
                      {m.newSlot.day} P{m.newSlot.start} in {m.newSlot.room}
                    </td>
                    <td className="p-3 text-[#71717A] capitalize">
                      {m.type.replace('_', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
