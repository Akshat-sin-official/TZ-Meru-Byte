import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { seekerService } from '@/services/seekerService';
import { searchService } from '@/services/searchService';
import { useAuth } from '@/contexts/AuthContext';
import { useShortlist } from '@/contexts/ShortlistContext';
import { toast } from 'sonner';
import { ArrowLeft, Video, CheckCircle, Loader2, AlertCircle, Sunrise, Sun, Sunset, Lock, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getAvailableDayLabels,
  getAvailableTimeSlots,
  generateSlotsBetween,
  findFirstAvailableDate,
  getDateAvailabilityDetail,
  filterConflictingTimeSlots,
  getCurrentISTDate,
  getCurrentISTMinutes,
  normalizeDateString,
  type ExpertSchedulingProfile,
} from '@/utils/schedulingSlots';
import { formatTimeTo12hr } from '@/components/website/utils/helpers';

interface ExpertInfo {
  id: string;
  displayName: string;
  categories: string[];
  timezone?: string;
  bookingsAvailability?: {
    availableDays?: string[];
    availableTimeSlots?: string[];
  };
  availability?: Record<string, { available: boolean; from?: string; to?: string }>;
  daysOff?: string[];
}

const ScheduleDiscussion = () => {
  const queryClient = useQueryClient();
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const sidebarSections = useAppSidebar();
  const { addToShortlist } = useShortlist();

  const [step, setStep] = useState<'details' | 'datetime' | 'confirm'>('details');
  const [purpose, setPurpose] = useState<string>('requirement_discussion');
  const [agenda, setAgenda] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedWindow, setSelectedWindow] = useState<'morning' | 'afternoon' | 'evening' | ''>('');

  // Max date: 30 days ahead (per dump.md §15)
  const maxBookingDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  const draftStorageKey = useMemo(() => {
    return expertId ? `mta_schedule_draft:${expertId}` : `mta_schedule_draft:unknown`;
  }, [expertId]);

  // Fetch seeker's discussions to check if there is a completed one with this expert
  const { data: discussions } = useQuery({
    queryKey: ['discussions'],
    queryFn: () => seekerService.getDiscussions(),
    enabled: isAuthenticated,
  });

  const hasCompletedDiscussion = useMemo(() => {
    if (!discussions || !expertId) return false;
    return discussions.some(
      (d) => d.expertId === expertId && d.status === 'completed'
    );
  }, [discussions, expertId]);

  // Fetch seeker's quotations
  const { data: quotations } = useQuery({
    queryKey: ['seekerQuotations'],
    queryFn: () => seekerService.getQuotations(),
    enabled: isAuthenticated,
  });

  // Fetch seeker's engagements
  const { data: engagements } = useQuery({
    queryKey: ['seekerEngagements'],
    queryFn: () => seekerService.getEngagements(),
    enabled: isAuthenticated,
  });

  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>('');



  const expertQuotations = useMemo(() => {
    if (!quotations || !expertId) return [];
    return quotations.filter(q => q.expertId === expertId);
  }, [quotations, expertId]);

  const expertEngagements = useMemo(() => {
    if (!engagements || !expertId) return [];
    return engagements.filter(e => e.expertId === expertId);
  }, [engagements, expertId]);

  // Set default selected quotation / engagement if not pre-filled by query param
  useEffect(() => {
    if (expertQuotations.length > 0 && !selectedQuotationId) {
      const pendingQuote = expertQuotations.find(q => ['sent', 'revision_requested', 'revised'].includes(q.status.toLowerCase()));
      const quoteId = pendingQuote ? (pendingQuote.id || pendingQuote._id) : (expertQuotations[0].id || expertQuotations[0]._id);
      if (quoteId) setSelectedQuotationId(quoteId);
    }
  }, [expertQuotations, selectedQuotationId]);

  useEffect(() => {
    if (expertEngagements.length > 0 && !selectedEngagementId) {
      const activeEng = expertEngagements.find(e => e.status?.toLowerCase() === 'active');
      setSelectedEngagementId(activeEng ? activeEng.id : expertEngagements[0].id);
    }
  }, [expertEngagements, selectedEngagementId]);

  const currentQuotation = useMemo(() => {
    if (!expertQuotations.length) return null;
    if (selectedQuotationId) return expertQuotations.find(q => q.id === selectedQuotationId || q._id === selectedQuotationId) || null;
    return expertQuotations[0];
  }, [expertQuotations, selectedQuotationId]);

  const currentEngagement = useMemo(() => {
    if (!expertEngagements.length) return null;
    if (selectedEngagementId) return expertEngagements.find(e => e.id === selectedEngagementId || e._id === selectedEngagementId) || null;
    return expertEngagements[0];
  }, [expertEngagements, selectedEngagementId]);

  const hasUnquotedCompletedDiscussion = useMemo(() => {
    if (!discussions || !expertId) return false;
    return discussions.some(
      (d) => d.expertId === expertId &&
        d.purpose === 'requirement_discussion' &&
        d.status === 'completed' &&
        !d.quotationStatus
    );
  }, [discussions, expertId]);

  const completedRequirementCount = useMemo(() => {
    if (!discussions || !expertId) return 0;
    return discussions.filter(
      (d) => d.expertId === expertId && d.purpose === 'requirement_discussion' && d.status === 'completed'
    ).length;
  }, [discussions, expertId]);

  const completedClarificationCount = useMemo(() => {
    if (!discussions || !expertId) return 0;
    return discussions.filter(
      (d) => d.expertId === expertId &&
        d.purpose === 'clarification' &&
        d.status === 'completed' &&
        (!user?.id || !d.scheduledBy || d.scheduledBy === user.id) &&
        (!selectedQuotationId || d.quotationId === selectedQuotationId)
    ).length;
  }, [discussions, expertId, selectedQuotationId, user?.id]);

  const completedAlignmentCount = useMemo(() => {
    if (!discussions || !expertId) return 0;
    return discussions.filter(
      (d) => d.expertId === expertId &&
        d.purpose === 'alignment' &&
        d.status === 'completed' &&
        (!user?.id || !d.scheduledBy || d.scheduledBy === user.id) &&
        (!selectedEngagementId || d.engagementId === selectedEngagementId)
    ).length;
  }, [discussions, expertId, selectedEngagementId, user?.id]);

  const formatCurrencyVal = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  const getPurposeStatus = (p: string) => {
    if (p === 'requirement_discussion') {
      const used = completedRequirementCount;
      const isLocked = hasUnquotedCompletedDiscussion;
      return {
        isLocked,
        lockReason: isLocked ? 'You already have a completed Requirement Discussion without a submitted quotation. Please wait for the expert to submit a quotation.' : '',
        limit: 1,
        used,
        remaining: isLocked ? 0 : 1,
        duration: 60,
      };
    }
    if (p === 'clarification') {
      const targetQuotation = currentQuotation;
      const targetQuotationStatus = targetQuotation?.status?.toLowerCase();

      const associatedEngagement = targetQuotation ? expertEngagements.find(e => e.quotationId === targetQuotation.id || e.quotationId === targetQuotation._id) : null;
      const isEngagementActive = associatedEngagement && associatedEngagement.status?.toLowerCase() === 'active';

      const used = completedClarificationCount;
      const limit = 3;
      const remaining = Math.max(0, limit - used);
      let isLocked = false;
      let lockReason = '';

      if (!targetQuotation || targetQuotationStatus === 'draft') {
        isLocked = true;
        lockReason = 'Clarification discussions can only be scheduled after a quotation has been submitted by the expert.';
      } else if (targetQuotationStatus === 'accepted') {
        isLocked = true;
        lockReason = 'Clarification discussions closed after quotation approval.';
      } else if (targetQuotationStatus === 'rejected' || targetQuotationStatus === 'declined') {
        isLocked = true;
        lockReason = 'The quotation has been rejected. Clarification scheduling is disabled.';
      } else if (isEngagementActive) {
        isLocked = true;
        lockReason = 'Clarification discussions are closed after engagement activation.';
      } else if (used >= limit) {
        isLocked = true;
        lockReason = 'Session Limit Reached: You have already completed your 3 permitted Clarification Discussions for this quotation.';
      }

      return {
        isLocked,
        lockReason,
        limit,
        used,
        remaining,
        duration: 30,
      };
    }
    if (p === 'alignment') {
      const targetEngagement = currentEngagement;
      const used = completedAlignmentCount;
      const limit = 3;
      const remaining = Math.max(0, limit - used);
      let isLocked = false;
      let lockReason = '';

      if (targetEngagement && (targetEngagement.status?.toLowerCase() === 'completed' || targetEngagement.status?.toLowerCase() === 'closed')) {
        isLocked = true;
        lockReason = 'Alignment discussions closed after engagement completion.';
      } else if (!targetEngagement || targetEngagement.status?.toLowerCase() !== 'active') {
        isLocked = true;
        lockReason = 'Alignment discussions require deposit payment success and engagement activation.';
      } else if (used >= limit) {
        isLocked = true;
        lockReason = 'Session Limit Reached: You have already completed your 3 permitted Alignment Discussions for this engagement.';
      }

      return {
        isLocked,
        lockReason,
        limit,
        used,
        remaining,
        duration: 30,
      };
    }
    return { isLocked: false, lockReason: '', limit: 0, used: 0, remaining: 0, duration: 45 };
  };

  const purposeInfo = getPurposeStatus(purpose);

  const persistDraft = (next?: Partial<{
    step: 'details' | 'datetime' | 'confirm';
    purpose: string;
    agenda: string;
    selectedDate: string;
    selectedTime: string;
  }>) => {
    try {
      const payload = {
        step,
        purpose,
        agenda,
        selectedDate,
        selectedTime,
        updatedAt: new Date().toISOString(),
        ...(next || {}),
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    } catch {
      // best-effort only
    }
  };

  useEffect(() => {
    if (!expertId) return;
    try {
      const raw = localStorage.getItem(draftStorageKey);
      const parsed = raw ? JSON.parse(raw) : null;

      const urlPurpose = searchParams.get('purpose');
      const urlQuoteId = searchParams.get('quotationId');
      const urlEngId = searchParams.get('engagementId');

      if (urlPurpose) {
        setPurpose(urlPurpose);
      } else if (parsed?.purpose) {
        setPurpose(String(parsed.purpose));
      }

      if (urlQuoteId) {
        setSelectedQuotationId(urlQuoteId);
      }

      if (urlEngId) {
        setSelectedEngagementId(urlEngId);
      }

      if (parsed?.agenda) setAgenda(String(parsed.agenda));
      if (parsed?.selectedDate) setSelectedDate(String(parsed.selectedDate));
      if (parsed?.selectedTime) setSelectedTime(String(parsed.selectedTime));
      if (parsed?.step === 'details' || parsed?.step === 'datetime' || parsed?.step === 'confirm') {
        setStep(parsed.step);
      }
    } catch {
      // ignore bad draft
    }
  }, [expertId, searchParams, draftStorageKey]);

  const PURPOSE_OPTIONS = [
    { value: 'requirement_discussion', label: 'Requirement discussion' },
    { value: 'clarification', label: 'Clarification' },
    { value: 'alignment', label: 'Alignment' },
  ];

  // Fetch expert info using the proper endpoint
  // Note: This endpoint is public, so we can fetch even if not authenticated
  const { data: expert, isLoading: expertLoading, error: expertError } = useQuery({
    queryKey: ['expert', expertId],
    queryFn: async () => {
      if (!expertId) {
        throw new Error('Expert ID is required');
      }
      try {
        const expertProfile = await searchService.getExpertProfileByUserId(expertId!);
        return {
          id: expertProfile.userId,
          displayName: expertProfile.displayName,
          categories: expertProfile.categories || [],
          timezone: expertProfile.timezone,
          bookingsAvailability: expertProfile.bookingsAvailability,
          availability: expertProfile.availability as ExpertInfo['availability'],
          daysOff: expertProfile.daysOff,
        } as ExpertInfo;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch expert profile';
        throw new Error(errorMessage);
      }
    },
    enabled: !!expertId, // Enable query if expertId exists (public endpoint, no auth required)
  });

  // Fetch existing booked discussion slots for this expert on selected date to automatically hide conflicting slots
  const { data: bookedSessions } = useQuery({
    queryKey: ['expertBookedSlots', expertId, selectedDate],
    queryFn: () => seekerService.getExpertBookedSlots(expertId!, selectedDate),
    enabled: !!expertId && !!selectedDate,
  });

  // Request scheduled discussion mutation (platform-controlled meeting)
  const requestDiscussionMutation = useMutation({
    mutationFn: (data: {
      expertId: string;
      purpose: 'requirement_discussion' | 'clarification' | 'alignment';
      agenda: string;
      scheduledAt: string;
      duration?: number;
      context?: Record<string, unknown>;
      quotationId?: string;
      engagementId?: string;
    }) => seekerService.requestScheduledDiscussion(data),
    onSuccess: () => {
      toast.success('Discussion request sent! Waiting for expert response.');

      // Auto-shortlist the expert so they appear on the dashboard
      if (expertId) {
        addToShortlist(expertId!).catch(err => console.error('Auto-shortlist failed:', err));
      }

      // Invalidate queries so expert and seeker dashboards/notifications update in real-time
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['expertDiscussions'] });
      queryClient.invalidateQueries({ queryKey: ['seekerDiscussions'] });
      queryClient.invalidateQueries({ queryKey: ['expertStats'] });
      queryClient.invalidateQueries({ queryKey: ['seekerStats'] });

      try {
        localStorage.removeItem(draftStorageKey);
      } catch { }
      // For now, take user to discussions list; detail page wiring for scheduled-discussions can be added next
      navigate('/seeker/discussions');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule discussion';
      toast.error(errorMessage);
    },
  });

  const gotoAuth = (target: 'login' | 'register') => {
    persistDraft();
    const from = { pathname: location.pathname, search: location.search };
    if (target === 'login') {
      navigate('/login', { state: { from } });
    } else {
      navigate('/register?role=seeker', { state: { from } });
    }
  };


  const handleSubmit = async () => {
    if (!expertId || !purpose.trim() || !agenda.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    // Max 30-day booking window validation (per dump.md §15)
    if (selectedDate > maxBookingDate) {
      toast.error('Discussions can only be scheduled up to 30 days in advance.');
      return;
    }

    const normalizedDate = normalizeDateString(selectedDate);
    const dateParts = normalizedDate.split('-').map(Number);
    const [y, m, d] = [dateParts[0], dateParts[1], dateParts[2]];
    const [hh, mm] = selectedTime.split(':').map(Number);

    const timezone = expert?.timezone || 'Asia/Kolkata';

    // Construct a UTC date that matches the literal selected date/time
    const targetUTC = new Date(Date.UTC(y, m - 1, d, hh, mm));

    // Calculate the timezone offset dynamically for this specific date (to handle DST)
    const tzDateStr = targetUTC.toLocaleString('en-US', { timeZone: timezone });
    const utcDateStr = targetUTC.toLocaleString('en-US', { timeZone: 'UTC' });

    const tzDate = new Date(tzDateStr);
    const utcDate = new Date(utcDateStr);
    const offsetMs = tzDate.getTime() - utcDate.getTime();

    // Subtract offset to get the true UTC time that represents the selected local time
    const finalScheduledAt = new Date(targetUTC.getTime() - offsetMs);

    // Strict 15-minute advance booking buffer check
    const minBufferMs = 15 * 60 * 1000 - 30 * 1000;
    if (finalScheduledAt.getTime() < Date.now() + minBufferMs) {
      toast.error('Discussions must be scheduled at least 15 minutes in advance.');
      return;
    }

    if (!isAuthenticated) {
      persistDraft({ step: 'confirm' });
      toast.info('Please sign in to send this request. We saved your draft.');
      gotoAuth('login');
      return;
    }

    requestDiscussionMutation.mutate({
      expertId: expertId!,
      purpose: purpose.trim() as any,
      agenda: agenda.trim(),
      scheduledAt: finalScheduledAt.toISOString(),
      duration: getPurposeStatus(purpose).duration,
      quotationId: purpose === 'clarification' && selectedQuotationId ? selectedQuotationId : undefined,
      engagementId: purpose === 'alignment' && selectedEngagementId ? selectedEngagementId : undefined,
      context: (() => {
        try {
          const raw = sessionStorage.getItem('searchContext');
          const parsed = raw ? JSON.parse(raw) : null;
          const category = searchParams.get('category') || '';
          return {
            ...(parsed || {}),
            sourceCategory: category || parsed?.serviceCategory || '',
            notes: agenda.trim(),
          };
        } catch {
          return { sourceCategory: searchParams.get('category') || '', notes: agenda.trim() };
        }
      })(),
    });
  };

  const expertScheduling: ExpertSchedulingProfile | null = expert
    ? {
      bookingsAvailability: expert.bookingsAvailability,
      availability: expert.availability,
      daysOff: expert.daysOff,
    }
    : null;

  const duration = purposeInfo?.duration || 30;

  // Auto-select earliest date that actually has open bookable slots if selectedDate is not yet set
  useEffect(() => {
    if (expertScheduling && !selectedDate) {
      const earliestBookable = findFirstAvailableDate(expertScheduling, duration);
      setSelectedDate(earliestBookable);
    }
  }, [expertScheduling, selectedDate, duration]);

  const availableDayLabels = expertScheduling ? getAvailableDayLabels(expertScheduling) : [];

  const dateAvailability = useMemo(() => {
    if (!expertScheduling || !selectedDate) {
      return {
        isPast: false,
        isToday: false,
        isWorkingDay: true,
        dayName: '',
        hasSlots: true,
        slotCount: 0,
      };
    }
    return getDateAvailabilityDetail(expertScheduling, selectedDate, duration);
  }, [expertScheduling, selectedDate, duration]);

  // Reset window and time when date changes
  useEffect(() => {
    setSelectedWindow('');
    setSelectedTime('');
  }, [selectedDate]);

  const hasCustomAvailability = useMemo(() => {
    if (!expert) return false;
    const explicit = expert.bookingsAvailability?.availableTimeSlots;
    if (explicit && explicit.length > 0) return true;

    // Check if availability maps are set
    if (expert.availability) {
      const entries = expert.availability instanceof Map
        ? Array.from(expert.availability.entries())
        : Object.entries(expert.availability);
      const hasAnyDayAvailable = entries.some(([, cfg]) => cfg?.available);
      if (hasAnyDayAvailable) return true;
    }
    return false;
  }, [expert]);

  // Slots calculation
  const slotsForDate = useMemo(() => {
    if (!selectedDate || !expertScheduling) return [];

    const normalizedDate = normalizeDateString(selectedDate);
    const istToday = getCurrentISTDate();
    if (normalizedDate < istToday) return [];

    let slots = getAvailableTimeSlots(expertScheduling, normalizedDate, duration);
    if (slots.length === 0 && !hasCustomAvailability) {
      slots = generateSlotsBetween("09:00", "21:00", 15, duration);
    }

    // Always enforce the minimum 15-minute lead buffer for same-day bookings in IST
    if (normalizedDate === istToday) {
      const minStartMinutes = getCurrentISTMinutes() + 15;
      slots = slots.filter((slot) => {
        const [slotHour, slotMin] = slot.split(':').map(Number);
        return slotHour * 60 + slotMin >= minStartMinutes;
      });
    }

    // Automatically hide slots that overlap or fall within 15 mins of existing bookings
    if (bookedSessions && bookedSessions.length > 0) {
      slots = filterConflictingTimeSlots(slots, normalizedDate, bookedSessions, duration);
    }

    return slots;
  }, [selectedDate, hasCustomAvailability, expertScheduling, bookedSessions, duration]);

  const windowsWithSlots = useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    slotsForDate.forEach(slot => {
      const [hour, min] = slot.split(':').map(Number);
      if (hour >= 9 && hour < 12) {
        morning.push(slot);
      } else if (hour >= 12 && hour < 16) {
        afternoon.push(slot);
      } else if (hour >= 16 && (hour < 21 || (hour === 21 && min === 0))) {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [slotsForDate]);

  // Automatically select the first window that has slots when date or slots change
  useEffect(() => {
    if (slotsForDate.length > 0) {
      if (!selectedWindow || windowsWithSlots[selectedWindow]?.length === 0) {
        if (windowsWithSlots.morning.length > 0) {
          setSelectedWindow('morning');
        } else if (windowsWithSlots.afternoon.length > 0) {
          setSelectedWindow('afternoon');
        } else if (windowsWithSlots.evening.length > 0) {
          setSelectedWindow('evening');
        }
      }
    }
  }, [slotsForDate, windowsWithSlots, selectedWindow]);

  if (expertLoading) {
    return (
      <AppDashboardLayout
        user={{
          name: user?.name || user?.fullName || 'Business Owner',
          role: user?.role === 'expert' ? 'Marketing Expert' : 'Business Owner',
        }}
        sections={sidebarSections}
        onSignOut={() => {
          logout();
          navigate('/login');
        }}
        headerTitle="Schedule Discussion"
      >
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppDashboardLayout>
    );
  }

  if (expertError || (!expert && !expertLoading)) {
    return (
      <AppDashboardLayout
        user={{
          name: user?.name || user?.fullName || 'Business Owner',
          role: user?.role === 'expert' ? 'Marketing Expert' : 'Business Owner',
        }}
        sections={sidebarSections}
        onSignOut={() => {
          logout();
          navigate('/login');
        }}
        headerTitle="Schedule Discussion"
      >
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">Expert Not Found</h1>
          <p className="mb-4 text-muted-foreground">
            {expertError instanceof Error ? expertError.message : 'The expert profile could not be loaded.'}
          </p>
          <Button onClick={() => navigate('/seeker/dashboard')}>Back to Dashboard</Button>
        </div>
      </AppDashboardLayout>
    );
  }

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || user?.fullName || 'Business Owner',
        role: user?.role === 'expert' ? 'Marketing Expert' : 'Business Owner',
      }}
      sections={sidebarSections}
      onSignOut={() => {
        logout();
        navigate('/login');
      }}
      headerTitle="Schedule Discussion"
    >
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mx-auto max-w-2xl">
          {/* Expert Info */}
          {expert && (
            <div className="mb-8 rounded-xl border border-border bg-secondary p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background font-mono font-bold">
                  {expert.displayName.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold">{expert.displayName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {expert.categories.slice(0, 2).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="mb-8 flex gap-2">
            {['details', 'datetime', 'confirm'].map((s, i) => {
              const stepIndex = ['details', 'datetime', 'confirm'].indexOf(step);
              const isActive = stepIndex >= i;

              // Enable navigation by clicking to any step that has been reached or is valid
              const isClickable = i <= stepIndex || (
                (s === 'datetime' && purpose && agenda) ||
                (s === 'confirm' && purpose && agenda && selectedDate && selectedTime)
              );

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (isClickable) {
                      persistDraft({ step: s as any });
                      setStep(s as any);
                    }
                  }}
                  disabled={!isClickable}
                  className={`h-9 flex-1 rounded-lg border text-xs font-bold transition-all capitalize shadow-sm flex items-center justify-center gap-1.5 ${step === s
                      ? 'bg-orange-600 border-orange-600 text-white hover:bg-orange-700'
                      : isActive
                        ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full border text-[10px] shrink-0">
                    {i + 1}
                  </span>
                  <span className="hidden sm:inline">{s}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-background p-8">
            {step === 'details' && (() => {
              const currentPurposeStatus = getPurposeStatus(purpose);
              return (
                <>
                  <h1 className="mb-2 text-2xl font-bold">Schedule a Discussion</h1>
                  <p className="mb-6 text-muted-foreground">
                    Define the purpose and agenda for your discussion (All times in IST)
                  </p>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Select Purpose *</Label>
                      <Select value={purpose} onValueChange={(val) => {
                        setPurpose(val);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose of discussion" />
                        </SelectTrigger>
                        <SelectContent>
                          {PURPOSE_OPTIONS.map((option) => {
                            const statusInfo = getPurposeStatus(option.value);
                            return (
                              <SelectItem key={option.value} value={option.value} disabled={statusInfo.isLocked}>
                                {option.label} {statusInfo.isLocked ? ' (Locked)' : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {/* Quotation Selection for Clarification Purpose */}
                      {purpose === 'clarification' && expertQuotations.length > 0 && (
                        <div className="mt-4 space-y-2 animate-in fade-in duration-200">
                          <Label htmlFor="quotation-select" className="font-semibold text-slate-800">Select Quotation / Proposal *</Label>
                          <Select
                            value={selectedQuotationId}
                            onValueChange={(val) => setSelectedQuotationId(val)}
                          >
                            <SelectTrigger id="quotation-select" className="rounded-xl border-[#E5E7EB] bg-white">
                              <SelectValue placeholder="Select a quotation" />
                            </SelectTrigger>
                            <SelectContent>
                              {expertQuotations.map((q) => (
                                <SelectItem key={q.id || q._id} value={q.id || q._id || ''}>
                                  {q.referenceId || `QT-${String(q.id || q._id).substring(18).toUpperCase()}`} ({formatCurrencyVal(q.totalAmount || q.totalEngagementValue || 0)}) - {q.status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Engagement Selection for Alignment Purpose */}
                      {purpose === 'alignment' && expertEngagements.length > 0 && (
                        <div className="mt-4 space-y-2 animate-in fade-in duration-200">
                          <Label htmlFor="engagement-select" className="font-semibold text-slate-800">Select Engagement *</Label>
                          <Select
                            value={selectedEngagementId}
                            onValueChange={(val) => setSelectedEngagementId(val)}
                          >
                            <SelectTrigger id="engagement-select" className="rounded-xl border-[#E5E7EB] bg-white">
                              <SelectValue placeholder="Select an engagement" />
                            </SelectTrigger>
                            <SelectContent>
                              {expertEngagements.map((e) => (
                                <SelectItem key={e.id || e._id} value={e.id || e._id || ''}>
                                  {e.referenceId || `ENG-${String(e.id || e._id).substring(18).toUpperCase()}`} ({formatCurrencyVal(e.totalProjectAmount)}) - {e.status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground font-medium mt-1">
                        {purpose === 'requirement_discussion' && (
                          hasUnquotedCompletedDiscussion ? (
                            <span className="text-rose-500 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                              Requirement Discussion locked. You already have a completed Requirement Discussion without a submitted quotation.
                            </span>
                          ) : (
                            <span className="text-[#FF6B35] flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 flex-shrink-0" />
                              Initial discussion to discover requirements, timelines, and budget direction. Limit: 1 completed session per project.
                            </span>
                          )
                        )}
                        {purpose === 'clarification' && (
                          !currentQuotation || currentQuotation.status?.toLowerCase() === 'draft' ? (
                            <span className="text-amber-600 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                              Clarification discussions require a submitted quotation from the expert.
                            </span>
                          ) : currentQuotation.status?.toLowerCase() === 'accepted' ? (
                            <span className="text-rose-500 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                              Clarification discussions are closed after quotation approval.
                            </span>
                          ) : completedClarificationCount >= 3 ? (
                            <span className="text-rose-500 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                              Clarification locked. You have reached your limit of 3 completed clarification sessions for this quotation.
                            </span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                              Active! Use this session to clarify quotation scope, deliverables, or negotiate terms. Limit: 3 completed sessions.
                            </span>
                          )
                        )}
                        {purpose === 'alignment' && (
                          (currentEngagement && (currentEngagement.status?.toLowerCase() === 'completed' || currentEngagement.status?.toLowerCase() === 'closed')) ? (
                            <span className="text-rose-500 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                              Alignment discussions closed after engagement completion.
                            </span>
                          ) : (!currentEngagement || currentEngagement.status?.toLowerCase() !== 'active') ? (
                            <span className="text-amber-600 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                              Alignment discussions require deposit payment success and engagement activation.
                            </span>
                          ) : completedAlignmentCount >= 3 ? (
                            <span className="text-rose-500 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                              Alignment locked. You have reached your limit of 3 completed alignment sessions for this engagement.
                            </span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                              Active! Use this session for project kickoff, milestone planning, and onboarding. Limit: 3 completed sessions.
                            </span>
                          )
                        )}
                      </p>
                    </div>

                    {/* Premium Session Metrics Visibility Card */}
                    <div className="rounded-xl border border-[#FF6B35]/20 bg-[#FF6B35]/5 p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="font-bold text-slate-900 capitalize text-base">
                            {purpose.replace('_', ' ')}
                          </h3>
                          <p className="text-xs text-muted-foreground">Session Governance & Usage Limits</p>
                        </div>
                        <Badge className={`px-2.5 py-1 text-xs font-bold capitalize shadow-sm border ${currentPurposeStatus.isLocked
                            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}>
                          {currentPurposeStatus.isLocked ? 'Session Limit Reached' : 'Available'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground font-medium block">Session Duration</span>
                          <span className="font-bold text-slate-800">{currentPurposeStatus.duration} Minutes</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground font-medium block">Total Limit</span>
                          <span className="font-bold text-slate-800">{currentPurposeStatus.limit} {currentPurposeStatus.limit === 1 ? 'Session' : 'Sessions'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground font-medium block">Used Sessions</span>
                          <span className="font-bold text-slate-800">{currentPurposeStatus.used}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground font-medium block">Remaining</span>
                          <span className={`font-bold ${currentPurposeStatus.remaining === 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                            {currentPurposeStatus.remaining}
                          </span>
                        </div>
                      </div>

                      {currentPurposeStatus.isLocked && (
                        <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                          <span>{currentPurposeStatus.lockReason}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="agenda">Discussion Agenda *</Label>
                      <Textarea
                        id="agenda"
                        value={agenda}
                        onChange={(e) => setAgenda(e.target.value)}
                        placeholder="1. Current challenges&#10;2. Desired outcomes&#10;3. Timeline expectations&#10;4. Budget range"
                        rows={6}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        List the key points you want to cover in the discussion
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        persistDraft({ step: 'datetime' });
                        setStep('datetime');
                      }}
                      disabled={!purpose || !agenda || currentPurposeStatus.isLocked}
                      className="w-full"
                    >
                      Continue
                    </Button>
                  </div>
                </>
              );
            })()}

            {step === 'datetime' && (
              <>
                <h1 className="mb-2 text-2xl font-bold">Select Date & Time</h1>
                <p className="mb-6 text-muted-foreground">
                  Choose a convenient time for your discussion (All times in IST)
                </p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="date">Preferred Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      max={maxBookingDate}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Available: Today → {new Date(maxBookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (30-day window)</p>

                    {/* Clear, helpful availability alerts */}
                    {selectedDate && expert && !dateAvailability.isWorkingDay && (
                      <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-amber-950">Expert is not available on {dateAvailability.dayName}s</p>
                          <p className="text-amber-800">
                            The expert does not conduct discussions on this day. Available days: {availableDayLabels.join(', ')}.
                          </p>
                          {dateAvailability.nextAvailableDate && (
                            <button
                              type="button"
                              onClick={() => setSelectedDate(dateAvailability.nextAvailableDate!)}
                              className="inline-flex items-center gap-1 font-semibold text-amber-900 underline hover:text-black mt-1"
                            >
                              Switch to earliest available date ({new Date(dateAvailability.nextAvailableDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}) →
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedDate && expert && dateAvailability.isWorkingDay && dateAvailability.isToday && !dateAvailability.hasSlots && (
                      <div className="rounded-xl bg-blue-50/80 border border-blue-200 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-blue-950">Consultation hours for today have concluded</p>
                          <p className="text-blue-800">
                            All available time slots for today have ended. Please choose an upcoming date.
                          </p>
                          {dateAvailability.nextAvailableDate && (
                            <button
                              type="button"
                              onClick={() => setSelectedDate(dateAvailability.nextAvailableDate!)}
                              className="inline-flex items-center gap-1 font-semibold text-blue-900 underline hover:text-black mt-1"
                            >
                              Switch to earliest available date ({new Date(dateAvailability.nextAvailableDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}) →
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedDate && expert && dateAvailability.isWorkingDay && !dateAvailability.isToday && !dateAvailability.hasSlots && (
                      <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-amber-950">No available slots on this date</p>
                          <p className="text-amber-800">
                            All appointment slots on this date are fully booked or reserved.
                          </p>
                          {dateAvailability.nextAvailableDate && (
                            <button
                              type="button"
                              onClick={() => setSelectedDate(dateAvailability.nextAvailableDate!)}
                              className="inline-flex items-center gap-1 font-semibold text-amber-900 underline hover:text-black mt-1"
                            >
                              Switch to next available date ({new Date(dateAvailability.nextAvailableDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}) →
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Select Time Window */}
                  {selectedDate && (
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-[#111926]">Available Time Windows</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Morning */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWindow('morning');
                            setSelectedTime('');
                          }}
                          disabled={hasCustomAvailability && windowsWithSlots.morning.length === 0}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${selectedWindow === 'morning'
                              ? 'border-orange-600 bg-orange-50/50 text-[#111926] shadow-sm'
                              : hasCustomAvailability && windowsWithSlots.morning.length === 0
                                ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-[#111926]'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold flex items-center gap-1.5 text-sm">
                              <Sunrise className="w-4 h-4 text-amber-500" /> Morning
                            </span>
                            {hasCustomAvailability && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                {windowsWithSlots.morning.length} slots
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">9 AM – 12 PM</span>
                        </button>

                        {/* Afternoon */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWindow('afternoon');
                            setSelectedTime('');
                          }}
                          disabled={hasCustomAvailability && windowsWithSlots.afternoon.length === 0}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${selectedWindow === 'afternoon'
                              ? 'border-orange-600 bg-orange-50/50 text-[#111926] shadow-sm'
                              : hasCustomAvailability && windowsWithSlots.afternoon.length === 0
                                ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-[#111926]'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold flex items-center gap-1.5 text-sm">
                              <Sun className="w-4 h-4 text-amber-500" /> Afternoon
                            </span>
                            {hasCustomAvailability && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                {windowsWithSlots.afternoon.length} slots
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">12 PM – 4 PM</span>
                        </button>

                        {/* Evening */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWindow('evening');
                            setSelectedTime('');
                          }}
                          disabled={hasCustomAvailability && windowsWithSlots.evening.length === 0}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${selectedWindow === 'evening'
                              ? 'border-orange-600 bg-orange-50/50 text-[#111926] shadow-sm'
                              : hasCustomAvailability && windowsWithSlots.evening.length === 0
                                ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-[#111926]'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold flex items-center gap-1.5 text-sm">
                              <Sunset className="w-4 h-4 text-indigo-500" /> Evening
                            </span>
                            {hasCustomAvailability && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                {windowsWithSlots.evening.length} slots
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">4 PM – 9 PM</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Select Available Slots */}
                  {selectedDate && selectedWindow && (
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-[#111926]">Select Available Slot</Label>
                      {windowsWithSlots[selectedWindow].length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No slots available in this window. Please select another window or date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {windowsWithSlots[selectedWindow].map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`rounded-lg border-2 p-3 text-sm font-semibold transition-all text-center ${selectedTime === time
                                  ? 'border-orange-600 bg-orange-600 text-white shadow-sm'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                            >
                              {formatTimeTo12hr(time)}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground pt-1">
                        {expert && expert.timezone
                          ? `Times shown in ${expert.timezone}. Your local time: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
                          : 'All times are in IST (Indian Standard Time). Your local time: ' + Intl.DateTimeFormat().resolvedOptions().timeZone
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        persistDraft({ step: 'details' });
                        setStep('details');
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        persistDraft({ step: 'confirm' });
                        setStep('confirm');
                      }}
                      disabled={!selectedDate || !selectedTime}
                      className="flex-1"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </>
            )}

            {step === 'confirm' && (
              <>
                <h1 className="mb-2 text-2xl font-bold">Confirm Discussion</h1>
                <p className="mb-6 text-muted-foreground">
                  Review the details before scheduling
                </p>

                <div className="space-y-6">
                  {/* Premium Edit Form Card */}
                  <div className="rounded-xl border border-border bg-slate-50/50 p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white shadow-sm">
                        <Video className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Directly Edit Details</h3>
                        <p className="text-xs text-muted-foreground">Adjust any fields below instantly before confirming</p>
                      </div>
                    </div>

                    <div className="space-y-4 text-sm">
                      {/* Date & Time Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-date" className="font-bold text-slate-700">Preferred Date</Label>
                          <Input
                            id="edit-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            max={maxBookingDate}
                            className="bg-white border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-window" className="font-bold text-slate-700">Available Time Window</Label>
                          <Select value={selectedWindow} onValueChange={(val: any) => {
                            setSelectedWindow(val);
                            setSelectedTime('');
                          }}>
                            <SelectTrigger id="edit-window" className="bg-white border-slate-200">
                              <SelectValue placeholder="Select time window" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning" disabled={hasCustomAvailability && windowsWithSlots.morning.length === 0}>
                                Morning (9:00 AM – 12:00 PM) {hasCustomAvailability ? `(${windowsWithSlots.morning.length} slots)` : ''}
                              </SelectItem>
                              <SelectItem value="afternoon" disabled={hasCustomAvailability && windowsWithSlots.afternoon.length === 0}>
                                Afternoon (12:00 PM – 4:00 PM) {hasCustomAvailability ? `(${windowsWithSlots.afternoon.length} slots)` : ''}
                              </SelectItem>
                              <SelectItem value="evening" disabled={hasCustomAvailability && windowsWithSlots.evening.length === 0}>
                                Evening (4:00 PM – 9:00 PM) {hasCustomAvailability ? `(${windowsWithSlots.evening.length} slots)` : ''}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-time" className="font-bold text-slate-700">Time Slot ({expert?.timezone || 'IST'})</Label>
                          <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedWindow}>
                            <SelectTrigger id="edit-time" className="bg-white border-slate-200">
                              <SelectValue placeholder={selectedWindow ? "Select time slot" : "Select window first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {!selectedWindow ? (
                                <SelectItem value="none" disabled>Select window first</SelectItem>
                              ) : windowsWithSlots[selectedWindow].length === 0 ? (
                                <SelectItem value="none" disabled>No slots available</SelectItem>
                              ) : (
                                windowsWithSlots[selectedWindow].map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {formatTimeTo12hr(time)}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Purpose Selector */}
                      <div className="space-y-2">
                        <Label htmlFor="edit-purpose" className="font-bold text-slate-700">Select Purpose</Label>
                        <Select value={purpose} onValueChange={setPurpose}>
                          <SelectTrigger id="edit-purpose" className="bg-white border-slate-200">
                            <SelectValue placeholder="Select purpose of discussion" />
                          </SelectTrigger>
                          <SelectContent>
                            {PURPOSE_OPTIONS.map((option) => {
                              const isOptionLocked = !hasCompletedDiscussion && option.value !== 'requirement_discussion';
                              return (
                                <SelectItem key={option.value} value={option.value} disabled={isOptionLocked}>
                                  {option.label} {isOptionLocked ? ' (Locked)' : ''}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Discussion Agenda */}
                      <div className="space-y-2">
                        <Label htmlFor="edit-agenda" className="font-bold text-slate-700">Discussion Agenda</Label>
                        <Textarea
                          id="edit-agenda"
                          value={agenda}
                          onChange={(e) => setAgenda(e.target.value)}
                          placeholder="List the key points you want to cover..."
                          rows={4}
                          className="bg-white border-slate-200 text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-secondary p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4" />
                      <p className="text-sm">
                        By scheduling this discussion, you agree to our platform terms. No recordings
                        are allowed. Contact information will be shared after confirmation.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        persistDraft({ step: 'datetime' });
                        setStep('datetime');
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={requestDiscussionMutation.isPending}
                      className="flex-1"
                    >
                      {requestDiscussionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        'Schedule Discussion'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppDashboardLayout>
  );
};

export default ScheduleDiscussion;
