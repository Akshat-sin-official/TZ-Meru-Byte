import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  subDays,
  isToday,
  parseISO,
  addMinutes,
} from 'date-fns';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { expertService } from '@/services';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { formatStatusLabel } from '@/lib/statusUtils';
import { cn } from '@/lib/utils';
import { RescheduleDiscussionDialog } from '@/components/discussion/RescheduleDiscussionDialog';
import {
  getAvailableTimeSlots,
  normalizeAvailabilityMap,
  getCurrentISTDate,
  getCurrentISTMinutes,
  normalizeDateString,
  generateSlotsBetween,
} from '@/utils/schedulingSlots';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarEvent {
  id: string;
  type: 'discussion' | 'blocked';
  eventDate: Date;
  endDate?: Date;
  daysDuration?: number; // 0 for same day
  purpose: string;
  status: string;

  // Discussion specific
  seekerName?: string;
  agenda?: string;
  jitsiLink?: string | null;
  context?: any;
  rescheduleAttempts?: number;
  duration?: number;

  // Blocked specific
  startTime?: string;
  endTime?: string;
  reason?: string;
}

// Helper to format date in IST regardless of browser timezone
const formatInIST = (date: Date | string, formatStr: string) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  // This converts the UTC date to a string representation of IST
  const istDate = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return format(istDate, formatStr);
};

