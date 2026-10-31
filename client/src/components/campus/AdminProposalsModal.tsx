import React, { useState, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Check,
  X,
  RotateCw,
  Clock,
  ArrowRight,
  User,
  AlertCircle,
} from 'lucide-react';

interface AdminProposalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const AdminProposalsModal: React.FC<AdminProposalsModalProps> = ({
  isOpen,
  onClose,
  onActionComplete,
}) => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getPendingProposals();
      if (res.proposals) {
        setProposals(res.proposals);
      }
    } catch (err: any) {
      toast.error('Failed to load pending proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProposals();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (id: string) => {
    setActingId(id);
    try {
      const res = await campusApi.approveProposal(id);
      toast.success(res.message || 'Proposal approved and activated!');
      await fetchProposals();
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to approve proposal';
      toast.error(msg);
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActingId(id);
    try {
      const res = await campusApi.rejectProposal(id);
      toast.success(res.message || 'Proposal rejected');
      await fetchProposals();
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to reject proposal';
      toast.error(msg);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#FAF9F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111926] font-poppins">
                Pending Schedule Proposals & Approvals
              </h2>
              <p className="text-xs text-muted-foreground">
                Administrative review authority for faculty unavailability relocations & timetable shifts
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-poppins">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Fetching pending change proposals...</span>
            </div>
          ) : proposals.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-1">
              <Check className="w-6 h-6 text-emerald-600 mx-auto" />
              <div className="font-semibold text-sm text-[#111926]">All Caught Up!</div>
              <p className="text-xs text-muted-foreground">
                There are currently zero pending timetable proposals awaiting review.
              </p>
            </div>
          ) : (
            proposals.map((p) => {
              const u = p.unavailabilityRequest;
              return (
                <div
                  key={p.id}
                  className="p-4 border border-[#E5E7EB] rounded-xl bg-slate-50/70 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111926]">
                          Schedule Version #{p.versionNumber}
                        </span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                          Pending Approval
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Submitted {new Date(p.createdAt).toLocaleDateString()} at {new Date(p.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReject(p.id)}
                        disabled={actingId === p.id}
                        className="px-2.5 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={actingId === p.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
                      >
                        {actingId === p.id ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Approve & Activate</span>
                      </button>
                    </div>
                  </div>

                  {u && (
                    <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg text-xs space-y-1.5">
                      <div className="font-semibold text-[#111926] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>Faculty Request: {u.facultyName} ({u.facultyId})</span>
                      </div>
                      <div className="text-[11px] text-[#4B5563]">
                        Unavailable Days: <strong>{Array.isArray(u.days) ? u.days.join(', ') : u.days}</strong> • 
                        Periods: <strong>{Array.isArray(u.periods) ? u.periods.map((x: any) => `P${x}`).join(', ') : u.periods}</strong>
                      </div>
                      {u.reason && (
                        <div className="text-[11px] text-muted-foreground italic">
                          "{u.reason}"
                        </div>
                      )}
                      {u.affectedSessions && (
                        <div className="text-[11px] text-[#374151] pt-1">
                          Affected sessions relocated: <strong>{u.affectedSessions.length} session(s)</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF9F6] border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Approving activates the schedule version atomically and supersedes the current active timetable.</span>
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
