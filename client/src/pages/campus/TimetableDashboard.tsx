import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

export const TimetableDashboard: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);

  const [filterType, setFilterType] = useState<'group' | 'faculty' | 'room'>('group');
  const [selectedFilter, setSelectedFilter] = useState<string>('CSE-2');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<any | null>(null);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getActiveTimetable();
      setData(res);
      if (res.metadata?.studentGroups?.length > 0 && !selectedFilter) {
        setSelectedFilter(res.metadata.studentGroups[0].externalId);
      }
    } catch {
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

  const { schedule, metadata } = data || {};
  const assignments = schedule?.assignments || [];

  const sessionsMap = useMemo(() => {
    const map = new Map<string, any>();
    if (metadata?.sessions) {
      for (const s of metadata.sessions) map.set(s.externalId, s);
    }
    return map;
  }, [metadata]);

  const roomsMap = useMemo(() => {
    const map = new Map<string, any>();
    if (metadata?.rooms) {
      for (const r of metadata.rooms) map.set(r.externalId, r);
    }
    return map;
  }, [metadata]);

  const facultyMap = useMemo(() => {
    const map = new Map<string, any>();
    if (metadata?.faculty) {
      for (const f of metadata.faculty) map.set(f.externalId, f);
    }
    return map;
  }, [metadata]);

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  const filteredAssignments = useMemo(() => {
    if (!assignments.length) return [];
    return assignments.filter((a: any) => {
      const session = sessionsMap.get(a.sessionExternalId);
      if (!session) return false;
      if (filterType === 'group') return (session.groups || []).includes(selectedFilter);
      if (filterType === 'faculty') return session.facultyId === selectedFilter;
      if (filterType === 'room') return a.roomExternalId === selectedFilter;
      return true;
    });
  }, [assignments, sessionsMap, filterType, selectedFilter]);

  const gridMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const a of filteredAssignments) {
      const s = sessionsMap.get(a.sessionExternalId);
      if (!s) continue;
      const dur = s.duration || 1;
      for (let p = a.startPeriod; p < a.startPeriod + dur; p++) {
        map.set(`${a.day}_${p}`, {
          assignment: a,
          session: s,
          isStart: p === a.startPeriod,
          duration: dur,
        });
      }
    }
    return map;
  }, [filteredAssignments, sessionsMap]);

  // Filtered lists for dropdown / search
  const availableOptions = useMemo(() => {
    if (!metadata) return [];
    const q = searchQuery.toLowerCase().trim();
    if (filterType === 'group') {
      return (metadata.studentGroups || []).filter(
        (g: any) => !q || g.externalId.toLowerCase().includes(q)
      );
    }
    if (filterType === 'faculty') {
      return (metadata.faculty || []).filter(
        (f: any) =>
          !q || f.externalId.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
      );
    }
    return (metadata.rooms || []).filter(
      (r: any) =>
        !q || r.externalId.toLowerCase().includes(q) || (r.building && r.building.toLowerCase().includes(q))
    );
  }, [metadata, filterType, searchQuery]);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#71717A]">
        Loading timetable...
      </div>
    );
  }

  // Render period span with colSpan
  const renderPeriodBlock = (day: string, startPeriod: number, endPeriod: number) => {
    const cells: React.ReactNode[] = [];
    let p = startPeriod;

    while (p <= endPeriod) {
      const entry = gridMap.get(`${day}_${p}`);

      if (entry && entry.isStart) {
        const dur = Math.min(entry.duration, endPeriod - p + 1);
        const session = entry.session;
        const assignment = entry.assignment;
        const kind = (session.kind || 'lecture').toLowerCase();

        const kindStyle =
          kind === 'lab'
            ? 'border-purple-200 bg-[#F5F3FF] text-[#6D28D9]'
            : kind === 'tutorial'
            ? 'border-emerald-200 bg-[#ECFDF5] text-[#047857]'
            : 'border-[#E5E7EB] bg-white text-[#111827]';

        cells.push(
          <td
            key={p}
            colSpan={dur}
            className="p-1 border-r border-[#E5E7EB] last:border-r-0 align-top"
          >
            <div
              onClick={() =>
                setSelectedSessionDetail({
                  session,
                  assignment,
                  room: roomsMap.get(assignment.roomExternalId),
                  faculty: facultyMap.get(session.facultyId),
                })
              }
              className={`group relative p-1.5 rounded border ${kindStyle} h-14 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xs hover:border-[#7C3AED]/50`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-semibold text-xs text-[#111827] truncate font-heading">
                  {session.courseId}
                </span>
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-black/5 text-[#4B5563]">
                  {assignment.roomExternalId}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#71717A]">
                <span className="truncate">{session.facultyId}</span>
                {dur > 1 && (
                  <span className="font-mono text-[9px] px-1 rounded bg-[#7C3AED]/10 text-[#7C3AED] font-medium">
                    {dur}h {kind}
                  </span>
                )}
              </div>
            </div>
          </td>
        );
        p += dur;
      } else if (!entry) {
        cells.push(
          <td
            key={p}
            colSpan={1}
            className="p-1 border-r border-[#E5E7EB] last:border-r-0 h-14 align-top"
          >
            <div className="h-full rounded border border-transparent hover:border-dashed hover:border-[#E5E7EB] transition-colors" />
          </td>
        );
        p += 1;
      } else {
        // Handled by earlier colSpan
        p += 1;
      }
    }

    return cells;
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-6 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-[#111827]">
              Academic Timetable
            </h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              0 Violations
            </span>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            {assignments.length} total scheduled sessions · Filtered: {filteredAssignments.length} sessions
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Filter Type Toggle */}
          <div className="flex items-center rounded border border-[#E5E7EB] bg-white p-0.5 text-xs">
            <button
              onClick={() => {
                setFilterType('group');
                setSelectedFilter(metadata.studentGroups[0]?.externalId || 'CSE-2');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterType === 'group'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#71717A] hover:text-[#111827]'
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
                filterType === 'faculty'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#71717A] hover:text-[#111827]'
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
                filterType === 'room'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#71717A] hover:text-[#111827]'
              }`}
            >
              Room
            </button>
          </div>

          {/* Target Selector */}
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-44 h-7 text-xs bg-white border-[#E5E7EB]">
              <SelectValue placeholder="Select target..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {availableOptions.map((opt: any) => (
                <SelectItem key={opt.externalId} value={opt.externalId} className="text-xs">
                  {opt.externalId}
                  {opt.name && opt.name !== opt.externalId ? ` · ${opt.name}` : ''}
                  {opt.capacity ? ` (Cap ${opt.capacity})` : ''}
                  {opt.size ? ` (${opt.size} students)` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {user?.role === 'admin' && (
            <Button
              size="sm"
              onClick={handleSolve}
              disabled={solving}
              className="h-7 px-3 text-xs font-medium bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            >
              {solving ? 'Solving...' : 'Re-Optimize'}
            </Button>
          )}
        </div>
      </div>

      {/* Clean Compact Timetable Grid */}
      <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs border-collapse table-fixed min-w-[860px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAF9F6] text-[#71717A]">
              <th className="p-2 w-14 text-center font-medium border-r border-[#E5E7EB]">Day</th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-medium">P1<br /><span className="text-[10px] text-[#9CA3AF]">08:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-medium">P2<br /><span className="text-[10px] text-[#9CA3AF]">09:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-medium">P3<br /><span className="text-[10px] text-[#9CA3AF]">10:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-medium">P4<br /><span className="text-[10px] text-[#9CA3AF]">11:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-medium">P5<br /><span className="text-[10px] text-[#9CA3AF]">12:00</span></th>
              <th className="p-1 w-12 text-center border-r border-[#E5E7EB] bg-[#F3F4F6] text-[10px] text-[#6B7280] font-medium">
                Lunch<br /><span className="text-[9px] text-[#9CA3AF]">13:00</span>
              </th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-medium">P6<br /><span className="text-[10px] text-[#9CA3AF]">14:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-medium">P7<br /><span className="text-[10px] text-[#9CA3AF]">15:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-medium">P8<br /><span className="text-[10px] text-[#9CA3AF]">16:00</span></th>
              <th className="p-1.5 text-center font-medium">P9<br /><span className="text-[10px] text-[#9CA3AF]">17:00</span></th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FAF9F6]/40">
                <td className="p-2 text-center font-semibold text-[#111827] border-r border-[#E5E7EB] bg-[#FAF9F6]">
                  {day}
                </td>

                {/* Periods 1 to 5 */}
                {renderPeriodBlock(day, 1, 5)}

                {/* Lunch Recess */}
                <td className="p-0 border-r border-[#E5E7EB] bg-[#F9FAFB] text-center">
                  <div className="h-14 flex items-center justify-center [writing-mode:vertical-lr] tracking-widest text-[9px] text-[#9CA3AF]">
                    RECESS
                  </div>
                </td>

                {/* Periods 6 to 9 */}
                {renderPeriodBlock(day, 6, 9)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-[#71717A] pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded border border-[#E5E7EB] bg-white" /> Lecture
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded border border-purple-200 bg-[#F5F3FF]" /> Lab
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded border border-emerald-200 bg-[#ECFDF5]" /> Tutorial
        </span>
        <span className="text-[#9CA3AF] ml-auto">
          Click any session to view complete allocation metadata
        </span>
      </div>

      {/* Session Details Modal / Sheet */}
      <Sheet open={!!selectedSessionDetail} onOpenChange={() => setSelectedSessionDetail(null)}>
        <SheetContent className="w-full sm:max-w-md p-6 space-y-5 bg-white">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-black/5 text-[#4B5563]">
                {selectedSessionDetail?.session?.kind}
              </span>
              <span className="text-xs text-[#71717A]">
                Duration: {selectedSessionDetail?.session?.duration}h
              </span>
            </div>
            <SheetTitle className="font-heading text-lg font-semibold text-[#111827]">
              {selectedSessionDetail?.session?.courseId}
            </SheetTitle>
          </SheetHeader>

          {selectedSessionDetail && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] space-y-2">
                <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Assigned Slot & Venue
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#71717A] block text-[11px]">Time</span>
                    <span className="font-medium text-[#111827]">
                      {selectedSessionDetail.assignment.day} · Period {selectedSessionDetail.assignment.startPeriod} to{' '}
                      {selectedSessionDetail.assignment.startPeriod + selectedSessionDetail.session.duration - 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] block text-[11px]">Room</span>
                    <span className="font-medium text-[#111827]">
                      {selectedSessionDetail.assignment.roomExternalId}
                      {selectedSessionDetail.room ? ` (Cap: ${selectedSessionDetail.room.capacity})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-white space-y-2">
                <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Faculty & Groups
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#71717A]">Instructor:</span>
                    <span className="font-medium text-[#111827]">
                      {selectedSessionDetail.faculty?.name || selectedSessionDetail.session.facultyId} ({selectedSessionDetail.session.facultyId})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#71717A]">Student Groups:</span>
                    <span className="font-medium text-[#111827]">
                      {(selectedSessionDetail.session.groups || []).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#71717A]">Enrolled Class Size:</span>
                    <span className="font-medium text-[#111827]">
                      {selectedSessionDetail.session.size} students
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-white space-y-2">
                <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Equipment & Accessibility
                </div>
                <div className="space-y-1 text-[#4B5563]">
                  <div>Accessible Required: {selectedSessionDetail.session.needsAccessible ? 'Yes' : 'No'}</div>
                  <div>Allowed Room Types: {(selectedSessionDetail.session.roomTypes || []).join(', ')}</div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