const ExpertSchedule = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const sidebarSections = useAppSidebar();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState<'decline' | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<CalendarEvent | null>(null);

  // Expert scheduling states
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [schedulePurpose, setSchedulePurpose] = useState<'clarification' | 'alignment'>('clarification');
  const [scheduleSelectedQuotationId, setScheduleSelectedQuotationId] = useState('');
  const [scheduleSelectedEngagementId, setScheduleSelectedEngagementId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleAgenda, setScheduleAgenda] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['expertProfile'],
    queryFn: () => expertService.getProfile(),
  });

  const format12Hour = (time24: string): string => {
    const [hStr, mStr] = time24.split(':');
    const h = Number(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayH).padStart(2, '0')}:${mStr} ${ampm}`;
  };

  const activeSlots = useMemo(() => {
    if (!profile) return [];

    const expertSched = {
      bookingsAvailability: profile.bookingsAvailability,
      availability: profile.availability,
      daysOff: profile.daysOff
    };

    const duration = schedulePurpose === 'alignment' ? 45 : 30;
    const normalizedDate = normalizeDateString(scheduleDate);
    const istToday = getCurrentISTDate();
    if (normalizedDate < istToday) return [];

    let slots = getAvailableTimeSlots(expertSched, normalizedDate, duration);

    if (slots.length === 0) {
      const hasAnyAvailabilityConfig = profile.bookingsAvailability?.availableTimeSlots?.length ||
        Object.values(normalizeAvailabilityMap(profile.availability)).some(d => d.available);

      if (!hasAnyAvailabilityConfig && normalizedDate >= istToday) {
        slots = generateSlotsBetween('09:00', '21:00', 15, duration);
      }
    }

    if (normalizedDate === istToday) {
      const minStartMinutes = getCurrentISTMinutes() + 15;
      slots = slots.filter((slot) => {
        const [slotHour, slotMin] = slot.split(':').map(Number);
        return slotHour * 60 + slotMin >= minStartMinutes;
      });
    }

    return slots.map(slot => ({
      value: slot,
      label: format12Hour(slot)
    }));
  }, [profile, scheduleDate, schedulePurpose]);

  const { data: engagements = [] } = useQuery({
    queryKey: ['expertEngagements'],
    queryFn: () => expertService.getEngagements(),
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['expertQuotations'],
    queryFn: () => expertService.getQuotations(),
  });

  const acceptMutation = useMutation({
    mutationFn: (discussionId: string) => expertService.acceptScheduledDiscussion(discussionId),
    onSuccess: () => {
      toast.success('Accepted. Meeting link generated.');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      expertService.declineScheduledDiscussion(id, reason),
    onSuccess: () => {
      toast.success('Declined.');
      setSelectedEvent(null);
      setShowRejectInput(null);
      setActionReason('');
      queryClient.invalidateQueries({ queryKey: ['expertDiscussions'] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  // Schedule discussion request mutation (Expert -> Seeker)
  const scheduleDiscussionMutation = useMutation({
    mutationFn: (data: {
      seekerId: string;
      purpose: 'clarification' | 'alignment';
      agenda: string;
      scheduledAt: string;
      quotationId?: string;
      engagementId?: string;
      duration?: number;
    }) => expertService.requestScheduledDiscussion(data),
    onSuccess: () => {
      toast.success('Discussion request scheduled successfully.');
      queryClient.invalidateQueries({ queryKey: ['expertDiscussions'] });
      setShowScheduleDialog(false);
      // Reset form
      setSchedulePurpose('clarification');
      setScheduleSelectedQuotationId('');
      setScheduleSelectedEngagementId('');
      setScheduleDate('');
      setScheduleTime('');
      setScheduleAgenda('');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule discussion';
      toast.error(errorMessage);
    },
  });

  const handleScheduleSubmit = () => {
    if (!scheduleDate || !scheduleTime || !scheduleAgenda.trim()) {
      toast.error('Date, time, and agenda are required');
      return;
    }

    const dateParts = scheduleDate.split('-').map(Number);
    const [y, m, d] = dateParts[0] > 1000 ? [dateParts[0], dateParts[1], dateParts[2]] : [dateParts[2], dateParts[1], dateParts[0]];
    const [hh, mm] = scheduleTime.split(':').map(Number);
    const targetUTC = new Date(Date.UTC(y, m - 1, d, hh, mm));
    const tzDateStr = targetUTC.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const utcDateStr = targetUTC.toLocaleString('en-US', { timeZone: 'UTC' });
    const offsetMs = new Date(tzDateStr).getTime() - new Date(utcDateStr).getTime();
    const finalScheduledAt = new Date(targetUTC.getTime() - offsetMs);

    const minBufferMs = 15 * 60 * 1000 - 30 * 1000;
    if (finalScheduledAt.getTime() < Date.now() + minBufferMs) {
      toast.error('Discussions must be scheduled at least 15 minutes in advance.');
      return;
    }

    // Limit to 30 days ahead
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (finalScheduledAt > maxDate) {
      toast.error('Discussions can only be scheduled up to 30 days in advance.');
      return;
    }

    let seekerId = '';
    let quotationId: string | undefined = undefined;
    let engagementId: string | undefined = undefined;

    if (schedulePurpose === 'clarification') {
      const selectedQuotation = quotations.find(q => q.id === scheduleSelectedQuotationId || q._id === scheduleSelectedQuotationId);
      if (!selectedQuotation) {
        toast.error('Please select a quotation');
        return;
      }
      seekerId = selectedQuotation.seekerId;
      quotationId = selectedQuotation.id || selectedQuotation._id;
    } else {
      const selectedEngagement = engagements.find(e => e.id === scheduleSelectedEngagementId || e._id === scheduleSelectedEngagementId);
      if (!selectedEngagement) {
        toast.error('Please select an engagement');
        return;
      }
      seekerId = selectedEngagement.seekerId;
      engagementId = selectedEngagement.id || selectedEngagement._id;
    }

    if (!seekerId) {
      toast.error('Could not find seeker ID for the selected context');
      return;
    }

    scheduleDiscussionMutation.mutate({
      seekerId,
      purpose: schedulePurpose,
      agenda: scheduleAgenda.trim(),
      scheduledAt: finalScheduledAt.toISOString(),
      duration: 30,
      quotationId,
      engagementId,
    });
  };




  // Block Time State
  const [isBlockTimeOpen, setIsBlockTimeOpen] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockToDate, setBlockToDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  // Fetch expert discussions
  const { data: discussions = [] } = useQuery({
    queryKey: ['expertDiscussions'],
    queryFn: () => expertService.getDiscussions(),
  });

  // Fetch availability
  const { data: availability = [], refetch: refetchAvailability } = useQuery({
    queryKey: ['expertAvailability'],
    queryFn: () => expertService.getAvailability(),
  });

  // Combine and sort events
  const allEvents = useMemo<CalendarEvent[]>(() => {
    // Map discussions to a common event shape
    const discussionEvents: CalendarEvent[] = discussions.map(d => ({
      id: d.id,
      type: 'discussion',
      eventDate: d.scheduledDate ? parseISO(d.scheduledDate) : parseISO(d.createdAt),
      purpose: d.purpose,
      status: d.status,
      seekerName: d.seekerName,
      agenda: d.agenda,
      jitsiLink: d.jitsiLink ?? null,
      context: d.context,
      rescheduleAttempts: d.rescheduleAttempts ?? 0,
    }));

    // Map availability blocks to a common event shape
    const availabilityEvents: CalendarEvent[] = availability.map(a => ({
      id: a._id, // normalizing id
      type: 'blocked',
      eventDate: parseISO(a.startTime),
      endDate: parseISO(a.endTime),
      purpose: a.reason || 'Blocked Time',
      status: 'blocked',
      reason: a.reason,
      startTime: a.startTime,
      endTime: a.endTime,
    }));

    return [...discussionEvents, ...availabilityEvents].sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  }, [discussions, availability]);

  // --- Date Navigation ---
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => subDays(prev, 7));
    } else {
      setCurrentDate(prev => subDays(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => addDays(prev, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    // If in month view, ensure we're viewing the current month
    if (viewMode === 'month') {
      // Force re-render by creating a new date object
      setCurrentDate(new Date(today.getTime()));
    }
  };

  // --- Actions ---
  const handleBlockTime = async () => {
    if (!blockDate || !blockToDate || !blockStartTime || !blockEndTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsBlocking(true);
      const start = new Date(`${blockDate}T${blockStartTime}`);
      const end = new Date(`${blockToDate}T${blockEndTime}`);

      if (start >= end) {
        toast.error('End time must be after start time');
        return;
      }

      await expertService.blockTime(start, end, blockReason);
      toast.success('Time blocked successfully');
      setIsBlockTimeOpen(false);
      // Reset form
      setBlockDate('');
      setBlockToDate('');
      setBlockStartTime('');
      setBlockEndTime('');
      setBlockReason('');

      refetchAvailability();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to block time');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await expertService.deleteAvailability(id);
      toast.success('Availability block removed');
      setSelectedEvent(null);
      refetchAvailability();
    } catch (error) {
      toast.error('Failed to remove block');
    }
  };


  // --- Data Helpers ---
  const getEventsForDateOptimized = (date: Date) => {
    return allEvents.filter(e => isSameDay(e.eventDate, date));
  };


  // --- Renderers ---

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    // Header (Days of week)
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = formatInIST(day, dateFormat);
        const cloneDay = day;
        const dayEvents = getEventsForDateOptimized(cloneDay);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[120px] border-b border-r bg-background p-2 transition-colors hover:bg-muted/30",
              !isCurrentMonth && "bg-muted/10 text-muted-foreground",
              isToday(day) && "bg-blue-50/50"
            )}
            onClick={() => {
              // Create a new Date object to ensure state update
              setCurrentDate(new Date(cloneDay.getTime()));
              setViewMode('day');
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                isToday(day) ? "bg-blue-600 text-white" : "text-muted-foreground"
              )}>
                {formattedDate}
              </span>
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(event);
                  }}
                  className={cn(
                    "group flex cursor-pointer items-center gap-1 rounded border px-1.5 py-1 text-xs",
                    event.type === 'blocked'
                      ? "bg-gray-100 border-l-gray-500 text-gray-700 border-l-2"
                      : "bg-blue-50 border-l-blue-500 text-blue-700 border-l-2 hover:bg-blue-100"
                  )}
                >
                  <span className="font-medium">
                    {formatInIST(event.eventDate, 'HH:mm')}
                  </span>
                  <span className="truncate">{event.type === 'blocked' ? (event.reason || 'Blocked') : event.purpose}</span>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-[10px] text-muted-foreground pl-1">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="rounded-lg border shadow-sm bg-white">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {weekDays.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  const renderAgendaView = () => {
    const events = allEvents.filter(e => {
      const date = e.eventDate;
      if (viewMode === 'day') return isSameDay(date, currentDate);
      // Week logic
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return date >= start && date <= end;
    });

    if (events.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-lg bg-white h-[500px]">
          <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
          <p>No events scheduled for this {viewMode}.</p>
          <Button variant="link" onClick={() => setViewMode('month')}>View Month</Button>
        </div>
      )
    }

    return (
      <ScrollArea className="h-[600px] rounded-lg border bg-white">
        <div className="divide-y">
          {events.map((event) => (
            <div key={event.id} className="p-4 hover:bg-muted/50 transition-colors flex items-start gap-4">
              <div className="flex flex-col items-center min-w-[60px] pt-1">
                <span className="text-sm font-bold text-muted-foreground uppercase">{formatInIST(event.eventDate, 'MMM')}</span>
                <span className="text-2xl font-bold text-foreground">{formatInIST(event.eventDate, 'd')}</span>
                <span className="text-xs text-muted-foreground">{formatInIST(event.eventDate, 'EEE')}</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={cn("font-semibold text-lg", event.type === 'blocked' && "text-gray-600 italic")}>
                    {event.type === 'blocked' ? (event.reason || "Blocked Time") : event.purpose}
                  </h3>
                  <Badge variant={event.type === 'blocked' ? 'outline' : (event.status === 'scheduled' ? 'default' : 'secondary')} className="capitalize">
                    {event.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatInIST(event.eventDate, 'h:mm a')}
                    {event.type === 'blocked' && event.endTime && ` - ${formatInIST(parseISO(event.endTime), 'h:mm a')}`}
                    {event.type === 'discussion' && ` - ${formatInIST(addMinutes(event.eventDate, 30), 'h:mm a')} (30m)`}
                  </div>
                  {event.type === 'discussion' && (
                    <div className="flex items-center gap-1">
                      <Video className="h-3.5 w-3.5" />
                      Video Meeting
                    </div>
                  )}
                </div>
                {event.type === 'discussion' && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {event.agenda || "No specific agenda set."}
                  </p>
                )}
                <div className="pt-2 flex items-center gap-2">
                  {event.type === 'discussion' ? (
                    <>
                      <Button size="sm" onClick={() => navigate(`/meeting/${event.id}`)}>
                        {(event as any).meetingJoinedAt || (event as any).attendanceStatus === 'in_progress' ? 'Rejoin Discussion' : 'Join Meeting'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(event)}>
                        View Details
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteBlock(event.id)}>
                      Remove Block
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    )

  }

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'Expert',
        role: 'Marketing Expert',
      }}
      sections={sidebarSections}
      onSignOut={() => {
        logout();
        navigate('/login');
      }}
      headerTitle="Schedule (All times in IST)"
    >
      <div className="space-y-6 max-w-[1400px] mx-auto">

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleToday} className="font-medium">
              Today
            </Button>
            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-xl font-semibold min-w-[200px]" key={`month-${currentDate.getMonth()}-${currentDate.getFullYear()}`}>
              {formatInIST(currentDate, 'MMMM yyyy')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2 border-[#0EA5E9] text-[#0EA5E9] hover:bg-blue-50"
              onClick={() => setShowScheduleDialog(true)}
            >
              <CalendarIcon className="h-4 w-4" />
              Schedule Call
            </Button>
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsBlockTimeOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Block Time
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'month' ? renderMonthView() : renderAgendaView()}

        {/* Block Time Dialog */}
        <Dialog open={isBlockTimeOpen} onOpenChange={setIsBlockTimeOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Block Time</DialogTitle>
              <DialogDescription>
                Mark a specific time range as unavailable.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">From Date</Label>
                  <div className="relative">
                    <Input
                      id="date"
                      type="date"
                      value={blockDate}
                      onChange={(e) => {
                        setBlockDate(e.target.value);
                        if (!blockToDate || blockToDate < e.target.value) {
                          setBlockToDate(e.target.value);
                        }
                      }}
                      placeholder="Select date"
                      className="pl-9"
                    />
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="toDate">To Date</Label>
                  <div className="relative">
                    <Input
                      id="toDate"
                      type="date"
                      value={blockToDate}
                      onChange={(e) => setBlockToDate(e.target.value)}
                      placeholder="Select date"
                      className="pl-9"
                    />
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Time Range</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="start"
                      type="time"
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="pl-9"
                    />
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="relative flex-1">
                    <Input
                      id="end"
                      type="time"
                      value={blockEndTime}
                      onChange={(e) => setBlockEndTime(e.target.value)}
                      className="pl-9"
                    />
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {blockStartTime && blockEndTime && blockStartTime >= blockEndTime && (
                  <p className="text-[13px] text-destructive font-medium mt-1">End time must be after start time</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g. Lunch, personal appointment, busy"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBlockTimeOpen(false)}>Cancel</Button>
              <Button
                onClick={handleBlockTime}
                disabled={isBlocking || !blockDate || !blockToDate || !blockStartTime || !blockEndTime || (new Date(`${blockDate}T${blockStartTime}`) >= new Date(`${blockToDate}T${blockEndTime}`))}
              >
                {isBlocking ? 'Blocking...' : 'Block Time'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Event Detail Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
            {/* Coloured Header */}
            <div className={`px-6 pt-6 pb-5 ${selectedEvent?.type === 'blocked'
                ? 'bg-gradient-to-br from-red-50 to-orange-50 border-b border-red-100'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100'
              }`}>
              {/* Status badge */}
              {selectedEvent?.type === 'discussion' && selectedEvent.status && (
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full mb-3 ${selectedEvent.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    selectedEvent.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                      selectedEvent.status === 'declined' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                  }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {formatStatusLabel(selectedEvent.status)}
                </span>
              )}
              {/* Title */}
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {selectedEvent?.type === 'blocked' ? 'Blocked Time' : selectedEvent?.purpose}
              </h2>
              {/* Date */}
              <p className="text-sm text-slate-500 mt-1">
                {selectedEvent && formatInIST(selectedEvent.eventDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Time row */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Time</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {selectedEvent && formatInIST(selectedEvent.eventDate, 'h:mm a')}
                    {selectedEvent?.type === 'blocked' && selectedEvent.endDate
                      ? ` – ${formatInIST(selectedEvent.endDate, 'h:mm a')}`
                      : selectedEvent?.type === 'discussion'
                        ? ` – ${formatInIST(addMinutes(selectedEvent.eventDate, 30), 'h:mm a')} (30m)`
                        : ''}
                  </p>
                </div>
              </div>

              {/* Location (discussion only) */}
              {selectedEvent?.type === 'discussion' && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Video className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Location</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">Video Meeting</p>
                  </div>
                </div>
              )}

              {/* Attendee */}
              {selectedEvent?.type === 'discussion' && selectedEvent.seekerName && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <span className="text-xs font-bold">
                      {selectedEvent.seekerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attendee</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{selectedEvent.seekerName}</p>
                  </div>
                </div>
              )}

              {/* Agenda / Reason */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  {selectedEvent?.type === 'blocked' ? 'Reason' : 'Agenda'}
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedEvent?.type === 'blocked'
                    ? selectedEvent.reason || 'No reason provided.'
                    : selectedEvent?.agenda || 'No agenda details provided.'}
                </p>
              </div>

              {/* Seeker Requirements */}
              {selectedEvent?.type === 'discussion' && selectedEvent.context &&
                Object.keys(selectedEvent.context).length > 0 && (
                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-2">
                      Seeker Requirements
                    </p>
                    <div className="space-y-1.5">
                      {Object.entries(selectedEvent.context).map(([key, value]) => {
                        if (!value || (typeof value === 'object' && Object.keys(value as object).length === 0)) return null;
                        const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        const displayValue = Array.isArray(value)
                          ? (value as string[]).join(', ')
                          : typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value);
                        return (
                          <div key={key} className="flex gap-2 text-sm">
                            <span className="font-semibold text-indigo-700 shrink-0">{displayKey}:</span>
                            <span className="text-slate-600">{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 pb-6">
              {selectedEvent?.type === 'blocked' ? (
                <Button
                  variant="destructive"
                  className="w-full rounded-xl"
                  onClick={() => handleDeleteBlock(selectedEvent.id)}
                >
                  Delete Block
                </Button>
              ) : (
                <div className="space-y-3">
                  {/* Reject with reason form */}
                  {showRejectInput && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
                      <Label className="text-sm font-semibold text-red-700">Reason (Optional)</Label>
                      <Textarea
                        placeholder="Why are you rejecting this request?"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        className="resize-none bg-white rounded-lg border-red-200 text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => { setShowRejectInput(null); setActionReason(''); }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => selectedEvent?.id && declineMutation.mutate({ id: selectedEvent.id, reason: actionReason })}
                          disabled={declineMutation.isPending}
                        >
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Main action buttons */}
                  {!showRejectInput && (
                    <div className={`flex gap-2 ${selectedEvent?.status?.toLowerCase() === 'pending' ? 'flex-wrap' : ''}`}>
                      {/* Close always shown except when reject form open */}
                      <Button
                        variant="outline"
                        className="rounded-xl flex-1"
                        onClick={() => setSelectedEvent(null)}
                      >
                        Close
                      </Button>

                      {/* Pending actions */}
                      {selectedEvent?.status?.toLowerCase() === 'pending' && (
                        <>
                          <Button
                            variant="destructive"
                            className="rounded-xl flex-1"
                            onClick={() => setShowRejectInput('decline')}
                          >
                            Reject
                          </Button>
                          <Button
                            className="rounded-xl flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => selectedEvent?.id && acceptMutation.mutate(selectedEvent.id)}
                            disabled={acceptMutation.isPending}
                          >
                            Accept
                          </Button>
                        </>
                      )}

                      {/* Join meeting for accepted */}
                      {selectedEvent?.status?.toLowerCase() === 'accepted' && (
                        <Button
                          className="rounded-xl flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => { navigate(`/meeting/${selectedEvent.id}`); setSelectedEvent(null); }}
                        >
                          {(selectedEvent as any).meetingJoinedAt || (selectedEvent as any).attendanceStatus === 'in_progress' ? 'Rejoin Discussion' : 'Join Meeting'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Propose New Time — shown below main actions */}
                  {['pending', 'accepted', 'rescheduled'].includes(selectedEvent?.status?.toLowerCase() || '') &&
                    (selectedEvent?.rescheduleAttempts ?? 0) < 3 && (
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-dashed text-slate-600 hover:text-slate-900"
                        onClick={() => {
                          setRescheduleTarget(selectedEvent);
                          setSelectedEvent(null);
                        }}
                      >
                        Propose New Time
                        <span className="ml-2 text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                          {3 - (selectedEvent?.rescheduleAttempts ?? 0)} left
                        </span>
                      </Button>
                    )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>


        {user?.id && rescheduleTarget && (
          <RescheduleDiscussionDialog
            open={!!rescheduleTarget}
            onOpenChange={(open) => !open && setRescheduleTarget(null)}
            discussionId={rescheduleTarget.id}
            expertId={user.id}
            duration={rescheduleTarget.duration || 30}
            rescheduleAttempts={rescheduleTarget.rescheduleAttempts ?? 0}
            role="expert"
            onSuccess={() => {
              setRescheduleTarget(null);
              queryClient.invalidateQueries({ queryKey: ['expertDiscussions'] });
            }}
          />
        )}

        {/* Schedule Call Dialog for Expert */}
        <Dialog open={showScheduleDialog} onOpenChange={(open) => {
          if (!open) {
            setShowScheduleDialog(false);
            // Reset form states
            setSchedulePurpose('clarification');
            setScheduleSelectedQuotationId('');
            setScheduleSelectedEngagementId('');
            setScheduleDate('');
            setScheduleTime('');
            setScheduleAgenda('');
          }
        }}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 border-[#E5E7EB] bg-white shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#111926] flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#0EA5E9]" />
                Schedule a Call
              </DialogTitle>
              <DialogDescription className="text-sm text-[#6B7280]">
                Schedule a discussion directly with your client for quotation discussion or project alignment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Purpose */}
              <div className="space-y-2">
                <Label className="font-semibold text-slate-800 text-sm">Purpose of Call</Label>
                <Select value={schedulePurpose} onValueChange={(val: 'clarification' | 'alignment') => setSchedulePurpose(val)}>
                  <SelectTrigger className="w-full rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clarification">DISCUSS QUOTATION</SelectItem>
                    <SelectItem 
                      value="alignment"
                      disabled={engagements.filter(e => e.status === 'active').length === 0}
                    >
                      Active-Engagement discussion {engagements.filter(e => e.status === 'active').length === 0 ? '(Locked - Deposit Required)' : ''}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Context/Project Select */}
              {schedulePurpose === 'clarification' ? (
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-800 text-sm">Select Quotation/Proposal</Label>
                  {quotations.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                      No quotations found. You must submit a quotation first to schedule clarification discussions.
                    </p>
                  ) : (
                    <Select value={scheduleSelectedQuotationId} onValueChange={setScheduleSelectedQuotationId}>
                      <SelectTrigger className="w-full rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm">
                        <SelectValue placeholder="Select proposal context" />
                      </SelectTrigger>
                      <SelectContent>
                        {quotations.map((q) => (
                          <SelectItem key={q.id || q._id} value={q.id || q._id || ''}>
                            {q.seekerName || 'Business Owner'} - {q.title || 'Quotation'} ({formatStatusLabel(q.status)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-800 text-sm">Select Active Project</Label>
                  {engagements.filter(e => e.status === 'active').length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                      No active engagements found. Seekers must accept your proposal and pay the deposit before you can schedule alignment calls.
                    </p>
                  ) : (
                    <Select value={scheduleSelectedEngagementId} onValueChange={setScheduleSelectedEngagementId}>
                      <SelectTrigger className="w-full rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm">
                        <SelectValue placeholder="Select active project context" />
                      </SelectTrigger>
                      <SelectContent>
                        {engagements.filter(e => e.status === 'active').map((e) => (
                          <SelectItem key={e.id || e._id} value={e.id || e._id || ''}>
                            {e.seekerName || 'Business Owner'} - {e.serviceCategory || 'Project'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="expert-schedule-date" className="font-semibold text-slate-800 text-sm">Scheduled Date</Label>
                <Input
                  id="expert-schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {
                      // showPicker not supported in all browsers
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  max={(() => {
                    const maxDate = new Date();
                    maxDate.setDate(maxDate.getDate() + 30);
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  className="rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-slate-800 text-sm">Scheduled Time (IST)</Label>
                <Select value={scheduleTime} onValueChange={setScheduleTime} disabled={!scheduleDate || activeSlots.length === 0}>
                  <SelectTrigger className="w-full rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm">
                    <SelectValue placeholder={!scheduleDate ? 'Select a date first' : activeSlots.length === 0 ? '❌ No slots available today. Please select tomorrow.' : 'Select a time slot'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[220px]">
                    {activeSlots.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {scheduleDate ? '❌ No slots available today. Please select tomorrow.' : 'Select a date first'}
                      </SelectItem>
                    ) : (
                      activeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {scheduleDate && activeSlots.length === 0 && (
                  <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                    ❌ No slots available today. Please select tomorrow.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expert-schedule-agenda" className="font-semibold text-slate-800 text-sm">Agenda (Max 300 characters)</Label>
                <Textarea
                  id="expert-schedule-agenda"
                  placeholder="Describe what needs to be discussed (e.g., align on onboarding, clarify quotation terms...)"
                  value={scheduleAgenda}
                  onChange={(e) => setScheduleAgenda(e.target.value)}
                  maxLength={300}
                  rows={4}
                  className="rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm placeholder:text-muted-foreground"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {scheduleAgenda.length}/300 characters
                </p>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowScheduleDialog(false);
                  // Reset form states
                  setSchedulePurpose('clarification');
                  setScheduleSelectedQuotationId('');
                  setScheduleSelectedEngagementId('');
                  setScheduleDate('');
                  setScheduleTime('');
                  setScheduleAgenda('');
                }}
                className="rounded-xl font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-800 h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleSubmit}
                disabled={
                  scheduleDiscussionMutation.isPending ||
                  (schedulePurpose === 'clarification' && !scheduleSelectedQuotationId) ||
                  (schedulePurpose === 'alignment' && !scheduleSelectedEngagementId)
                }
                className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold h-10 px-5 rounded-xl shadow-sm"
              >
                {scheduleDiscussionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Discussion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppDashboardLayout>
  );
};


export default ExpertSchedule;
