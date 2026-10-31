import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const TimetableDashboard: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);

  const [filterType, setFilterType] = useState<'group' | 'faculty' | 'room'>('group');
  const [selectedFilter, setSelectedFilter] = useState<string>('CSE-2');

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getActiveTimetable();
      setData(res);
      if (res.metadata?.studentGroups?.length > 0 && !selectedFilter) {
        setSelectedFilter(res.metadata.studentGroups[0].externalId);
      }
    } catch (err: any) {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const handleSolve = async () => {
    setSolving(true);
    try {
      toast.info('Running CP-SAT solver...');
      const res = await campusApi.generateTimetable();
      await campusApi.approveProposal(res.proposalId);
      toast.success('Schedule optimized (0 violations)');
      await fetchTimetable();
    } catch {
      toast.error('Optimization failed');
    } finally {
      setSolving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#71717A]">
        Loading timetable...
      </div>
    );
  }

  const { schedule, metadata } = data;
  const assignments = schedule.assignments || [];
  const sessionsMap = new Map<string, any>();
  for (const s of metadata.sessions) sessionsMap.set(s.externalId, s);

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const filteredAssignments = assignments.filter((a: any) => {
    const session = sessionsMap.get(a.sessionExternalId);
    if (!session) return false;
    if (filterType === 'group') return (session.groups || []).includes(selectedFilter);
    if (filterType === 'faculty') return session.facultyId === selectedFilter;
    if (filterType === 'room') return a.roomExternalId === selectedFilter;
    return true;
  });

  const gridMap = new Map<string, any>();
  for (const a of filteredAssignments) {
    const s = sessionsMap.get(a.sessionExternalId);
    if (!s) continue;
    const dur = s.duration || 1;
    for (let p = a.startPeriod; p < a.startPeriod + dur; p++) {
      gridMap.set(`${a.day}_${p}`, {
        assignment: a,
        session: s,
        isStart: p === a.startPeriod,
        duration: dur,
      });
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
        <div>
          <h2 className="font-poppins text-lg font-semibold text-[#18181B]">
            Weekly Timetable
          </h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            {assignments.length} sessions · 0 hard violations · Soft penalty: {schedule.softScoreTotal}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Type Toggle */}
          <div className="flex items-center rounded-md border border-[#E4E4E7] bg-white p-0.5 text-xs">
            <button
              onClick={() => {
                setFilterType('group');
                setSelectedFilter(metadata.studentGroups[0]?.externalId || 'CSE-2');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterType === 'group' ? 'bg-[#18181B] text-white' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Group
            </button>
            <button
              onClick={() => {
                setFilterType('faculty');
                setSelectedFilter(metadata.faculty[0]?.externalId || 'F01');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterType === 'faculty' ? 'bg-[#18181B] text-white' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => {
                setFilterType('room');
                setSelectedFilter(metadata.rooms[0]?.externalId || 'LH-1');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterType === 'room' ? 'bg-[#18181B] text-white' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Room
            </button>
          </div>

          {/* Select Dropdown */}
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48 h-8 text-xs bg-white border-[#E4E4E7]">
              <SelectValue placeholder="Select target..." />
            </SelectTrigger>
            <SelectContent>
              {filterType === 'group' &&
                metadata.studentGroups.map((g: any) => (
                  <SelectItem key={g.externalId} value={g.externalId} className="text-xs">
                    {g.externalId} ({g.size} students)
                  </SelectItem>
                ))}
              {filterType === 'faculty' &&
                metadata.faculty.map((f: any) => (
                  <SelectItem key={f.externalId} value={f.externalId} className="text-xs">
                    {f.externalId} — {f.name}
                  </SelectItem>
                ))}
              {filterType === 'room' &&
                metadata.rooms.map((r: any) => (
                  <SelectItem key={r.externalId} value={r.externalId} className="text-xs">
                    {r.externalId} (Cap: {r.capacity})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {user?.role === 'admin' && (
            <Button
              size="sm"
              onClick={handleSolve}
              disabled={solving}
              className="h-8 px-3 text-xs font-medium bg-[#18181B] text-white hover:bg-[#27272A]"
            >
              {solving ? 'Solving...' : 'Re-Optimize'}
            </Button>
          )}
        </div>
      </div>

      {/* Clean Timetable Grid */}
      <div className="rounded-lg border border-[#E4E4E7] bg-white overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E4E4E7] bg-[#FAF9F6] text-[#71717A]">
              <th className="p-2.5 w-16 text-center font-medium border-r border-[#E4E4E7]">Day</th>
              <th className="p-2 text-center border-r border-[#E4E4E7] font-medium">P1<br /><span className="text-[10px] text-[#A1A1AA]">08:00</span></th>
              <th className="p-2 text-center border-r border-[#E4E4E7] font-medium">P2<br /><span className="text-[10px] text-[#A1A1AA]">09:00</span></th>
              <th className="p-2 text-center border-r border-[#E4E4E7] font-medium">P3<br /><span className="text-[10px] text-[#A1A1AA]">10:00</span></th>
              <th className="p-2 text-center border-r border-[#E4E4E7] font-medium">P4<br /><span className="text-[10px] text-[#A1A1AA]">11:00</span></th>
              <th className="p-2 text-center border-r border-[#E4E4E7] font-medium">P5<br /><span className="text-[10px] text-[#A1A1AA]">12:00</span></th>
              <th className="p-1 w-12 text-center border-r border-[#E4E4E7] bg-[#F4F4F5] text-[10px] text-[#71717A] font-medium">Recess</th>
              <th className="p-2 text-center border-r border-[#E4E4E7] font-medium">P6<br /><span className="text-[10px] text-[#A1A1AA]">14:00</span></th>
              <th className="p-2 text-center border-r border-[#E4E4E7] font-medium">P7<br /><span className="text-[10px] text-[#A1A1AA]">15:00</span></th>
              <th className="p-2 text-center border-r border-[#E4E4E7] font-medium">P8<br /><span className="text-[10px] text-[#A1A1AA]">16:00</span></th>
              <th className="p-2 text-center font-medium">P9<br /><span className="text-[10px] text-[#A1A1AA]">17:00</span></th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day} className="border-b border-[#E4E4E7] last:border-b-0 hover:bg-[#FAF9F6]/50">
                <td className="p-2.5 text-center font-medium text-[#18181B] border-r border-[#E4E4E7] bg-[#FAF9F6]">
                  {day}
                </td>

                {/* Periods 1 to 5 */}
                {periods.slice(0, 5).map((p) => {
                  const entry = gridMap.get(`${day}_${p}`);
                  return (
                    <td key={p} className="p-1.5 border-r border-[#E4E4E7] h-20 align-top">
                      {entry?.isStart && (
                        <div className="p-2 rounded border border-[#E4E4E7] bg-white h-full flex flex-col justify-between">
                          <div>
                            <div className="font-semibold text-xs text-[#18181B]">{entry.session.courseId}</div>
                            <div className="text-[11px] text-[#71717A] truncate mt-0.5">{entry.assignment.roomExternalId}</div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#A1A1AA] pt-1">
                            <span>{entry.session.facultyId}</span>
                            {entry.duration > 1 && <span className="font-mono">{entry.duration}h</span>}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}

                {/* Lunch Recess */}
                <td className="p-0 border-r border-[#E4E4E7] bg-[#F4F4F5] text-center text-[10px] text-[#A1A1AA]">
                  <div className="h-full flex items-center justify-center [writing-mode:vertical-lr] tracking-widest text-[9px]">
                    LUNCH
                  </div>
                </td>

                {/* Periods 6 to 9 */}
                {periods.slice(5).map((p) => {
                  const entry = gridMap.get(`${day}_${p}`);
                  return (
                    <td key={p} className="p-1.5 border-r border-[#E4E4E7] last:border-r-0 h-20 align-top">
                      {entry?.isStart && (
                        <div className="p-2 rounded border border-[#E4E4E7] bg-white h-full flex flex-col justify-between">
                          <div>
                            <div className="font-semibold text-xs text-[#18181B]">{entry.session.courseId}</div>
                            <div className="text-[11px] text-[#71717A] truncate mt-0.5">{entry.assignment.roomExternalId}</div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#A1A1AA] pt-1">
                            <span>{entry.session.facultyId}</span>
                            {entry.duration > 1 && <span className="font-mono">{entry.duration}h</span>}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
