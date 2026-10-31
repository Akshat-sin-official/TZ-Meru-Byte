import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AlertTriangle, RotateCw, Download, ArrowRight } from 'lucide-react';

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
      toast.info('Computing 2-stage stability CP-SAT repair...');
      const res = await campusApi.submitDisruption(sampleDisruption);
      setRepairResult(res);
      toast.success(`Disruption repaired with minimal shift (${res.summary.totalMoved} moved)`);
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
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink-soft font-poppins">
            CONTINUOUS OPERATIONS · STABILITY SOLVER
          </span>
          <h2 className="mt-1 text-[28px] font-bold font-poppins text-ink tracking-tight">
            Disruption Recovery & Stability Repair
          </h2>
          <p className="text-xs text-ink-soft mt-1">
            2-Stage CP-SAT Optimization: 100× Time Change Penalty + 10× Room Change Penalty · 0 hard violations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <button
              onClick={handleRunRepair}
              disabled={solving}
              className="rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 text-white shadow-xs hover:shadow-md font-bold font-poppins px-5 py-2 text-xs flex items-center gap-2 cursor-pointer"
            >
              {solving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{solving ? 'Solving Repair...' : 'Simulate Disruption'}</span>
            </button>
          )}

          <a
            href="http://localhost:5000/api/exports/schedule_after.json"
            download="schedule_after.json"
            className="rounded-full border border-border/80 bg-white hover:bg-slate-50 text-ink shadow-2xs hover:border-primary/40 active:scale-98 transition-all font-bold font-poppins px-4 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-ink-soft" />
            <span>schedule_after.json</span>
          </a>
        </div>
      </div>

      {/* Disruption Events Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sampleDisruption.changes.map((ch: any, idx: number) => (
          <div
            key={idx}
            className="rounded-[24px] border border-border/70 bg-white p-5 space-y-2 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)]"
          >
            <div className="text-[10px] font-bold text-ink-soft font-poppins uppercase tracking-wider">
              {ch.type.replace('_', ' ')}
            </div>
            <div className="text-sm font-bold font-poppins text-ink font-mono">
              {ch.faculty_id || ch.room_id || ch.session?.id}
            </div>
            <div className="text-xs text-ink-soft truncate">
              {ch.reason || 'Added emergency session'}
            </div>
          </div>
        ))}
      </div>

      {/* Diff Table & Filter Bar */}
      {repairResult && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center rounded-full border border-border/80 bg-white p-1 text-xs shadow-2xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold font-poppins transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  All Moved ({repairResult.summary?.totalMoved || 0})
                </button>
                <button
                  onClick={() => setFilterType('time')}
                  className={`px-3 py-1 rounded-full text-xs font-bold font-poppins transition-all cursor-pointer ${
                    filterType === 'time'
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  Time Changed ({repairResult.summary?.timeChanged || 0})
                </button>
                <button
                  onClick={() => setFilterType('room')}
                  className={`px-3 py-1 rounded-full text-xs font-bold font-poppins transition-all cursor-pointer ${
                    filterType === 'room'
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  Room Only ({repairResult.summary?.roomOnlyChanged || 0})
                </button>
              </div>

              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search session or room..."
                className="w-48 h-8 rounded-full text-xs bg-white border-border/80 font-poppins font-medium shadow-2xs"
              />
            </div>

            <div className="text-xs text-ink-soft font-poppins font-bold">
              Stability Score: {repairResult.summary?.timeChanged * 100 + repairResult.summary?.roomOnlyChanged * 10} penalty points
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-white overflow-x-auto shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-2">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border/60 bg-[#FAF9F6] text-ink-soft font-bold font-poppins">
                  <th className="p-3 w-28">Session</th>
                  <th className="p-3">Original Assignment</th>
                  <th className="p-3">Repaired Assignment</th>
                  <th className="p-3">Disruption Classification</th>
                  <th className="p-3">Impact</th>
                </tr>
              </thead>
              <tbody>
                {filteredMoved.map((m: any) => {
                  const isTimeChanged = m.type === 'time_changed';
                  return (
                    <tr
                      key={m.sessionId}
                      className="border-b border-border/60 last:border-b-0 hover:bg-[#FAF9F6]/50 transition"
                    >
                      <td className="p-3 font-mono font-bold text-ink">{m.sessionId}</td>
                      <td className="p-3 text-ink-soft font-mono text-[11px]">
                        {m.oldSlot.day} P{m.oldSlot.start} in {m.oldSlot.room}
                      </td>
                      <td className="p-3 font-bold text-ink font-mono text-[11px]">
                        {m.newSlot.day} P{m.newSlot.start} in {m.newSlot.room}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold font-poppins ${
                            isTimeChanged
                              ? 'text-amber-800 bg-[#F5E3D2]'
                              : 'text-[#6D28D9] bg-[#EDE9FE]'
                          }`}
                        >
                          {isTimeChanged ? 'Time & Room Changed' : 'Room Reassigned Only'}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-ink-soft">
                        {isTimeChanged ? 'Rescheduled due to room/faculty block' : 'Adjacent available room swap'}
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
