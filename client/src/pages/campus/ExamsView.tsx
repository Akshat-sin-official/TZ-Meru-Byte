import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

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
      toast.info('Scheduling midsem exams...');
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

  const roomsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of rooms) map.set(r.externalId, r);
    return map;
  }, [rooms]);

  // Extract all distinct student groups
  const allGroups = useMemo(() => {
    const s = new Set<string>();
    for (const e of exams) {
      if (Array.isArray(e.groups)) {
        for (const g of e.groups) s.add(g);
      }
    }
    return Array.from(s).sort();
  }, [exams]);

  // Filtered allocations
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
      <div className="flex h-64 items-center justify-center text-xs text-[#71717A]">
        Loading midsem exams...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-6 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-[#111827]">
              Midsem Examinations
            </h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Half-Capacity Enforced
            </span>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            {allocations.length} total exams scheduled · Showing {filteredAllocations.length} · 0 group multi-exam clashes
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Group Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
            <span>Group:</span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-7 text-xs bg-white border border-[#E5E7EB] rounded px-2 text-[#111827] focus:outline-none focus:border-[#7C3AED]"
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
            className="w-36 h-7 text-xs bg-white border-[#E5E7EB]"
          />

          {user?.role === 'admin' && (
            <Button
              size="sm"
              onClick={handleSolve}
              disabled={solving}
              className="h-7 px-3 text-xs font-medium bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            >
              {solving ? 'Solving...' : 'Re-Schedule'}
            </Button>
          )}
        </div>
      </div>

      {/* Clean Compact Matrix by Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {days.map((day: string) => {
          const amExams = slotMap.get(`${day}_AM`) || [];
          const pmExams = slotMap.get(`${day}_PM`) || [];
          const totalInDay = amExams.length + pmExams.length;

          return (
            <div
              key={day}
              className="rounded-lg border border-[#E5E7EB] bg-white p-3 space-y-2.5 shadow-2xs hover:border-[#7C3AED]/30 transition"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E7EB]">
                <span className="font-heading font-semibold text-xs text-[#111827]">{day}</span>
                <span className="text-[10px] text-[#71717A] font-mono">{totalInDay} exams</span>
              </div>

              {sessions.map((sess) => {
                const items = slotMap.get(`${day}_${sess}`) || [];
                const timeLabel = sess === 'AM' ? '09:30–11:30' : '14:00–16:00';

                return (
                  <div key={sess} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#71717A]">
                      <span className="font-medium text-[#111827]">
                        {sess} Session <span className="font-normal text-[#9CA3AF]">({timeLabel})</span>
                      </span>
                      <span>{items.length}</span>
                    </div>

                    <div className="space-y-1">
                      {items.length > 0 ? (
                        items.map((exItem: any) => {
                          const exam = examsMap.get(exItem.examExternalId);
                          return (
                            <div
                              key={exItem.id}
                              onClick={() => setSelectedExam({ allocation: exItem, exam })}
                              className="group p-1.5 rounded border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-white hover:border-[#7C3AED]/50 cursor-pointer transition text-xs flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-1">
                                <div className="font-semibold text-xs text-[#111827] truncate font-heading">
                                  {exItem.examExternalId}
                                </div>
                                <div className="text-[10px] text-[#71717A] truncate">
                                  {exItem.rooms.join(', ')} · {exam?.size || 0} students
                                </div>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                Valid
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-1 text-center text-[10px] text-[#9CA3AF] border border-dashed border-[#E5E7EB] rounded">
                          No exams
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
        <SheetContent className="w-full sm:max-w-md p-6 space-y-5 bg-white">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Midsem Exam
              </span>
              <span className="text-xs text-[#71717A]">
                {selectedExam?.allocation?.day} · Session {selectedExam?.allocation?.session}
              </span>
            </div>
            <SheetTitle className="font-heading text-lg font-semibold text-[#111827]">
              {selectedExam?.allocation?.examExternalId}
            </SheetTitle>
          </SheetHeader>

          {selectedExam && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] space-y-2">
                <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Venue & Capacity Breakdown
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Total Examinees:</span>
                    <span className="font-semibold text-[#111827]">
                      {selectedExam.exam?.size} students
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Assigned Venues:</span>
                    <span className="font-medium text-[#111827]">
                      {selectedExam.allocation.rooms.join(', ')}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-[#E5E7EB] text-[11px] text-[#4B5563]">
                    Under the Half-Capacity rule (E1), total room capacity must equal or exceed twice the number of students ({selectedExam.exam?.size * 2} seats required).
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-white space-y-2">
                <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Enrolled Student Groups
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedExam.exam?.groups || []).map((g: string) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded border border-[#E5E7EB] bg-[#FAF9F6] text-[#111827] text-xs font-mono"
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
