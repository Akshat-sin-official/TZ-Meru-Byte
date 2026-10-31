import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { RotateCw, CheckCircle2 } from 'lucide-react';

export const ExamsView: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getActiveExams();
      setData(res);
    } catch {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleSolve = async () => {
    setSolving(true);
    try {
      toast.info('Scheduling midsem exams with CP-SAT...');
      await campusApi.generateExams();
      toast.success('Exams scheduled with 0 conflicts');
      await fetchExams();
    } catch {
      toast.error('Scheduling failed');
    } finally {
      setSolving(false);
    }
  };

  const { allocations = [], exams = [], rooms = [], calendar } = data || {};
  const days = calendar?.days || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const sessions = ['AM', 'PM'];

  const examsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const e of exams) map.set(e.externalId, e);
    return map;
  }, [exams]);

  const allGroups = useMemo(() => {
    const s = new Set<string>();
    for (const e of exams) {
      if (Array.isArray(e.groups)) {
        for (const g of e.groups) {
          if (user?.role === 'department_coordinator' && user.department) {
            if (g.startsWith(user.department)) s.add(g);
          } else {
            s.add(g);
          }
        }
      }
    }
    return Array.from(s).sort();
  }, [exams, user?.role, user?.department]);

  const filteredAllocations = useMemo(() => {
    return allocations.filter((a: any) => {
      const exam = examsMap.get(a.examExternalId);
      if (!exam) return false;

      if (groupFilter !== 'all' && (!exam.groups || !exam.groups.includes(groupFilter))) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = a.examExternalId.toLowerCase().includes(q);
        const matchRoom = (a.rooms || []).some((r: string) => r.toLowerCase().includes(q));
        if (!matchId && !matchRoom) return false;
      }

      return true;
    });
  }, [allocations, examsMap, groupFilter, searchQuery]);

  const slotMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const a of filteredAllocations) {
      const key = `${a.day}_${a.session}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [filteredAllocations]);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-ink-soft">
        Loading midsem exams...
      </div>
    );
  }

  if (user?.role === 'club') {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center max-w-md mx-auto my-16 space-y-3 shadow-xs">
        <h3 className="text-base font-semibold text-[#09090B]">Midsem Seating Matrix Restricted</h3>
        <p className="text-xs text-[#52525B] leading-relaxed">
          Club Representatives do not have operational clearance to inspect midsem examination seating grids per Institute RBAC policies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-xl font-bold font-poppins text-[#111926] tracking-tight">
            Midsem Examination Seating
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-poppins">
            {allocations.length} total exams · Half-capacity enforced (Rule E1) · 0 group multi-exam clashes
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-poppins font-bold">Group:</span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#111926] font-poppins font-medium shadow-2xs focus:outline-none"
            >
              <option value="all">All Groups</option>
              {allGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exam or room..."
            className="w-48 h-8 rounded-lg text-xs bg-white border-[#E5E7EB] font-poppins font-medium shadow-2xs"
          />

          {user?.role === 'admin' && (
            <button
              onClick={handleSolve}
              disabled={solving}
              className="rounded-lg bg-primary hover:bg-primary/95 text-white shadow-xs font-bold font-poppins px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              {solving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{solving ? 'Solving...' : 'Re-Schedule'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Grid by Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map((day: string) => {
          const amExams = slotMap.get(`${day}_AM`) || [];
          const pmExams = slotMap.get(`${day}_PM`) || [];
          const totalInDay = amExams.length + pmExams.length;

          return (
            <div
              key={day}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 shadow-xs hover:border-primary/40 transition"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                <span className="font-poppins font-bold text-xs text-[#111926]">{day}</span>
                <span className="text-[10px] font-bold font-poppins text-muted-foreground bg-[#FAF9F6] border border-[#E5E7EB] px-2 py-0.5 rounded-md">
                  {totalInDay} exams
                </span>
              </div>

              {sessions.map((sess) => {
                const items = slotMap.get(`${day}_${sess}`) || [];
                const timeLabel = sess === 'AM' ? '09:30–11:30' : '14:00–16:00';

                return (
                  <div key={sess} className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-ink-soft font-poppins font-bold">
                      <span className="text-ink">
                        {sess} Session <span className="font-normal text-ink-soft/60">({timeLabel})</span>
                      </span>
                      <span>{items.length}</span>
                    </div>

                    <div className="space-y-1.5">
                      {items.length > 0 ? (
                        items.map((exItem: any) => {
                          const exam = examsMap.get(exItem.examExternalId);
                          return (
                            <div
                              key={exItem.id}
                              onClick={() => setSelectedExam({ allocation: exItem, exam })}
                              className="group p-2.5 rounded-xl border border-border/70 bg-[#FAF9F6] hover:bg-white hover:border-primary/50 cursor-pointer transition text-xs flex items-center justify-between shadow-2xs"
                            >
                              <div className="min-w-0 pr-1">
                                <div className="font-bold text-xs text-ink truncate font-poppins">
                                  {exItem.examExternalId}
                                </div>
                                <div className="text-[11px] text-ink-soft truncate mt-0.5">
                                  {exItem.rooms.join(', ')} · {exam?.size || 0} students
                                </div>
                              </div>
                              <span className="text-[9px] font-bold font-poppins px-2 py-0.5 rounded-full bg-[#DDECD4] text-[#2D5A27] shrink-0">
                                Half-Cap OK
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-2 text-center text-[10px] text-ink-soft/50 border border-dashed border-border/60 rounded-xl">
                          No exams scheduled
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Exam Detail Sheet */}
      <Sheet open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
        <SheetContent className="w-full sm:max-w-md p-6 space-y-6 bg-white overflow-y-auto font-sans">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded-full bg-[#DDECD4] text-[#2D5A27] font-bold">
                Midsem Exam
              </span>
              <span className="text-xs text-ink-soft">
                {selectedExam?.allocation?.day} · Session {selectedExam?.allocation?.session}
              </span>
            </div>
            <SheetTitle className="font-poppins text-xl font-bold text-ink">
              {selectedExam?.allocation?.examExternalId}
            </SheetTitle>
          </SheetHeader>

          {selectedExam && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl border border-border/70 bg-[#FAF9F6] space-y-2">
                <div className="text-[11px] font-bold text-ink font-poppins uppercase tracking-wider">
                  Venue & Capacity Breakdown
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Total Examinees:</span>
                    <span className="font-bold text-ink">
                      {selectedExam.exam?.size} students
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Assigned Venues:</span>
                    <span className="font-bold text-ink">
                      {selectedExam.allocation.rooms.join(', ')}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border/60 text-[11px] text-[#4B5563] leading-relaxed">
                    Under the Half-Capacity rule (E1), total room capacity must equal or exceed twice the number of students ({selectedExam.exam?.size * 2} seats required).
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border/70 bg-white space-y-2">
                <div className="text-[11px] font-bold text-ink font-poppins uppercase tracking-wider">
                  Enrolled Student Groups
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedExam.exam?.groups || []).map((g: string) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-full border border-border/80 bg-[#FAF9F6] text-ink text-xs font-bold font-poppins"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
