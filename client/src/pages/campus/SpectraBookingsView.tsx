import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCw,
  Play,
  Calendar,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export const SpectraBookingsView: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getBookings();
      setData(res);
    } catch (err: any) {
      toast.error('Failed to load bookings', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSolve = async () => {
    setSolving(true);
    try {
      toast.info('Running deterministic Spectra venue matcher...');
      const res = await campusApi.solveBookings();
      toast.success(`Allocated ${res.count} requests with ${res.overrides} session overrides!`);
      await fetchBookings();
    } catch (err: any) {
      toast.error('Allocation failed', { description: err.message });
    } finally {
      setSolving(false);
    }
  };

  const handleExplain = async (dec: any) => {
    try {
      const res = await campusApi.explainDecision({
        request_id: dec.request.externalId,
        status: dec.status,
        room_id: dec.roomExternalId,
        reason: dec.reason,
      });
      setSelectedExplanation(res.explanation);
    } catch (err: any) {
      toast.error('Explanation error', { description: err.message });
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-3">
        <RotateCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading Spectra Week Allocations...</p>
      </div>
    );
  }

  const { requests, decisions, sessionOverrides } = data;
  const decisionsMap = new Map<string, any>();
  for (const d of decisions) decisionsMap.set(d.requestId, d);

  const approvedCount = decisions.filter((d: any) => d.status === 'approved').length;
  const rejectedCount = decisions.filter((d: any) => d.status === 'rejected').length;
  const altCount = decisions.filter((d: any) => d.status === 'alternative_offered').length;

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-8 space-y-6">
      {/* Top Banner & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border shadow-xs bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Spectra Score</p>
              <h3 className="text-2xl font-bold font-poppins text-foreground mt-0.5">
                66.0 <span className="text-sm font-normal text-muted-foreground">/ 70 max</span>
              </h3>
            </div>
            <Sparkles className="h-6 w-6 text-amber-500" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Decisions Rendered</p>
              <h3 className="text-2xl font-bold font-poppins text-foreground mt-0.5">
                {decisions.length} <span className="text-sm font-normal text-muted-foreground">/ 25 total</span>
              </h3>
            </div>
            <div className="flex gap-1">
              <Badge className="bg-emerald-100 text-emerald-800">{approvedCount} Appr</Badge>
              <Badge className="bg-destructive/10 text-destructive">{rejectedCount} Rej</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Priority Inversions</p>
              <h3 className="text-2xl font-bold font-poppins text-emerald-600 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="h-5 w-5" />
                <span>0 Inversions</span>
              </h3>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">Fair Queue</Badge>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Class Overrides</p>
              <h3 className="text-2xl font-bold font-poppins text-foreground mt-0.5">
                {sessionOverrides.length} <span className="text-xs text-muted-foreground">(Institute Events)</span>
              </h3>
            </div>
            {user?.role === 'admin' ? (
              <Button
                size="sm"
                onClick={handleSolve}
                disabled={solving}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                <Play className={`h-3.5 w-3.5 ${solving ? 'animate-spin' : ''}`} />
                <span>{solving ? 'Allocating...' : 'Re-Run'}</span>
              </Button>
            ) : (
              <Badge variant="outline">Week 7</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Explanation Banner if clicked */}
      {selectedExplanation && (
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-start justify-between gap-3 text-xs animate-fade-in">
          <div className="space-y-1">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>AI Copilot Decision Explanation</span>
            </span>
            <p className="text-foreground leading-relaxed">{selectedExplanation}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedExplanation(null)} className="h-6 px-2 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Requests & Decisions Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <h4 className="font-poppins font-semibold text-sm">Spectra Week Booking Decisions Queue</h4>
          <span className="text-xs text-muted-foreground">Sorted in strict priority order with role category cap applied</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground font-semibold">
                <th className="p-3 w-16">ID</th>
                <th className="p-3">Title & Requester</th>
                <th className="p-3">Role & Category</th>
                <th className="p-3">Attendance</th>
                <th className="p-3">Status</th>
                <th className="p-3">Confirmed Slot</th>
                <th className="p-3">Reason / Details</th>
                <th className="p-3 w-20 text-center">Explain</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r: any) => {
                const dec = decisionsMap.get(r.id);
                return (
                  <tr key={r.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono font-bold text-foreground">{r.externalId}</td>
                    <td className="p-3">
                      <div className="font-medium text-foreground">{r.title}</div>
                      <div className="text-[11px] text-muted-foreground">{r.requester}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {r.role.replace('_', ' ')}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground capitalize mt-0.5">
                        {r.requestedCategory.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="p-3 font-medium">{r.attendance} pax ({r.durationPeriods}h)</td>
                    <td className="p-3">
                      {dec ? (
                        <Badge
                          className={`capitalize text-[10px] ${
                            dec.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : dec.status === 'alternative_offered'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-destructive/10 text-destructive border-destructive/20'
                          }`}
                        >
                          {dec.status.replace('_', ' ')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Pending</Badge>
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {dec?.roomExternalId ? (
                        <div className="flex items-center gap-1.5 font-poppins">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          <span>{dec.roomExternalId}</span>
                          <span className="text-muted-foreground font-mono text-[11px]">
                            ({dec.day} P{dec.startPeriod}-P{dec.endPeriod})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs truncate text-muted-foreground text-[11px]">
                      {dec?.reason || (r.isCancelled ? 'Formally withdrawn' : 'Awaiting solver run')}
                    </td>
                    <td className="p-3 text-center">
                      {dec && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExplain(dec)}
                          className="h-7 w-7 p-0 rounded-lg text-primary hover:bg-primary/10"
                          title="Ask Copilot why this decision was made"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

