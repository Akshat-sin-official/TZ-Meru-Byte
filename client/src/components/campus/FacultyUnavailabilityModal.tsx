import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { toast } from 'sonner';
import {
  CalendarOff,
  Clock,
  Sparkles,
  RotateCw,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface FacultyUnavailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userFacultyId?: string;
  userFacultyName?: string;
}

const ALL_DAYS = [
  { id: 'MON', label: 'Monday' },
  { id: 'TUE', label: 'Tuesday' },
  { id: 'WED', label: 'Wednesday' },
  { id: 'THU', label: 'Thursday' },
  { id: 'FRI', label: 'Friday' },
];

const ALL_PERIODS = [
  { id: 1, label: 'P1', time: '08:00 - 09:00' },
  { id: 2, label: 'P2', time: '09:00 - 10:00' },
  { id: 3, label: 'P3', time: '10:00 - 11:00' },
  { id: 4, label: 'P4', time: '11:00 - 12:00' },
  { id: 5, label: 'P5', time: '12:00 - 13:00' },
  { id: 6, label: 'P6', time: '14:00 - 15:00' },
  { id: 7, label: 'P7', time: '15:00 - 16:00' },
  { id: 8, label: 'P8', time: '16:00 - 17:00' },
  { id: 9, label: 'P9', time: '17:00 - 18:00' },
];

export const FacultyUnavailabilityModal: React.FC<FacultyUnavailabilityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userFacultyId,
  userFacultyName,
}) => {
  const [selectedDays, setSelectedDays] = useState<string[]>(['MON']);
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([1, 2]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await campusApi.getFacultyUnavailabilities();
      if (res.records) {
        setMyRequests(res.records);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleDay = (d: string) => {
    if (selectedDays.includes(d)) {
      if (selectedDays.length === 1) {
        toast.error('Select at least one unavailable day');
        return;
      }
      setSelectedDays(selectedDays.filter((x) => x !== d));
    } else {
      setSelectedDays([...selectedDays, d]);
    }
  };

  const togglePeriod = (p: number) => {
    if (selectedPeriods.includes(p)) {
      if (selectedPeriods.length === 1) {
        toast.error('Select at least one unavailable period');
        return;
      }
      setSelectedPeriods(selectedPeriods.filter((x) => x !== p));
    } else {
      setSelectedPeriods([...selectedPeriods, p].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await campusApi.submitFacultyUnavailability({
        days: selectedDays,
        periods: selectedPeriods,
        reason: reason.trim() || undefined,
      });

      setResult(res);
      toast.success('Unavailability submitted and conflict-free relocation plan generated!');
      fetchHistory();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit unavailability';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#FAF9F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <CalendarOff className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111926] font-poppins">
                Faculty Unavailability & Rescheduling
              </h2>
              <p className="text-xs text-muted-foreground">
                Prof. {userFacultyName || userFacultyId || 'Authenticated Faculty'} ({userFacultyId || 'Own Profile'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-black hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-poppins">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Day Selection */}
            <div>
              <label className="font-semibold text-[#111926] block mb-1.5">
                Unavailable Days <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((d) => {
                  const active = selectedDays.includes(d.id);
                  return (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => toggleDay(d.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        active
                          ? 'bg-[#111926] text-white border-[#111926] shadow-2xs font-semibold'
                          : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-black'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Period Selection */}
            <div>
              <label className="font-semibold text-[#111926] block mb-1.5">
                Unavailable Teaching Periods <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {ALL_PERIODS.map((p) => {
                  const active = selectedPeriods.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => togglePeriod(p.id)}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                        active
                          ? 'bg-red-500 text-white border-red-600 font-bold shadow-2xs'
                          : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-red-300'
                      }`}
                    >
                      <div className="font-mono text-xs font-semibold">{p.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{p.time.split(' - ')[0]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Reason */}
            <div>
              <label className="font-semibold text-[#111926] block mb-1.5">
                Reason / Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. University Senate Meeting, Medical leave, Academic Conference"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#111926] hover:bg-black text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Computing Conflict-Free Relocation (CP-SAT Solver)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Submit Unavailability & Generate Relocation Plan</span>
                </>
              )}
            </button>
          </form>

          {/* Submission Result / Relocation Plan */}
          {result && (
            <div className="space-y-3 pt-4 border-t border-[#E5E7EB] animate-in fade-in-50">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">
                    Proposal Generated & Submitted for Admin Approval
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Proposal ID: <span className="font-mono font-semibold">{result.proposalId}</span> • 
                    Status: <span className="font-semibold uppercase">{result.status}</span>
                  </div>
                </div>
              </div>

              {/* Affected Sessions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111926]">
                    Affected Teaching Sessions ({result.totalAffected})
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Must be relocated out of unavailable slot
                  </span>
                </div>
                {result.affectedSessions.length === 0 ? (
                  <p className="text-muted-foreground text-[11px] italic bg-slate-50 p-2.5 rounded-lg border border-[#E5E7EB]">
                    No existing sessions were scheduled during your chosen unavailable period. Your calendar constraint is safely registered!
                  </p>
                ) : (
                  <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
                    {result.affectedSessions.map((s: any) => (
                      <div key={s.sessionId} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold font-mono text-[#111926]">{s.sessionId}</span>
                          <span className="text-muted-foreground ml-2">({s.courseId})</span>
                          <span className="text-muted-foreground ml-2">Cohort: {s.groups.join(', ')}</span>
                        </div>
                        <div className="font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-red-200">
                          {s.day} P{s.startPeriod} ({s.roomExternalId})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Relocated Sessions Diff */}
              {result.movedSessions && result.movedSessions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#111926]">
                      Proposed Conflict-Free Relocations ({result.totalMoved})
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      Zero Hard Violations (H1–H8 Passed)
                    </span>
                  </div>
                  <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
                    {result.movedSessions.map((m: any) => (
                      <div key={m.sessionId} className="p-2.5 flex items-center justify-between text-xs">
                        <span className="font-bold font-mono text-[#111926]">{m.sessionId}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-muted-foreground line-through text-[11px]">
                            {m.oldSlot.day} P{m.oldSlot.startPeriod} ({m.oldSlot.roomExternalId})
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-200">
                            {m.newSlot.day} P{m.newSlot.startPeriod} ({m.newSlot.roomExternalId})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Past Unavailability History */}
          <div className="space-y-2 pt-4 border-t border-[#E5E7EB]">
            <span className="font-bold text-xs text-[#111926] block">
              Recent Unavailability Requests & Status ({myRequests.length})
            </span>
            {loadingHistory ? (
              <p className="text-muted-foreground text-center py-2">Loading records...</p>
            ) : myRequests.length === 0 ? (
              <p className="text-muted-foreground text-[11px] italic bg-slate-50 p-2.5 rounded-lg border border-[#E5E7EB]">
                No previous unavailability requests found.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-lg border border-[#E5E7EB] bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#111926]">
                        {Array.isArray(req.days) ? req.days.join(', ') : req.days} • Periods: {Array.isArray(req.periods) ? req.periods.map((p: any) => `P${p}`).join(', ') : req.periods}
                      </div>
                      {req.reason && <div className="text-[11px] text-muted-foreground">{req.reason}</div>}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF9F6] border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Schedule updates require independent Admin approval prior to active timetable commitment.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-[#E5E7EB] hover:bg-slate-50 rounded-md text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
