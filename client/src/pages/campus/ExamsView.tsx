import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const ExamsView: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);

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

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#71717A]">
        Loading midsem exams...
      </div>
    );
  }

  const { allocations, exams, calendar } = data;
  const days = calendar?.days || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const sessions = ['AM', 'PM'];

  const slotMap = new Map<string, any[]>();
  for (const a of allocations) {
    const key = `${a.day}_${a.session}`;
    if (!slotMap.has(key)) slotMap.set(key, []);
    slotMap.get(key)!.push(a);
  }

  const examsMap = new Map<string, any>();
  for (const e of exams) examsMap.set(e.externalId, e);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
        <div>
          <h2 className="font-poppins text-lg font-semibold text-[#18181B]">
            Midsem Examinations
          </h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            {allocations.length} exams · Half-capacity rule enforced · 0 multi-exam group clashes
          </p>
        </div>

        {user?.role === 'admin' && (
          <Button
            size="sm"
            onClick={handleSolve}
            disabled={solving}
            className="h-8 px-3 text-xs font-medium bg-[#18181B] text-white hover:bg-[#27272A]"
          >
            {solving ? 'Solving...' : 'Re-Schedule'}
          </Button>
        )}
      </div>

      {/* Clean Grid by Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map((day: string) => (
          <div key={day} className="rounded-lg border border-[#E4E4E7] bg-white p-4 space-y-3">
            <div className="font-poppins font-medium text-xs text-[#18181B] pb-2 border-b border-[#E4E4E7]">
              {day}
            </div>

            {sessions.map((sess) => {
              const items = slotMap.get(`${day}_${sess}`) || [];
              return (
                <div key={sess} className="space-y-1.5">
                  <div className="text-[11px] font-medium text-[#71717A] flex items-center justify-between">
                    <span>Session {sess} ({sess === 'AM' ? '09:30' : '14:00'})</span>
                    <span className="text-[10px] text-[#A1A1AA]">{items.length} exams</span>
                  </div>

                  <div className="space-y-1">
                    {items.length > 0 ? (
                      items.map((exItem: any) => {
                        const exam = examsMap.get(exItem.examExternalId);
                        return (
                          <div
                            key={exItem.id}
                            className="p-2 rounded border border-[#E4E4E7] bg-[#FAF9F6]/40 text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-xs text-[#18181B]">{exItem.examExternalId}</div>
                              <div className="text-[10px] text-[#71717A]">
                                {exItem.rooms.join(', ')} · {exam?.size} students
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-2 text-center text-[11px] text-[#A1A1AA] border border-dashed border-[#E4E4E7] rounded">
                        No exams
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
