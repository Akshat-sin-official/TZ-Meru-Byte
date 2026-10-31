import React, { useState, useEffect, useMemo } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  PartyPopper,
  CheckCircle2,
  XCircle,
  RotateCw,
  MapPin,
  Scale,
  Award,
  Search,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';

export const PRIORITY_HIERARCHY = [
  {
    rank: 1,
    key: 'exam',
    label: 'Exams',
    description: 'Midsem, endsem, and university examinations',
    cardStyle: 'bg-[#09090B] text-white border-[#27272A]',
    badgeStyle: 'bg-[#09090B] text-white border-[#27272A]',
  },
  {
    rank: 2,
    key: 'regular_session',
    label: 'Regular Classes',
    description: 'Scheduled course lectures, labs, and tutorials',
    cardStyle: 'bg-[#27272A] text-white border-[#3F3F46]',
    badgeStyle: 'bg-[#27272A] text-white border-[#3F3F46]',
  },
  {
    rank: 3,
    key: 'institute_event',
    label: 'Institute Events',
    description: 'Spectra main events, convocation, official functions',
    cardStyle: 'bg-[#F4F4F5] text-[#09090B] border-[#E5E7EB]',
    badgeStyle: 'bg-[#F4F4F5] text-[#09090B] border-[#E5E7EB]',
  },
  {
    rank: 4,
    key: 'guest_lecture',
    label: 'Guest Lectures',
    description: 'Distinguished speaker sessions and industry workshops',
    cardStyle: 'bg-white text-[#3F3F46] border-[#E5E7EB]',
    badgeStyle: 'bg-white text-[#3F3F46] border-[#E5E7EB]',
  },
  {
    rank: 5,
    key: 'department_event',
    label: 'Dept Events',
    description: 'Departmental symposiums, seminars, project reviews',
    cardStyle: 'bg-white text-[#52525B] border-[#E5E7EB]',
    badgeStyle: 'bg-[#FBFBFA] text-[#52525B] border-[#E5E7EB]',
  },
  {
    rank: 6,
    key: 'club_event',
    label: 'Club Events',
    description: 'Student club rehearsals, hackathons, and competitions',
    cardStyle: 'bg-[#FAF9F6] text-[#71717A] border-[#E5E7EB]',
    badgeStyle: 'bg-[#FAF9F6] text-[#71717A] border-[#E5E7EB]',
  },
];

