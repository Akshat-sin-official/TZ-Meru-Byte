import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const DisruptionsView: React.FC = () => {
  const { user } = useCampusAuth();
  const [solving, setSolving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [repairResult, setRepairResult] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'time' | 'room'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
        reason: 'Conference travel every Monday for semester',
      },
      {
        type: 'room_unavailable',
        room_id: 'CR-102',
        days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        periods: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        reason: 'Water leak, room closed for semester',
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
        },
      },
    ],
  };

  const loadInitialDisruption = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getLatestDisruption();
      if (res && res.available) {
        setRepairResult(res);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialDisruption();
  }, []);

  const handleRunRepair = async () => {
    setSolving(true);
    try {
      toast.info('Computing stability-optimal CP-SAT repair...');
      const res = await campusApi.submitDisruption(sampleDisruption);
      setRepairResult(res);
      toast.success(`Repaired with minimal disruption (${res.summary.totalMoved} moved)`);
    } catch {
      toast.error('Repair failed');
    } finally {
      setSolving(false);
    }
  };

  const movedList = repairResult?.movedSessions || [];

  const filteredMoved = useMemo(() => {
    return movedList.filter((m: any) => {
      if (filterType === 'time' && m.type !== 'time_changed') return false;
      if (filterType === 'room' && m.type !== 'room_only_changed') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = m.sessionId.toLowerCase().includes(q);
        const matchRoom =
          m.oldSlot.room.toLowerCase().includes(q) || m.newSlot.room.toLowerCase().includes(q);
        if (!matchId && !matchRoom) return false;
      }

      return true;
    });
  }, [movedList, filterType, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-6 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-[#111827]">
              Disruption Recovery
            </h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200">
              Penalty: 100× Time + 10× Room
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              0 Hard Violations
            </span>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            2-Stage CP-SAT Stability Optimization: Minimizes disruption footprint across student and faculty routines
          </p>
        </div>

        {user?.role === 'admin' && (
          <Button
            size="sm"
            onClick={handleRunRepair}
            disabled={solving}
            className="h-7 px-3 text-xs font-medium bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
          >
            {solving ? 'Optimizing...' : 'Re-Simulate Disruption'}
          </Button>
        )}
      </div>

      {/* Disruption Event Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {sampleDisruption.changes.map((ch: any, idx: number) => (
          <div key={idx} className="p-3 rounded-lg border border-[#E5E7EB] bg-white space-y-1 shadow-2xs">
            <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              {ch.type.replace('_', ' ')}
            </div>
            <div className="text-xs font-semibold text-[#111827] font-mono">
              {ch.faculty_id || ch.room_id || ch.session?.id}
            </div>
            <div className="text-[11px] text-[#71717A] truncate">
              {ch.reason || 'Added emergency tutorial'}
            </div>
          </div>
        ))}
      </div>

      {/* Diff Table & Filter Bar */}
      {repairResult && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              {/* Type Filter Pills */}
              <div className="flex items-center rounded border border-[#E5E7EB] bg-white p-0.5 text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    filterType === 'all'
                      ? 'bg-[#111827] text-white'
                      : 'text-[#71717A] hover:text-[#111827]'
                  }`}
                >
                  All Moved ({repairResult.summary?.totalMoved || 0})
                </button>
                <button
                  onClick={() => setFilterType('time')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    filterType === 'time'
                      ? 'bg-[#111827] text-white'
                      : 'text-[#71717A] hover:text-[#111827]'
                  }`}
                >
                  Time Changed ({repairResult.summary?.timeChanged || 0})
                </button>
                <button
                  onClick={() => setFilterType('room')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    filterType === 'room'
                      ? 'bg-[#111827] text-white'
                      : 'text-[#71717A] hover:text-[#111827]'
                  }`}
                >
                  Room Only ({repairResult.summary?.roomOnlyChanged || 0})
                </button>
              </div>

              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search session or room..."
                className="w-44 h-7 text-xs bg-white border-[#E5E7EB]"
              />
            </div>

            <a
              href="http://localhost:5000/api/exports/schedule_after.json"
              download="schedule_after.json"
              className="text-xs text-[#7C3AED] hover:underline font-medium inline-flex items-center gap-1"
            >
              Export schedule_after.json
            </a>
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAF9F6] text-[#71717A] font-medium">
                  <th className="p-2.5 w-24">Session</th>
                  <th className="p-2.5">Original Assignment</th>
                  <th className="p-2.5">Repaired Assignment</th>
                  <th className="p-2.5">Disruption Type</th>
                  <th className="p-2.5">Impact</th>
                </tr>
              </thead>
              <tbody>
                {filteredMoved.map((m: any) => {
                  const isTimeChanged = m.type === 'time_changed';
                  return (
                    <tr
                      key={m.sessionId}
                      className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FAF9F6]/50 transition"
                    >
                      <td className="p-2.5 font-mono font-semibold text-[#111827]">{m.sessionId}</td>
                      <td className="p-2.5 text-[#71717A] font-mono text-[11px]">
                        {m.oldSlot.day} P{m.oldSlot.start} in {m.oldSlot.room}
                      </td>
                      <td className="p-2.5 font-semibold text-[#111827] font-mono text-[11px]">
                        {m.newSlot.day} P{m.newSlot.start} in {m.newSlot.room}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                            isTimeChanged
                              ? 'text-amber-800 bg-amber-50 border-amber-200'
                              : 'text-purple-800 bg-purple-50 border-purple-200'
                          }`}
                        >
                          {isTimeChanged ? 'Time & Room Changed' : 'Room Reassigned Only'}
                        </span>
                      </td>
                      <td className="p-2.5 text-[11px] text-[#71717A]">
                        {isTimeChanged ? 'Rescheduled due to room/faculty block' : 'Moved to adjacent available room'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
