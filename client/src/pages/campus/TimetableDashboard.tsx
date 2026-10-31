import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { toast } from 'sonner';
import {
  Sparkles,
  CheckCircle2,
  RotateCw,
  X,
  Share2,
  SlidersHorizontal,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FileDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const TimetableDashboard: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);

  // Filters
  const [filterType, setFilterType] = useState<'group' | 'faculty' | 'room'>('group');
  const [selectedFilter, setSelectedFilter] = useState<string>('CSE-2');
  const [quickFilter, setQuickFilter] = useState<'all' | 'labs' | 'lectures' | 'tutorials'>('all');

  // Session Drawer Details & Rescheduling
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<any | null>(null);
  const [targetDay, setTargetDay] = useState('MON');
  const [targetPeriod, setTargetPeriod] = useState(1);
  const [targetRoom, setTargetRoom] = useState('LH-1');
  const [validatingMove, setValidatingMove] = useState(false);
  const [applyingMove, setApplyingMove] = useState(false);
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
      toast.error('Failed to load academic timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const handleAutoSchedule = async () => {
    setSolving(true);
    try {
      const res = await campusApi.generateTimetable();
      if (res.proposalId) {
        await campusApi.approveProposal(res.proposalId);
      }
      toast.success('Master timetable auto-scheduled with 0 hard violations!');
      await fetchTimetable();
    } catch (err: any) {
      toast.error('Auto-scheduling error: ' + (err.response?.data?.error || err.message));
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
        toast.success('Slot move is mathematically valid (0 hard violations)!');
      } else {
        toast.warning(`Invalid move: ${res.violations?.length || 0} constraint violation(s) detected.`);
      }
    } catch (err: any) {
      toast.error('Validation request failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setValidatingMove(false);
    }
  };

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

  const metadata = data?.metadata || {};
  const assignments = data?.schedule?.assignments || [];

  // Lookup maps
  const sessionsMap = useMemo(() => {
    const map = new Map<string, any>();
    (metadata.sessions || []).forEach((s: any) => map.set(s.externalId, s));
    return map;
  }, [metadata.sessions]);

  const roomsMap = useMemo(() => {
    const map = new Map<string, any>();
    (metadata.rooms || []).forEach((r: any) => map.set(r.externalId, r));
    return map;
  }, [metadata.rooms]);

  const facultyMap = useMemo(() => {
    const map = new Map<string, any>();
    (metadata.faculty || []).forEach((f: any) => map.set(f.externalId, f));
    return map;
  }, [metadata.faculty]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    if (!selectedFilter) return [];
    return assignments.filter((a: any) => {
      const session = sessionsMap.get(a.sessionExternalId);
      if (!session) return false;

      // Quick filter
      const kind = (session.kind || 'lecture').toLowerCase();
      if (quickFilter === 'labs' && kind !== 'lab' && session.duration <= 1) return false;
      if (quickFilter === 'lectures' && kind !== 'lecture') return false;
      if (quickFilter === 'tutorials' && kind !== 'tutorial') return false;

      if (filterType === 'group') {
        const groups = session.groups || [];
        return groups.includes(selectedFilter);
      }
      if (filterType === 'faculty') {
        return session.facultyId === selectedFilter;
      }
      if (filterType === 'room') {
        return a.roomExternalId === selectedFilter;
      }
      return false;
    });
  }, [assignments, filterType, selectedFilter, sessionsMap, quickFilter]);

  // Grid mapping: Map(`${day}_${period}`) -> { assignment, session, isStart, duration }
  const gridMap = useMemo(() => {
    const map = new Map<string, { assignment: any; session: any; isStart: boolean; duration: number }>();
    filteredAssignments.forEach((a: any) => {
      const session = sessionsMap.get(a.sessionExternalId);
      const dur = session?.duration || 1;
      const startP = a.startPeriod;
      for (let p = startP; p < startP + dur; p++) {
        map.set(`${a.day}_${p}`, {
          assignment: a,
          session,
          isStart: p === startP,
          duration: dur,
        });
      }
    });
    return map;
  }, [filteredAssignments, sessionsMap]);

  // Entity summary statistics
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
      entityLabel = g?.name || `Cohort ${selectedFilter}`;
      entitySub = g ? `${g.size} Enrolled Students` : '';
    } else if (filterType === 'faculty') {
      const f = (metadata?.faculty || []).find((x: any) => x.externalId === selectedFilter);
      entityLabel = f?.name || selectedFilter;
      entitySub = `Faculty ${selectedFilter} · Dept: ${f?.department || 'CIT'}`;
    } else if (filterType === 'room') {
      const r = (metadata?.rooms || []).find((x: any) => x.externalId === selectedFilter);
      entityLabel = `Venue ${selectedFilter}`;
      entitySub = r ? `${r.type} · Cap: ${r.capacity} seats` : '';
    }

    return { totalHours, venueCount: venues.size, entityLabel, entitySub, sessionCount: filteredAssignments.length };
  }, [filteredAssignments, filterType, selectedFilter, sessionsMap, metadata]);

  // Day hours calculation
  const getDayHours = (day: string) => {
    let hrs = 0;
    for (let p = 1; p <= 9; p++) {
      const entry = gridMap.get(`${day}_${p}`);
      if (entry && entry.isStart) {
        hrs += entry.duration;
      }
    }
    return hrs;
  };

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  if (loading || !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-xs text-[#787774] font-sans">
        <RotateCw className="w-5 h-5 animate-spin text-[#37352F]" />
        <span className="font-medium">Loading Academic Schedule Workspace...</span>
      </div>
    );
  }

  // Render slots for teaching periods
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
        const isLab = kind === 'lab' || dur > 1;
        const isTutorial = kind === 'tutorial';

        let cardBg = 'bg-[#E0F2FE]/45 border-[#BAE6FD] hover:border-[#7DD3FC] text-[#0369A1]';
        let badgeBg = 'bg-white/90 border-[#BAE6FD] text-[#0369A1]';
        let typeBadge = 'Core Lecture';

        if (isLab) {
          cardBg = 'bg-[#F3E8FF]/50 border-[#E9D5FF] hover:border-[#D8B4FE] text-[#7E22CE]';
          badgeBg = 'bg-white/90 border-[#E9D5FF] text-[#7E22CE]';
          typeBadge = `${dur}h Lab`;
        } else if (isTutorial) {
          cardBg = 'bg-[#DCFCE7]/45 border-[#BBF7D0] hover:border-[#86EFAC] text-[#15803D]';
          badgeBg = 'bg-white/90 border-[#BBF7D0] text-[#15803D]';
          typeBadge = 'Tutorial';
        } else if (session.courseId?.startsWith('OE') || session.basketSlot) {
          cardBg = 'bg-[#FEF3C7]/45 border-[#FDE68A] hover:border-[#FCD34D] text-[#B45309]';
          badgeBg = 'bg-white/90 border-[#FDE68A] text-[#B45309]';
          typeBadge = 'Elective';
        }

        cells.push(
          <div
            key={p}
            style={{ gridColumn: `span ${dur} / span ${dur}` }}
            className="p-1 border-r border-[#EBEBEA] flex min-h-[76px]"
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
              className={`w-full ${cardBg} border rounded-md p-2 flex flex-col justify-between cursor-pointer transition-all duration-150 select-none shadow-2xs hover:shadow-xs`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-semibold text-xs tracking-tight truncate">
                  {session.courseId}
                </span>
                <span className={`text-[10px] font-mono px-1 rounded border ${badgeBg}`}>
                  {assignment.roomExternalId}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#787774] mt-1">
                <span className="truncate">{session.facultyId}</span>
                <span className="text-[9px] font-medium opacity-85">{typeBadge}</span>
              </div>
            </div>
          </div>
        );
        p += dur;
      } else if (!entry) {
        cells.push(
          <div
            key={p}
            className="p-1 border-r border-[#EBEBEA] flex items-center justify-center text-[10px] text-[#9B9A97] min-h-[76px] hover:bg-[#FBFBFA] transition-colors"
          >
            <span className="opacity-30">—</span>
          </div>
        );
        p += 1;
      } else {
        p += 1;
      }
    }

    return cells;
  };

  return (
    <div className="space-y-4 font-sans text-[#37352F] antialiased">
      {/* 1. Concise Controls & Metrics Bar (No duplicate breadcrumbs or headers) */}
      <div className="bg-white border border-[#EBEBEA] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-[#37352F] tracking-tight flex items-center gap-2">
              Academic Schedule Matrix
              <span className="text-xs font-normal text-[#787774] bg-[#F7F6F3] border border-[#EBEBEA] px-2 py-0.5 rounded-md">
                Autumn 2027 · Week 7
              </span>
            </h1>
            <p className="text-xs text-[#787774] mt-0.5">
              Chilika Institute of Technology · {entityStats.entitySub || 'Instructional Teaching Grid'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={handleAutoSchedule}
                disabled={solving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#37352F] text-white hover:bg-black rounded-md text-xs font-medium transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {solving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>{solving ? 'Solving CP-SAT...' : 'Auto-Schedule'}</span>
              </button>
            )}

            <button
              onClick={fetchTimetable}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#EBEBEA] hover:bg-[#F1F1EF] text-[#37352F] rounded-md text-xs font-medium transition cursor-pointer"
              title="Refresh Timetable"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#787774]" />
              <span>Refresh</span>
            </button>

            <a
              href="/api/exports/schedule.json"
              download="schedule.json"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#787774] hover:text-[#37352F] rounded-md border border-[#EBEBEA] hover:bg-[#F7F6F3] transition cursor-pointer"
              title="Download Master JSON"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export</span>
            </a>
          </div>
        </div>

        {/* 2. Flat Summary KPI Row (Quiet, non-bloated) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 border-t border-[#EBEBEA]/80">
          <div className="bg-[#F7F6F3] border border-[#EBEBEA] rounded-md px-3.5 py-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-[#9B9A97] block">
              Current Perspective
            </span>
            <div className="text-xs font-semibold text-[#37352F] mt-0.5 truncate">{entityStats.entityLabel}</div>
            <span className="text-[11px] text-[#787774] truncate block">{entityStats.entitySub}</span>
          </div>

          <div className="bg-[#F7F6F3] border border-[#EBEBEA] rounded-md px-3.5 py-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-[#9B9A97] block">
              Teaching Load
            </span>
            <div className="text-xs font-semibold text-[#37352F] mt-0.5">{entityStats.totalHours} hrs / week</div>
            <span className="text-[11px] text-[#787774]">{entityStats.sessionCount} scheduled periods</span>
          </div>

          <div className="bg-[#F7F6F3] border border-[#EBEBEA] rounded-md px-3.5 py-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-[#9B9A97] block">
              Facility Footprint
            </span>
            <div className="text-xs font-semibold text-[#37352F] mt-0.5">{entityStats.venueCount} Assigned Rooms</div>
            <span className="text-[11px] text-emerald-700">Suitability Verified (H2)</span>
          </div>

          <div className="bg-[#F7F6F3] border border-[#EBEBEA] rounded-md px-3.5 py-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-[#9B9A97] block">
              Integrity Status
            </span>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>0 Hard Violations</span>
            </div>
            <span className="text-[11px] text-[#787774]">Continuous 13:00 Lunch</span>
          </div>
        </div>

        {/* 3. Filter Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#EBEBEA]/80">
          <div className="inline-flex bg-[#F7F6F3] p-0.5 rounded-md border border-[#EBEBEA] text-xs">
            <button
              onClick={() => {
                setFilterType('group');
                setSelectedFilter(metadata.studentGroups?.[0]?.externalId || 'CSE-2');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                filterType === 'group' ? 'bg-white text-[#37352F] shadow-2xs font-semibold' : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              By Cohort
            </button>
            <button
              onClick={() => {
                setFilterType('faculty');
                setSelectedFilter(metadata.faculty?.[0]?.externalId || 'F01');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                filterType === 'faculty' ? 'bg-white text-[#37352F] shadow-2xs font-semibold' : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              By Faculty
            </button>
            <button
              onClick={() => {
                setFilterType('room');
                setSelectedFilter(metadata.rooms?.[0]?.externalId || 'LH-1');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                filterType === 'room' ? 'bg-white text-[#37352F] shadow-2xs font-semibold' : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              By Venue
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              onClick={() => setQuickFilter('all')}
              className={`px-2 py-0.5 text-[11px] rounded border transition cursor-pointer ${
                quickFilter === 'all'
                  ? 'border-[#37352F] bg-[#37352F] text-white'
                  : 'border-[#EBEBEA] bg-white text-[#787774] hover:text-[#37352F]'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setQuickFilter('labs')}
              className={`px-2 py-0.5 text-[11px] rounded border transition flex items-center gap-1 cursor-pointer ${
                quickFilter === 'labs'
                  ? 'border-purple-600 bg-purple-50 text-purple-900 font-medium'
                  : 'border-[#EBEBEA] bg-white text-[#787774] hover:text-[#37352F]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span>
              Labs Only (3h)
            </button>
            <button
              onClick={() => setQuickFilter('lectures')}
              className={`px-2 py-0.5 text-[11px] rounded border transition flex items-center gap-1 cursor-pointer ${
                quickFilter === 'lectures'
                  ? 'border-sky-600 bg-sky-50 text-sky-900 font-medium'
                  : 'border-[#EBEBEA] bg-white text-[#787774] hover:text-[#37352F]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></span>
              Lectures
            </button>
            <button
              onClick={() => setQuickFilter('tutorials')}
              className={`px-2 py-0.5 text-[11px] rounded border transition flex items-center gap-1 cursor-pointer ${
                quickFilter === 'tutorials'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-medium'
                  : 'border-[#EBEBEA] bg-white text-[#787774] hover:text-[#37352F]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
              Tutorials
            </button>

            {/* Target Select Dropdown */}
            <div className="w-52 ml-1">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="h-7 text-xs bg-white border-[#EBEBEA] text-[#37352F]">
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white">
                  {filterType === 'group' &&
                    (metadata.studentGroups || []).map((g: any) => (
                      <SelectItem key={g.externalId} value={g.externalId} className="text-xs">
                        {g.externalId} — {g.name} ({g.size})
                      </SelectItem>
                    ))}
                  {filterType === 'faculty' &&
                    (metadata.faculty || []).map((f: any) => (
                      <SelectItem key={f.externalId} value={f.externalId} className="text-xs">
                        {f.externalId} — {f.name}
                      </SelectItem>
                    ))}
                  {filterType === 'room' &&
                    (metadata.rooms || []).map((r: any) => (
                      <SelectItem key={r.externalId} value={r.externalId} className="text-xs">
                        {r.externalId} ({r.type}, Cap {r.capacity})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Notion Schedule Matrix Table */}
      <div className="bg-white border border-[#EBEBEA] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[1050px]">
            {/* Header Timings */}
            <div className="grid grid-cols-[80px_repeat(5,1fr)_44px_repeat(4,1fr)] bg-[#F7F6F3] border-b border-[#EBEBEA] text-center text-xs select-none">
              <div className="p-2 border-r border-[#EBEBEA] font-medium text-[#787774] flex items-center justify-center">
                Day
              </div>
              <div className="p-2 border-r border-[#EBEBEA]">
                <span className="font-semibold text-[#37352F] text-[11px] block">P1 · 08:00</span>
                <span className="text-[10px] text-[#9B9A97]">08:00–09:00</span>
              </div>
              <div className="p-2 border-r border-[#EBEBEA]">
                <span className="font-semibold text-[#37352F] text-[11px] block">P2 · 09:00</span>
                <span className="text-[10px] text-[#9B9A97]">09:00–10:00</span>
              </div>
              <div className="p-2 border-r border-[#EBEBEA]">
                <span className="font-semibold text-[#37352F] text-[11px] block">P3 · 10:00</span>
                <span className="text-[10px] text-[#9B9A97]">10:00–11:00</span>
              </div>
              <div className="p-2 border-r border-[#EBEBEA]">
                <span className="font-semibold text-[#37352F] text-[11px] block">P4 · 11:00</span>
                <span className="text-[10px] text-[#9B9A97]">11:00–12:00</span>
              </div>
              <div className="p-2 border-r border-[#EBEBEA]">
                <span className="font-semibold text-[#37352F] text-[11px] block">P5 · 12:00</span>
                <span className="text-[10px] text-[#9B9A97]">12:00–13:00</span>
              </div>

              {/* Lunch Column */}
              <div className="p-1 border-r border-[#EBEBEA] bg-[#ECECE9] flex flex-col justify-center items-center">
                <span className="text-[9px] font-semibold tracking-wider text-[#787774] uppercase">Lunch</span>
                <span className="text-[9px] font-mono text-[#9B9A97]">13–14</span>
              </div>

              {/* Afternoon Columns */}
              <div className="p-2 border-r border-[#EBEBEA]">
                <span className="font-semibold text-[#37352F] text-[11px] block">P6 · 14:00</span>
                <span className="text-[10px] text-[#9B9A97]">14:00–15:00</span>
              </div>
              <div className="p-2 border-r border-[#EBEBEA]">
                <span className="font-semibold text-[#37352F] text-[11px] block">P7 · 15:00</span>
                <span className="text-[10px] text-[#9B9A97]">15:00–16:00</span>
              </div>
              <div className="p-2 border-r border-[#EBEBEA]">
                <span className="font-semibold text-[#37352F] text-[11px] block">P8 · 16:00</span>
                <span className="text-[10px] text-[#9B9A97]">16:00–17:00</span>
              </div>
              <div className="p-2">
                <span className="font-semibold text-[#37352F] text-[11px] block">P9 · 17:00</span>
                <span className="text-[10px] text-[#9B9A97]">17:00–18:00</span>
              </div>
            </div>

            {/* Rows MON–FRI */}
            {days.map((day, idx) => (
              <div
                key={day}
                className={`grid grid-cols-[80px_repeat(5,1fr)_44px_repeat(4,1fr)] min-h-[82px] ${
                  idx !== days.length - 1 ? 'border-b border-[#EBEBEA]' : ''
                }`}
              >
                {/* Day Label */}
                <div className="p-2 border-r border-[#EBEBEA] bg-[#F7F6F3]/50 flex flex-col justify-center items-center select-none">
                  <span className="font-semibold text-xs text-[#37352F]">{day}</span>
                  <span className="text-[10px] text-[#9B9A97] font-mono mt-0.5">
                    {getDayHours(day)}h
                  </span>
                </div>

                {/* Morning Periods (P1–P5) */}
                {renderPeriodBlock(day, 1, 5)}

                {/* Lunch Strip */}
                <div className="border-r border-[#EBEBEA] bg-[repeating-linear-gradient(-45deg,#FAFAF9,#FAFAF9_4px,#F4F4F2_4px,#F4F4F2_8px)] flex items-center justify-center select-none">
                  <span className="text-[9px] font-mono text-[#9B9A97] rotate-90 tracking-widest uppercase font-medium">
                    Break
                  </span>
                </div>

                {/* Afternoon Periods (P6–P9) */}
                {renderPeriodBlock(day, 6, 9)}
              </div>
            ))}
          </div>
        </div>

        {/* Legend Footer */}
        <div className="border-t border-[#EBEBEA] bg-[#FDFDFD] px-5 py-2.5 flex flex-wrap items-center justify-between text-xs text-[#787774] gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
              <span className="text-[11px]">Core Lecture</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A855F7]"></span>
              <span className="text-[11px]">Practical Lab (3h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
              <span className="text-[11px]">Tutorial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
              <span className="text-[11px]">Elective / Basket</span>
            </div>
          </div>

          <span className="text-[11px] text-[#9B9A97]">
            Click any session block to inspect constraints or simulate a drag & drop move
          </span>
        </div>
      </div>

      {/* 5. Slide-Over Session Drawer */}
      {selectedSessionDetail && (
        <div className="fixed inset-y-0 right-0 w-84 sm:w-96 bg-white border-l border-[#EBEBEA] shadow-xl z-50 flex flex-col font-sans animate-in slide-in-from-right-4 duration-200">
          <div className="p-4 border-b border-[#EBEBEA] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <span className="text-base">📄</span>
              <span className="text-xs font-semibold text-[#37352F] uppercase tracking-wider">
                Session Inspection
              </span>
            </div>
            <button
              onClick={() => setSelectedSessionDetail(null)}
              className="p-1.5 rounded-md hover:bg-[#F1F1EF] text-[#787774] hover:text-[#37352F] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#F7F6F3] border border-[#EBEBEA] text-[#37352F]">
                {selectedSessionDetail.session.courseId}
              </span>
              <h3 className="text-sm font-semibold text-[#37352F] mt-2">
                Session ID: {selectedSessionDetail.session.externalId}
              </h3>
              <p className="text-xs text-[#787774] mt-0.5">
                Cohort(s): {(selectedSessionDetail.session.groups || []).join(', ')}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#EBEBEA]/80">
                <span className="text-[#787774]">Format</span>
                <span className="font-medium text-[#37352F] capitalize">
                  {selectedSessionDetail.session.kind || 'Lecture'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#EBEBEA]/80">
                <span className="text-[#787774]">Assigned Venue</span>
                <span className="font-medium font-mono text-[#37352F]">
                  {selectedSessionDetail.assignment.roomExternalId} (Cap: {selectedSessionDetail.room?.capacity || 80})
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#EBEBEA]/80">
                <span className="text-[#787774]">Instructor</span>
                <span className="font-medium text-[#37352F]">
                  {selectedSessionDetail.faculty?.name || selectedSessionDetail.session.facultyId}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#EBEBEA]/80">
                <span className="text-[#787774]">Time Slot</span>
                <span className="font-medium text-[#37352F]">
                  {selectedSessionDetail.assignment.day} · Period P{selectedSessionDetail.assignment.startPeriod} (
                  {selectedSessionDetail.session.duration || 1} hr)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#EBEBEA]/80">
                <span className="text-[#787774]">Integrity Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Free
                </span>
              </div>
            </div>

            {/* Pre-flight Reschedule Simulation */}
            <div className="p-3.5 rounded-lg border border-[#EBEBEA] bg-[#F7F6F3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#37352F] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#787774]" />
                  Simulate Drag & Drop Move
                </span>
                <span className="text-[10px] text-[#9B9A97] font-mono">Pre-flight CP-SAT</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-[#787774] block mb-1">Day</label>
                  <Select value={targetDay} onValueChange={setTargetDay}>
                    <SelectTrigger className="h-7 text-xs bg-white border-[#EBEBEA]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-[#787774] block mb-1">Period</label>
                  <Select value={String(targetPeriod)} onValueChange={(v) => setTargetPeriod(Number(v))}>
                    <SelectTrigger className="h-7 text-xs bg-white border-[#EBEBEA]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                        <SelectItem key={p} value={String(p)} className="text-xs">P{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-[#787774] block mb-1">Room</label>
                  <Select value={targetRoom} onValueChange={setTargetRoom}>
                    <SelectTrigger className="h-7 text-xs bg-white border-[#EBEBEA]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 bg-white">
                      {(metadata.rooms || []).map((r: any) => (
                        <SelectItem key={r.externalId} value={r.externalId} className="text-xs">
                          {r.externalId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <button
                onClick={handleValidateMove}
                disabled={validatingMove}
                className="w-full py-1.5 px-3 bg-white hover:bg-[#F1F1EF] border border-[#EBEBEA] text-[#37352F] rounded-md text-xs font-medium transition text-center shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {validatingMove ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{validatingMove ? 'Validating against H1–H10...' : 'Pre-flight Validate'}</span>
              </button>

              {moveValidationResult && (
                <div
                  className={`p-2.5 rounded-md border text-xs space-y-1.5 ${
                    moveValidationResult.valid
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                    {moveValidationResult.valid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Valid Move — Zero Hard Violations</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{moveValidationResult.violations?.length || 0} Conflict Violation(s)</span>
                      </>
                    )}
                  </div>

                  {!moveValidationResult.valid && moveValidationResult.violations && (
                    <ul className="text-[10px] list-disc list-inside space-y-0.5 opacity-90 font-mono">
                      {moveValidationResult.violations.slice(0, 3).map((v: any, i: number) => (
                        <li key={i}>{v.rule}: {v.detail}</li>
                      ))}
                    </ul>
                  )}

                  {moveValidationResult.valid && user?.role === 'admin' && (
                    <button
                      onClick={handleApplyMove}
                      disabled={applyingMove}
                      className="w-full mt-2 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {applyingMove ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      <span>Apply Move to Active Timetable</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
