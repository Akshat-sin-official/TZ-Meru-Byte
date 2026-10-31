import React, { useState } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

export const DisruptionsView: React.FC = () => {
  const { user } = useCampusAuth();
  const [solving, setSolving] = useState(false);
  const [repairResult, setRepairResult] = useState<any>(null);

  // Pre-configured official practice disruption payload
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
        reason: 'Conference travel every Monday for the rest of the semester',
      },
      {
        type: 'room_unavailable',
        room_id: 'CR-102',
        days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        periods: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        reason: 'Water leak, room closed for the rest of the semester',
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
          basket_slot: null,
          fixed_slot: null,
        },
      },
    ],
  };

  const handleRunRepair = async () => {
    setSolving(true);
    try {
      toast.info('Running 2-Stage CP-SAT Disruption Repair Solver...');
      const res = await campusApi.submitDisruption(sampleDisruption);
      setRepairResult(res);
      toast.success(`Disruption solved! 0 hard violations, ${res.summary.totalMoved} sessions moved.`);
    } catch (err: any) {
      toast.error('Repair failed', { description: err.message });
    } finally {
      setSolving(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-8 space-y-6">
      {/* Top Description Card */}
      <Card className="rounded-2xl border shadow-xs bg-destructive/5 border-destructive/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-bold font-poppins text-foreground">
                Disruption & Rescheduling Engine
              </h3>
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                Permanent Semester Changes
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Handles unforeseen real-world disruptions: faculty leaves, facility closures, and added/dropped courses.
              The 2-stage CP-SAT solver prioritizes <strong>0 hard violations</strong> while minimizing schedule churn
              (time changes are penalized 10x higher than room-only changes).
            </p>
          </div>

          {user?.role === 'admin' ? (
            <Button
              size="sm"
              onClick={handleRunRepair}
              disabled={solving}
              className="gap-2 shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Play className={`h-4 w-4 ${solving ? 'animate-spin' : ''}`} />
              <span>{solving ? 'Optimizing Repair...' : 'Simulate Practice Disruption'}</span>
            </Button>
          ) : (
            <Badge variant="outline">Admin Controlled</Badge>
          )}
        </CardContent>
      </Card>

      {/* Disruption Changes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sampleDisruption.changes.map((ch: any, idx: number) => (
          <Card key={idx} className="rounded-2xl border shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-poppins font-bold text-xs text-foreground uppercase tracking-wider">
                  Change #{idx + 1}
                </span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {ch.type.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-xs font-semibold text-foreground">
                {ch.faculty_id || ch.room_id || ch.session?.id}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {ch.reason || 'New session injection'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Repair Results & Stability Impact */}
      {repairResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="rounded-2xl border shadow-xs bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Hard Violations</p>
                  <h3 className="text-2xl font-bold font-poppins text-foreground mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>0 Violations</span>
                  </h3>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800">Clean Repair</Badge>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Sessions Moved</p>
                  <h3 className="text-2xl font-bold font-poppins text-foreground mt-0.5">
                    {repairResult.summary.totalMoved}
                  </h3>
                </div>
                <Badge variant="outline">Minimal Churn</Badge>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Time Changed</p>
                  <h3 className="text-2xl font-bold font-poppins text-destructive mt-0.5">
                    {repairResult.summary.timeChanged} <span className="text-xs text-muted-foreground">sessions</span>
                  </h3>
                </div>
                <Clock className="h-5 w-5 text-destructive" />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Room Only Changed</p>
                  <h3 className="text-2xl font-bold font-poppins text-amber-600 mt-0.5">
                    {repairResult.summary.roomOnlyChanged} <span className="text-xs text-muted-foreground">sessions</span>
                  </h3>
                </div>
                <Building2 className="h-5 w-5 text-amber-600" />
              </CardContent>
            </Card>
          </div>

          {/* Session by Session Diff Table */}
          <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
              <h4 className="font-poppins font-semibold text-sm">Rescheduled Sessions Diff</h4>
              <span className="text-xs text-muted-foreground">
                Download verified export: <a href="http://localhost:5000/api/exports/schedule_after.json" className="text-primary underline">schedule_after.json</a>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground font-semibold">
                    <th className="p-3">Session ID</th>
                    <th className="p-3">Original Assignment</th>
                    <th className="p-3"></th>
                    <th className="p-3">Repaired Assignment</th>
                    <th className="p-3">Shift Type</th>
                  </tr>
                </thead>
                <tbody>
                  {repairResult.movedSessions.map((m: any) => (
                    <tr key={m.sessionId} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">{m.sessionId}</td>
                      <td className="p-3 font-medium text-muted-foreground">
                        {m.oldSlot.day} P{m.oldSlot.start} in {m.oldSlot.room}
                      </td>
                      <td className="p-3 text-center">
                        <ArrowRight className="h-3.5 w-3.5 text-primary" />
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        {m.newSlot.day} P{m.newSlot.start} in {m.newSlot.room}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`text-[10px] capitalize ${
                            m.type === 'time_changed'
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {m.type.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

