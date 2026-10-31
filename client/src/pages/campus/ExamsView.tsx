import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCw, Play, FileCheck2, Building } from 'lucide-react';
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
    } catch (err: any) {
      toast.error('Failed to load exams', { description: err.message });
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
      toast.info('Solving midsem exams with CP-SAT (half-capacity constraint)...');
      const res = await campusApi.generateExams();
      toast.success(`Scheduled ${res.count} exams in ${res.solveTime}s!`);
      await fetchExams();
    } catch (err: any) {
      toast.error('Exam solver failed', { description: err.message });
    } finally {
      setSolving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-3">
        <RotateCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading Midsem Examination Schedule...</p>
      </div>
    );
  }

  const { allocations, exams, rooms, calendar } = data;
  const days = calendar?.days || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const sessions = ['AM', 'PM'];

  // Map slot -> list of allocations
  const slotMap = new Map<string, any[]>();
  for (const a of allocations) {
    const key = `${a.day}_${a.session}`;
    if (!slotMap.has(key)) slotMap.set(key, []);
    slotMap.get(key)!.push(a);
  }

  const examsMap = new Map<string, any>();
  for (const e of exams) examsMap.set(e.externalId, e);

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-8 space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Exams Scheduled</p>
              <h3 className="text-2xl font-bold font-poppins text-foreground mt-0.5">
                {allocations.length} <span className="text-sm font-normal text-muted-foreground">/ 41 total</span>
              </h3>
            </div>
            <FileCheck2 className="h-6 w-6 text-primary" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Seating Rule</p>
              <h3 className="text-base font-bold font-poppins text-foreground mt-0.5">
                Half Capacity (50%)
              </h3>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary">Distance Rule</Badge>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Multi-Exam Days Penalty</p>
              <h3 className="text-2xl font-bold font-poppins text-emerald-600 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="h-5 w-5" />
                <span>0 Penalty</span>
              </h3>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800">1 Exam / Day</Badge>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Calendar Scope</p>
              <h3 className="text-sm font-bold font-poppins text-foreground mt-0.5">
                MON – SAT (12 Slots)
              </h3>
            </div>
            {user?.role === 'admin' && (
              <Button
                size="sm"
                onClick={handleSolve}
                disabled={solving}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                <Play className={`h-3.5 w-3.5 ${solving ? 'animate-spin' : ''}`} />
                <span>{solving ? 'Solving...' : 'Re-Solve'}</span>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map((day: string) => (
          <Card key={day} className="rounded-2xl border shadow-xs overflow-hidden">
            <div className="p-3 border-b bg-muted/40 font-poppins font-bold text-sm text-foreground flex items-center justify-between">
              <span>{day}</span>
              <span className="text-xs font-normal text-muted-foreground font-mono">Exam Day</span>
            </div>
            <CardContent className="p-4 space-y-4">
              {sessions.map((sess) => {
                const examsInSlot = slotMap.get(`${day}_${sess}`) || [];
                return (
                  <div key={sess} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-primary flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        Session {sess} ({sess === 'AM' ? '09:30 - 11:30' : '14:00 - 16:00'})
                      </span>
                      <span className="text-[11px] text-muted-foreground">{examsInSlot.length} exams</span>
                    </div>

                    <div className="space-y-1.5">
                      {examsInSlot.length > 0 ? (
                        examsInSlot.map((exItem: any) => {
                          const examDetails = examsMap.get(exItem.examExternalId);
                          return (
                            <div
                              key={exItem.id}
                              className="p-2.5 rounded-xl border bg-card/60 shadow-2xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold font-poppins text-xs text-foreground">
                                  {exItem.examExternalId}
                                </span>
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                  {examDetails?.size} students
                                </Badge>
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span>Rooms: {exItem.rooms.join(', ')}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                Groups: {examDetails?.groups.join(', ')}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-2 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                          Free Slot (No Exam)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

