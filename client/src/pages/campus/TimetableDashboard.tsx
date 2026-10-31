import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, AlertCircle, RotateCw } from 'lucide-react';

export const TimetableDashboard: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);

  const [filterType, setFilterType] = useState<'group' | 'faculty' | 'room'>('group');
  const [selectedFilter, setSelectedFilter] = useState<string>('CSE-2');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<any | null>(null);

  // Reschedule proposal states
  const [targetDay, setTargetDay] = useState('MON');
  const [targetPeriod, setTargetPeriod] = useState(1);
  const [targetRoom, setTargetRoom] = useState('LH-1');
  const [validatingMove, setValidatingMove] = useState(false);
  const [moveValidationResult, setMoveValidationResult] = useState<any | null>(null);

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

  const handleValidateMove = async () => {
    if (!selectedSessionDetail) return;
    setValidatingMove(true);
    setMoveValidationResult(null);
    try {
      const res = await campusApi.validateMove({
        session_id: selectedSessionDetail.session.externalId,
        target_day: targetDay,
        target_start_period: Number(targetPeriod),
        target_room_id: targetRoom,
      });
      setMoveValidationResult(res);
      if (res.valid) {
        toast.success('Proposed slot is valid! 0 hard violations.');
      } else {
        toast.error(`Slot invalid: ${res.reason || 'Violates hard constraints'}`);
      }
    } catch {
      toast.error('Failed to validate move');
    } finally {
      setValidatingMove(false);
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
      <div className="flex h-64 items-center justify-center text-xs text-ink-soft">
        Loading timetable...
      </div>
    );
  }

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
            ? 'border-purple-200 bg-[#EDE9FE]/50 text-[#6D28D9]'
            : kind === 'tutorial'
            ? 'border-emerald-200 bg-[#DDECD4]/50 text-[#2D5A27]'
            : 'border-border/70 bg-white text-ink';

        cells.push(
          <td
            key={p}
            colSpan={dur}
            className="p-1 border-r border-border/60 last:border-r-0 align-top"
          >
            <div
              onClick={() => {
                setSelectedSessionDetail({
                  session,
                  assignment,
                  room: roomsMap.get(assignment.roomExternalId),
                  faculty: facultyMap.get(session.facultyId),
                });
                setTargetDay(assignment.day);
                setTargetPeriod(assignment.startPeriod);
                setTargetRoom(assignment.roomExternalId);
                setMoveValidationResult(null);
              }}
              className={`group relative p-2 rounded-xl border ${kindStyle} h-14 flex flex-col justify-between cursor-pointer transition-all hover:shadow-sm hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-bold text-xs text-ink truncate font-poppins">
                  {session.courseId}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-full bg-black/5 text-ink-soft font-medium">
                  {assignment.roomExternalId}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-ink-soft">
                <span className="truncate">{session.facultyId}</span>
                {dur > 1 && (
                  <span className="font-mono text-[9px] px-1.5 rounded-full bg-primary/10 text-primary font-bold">
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
            className="p-1 border-r border-border/60 last:border-r-0 h-14 align-top"
          >
            <div className="h-full rounded-xl border border-transparent hover:border-dashed hover:border-border/80 transition-colors" />
          </td>
        );
        p += 1;
      } else {
        p += 1;
      }
    }

    return cells;
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-xl font-bold font-poppins text-[#111926] tracking-tight">
            Academic Timetable Grid
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-poppins">
            {assignments.length} total sessions · 0 hard clashes · Showing {filteredAssignments.length} sessions
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Filter Type Toggle */}
          <div className="flex items-center rounded-lg border border-[#E5E7EB] bg-white p-0.5 text-xs shadow-2xs">
            <button
              onClick={() => {
                setFilterType('group');
                setSelectedFilter(metadata.studentGroups[0]?.externalId || 'CSE-2');
              }}
              className={`px-3 py-1 rounded-md text-xs font-bold font-poppins transition-all cursor-pointer ${
                filterType === 'group'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-[#111926]'
              }`}
            >
              Group
            </button>
            <button
              onClick={() => {
                setFilterType('faculty');
                setSelectedFilter(metadata.faculty[0]?.externalId || 'F01');
              }}
              className={`px-3 py-1 rounded-md text-xs font-bold font-poppins transition-all cursor-pointer ${
                filterType === 'faculty'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-[#111926]'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => {
                setFilterType('room');
                setSelectedFilter(metadata.rooms[0]?.externalId || 'LH-1');
              }}
              className={`px-3 py-1 rounded-md text-xs font-bold font-poppins transition-all cursor-pointer ${
                filterType === 'room'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-[#111926]'
              }`}
            >
              Room
            </button>
          </div>

          {/* Target Selector */}
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48 h-8 rounded-lg text-xs bg-white border-[#E5E7EB] font-poppins font-medium shadow-2xs">
              <SelectValue placeholder="Select target..." />
            </SelectTrigger>
            <SelectContent className="max-h-60 rounded-xl">
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
            <button
              onClick={handleSolve}
              disabled={solving}
              className="rounded-lg bg-primary hover:bg-primary/95 text-white shadow-xs font-bold font-poppins px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              {solving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{solving ? 'Solving...' : 'Re-Optimize'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Compact Timetable Grid */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-x-auto shadow-xs p-1.5">
        <table className="w-full text-left text-xs border-collapse table-fixed min-w-[860px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAF9F6] text-muted-foreground">
              <th className="p-2 w-14 text-center font-bold font-poppins border-r border-[#E5E7EB]">Day</th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">P1<br /><span className="text-[10px] text-muted-foreground/70 font-normal">08:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">P2<br /><span className="text-[10px] text-muted-foreground/70 font-normal">09:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">P3<br /><span className="text-[10px] text-muted-foreground/70 font-normal">10:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">P4<br /><span className="text-[10px] text-muted-foreground/70 font-normal">11:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">P5<br /><span className="text-[10px] text-muted-foreground/70 font-normal">12:00</span></th>
              <th className="p-1 w-12 text-center border-r border-[#E5E7EB] bg-slate-50 text-[10px] text-muted-foreground font-bold font-poppins">
                Lunch<br /><span className="text-[9px] text-muted-foreground/60 font-normal">13:00</span>
              </th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">P6<br /><span className="text-[10px] text-muted-foreground/70 font-normal">14:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">P7<br /><span className="text-[10px] text-muted-foreground/70 font-normal">15:00</span></th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">P8<br /><span className="text-[10px] text-muted-foreground/70 font-normal">16:00</span></th>
              <th className="p-1.5 text-center font-bold font-poppins">P9<br /><span className="text-[10px] text-ink-soft/60 font-normal">17:00</span></th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day} className="border-b border-border/60 last:border-b-0 hover:bg-[#FAF9F6]/50">
                <td className="p-2 text-center font-bold font-poppins text-ink border-r border-border/60 bg-[#FAF9F6]">
                  {day}
                </td>

                {/* Periods 1 to 5 */}
                {renderPeriodBlock(day, 1, 5)}

                {/* Lunch Recess */}
                <td className="p-0 border-r border-border/60 bg-slate-50 text-center">
                  <div className="h-14 flex items-center justify-center [writing-mode:vertical-lr] tracking-widest text-[9px] text-ink-soft/60 font-bold font-poppins">
                    LUNCH
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
      <div className="flex items-center gap-4 text-xs text-ink-soft pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md border border-border bg-white" /> Lecture
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md border border-purple-200 bg-[#EDE9FE]/60" /> Lab
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md border border-emerald-200 bg-[#DDECD4]/60" /> Tutorial
        </span>
        <span className="text-ink-soft/60 ml-auto text-[11px]">
          Click any session block to inspect metadata or test rescheduling proposals
        </span>
      </div>

      {/* Session Details & Interactive Move Sheet */}
      <Sheet open={!!selectedSessionDetail} onOpenChange={() => setSelectedSessionDetail(null)}>
        <SheetContent className="w-full sm:max-w-md p-6 space-y-6 bg-white overflow-y-auto font-sans">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded-full bg-black/5 text-ink-soft font-bold">
                {selectedSessionDetail?.session?.kind}
              </span>
              <span className="text-xs text-ink-soft">
                Duration: {selectedSessionDetail?.session?.duration}h
              </span>
            </div>
            <SheetTitle className="font-poppins text-xl font-bold text-ink">
              {selectedSessionDetail?.session?.courseId}
            </SheetTitle>
          </SheetHeader>

          {selectedSessionDetail && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-2xl border border-border/70 bg-[#FAF9F6] space-y-2.5">
                <div className="text-[11px] font-bold text-ink font-poppins uppercase tracking-wider">
                  Current Assignment
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-ink-soft block text-[11px]">Time Slot</span>
                    <span className="font-bold text-ink">
                      {selectedSessionDetail.assignment.day} · P{selectedSessionDetail.assignment.startPeriod} to{' '}
                      P{selectedSessionDetail.assignment.startPeriod + selectedSessionDetail.session.duration - 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-soft block text-[11px]">Venue</span>
                    <span className="font-bold text-ink">
                      {selectedSessionDetail.assignment.roomExternalId}
                      {selectedSessionDetail.room ? ` (Cap ${selectedSessionDetail.room.capacity})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border/70 bg-white space-y-2">
                <div className="text-[11px] font-bold text-ink font-poppins uppercase tracking-wider">
                  Stakeholders
                </div>
                <div className="space-y-1.5 text-[#4B5563]">
                  <div className="flex justify-between">
                    <span>Instructor:</span>
                    <span className="font-bold text-ink">
                      {selectedSessionDetail.faculty?.name || selectedSessionDetail.session.facultyId} ({selectedSessionDetail.session.facultyId})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Student Groups:</span>
                    <span className="font-bold text-ink">
                      {(selectedSessionDetail.session.groups || []).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Class Size:</span>
                    <span className="font-bold text-ink">
                      {selectedSessionDetail.session.size} students
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Reschedule Validator (Problem Statement Handoff) */}
              <div className="p-4 rounded-2xl border border-primary/30 bg-[#EDE9FE]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold font-poppins text-xs text-ink">
                    Test Rescheduling Proposal
                  </span>
                  <span className="text-[10px] font-mono text-primary font-bold">Canonical Validator</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-ink-soft block">Target Day</span>
                    <select
                      value={targetDay}
                      onChange={(e) => setTargetDay(e.target.value)}
                      className="w-full h-8 rounded-lg border border-border/80 bg-white text-xs font-bold font-poppins px-2"
                    >
                      {days.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-ink-soft block">Period</span>
                    <select
                      value={targetPeriod}
                      onChange={(e) => setTargetPeriod(Number(e.target.value))}
                      className="w-full h-8 rounded-lg border border-border/80 bg-white text-xs font-bold font-poppins px-2"
                    >
                      {[1, 2, 3, 4, 6, 7, 8, 9].map((p) => (
                        <option key={p} value={p}>
                          P{p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-ink-soft block">Room</span>
                    <select
                      value={targetRoom}
                      onChange={(e) => setTargetRoom(e.target.value)}
                      className="w-full h-8 rounded-lg border border-border/80 bg-white text-xs font-bold font-poppins px-2"
                    >
                      {(metadata?.rooms || []).map((r: any) => (
                        <option key={r.externalId} value={r.externalId}>
                          {r.externalId}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleValidateMove}
                  disabled={validatingMove}
                  className="w-full h-9 rounded-full bg-ink hover:bg-black text-white font-bold font-poppins text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {validatingMove ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{validatingMove ? 'Validating against H1–H14...' : 'Validate Proposed Move'}</span>
                </button>

                {moveValidationResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      moveValidationResult.valid
                        ? 'bg-[#DDECD4]/50 border-emerald-300 text-[#2D5A27]'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {moveValidationResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold font-poppins">
                        {moveValidationResult.valid ? 'Move is 100% Feasible' : 'Hard Constraint Violation'}
                      </div>
                      <div className="text-[11px] mt-0.5">
                        {moveValidationResult.reason ||
                          (moveValidationResult.valid
                            ? 'Zero hard constraint clashes detected.'
                            : 'Slot or room conflict.')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
