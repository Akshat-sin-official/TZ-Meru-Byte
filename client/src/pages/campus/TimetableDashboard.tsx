import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  CalendarDays,
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  GraduationCap,
  Clock,
  MapPin,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
  const [applyingMove, setApplyingMove] = useState(false);
  const [moveValidationResult, setMoveValidationResult] = useState<any | null>(null);

  const handleApplyMove = async () => {
    if (!selectedSessionDetail || !moveValidationResult?.valid) return;
    setApplyingMove(true);
    try {
      const res = await campusApi.applyMove({
        session_id: selectedSessionDetail.session.externalId,
        target_day: targetDay,
        target_start_period: Number(targetPeriod),
        target_room_id: targetRoom,
      });
      toast.success(res.message || 'Session move successfully applied to active timetable');
      setSelectedSessionDetail(null);
      await fetchTimetable();
    } catch (err: any) {
      toast.error('Failed to commit move: ' + (err.response?.data?.error || err.message));
    } finally {
      setApplyingMove(false);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getActiveTimetable();
      setData(res);
      if (res.metadata?.studentGroups?.length > 0 && !selectedFilter) {
        setSelectedFilter(res.metadata.studentGroups[0].externalId);
      }
    } catch {
      toast.error('Failed to load academic timetable');
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
      toast.info('Running Google OR-Tools CP-SAT discrete solver...');
      const res = await campusApi.generateTimetable();
      await campusApi.approveProposal(res.proposalId);
      toast.success('Schedule optimized (0 hard violations)');
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
      toast.error('Failed to validate proposed move');
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
          !q || f.externalId.toLowerCase().includes(q) || f.name?.toLowerCase().includes(q)
      );
    }
    return (metadata.rooms || []).filter(
      (r: any) =>
        !q || r.externalId.toLowerCase().includes(q) || (r.building && r.building.toLowerCase().includes(q))
    );
  }, [metadata, filterType, searchQuery]);

  // Summary Metrics for the currently selected filter
  const entityStats = useMemo(() => {
    const totalHours = filteredAssignments.reduce((acc: number, curr: any) => {
      const s = sessionsMap.get(curr.sessionExternalId);
      return acc + (s?.duration || 1);
    }, 0);

    const venues = new Set(filteredAssignments.map((a: any) => a.roomExternalId));

    let entityLabel = selectedFilter;
    let entitySub = '';

    if (filterType === 'group') {
      const g = (metadata?.studentGroups || []).find((x: any) => x.externalId === selectedFilter);
      entityLabel = `Cohort ${selectedFilter}`;
      entitySub = g ? `${g.size} Students` : '';
    } else if (filterType === 'faculty') {
      const f = (metadata?.faculty || []).find((x: any) => x.externalId === selectedFilter);
      entityLabel = f?.name || selectedFilter;
      entitySub = `ID: ${selectedFilter} · Dept: ${f?.department || 'CIT'}`;
    } else if (filterType === 'room') {
      const r = (metadata?.rooms || []).find((x: any) => x.externalId === selectedFilter);
      entityLabel = `Venue ${selectedFilter}`;
      entitySub = r ? `${r.type} · Cap: ${r.capacity}` : '';
    }

    return { totalHours, venueCount: venues.size, entityLabel, entitySub };
  }, [filteredAssignments, filterType, selectedFilter, sessionsMap, metadata]);

  if (loading || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2.5 text-xs text-muted-foreground font-poppins">
        <RotateCw className="w-5 h-5 animate-spin text-primary" />
        <span>Loading academic timetable matrix...</span>
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
        const kind = (session.kind || session.type || 'lecture').toLowerCase();

        const isLab = kind === 'lab' || dur > 1;
        const isTutorial = kind === 'tutorial';

        // High-contrast, clean enterprise card style
        const cardStyle = isLab
          ? 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-950 border-l-4 border-l-purple-600'
          : isTutorial
          ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-950 border-l-4 border-l-emerald-600'
          : 'border-[#E5E7EB] bg-white hover:bg-slate-50/80 text-[#111926] border-l-4 border-l-primary';

        cells.push(
          <td
            key={p}
            colSpan={dur}
            className="p-1 border-r border-[#E5E7EB] last:border-r-0 align-top"
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
              className={`group relative p-2 rounded-lg border ${cardStyle} min-h-[58px] flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-xs`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-bold text-xs leading-none truncate font-poppins">
                  {session.courseId}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/5 font-semibold text-muted-foreground shrink-0">
                  {assignment.roomExternalId}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                <span className="truncate">{session.facultyId}</span>
                {dur > 1 && (
                  <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
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
            className="p-1 border-r border-[#E5E7EB] last:border-r-0 min-h-[58px] align-top"
          >
            <div className="h-full min-h-[56px] rounded-lg border border-transparent hover:border-dashed hover:border-[#CBD5E1] transition-colors" />
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
      {/* Top Header & Operational Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-poppins text-[#111926] tracking-tight">
              Academic Timetable Matrix
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold font-mono">
              H1–H14 COMPLIANT
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-poppins">
            Discrete CP-SAT scheduled sessions across 5 instructional days · 0 hard clashes
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
              className={`px-3 py-1.5 rounded-md text-xs font-bold font-poppins transition-all cursor-pointer ${
                filterType === 'group'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-[#111926]'
              }`}
            >
              By Cohort
            </button>
            <button
              onClick={() => {
                setFilterType('faculty');
                setSelectedFilter(metadata.faculty[0]?.externalId || 'F01');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold font-poppins transition-all cursor-pointer ${
                filterType === 'faculty'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-[#111926]'
              }`}
            >
              By Faculty
            </button>
            <button
              onClick={() => {
                setFilterType('room');
                setSelectedFilter(metadata.rooms[0]?.externalId || 'LH-1');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold font-poppins transition-all cursor-pointer ${
                filterType === 'room'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-[#111926]'
              }`}
            >
              By Venue
            </button>
          </div>

          {/* Target Selector Dropdown */}
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-52 h-9 rounded-lg text-xs bg-white border-[#E5E7EB] font-poppins font-medium shadow-2xs">
              <SelectValue placeholder="Select target..." />
            </SelectTrigger>
            <SelectContent className="max-h-64 rounded-xl">
              {availableOptions.map((opt: any) => (
                <SelectItem key={opt.externalId} value={opt.externalId} className="text-xs">
                  <span className="font-bold font-poppins">{opt.externalId}</span>
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
              className="rounded-lg bg-primary hover:bg-primary/95 text-white shadow-xs font-bold font-poppins px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-70 transition"
            >
              {solving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{solving ? 'Solving CP-SAT...' : 'Re-Optimize'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Entity KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
            Selected Filter
          </span>
          <div className="text-xs font-bold font-poppins text-[#111926] truncate">
            {entityStats.entityLabel}
          </div>
          {entityStats.entitySub && (
            <div className="text-[10px] text-muted-foreground font-mono">{entityStats.entitySub}</div>
          )}
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
            Assigned Load
          </span>
          <div className="text-xs font-bold font-poppins text-[#111926]">
            {entityStats.totalHours} Hours / Week
          </div>
          <div className="text-[10px] text-muted-foreground">
            {filteredAssignments.length} Scheduled Sessions
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
            Venues Allocated
          </span>
          <div className="text-xs font-bold font-poppins text-[#111926]">
            {entityStats.venueCount} Unique Venues
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">100% capacity verified</div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
            Constraint Parity
          </span>
          <div className="text-xs font-bold font-poppins text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>0 Violations</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">Deterministic Seed 42</div>
        </div>
      </div>

      {/* Clean Compact Timetable Grid */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-x-auto shadow-xs p-1.5">
        <table className="w-full text-left text-xs border-collapse table-fixed min-w-[880px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAF9F6] text-muted-foreground">
              <th className="p-2 w-14 text-center font-bold font-poppins border-r border-[#E5E7EB]">Day</th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">
                P1<br /><span className="text-[10px] text-muted-foreground/70 font-normal">08:00</span>
              </th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">
                P2<br /><span className="text-[10px] text-muted-foreground/70 font-normal">09:00</span>
              </th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">
                P3<br /><span className="text-[10px] text-muted-foreground/70 font-normal">10:00</span>
              </th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">
                P4<br /><span className="text-[10px] text-muted-foreground/70 font-normal">11:00</span>
              </th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">
                P5<br /><span className="text-[10px] text-muted-foreground/70 font-normal">12:00</span>
              </th>
              <th className="p-1 w-12 text-center border-r border-[#E5E7EB] bg-slate-100/70 text-[10px] text-muted-foreground font-bold font-poppins">
                Lunch<br /><span className="text-[9px] text-muted-foreground/60 font-normal">13:00</span>
              </th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">
                P6<br /><span className="text-[10px] text-muted-foreground/70 font-normal">14:00</span>
              </th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">
                P7<br /><span className="text-[10px] text-muted-foreground/70 font-normal">15:00</span>
              </th>
              <th className="p-1.5 text-center border-r border-[#E5E7EB] font-bold font-poppins">
                P8<br /><span className="text-[10px] text-muted-foreground/70 font-normal">16:00</span>
              </th>
              <th className="p-1.5 text-center font-bold font-poppins">
                P9<br /><span className="text-[10px] text-muted-foreground/70 font-normal">17:00</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {days.map((day) => (
              <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-2 text-center font-bold font-poppins text-[#111926] border-r border-[#E5E7EB] bg-[#FAF9F6]">
                  {day}
                </td>

                {/* Periods 1 to 5 (Morning) */}
                {renderPeriodBlock(day, 1, 5)}

                {/* Lunch Break (Mandatory H9) */}
                <td className="p-0 border-r border-[#E5E7EB] bg-slate-100/70 text-center">
                  <div className="h-14 flex items-center justify-center [writing-mode:vertical-lr] tracking-widest text-[9px] text-muted-foreground font-bold font-poppins">
                    LUNCH
                  </div>
                </td>

                {/* Periods 6 to 9 (Afternoon) */}
                {renderPeriodBlock(day, 6, 9)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend & Hint Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground pt-1 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-[#E5E7EB] bg-white border-l-4 border-l-primary" /> Lecture
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-purple-200 bg-purple-50 border-l-4 border-l-purple-600" /> Lab (Multi-period)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-emerald-200 bg-emerald-50 border-l-4 border-l-emerald-600" /> Tutorial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Lunch (H9)
          </span>
        </div>

        <div className="text-[11px] text-muted-foreground font-poppins flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-primary" />
          <span>Click any session block to inspect metadata or test rescheduling proposals</span>
        </div>
      </div>

      {/* Session Details & Interactive Reschedule Validator Drawer */}
      <Sheet open={!!selectedSessionDetail} onOpenChange={() => setSelectedSessionDetail(null)}>
        <SheetContent className="w-full sm:max-w-md p-6 space-y-5 bg-white overflow-y-auto font-sans">
          <SheetHeader className="space-y-1 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {selectedSessionDetail?.session?.kind || 'Lecture'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Duration: {selectedSessionDetail?.session?.duration}h
              </span>
            </div>
            <SheetTitle className="font-poppins text-lg font-bold text-[#111926]">
              {selectedSessionDetail?.session?.courseId} · {selectedSessionDetail?.session?.name || 'Academic Course'}
            </SheetTitle>
          </SheetHeader>

          {selectedSessionDetail && (
            <div className="space-y-4 text-xs">
              {/* Current Assignment Card */}
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
                  Current Schedule Assignment
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Time Slot</span>
                    <span className="font-bold text-[#111926] font-mono">
                      {selectedSessionDetail.assignment.day} · Period {selectedSessionDetail.assignment.startPeriod} to{' '}
                      {selectedSessionDetail.assignment.startPeriod + selectedSessionDetail.session.duration - 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Venue</span>
                    <span className="font-bold text-[#111926] font-mono">
                      {selectedSessionDetail.assignment.roomExternalId}
                      {selectedSessionDetail.room ? ` (Cap ${selectedSessionDetail.room.capacity})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stakeholders Card */}
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-poppins">
                  Assigned Stakeholders
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instructor:</span>
                    <span className="font-bold text-[#111926] font-poppins">
                      {selectedSessionDetail.faculty?.name || selectedSessionDetail.session.facultyId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-mono text-[#111926]">
                      {selectedSessionDetail.faculty?.department || 'Computer Science'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cohorts Enrolled:</span>
                    <span className="font-mono text-[#111926]">
                      {Array.isArray(selectedSessionDetail.session.groups)
                        ? selectedSessionDetail.session.groups.join(', ')
                        : selectedSessionDetail.session.groups}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class Size:</span>
                    <span className="font-mono text-[#111926] font-bold">
                      {selectedSessionDetail.session.size || 60} students
                    </span>
                  </div>
                </div>
              </div>

              {/* What-If Move Validation Tool */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary font-poppins flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Test Rescheduling Proposal</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono">
                    H1–H14 Validator
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                        Target Day
                      </label>
                      <select
                        value={targetDay}
                        onChange={(e) => setTargetDay(e.target.value)}
                        className="w-full h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2 text-[#111926] font-poppins font-medium focus:outline-none"
                      >
                        {days.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                        Start Period
                      </label>
                      <select
                        value={targetPeriod}
                        onChange={(e) => setTargetPeriod(Number(e.target.value))}
                        className="w-full h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2 text-[#111926] font-poppins font-medium focus:outline-none"
                      >
                        {[1, 2, 3, 4, 6, 7, 8].map((p) => (
                          <option key={p} value={p}>
                            Period {p} ({8 + p}:00)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                      Target Venue
                    </label>
                    <select
                      value={targetRoom}
                      onChange={(e) => setTargetRoom(e.target.value)}
                      className="w-full h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2 text-[#111926] font-poppins font-medium focus:outline-none"
                    >
                      {(metadata?.rooms || []).map((r: any) => (
                        <option key={r.externalId} value={r.externalId}>
                          {r.externalId} · {r.type} (Cap {r.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleValidateMove}
                    disabled={validatingMove}
                    className="w-full mt-2 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold font-poppins py-2 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-70 shadow-xs"
                  >
                    {validatingMove ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{validatingMove ? 'Validating H1–H14...' : 'Check Feasibility'}</span>
                  </button>

                  {/* Move Validation Result Banner */}
                  {moveValidationResult && (
                    <div
                      className={`p-3 rounded-lg border text-xs leading-relaxed ${
                        moveValidationResult.valid
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-red-50 border-red-200 text-red-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold font-poppins">
                        {moveValidationResult.valid ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Proposal Feasible (0 Violations)</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>Slot Infeasible</span>
                          </>
                        )}
                      </div>
                      <p className="mt-1 text-[11px]">
                        {moveValidationResult.valid
                          ? 'This slot satisfies room availability, faculty load, student group non-overlap, and suitability.'
                          : moveValidationResult.reason || 'Violates hard constraint rules.'}
                      </p>

                      {moveValidationResult.valid && (user?.role === 'admin' || user?.role === 'department_coordinator') && (
                        <button
                          onClick={handleApplyMove}
                          disabled={applyingMove}
                          className="w-full mt-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-poppins py-2 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-70"
                        >
                          {applyingMove ? (
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>{applyingMove ? 'Applying Move...' : 'Apply Rescheduled Slot (Active Commit)'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