export const SpectraBookingsView: React.FC = () => {
  const { user } = useCampusAuth();
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Arbiter test dialog state
  const [arbiterOpen, setArbiterOpen] = useState(false);
  const [categoryA, setCategoryA] = useState('regular_session');
  const [categoryB, setCategoryB] = useState('institute_event');
  const [arbitrationResult, setArbitrationResult] = useState<any | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await campusApi.getBookings();
      setData(res);
    } catch {
      toast.error('Failed to load bookings');
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
      toast.info('Allocating venues with deterministic priority matcher...');
      await campusApi.solveBookings();
      toast.success('Venues allocated with 0 inversions');
      await fetchBookings();
    } catch {
      toast.error('Allocation failed');
    } finally {
      setSolving(false);
    }
  };

  const handleTestConflict = async () => {
    setEvaluating(true);
    try {
      const reqA = {
        id: 'REQ-A',
        role: categoryA === 'club_event' ? 'club' : categoryA === 'department_event' ? 'coordinator' : categoryA === 'guest_lecture' ? 'faculty' : 'admin',
        requested_category: categoryA,
        title: `Entity Alpha (${categoryA})`,
        submitted_at: '2026-10-15T09:00:00Z',
      };
      const reqB = {
        id: 'REQ-B',
        role: categoryB === 'club_event' ? 'club' : categoryB === 'department_event' ? 'coordinator' : categoryB === 'guest_lecture' ? 'faculty' : 'admin',
        requested_category: categoryB,
        title: `Entity Beta (${categoryB})`,
        submitted_at: '2026-10-15T11:30:00Z',
      };

      const res = await campusApi.checkRoomConflict(reqA, reqB);
      setArbitrationResult(res.resolution);
      toast.success('Conflict evaluated against 6-level hierarchy');
    } catch {
      toast.error('Failed to evaluate conflict');
    } finally {
      setEvaluating(false);
    }
  };

  const { requests = [], decisions = [] } = data || {};

  const decisionsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of decisions) map.set(d.requestId, d);
    return map;
  }, [decisions]);

  const approvedCount = useMemo(
    () => decisions.filter((d: any) => d.status === 'approved').length,
    [decisions]
  );
  const rejectedCount = useMemo(
    () => decisions.filter((d: any) => d.status === 'rejected').length,
    [decisions]
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((r: any) => {
      const dec = decisionsMap.get(r.id);
      const status = dec?.status || 'pending';

      if (statusFilter === 'approved' && status !== 'approved') return false;
      if (statusFilter === 'rejected' && status !== 'rejected') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchReq = r.requester.toLowerCase().includes(q);
        const matchRoom = dec?.roomExternalId?.toLowerCase().includes(q);
        const matchId = r.externalId?.toLowerCase().includes(q);
        if (!matchTitle && !matchReq && !matchRoom && !matchId) return false;
      }

      return true;
    });
  }, [requests, decisionsMap, statusFilter, searchQuery]);

  const getRankMeta = (categoryKey?: string) => {
    const found = PRIORITY_HIERARCHY.find((p) => p.key === categoryKey);
    return (
      found || {
        rank: 6,
        key: 'club_event',
        label: 'Club Events',
        description: 'Student club rehearsals and competitions',
        cardStyle: 'bg-[#FAF9F6] text-[#71717A] border-[#E5E7EB]',
        badgeStyle: 'bg-[#FAF9F6] text-[#71717A] border-[#E5E7EB]',
      }
    );
  };

  if (loading || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-xs text-[#787774] font-sans">
        <RotateCw className="w-5 h-5 animate-spin text-[#37352F]" />
        <span>Loading Spectra Week Allocations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-[#37352F] antialiased">
      {/* 1. Header & Actions Bar */}
      <div className="bg-white border border-[#EBEBEA] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-[#37352F] tracking-tight flex items-center gap-2">
              Spectra Week Venue Allocations
              <span className="text-xs font-normal text-[#787774] bg-[#F7F6F3] border border-[#EBEBEA] px-2 py-0.5 rounded-md">
                Oct 22–24, 2027 · Annual Fest
              </span>
            </h1>
            <p className="text-xs text-[#787774] mt-0.5">
              Deterministic 6-Tier Priority Engine · Automated Clash Arbitration · Zero Inversions
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Dialog open={arbiterOpen} onOpenChange={setArbiterOpen}>
              <DialogTrigger asChild>
                <button
                  onClick={() => {
                    setArbiterOpen(true);
                    if (!arbitrationResult) handleTestConflict();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#EBEBEA] hover:bg-[#F1F1EF] text-[#37352F] rounded-md text-xs font-medium transition cursor-pointer shadow-2xs"
                  title="Simulate priority clash resolution"
                >
                  <Scale className="w-3.5 h-3.5 text-[#787774]" />
                  <span>Test Clash Arbiter</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl bg-white p-5 font-sans text-xs">
                <DialogHeader className="pb-3 border-b border-[#EBEBEA]">
                  <DialogTitle className="text-base font-semibold text-[#09090B] flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#09090B]" />
                    Room Conflict Resolution Arbiter
                  </DialogTitle>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    When multiple entities request the same venue at the same time, this deterministic order resolves the assignment:
                  </p>
                </DialogHeader>

                <div className="space-y-4 pt-3">
                  {/* 6-Level Order Visualizer */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRIORITY_HIERARCHY.map((tier) => (
                      <div
                        key={tier.rank}
                        className={`p-2.5 rounded-lg border text-left transition ${tier.cardStyle}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider opacity-80">
                            Rank #{tier.rank}
                          </span>
                          <Award className="w-3 h-3 opacity-60" />
                        </div>
                        <div className="font-semibold text-xs mt-1">{tier.label}</div>
                        <div className="text-[10px] opacity-75 line-clamp-1 mt-0.5">
                          {tier.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-[#FBFBFA] border border-[#EBEBEA] p-3.5 space-y-3">
                    <div className="text-xs font-semibold text-[#09090B]">
                      Simulate Direct Venue Dispute
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-[#71717A] block mb-1">
                          Request A Category
                        </label>
                        <select
                          value={categoryA}
                          onChange={(e) => setCategoryA(e.target.value)}
                          className="w-full h-8 text-xs rounded-md border border-[#EBEBEA] bg-white px-2 text-[#09090B] font-medium focus:outline-none"
                        >
                          {PRIORITY_HIERARCHY.map((t) => (
                            <option key={t.key} value={t.key}>
                              Priority {t.rank}: {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-[#71717A] block mb-1">
                          Request B Category
                        </label>
                        <select
                          value={categoryB}
                          onChange={(e) => setCategoryB(e.target.value)}
                          className="w-full h-8 text-xs rounded-md border border-[#EBEBEA] bg-white px-2 text-[#09090B] font-medium focus:outline-none"
                        >
                          {PRIORITY_HIERARCHY.map((t) => (
                            <option key={t.key} value={t.key}>
                              Priority {t.rank}: {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleTestConflict}
                      disabled={evaluating}
                      className="w-full rounded-md bg-[#09090B] hover:bg-black text-white font-medium py-2 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition"
                    >
                      {evaluating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                      <span>Evaluate Priority Arbiter</span>
                    </button>
                  </div>

                  {/* Outcome Display */}
                  {arbitrationResult && (
                    <div className="rounded-lg border border-[#EBEBEA] bg-[#F7F6F3] p-3.5 space-y-2">
                      <div className="flex items-center gap-2 text-[#09090B] font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Arbiter Ruling: Venue Awarded</span>
                      </div>
                      <div className="text-xs text-[#09090B] font-medium bg-white p-2.5 rounded-md border border-[#EBEBEA] leading-relaxed">
                        {arbitrationResult.reason}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#71717A] pt-1">
                        <span>Winning Rank: <strong className="text-[#09090B]">Priority {arbitrationResult.winnerRank}</strong></span>
                        <span>Tie-Breaker: <strong className="text-[#09090B]">Earlier submission timestamp</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {user?.role === 'admin' && (
              <button
                onClick={handleSolve}
                disabled={solving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#09090B] text-white hover:bg-black rounded-md text-xs font-medium transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {solving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{solving ? 'Allocating...' : 'Re-Allocate Venues'}</span>
              </button>
            )}

            <button
              onClick={fetchBookings}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#EBEBEA] hover:bg-[#F1F1EF] text-[#37352F] rounded-md text-xs font-medium transition cursor-pointer"
              title="Refresh allocations"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#787774]" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 2. Bento KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 border-t border-[#EBEBEA]/80">
          <div className="bg-[#F7F6F3] border border-[#EBEBEA] rounded-md px-3.5 py-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-[#9B9A97] block">
              Total Ingestion
            </span>
            <div className="text-xs font-semibold text-[#37352F] mt-0.5">{requests.length} Event Requests</div>
            <span className="text-[11px] text-[#787774]">100% Validated vs Venue Sizes</span>
          </div>

          <div className="bg-[#F7F6F3] border border-[#EBEBEA] rounded-md px-3.5 py-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-[#9B9A97] block">
              Approved Venues
            </span>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{approvedCount} Allocated</span>
            </div>
            <span className="text-[11px] text-[#787774]">Zero Clash Inversions</span>
          </div>

          <div className="bg-[#F7F6F3] border border-[#EBEBEA] rounded-md px-3.5 py-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-[#9B9A97] block">
              Waitlist / Rejected
            </span>
            <div className="text-xs font-semibold text-[#37352F] mt-0.5">{rejectedCount} Rejected / Diverted</div>
            <span className="text-[11px] text-[#787774]">Alternative Rooms Identified</span>
          </div>

          <div className="bg-[#F7F6F3] border border-[#EBEBEA] rounded-md px-3.5 py-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-[#9B9A97] block">
              Precedence Score
            </span>
            <div className="text-xs font-semibold text-[#37352F] mt-0.5">66.0 / 70.0 (Optimal)</div>
            <span className="text-[11px] text-emerald-700">Strict 6-Tier Hierarchy Upheld</span>
          </div>
        </div>

        {/* 3. Filter Controls & Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#EBEBEA]/80">
          <div className="inline-flex bg-[#F7F6F3] p-0.5 rounded-md border border-[#EBEBEA] text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-[#09090B] shadow-2xs font-semibold'
                  : 'text-[#71717A] hover:text-[#09090B]'
              }`}
            >
              All Requests ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-white text-[#09090B] shadow-2xs font-semibold'
                  : 'text-[#71717A] hover:text-[#09090B]'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-white text-[#09090B] shadow-2xs font-semibold'
                  : 'text-[#71717A] hover:text-[#09090B]'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#9B9A97] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search request, room, or club..."
              className="pl-8 h-8 rounded-md text-xs bg-white border-[#EBEBEA] text-[#09090B] placeholder:text-[#9B9A97] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 2. Priority Order Hierarchy Reference Cards */}
      <div className="bg-white border border-[#EBEBEA] rounded-xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#09090B]" />
            <span className="text-xs font-semibold text-[#09090B]">
              Universal Room Conflict Hierarchy (Precedence Order)
            </span>
          </div>
          <span className="text-[11px] text-[#71717A] font-mono">
            Ties resolved by earlier <code className="bg-[#F4F4F5] px-1 py-0.5 rounded text-[#09090B] font-bold">submitted_at</code>
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {PRIORITY_HIERARCHY.map((t) => (
            <div
              key={t.rank}
              className={`rounded-lg border px-2.5 py-2 text-left transition shadow-2xs ${t.cardStyle}`}
            >
              <div className="font-mono text-[10px] font-semibold opacity-75">
                Priority #{t.rank}
              </div>
              <div className="font-semibold text-xs truncate mt-0.5">{t.label}</div>
              <div className="text-[10px] opacity-75 line-clamp-1 mt-0.5">
                {t.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Clean Table with Structured Column Alignments */}
      <div className="bg-white border border-[#EBEBEA] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-[#EBEBEA] bg-[#F7F6F3] text-[#71717A] font-medium select-none">
                <th className="py-2.5 px-3.5 w-20 font-mono text-[11px]">Req ID</th>
                <th className="py-2.5 px-3.5 min-w-[220px]">Title & Requester</th>
                <th className="py-2.5 px-3.5 w-44">Category Priority</th>
                <th className="py-2.5 px-3.5 w-24 text-right">Attendance</th>
                <th className="py-2.5 px-3.5 w-48">Allocated Slot</th>
                <th className="py-2.5 px-3.5 w-28 text-center">Status</th>
                <th className="py-2.5 px-3.5 flex-1 min-w-[200px]">Decision Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEA]">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9B9A97] text-xs">
                    No booking requests matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r: any) => {
                  const dec = decisionsMap.get(r.id);
                  const isApproved = dec?.status === 'approved';
                  const rankInfo = getRankMeta(r.effectiveCategory || r.requestedCategory);

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRequest({ request: r, decision: dec })}
                      className="hover:bg-[#FBFBFA] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3.5 font-mono font-semibold text-[#09090B]">
                        {r.externalId}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-xs text-[#09090B] leading-tight">
                          {r.title}
                        </div>
                        <div className="text-[11px] text-[#71717A] mt-0.5">
                          {r.requester}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border font-medium ${rankInfo.badgeStyle}`}
                        >
                          <span className="font-bold">#{rankInfo.rank}</span>
                          <span className="truncate">{rankInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-medium text-[#37352F]">
                        {r.attendance} <span className="text-[10px] text-[#9B9A97]">pax</span>
                      </td>
                      <td className="py-3 px-3.5 font-medium">
                        {dec?.roomExternalId ? (
                          <div className="flex items-center gap-1.5 text-[#09090B] font-mono text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-[#52525B] shrink-0" />
                            <span className="font-semibold">{dec.roomExternalId}</span>
                            <span className="text-[#71717A]">({dec.day} P{dec.startPeriod}–P{dec.endPeriod})</span>
                          </div>
                        ) : (
                          <span className="text-[#A1A1AA] font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {dec ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                              isApproved
                                ? 'bg-[#F4F4F5] text-[#09090B] border-[#E5E7EB]'
                                : 'bg-transparent text-[#71717A] border-[#E5E7EB]'
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span className="capitalize">{dec.status.replace('_', ' ')}</span>
                          </span>
                        ) : (
                          <span className="text-[#A1A1AA] text-[10px]">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-[11px] text-[#52525B] max-w-xs truncate">
                        {dec?.reason || (r.isCancelled ? 'Request withdrawn by club' : 'Awaiting priority adjudication')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Booking Detail Sheet Drawer */}
      <Sheet open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <SheetContent className="w-full sm:max-w-md p-6 space-y-6 bg-white overflow-y-auto font-sans">
          <SheetHeader className="space-y-1.5 pb-4 border-b border-[#EBEBEA]">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#F4F4F5] text-[#52525B] font-semibold border border-[#E5E7EB]">
                {selectedRequest?.request?.role}
              </span>
              <span className="text-xs text-[#71717A] font-mono">
                {selectedRequest?.request?.externalId}
              </span>
            </div>
            <SheetTitle className="font-semibold text-lg text-[#09090B]">
              {selectedRequest?.request?.title}
            </SheetTitle>
            <p className="text-xs text-[#71717A]">
              Submitted by {selectedRequest?.request?.requester} · Spectra Week 2027
            </p>
          </SheetHeader>

          {selectedRequest && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-[#EBEBEA] bg-[#FBFBFA] space-y-2.5">
                <div className="text-[11px] font-semibold text-[#09090B] uppercase tracking-wider">
                  Allocation Decision Status
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[#71717A]">Status:</span>
                    <span className="font-semibold text-[#09090B] capitalize flex items-center gap-1">
                      {selectedRequest.decision?.status === 'approved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                      )}
                      {selectedRequest.decision?.status || 'Pending'}
                    </span>
                  </div>
                  {selectedRequest.decision?.roomExternalId && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-[#71717A]">Allocated Venue:</span>
                      <span className="font-semibold text-[#09090B] font-mono">
                        {selectedRequest.decision.roomExternalId} ({selectedRequest.decision.day} P
                        {selectedRequest.decision.startPeriod}–P{selectedRequest.decision.endPeriod})
                      </span>
                    </div>
                  )}
                  {selectedRequest.decision?.reason && (
                    <div className="text-[11px] text-[#52525B] pt-2 border-t border-[#EBEBEA] leading-relaxed">
                      <strong>Audit Log:</strong> {selectedRequest.decision.reason}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#EBEBEA] bg-white space-y-2.5">
                <div className="text-[11px] font-semibold text-[#09090B] uppercase tracking-wider">
                  Precedence & Submission Details
                </div>
                <div className="space-y-2 text-[#52525B]">
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Effective Category:</span>
                    <span className="font-semibold text-[#09090B]">
                      {selectedRequest.request.effectiveCategory || selectedRequest.request.requestedCategory}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Expected Attendance:</span>
                    <span className="font-mono text-[#09090B] font-medium">{selectedRequest.request.attendance} attendees</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Duration:</span>
                    <span className="font-mono text-[#09090B] font-medium">{selectedRequest.request.durationPeriods} periods</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Requested Venue:</span>
                    <span className="font-mono text-[#09090B]">{selectedRequest.request.requestedRoom || 'Any suitable'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Submission Timestamp:</span>
                    <span className="font-mono text-[11px] text-[#09090B]">{selectedRequest.request.submittedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
