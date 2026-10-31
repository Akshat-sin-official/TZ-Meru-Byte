import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LatestUpdates } from '@/components/seeker/LatestUpdates';
import { ExpertHeaderSnapshot } from '@/components/expert/ExpertHeaderSnapshot';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { ContextualPayoutBanner } from '@/components/expert/ContextualPayoutBanner';
import { expertService, ExpertDiscussion, ExpertEngagement, ExpertQuotation } from '@/services/expertService';
import { meetingService } from '@/services/meetingService';
import { formatStatusLabel } from '@/lib/statusUtils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FeedbackPrompt } from '@/components/feedback/FeedbackPrompt';
import { ExpertQuotationsPanel } from '@/components/expert/ExpertQuotationsPanel';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import {
  getAvailableTimeSlots,
  normalizeAvailabilityMap,
  isDateAvailableForExpert,
  normalizeDateString,
  getCurrentISTDate,
  getCurrentISTMinutes,
  generateSlotsBetween,
} from '@/utils/schedulingSlots';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Video,
  Send,
  User,
  LayoutDashboard,
  Bell,
  Settings,
  HelpCircle,
  Briefcase,
  Loader2,
  Archive,
  XCircle,
  ArrowRight,
  Copy,
  Lock,
  Paperclip,
} from 'lucide-react';

type TabType = 'overview' | 'discussions' | 'quotations' | 'engagements';

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { count: unreadNotificationCount } = useNotificationCount();

  // Redirect expert_candidate users to complete role confirmation
  useEffect(() => {
    if (user?.role === 'expert_candidate') {
      toast.info('Please complete your registration by selecting your primary service category');
      navigate('/register?step=confirm', { replace: true });
      return;
    }
  }, [user, navigate]);

  const initialTab = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['overview', 'discussions', 'quotations', 'engagements'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [selectedMilestone, setSelectedMilestone] = useState<{ engagementId: string; milestoneNumber: number; title: string } | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<string[]>(['']);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedEngagements, setExpandedEngagements] = useState<Set<string>>(new Set());
  const [showCreateQuoteDialog, setShowCreateQuoteDialog] = useState(false);
  const [declineDiscussionTarget, setDeclineDiscussionTarget] = useState<ExpertDiscussion | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [cancelDiscussionTarget, setCancelDiscussionTarget] = useState<ExpertDiscussion | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Expert scheduling states
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [schedulePurpose, setSchedulePurpose] = useState<'clarification' | 'alignment'>('clarification');
  const [scheduleSelectedQuotationId, setScheduleSelectedQuotationId] = useState('');
  const [scheduleSelectedEngagementId, setScheduleSelectedEngagementId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleAgenda, setScheduleAgenda] = useState('');


  // Clarification scheduling states
  const [scheduleClarificationTarget, setScheduleClarificationTarget] = useState<ExpertDiscussion | null>(null);
  const [clarificationDate, setClarificationDate] = useState('');
  const [clarificationTime, setClarificationTime] = useState('');
  const [clarificationAgenda, setClarificationAgenda] = useState('');
  const [isSchedulingClarification, setIsSchedulingClarification] = useState(false);

  const handleScheduleClarification = async () => {
    if (!scheduleClarificationTarget || !clarificationDate || !clarificationTime || !clarificationAgenda.trim()) {
      toast.error('All fields are required');
      return;
    }

    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const normDate = normalizeDateString(clarificationDate);
    const selectedDateTime = new Date(`${normDate}T${clarificationTime}`);

    if (selectedDateTime <= now) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    if (selectedDateTime > maxDate) {
      toast.error('Discussions can only be scheduled up to 30 days in advance.');
      return;
    }

    const todayStr = now.toISOString().split('T')[0];
    if (normDate === todayStr) {
      const businessStart = new Date(now);
      businessStart.setHours(9, 0, 0, 0);

      const businessStartPlus15 = new Date(now);
      businessStartPlus15.setHours(9, 15, 0, 0);

      const minTime = now < businessStart ? businessStartPlus15 : new Date(now.getTime() + 15 * 60 * 1000);
      if (selectedDateTime < minTime) {
        toast.error('For same-day bookings, please schedule a call at least 15 minutes after the current time (or from 9:15 AM IST).');
        return;
      }
    }

    if (clarificationAgenda.trim().length > 300) {
      toast.error('Agenda must be 300 characters or less');
      return;
    }

    if (!scheduleClarificationTarget.seekerId) {
      toast.error('Seeker information is missing for this discussion');
      return;
    }

    try {
      setIsSchedulingClarification(true);
      await expertService.requestScheduledDiscussion({
        seekerId: scheduleClarificationTarget.seekerId,
        purpose: 'clarification',
        agenda: clarificationAgenda.trim(),
        scheduledAt: selectedDateTime.toISOString(),
        duration: 30,
        quotationId: scheduleClarificationTarget.quotationId,
      });

      toast.success('Clarification discussion scheduled successfully');
      setScheduleClarificationTarget(null);
      setClarificationDate('');
      setClarificationTime('');
      setClarificationAgenda('');
      queryClient.invalidateQueries({ queryKey: ['expertDiscussions'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule discussion');
    } finally {
      setIsSchedulingClarification(false);
    }
  };

  // Only fetch data if user is expert (not expert_candidate)
  const isExpert = user?.role === 'expert';

  // Fetch expert stats
  const { data: stats } = useQuery({
    queryKey: ['expertStats'],
    queryFn: () => expertService.getStats(),
    enabled: isExpert, // Only fetch if user is expert
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch engagements
  const { data: engagements = [], isLoading: engagementsLoading } = useQuery({
    queryKey: ['expertEngagements'],
    queryFn: () => expertService.getEngagements(),
    enabled: isExpert, // Only fetch if user is expert
    refetchInterval: 30000,
  });

  const activeEngagementsForList = engagements.filter((e: ExpertEngagement) => {
    const s = e.status?.toLowerCase();
    return s === 'active' || s === 'completed' || s === 'closed';
  });

  // Fetch discussions
  const { data: discussions = [], isLoading: discussionsLoading } = useQuery({
    queryKey: ['expertDiscussions'],
    queryFn: () => expertService.getDiscussions(),
    enabled: isExpert, // Only fetch if user is expert
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Fetch expert profile for completeness and visibility status
  const { data: profile } = useQuery({
    queryKey: ['expertProfile'],
    queryFn: () => expertService.getProfile(),
    enabled: isExpert, // Only fetch if user is expert
  });

  const format12Hour = (time24: string): string => {
    const [hStr, mStr] = time24.split(':');
    const h = Number(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayH).padStart(2, '0')}:${mStr} ${ampm}`;
  };

  const expertScheduling = useMemo(() => {
    if (!profile) return null;
    return {
      bookingsAvailability: profile.bookingsAvailability,
      availability: profile.availability,
      daysOff: profile.daysOff,
    };
  }, [profile]);

  const activeSlots = useMemo(() => {
    if (!scheduleDate) return [];

    const duration = schedulePurpose === 'alignment' ? 45 : 30;
    const normalizedDate = normalizeDateString(scheduleDate);
    const istToday = getCurrentISTDate();
    if (normalizedDate < istToday) return [];

    let slots = getAvailableTimeSlots(expertScheduling, normalizedDate, duration);

    if (slots.length === 0) {
      const hasAnyAvailabilityConfig =
        profile?.bookingsAvailability?.availableTimeSlots?.length ||
        (profile?.availability && Object.values(normalizeAvailabilityMap(profile.availability)).some(d => d.available));

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
      label: format12Hour(slot),
    }));
  }, [profile, expertScheduling, scheduleDate, schedulePurpose]);

  const clarificationSlots = useMemo(() => {
    if (!clarificationDate) return [];

    const normalizedDate = normalizeDateString(clarificationDate);
    const istToday = getCurrentISTDate();
    if (normalizedDate < istToday) return [];

    let slots = getAvailableTimeSlots(expertScheduling, normalizedDate, 30);

    if (slots.length === 0) {
      const hasAnyAvailabilityConfig =
        profile?.bookingsAvailability?.availableTimeSlots?.length ||
        (profile?.availability && Object.values(normalizeAvailabilityMap(profile.availability)).some(d => d.available));

      if (!hasAnyAvailabilityConfig && normalizedDate >= istToday) {
        slots = generateSlotsBetween('09:00', '21:00', 15, 30);
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
      label: format12Hour(slot),
    }));
  }, [profile, expertScheduling, clarificationDate]);

  // Fetch quotations
  const { data: quotations = [], isLoading: quotationsLoading } = useQuery({
    queryKey: ['expertQuotations'],
    queryFn: () => expertService.getQuotations(),
    enabled: isExpert,
    refetchInterval: 60000,
  });

  // Submit milestone mutation
  const submitMilestoneMutation = useMutation({
    mutationFn: async ({ engagementId, milestoneNumber, submissionContent, submissionFiles }: {
      engagementId: string;
      milestoneNumber: number;
      submissionContent: string;
      submissionFiles?: string[];
    }) => {
      const cleanedFiles = submissionFiles?.filter(f => f.trim());
      return await expertService.submitMilestone({
        engagementId,
        milestoneNumber,
        submissionContent,
        submissionFiles: cleanedFiles && cleanedFiles.length > 0 ? cleanedFiles : undefined,
      });
    },
    onSuccess: () => {
      toast.success('Milestone submitted for review');
      setSelectedMilestone(null);
      setSubmissionContent('');
      setSubmissionFiles(['']);
      setAttachedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['expertEngagements'] });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to submit milestone';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string | { message?: string }; message?: string } } };
        const data = axiosError.response?.data;
        if (data?.error) {
          errorMessage = typeof data.error === 'string' ? data.error : data.error.message || errorMessage;
        } else if (data?.message) {
          errorMessage = data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  // Archive discussion mutation
  const archiveDiscussionMutation = useMutation({
    mutationFn: (discussionId: string) => expertService.archiveDiscussion(discussionId),
    onSuccess: () => {
      toast.success('Discussion archived');
      queryClient.invalidateQueries({ queryKey: ['expertDiscussions'] });
      queryClient.invalidateQueries({ queryKey: ['expertStats'] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive discussion';
      toast.error(errorMessage);
    },
  });

  // Accept discussion request mutation
  const acceptDiscussionMutation = useMutation({
    mutationFn: (discussionId: string) => expertService.acceptScheduledDiscussion(discussionId),
    onSuccess: () => {
      toast.success('Scheduled discussion request accepted successfully.');
      queryClient.invalidateQueries({ queryKey: ['expertDiscussions'] });
      queryClient.invalidateQueries({ queryKey: ['expertStats'] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept discussion request';
      toast.error(errorMessage);
    },
  });

  // Decline discussion request mutation
  const declineDiscussionMutation = useMutation({
    mutationFn: ({ discussionId, reason }: { discussionId: string; reason?: string }) =>
      expertService.declineScheduledDiscussion(discussionId, reason),
    onSuccess: () => {
      toast.success('Scheduled discussion request declined.');
      queryClient.invalidateQueries({ queryKey: ['expertDiscussions'] });
      queryClient.invalidateQueries({ queryKey: ['expertStats'] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to decline discussion request';
      toast.error(errorMessage);
    },
  });

  // Cancel discussion call mutation
  const cancelDiscussionMutation = useMutation({
    mutationFn: ({ discussionId, reason }: { discussionId: string; reason: string }) =>
      meetingService.cancelDiscussion(discussionId, reason),
    onSuccess: () => {
      toast.success('Discussion call cancelled successfully.');
      setCancelDiscussionTarget(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['expertDiscussions'] });
      queryClient.invalidateQueries({ queryKey: ['expertStats'] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel discussion call';
      toast.error(errorMessage);
    },
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
      queryClient.invalidateQueries({ queryKey: ['expertStats'] });
      setShowScheduleDialog(false);
      // Reset form
      setSchedulePurpose('alignment');
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
      quotationId = selectedQuotation.id || selectedQuotation._id || undefined;
    } else {
      const selectedEngagement = engagements.find(e => e.id === scheduleSelectedEngagementId || e._id === scheduleSelectedEngagementId);
      if (!selectedEngagement) {
        toast.error('Please select an engagement');
        return;
      }
      seekerId = selectedEngagement.seekerId;
      engagementId = selectedEngagement.id || selectedEngagement._id || undefined;
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

  // Complete compliance mutation
  const completeComplianceMutation = useMutation({
    mutationFn: (engagementId: string) => expertService.completeCompliance(engagementId),
    onSuccess: () => {
      toast.success('Compliance completed successfully');
      queryClient.invalidateQueries({ queryKey: ['expertEngagements'] });
      queryClient.invalidateQueries({ queryKey: ['expertStats'] });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to complete compliance';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string | { code?: string; message?: string; details?: unknown }; message?: string } } };
        const errorData = axiosError.response?.data?.error;

        if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = errorData.message || 'Failed to complete compliance';
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  // Complete engagement mutation
  const completeEngagementMutation = useMutation({
    mutationFn: (engagementId: string) => expertService.completeEngagement(engagementId),
    onSuccess: () => {
      toast.success('Engagement completed successfully');
      queryClient.invalidateQueries({ queryKey: ['expertEngagements'] });
      queryClient.invalidateQueries({ queryKey: ['expertStats'] });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to complete engagement';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string | { code?: string; message?: string; details?: unknown }; message?: string } } };
        const errorData = axiosError.response?.data?.error;

        if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = errorData.message || 'Failed to complete engagement';
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  // Close engagement mutation
  const closeEngagementMutation = useMutation({
    mutationFn: (engagementId: string) => expertService.closeEngagement(engagementId),
    onSuccess: () => {
      toast.success('Engagement closed successfully');
      queryClient.invalidateQueries({ queryKey: ['expertEngagements'] });
      queryClient.invalidateQueries({ queryKey: ['expertStats'] });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to close engagement';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string | { code?: string; message?: string; details?: unknown }; message?: string } } };
        const errorData = axiosError.response?.data?.error;

        if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = errorData.message || 'Failed to close engagement';
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  const toggleEngagement = (engagementId: string) => {
    setExpandedEngagements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(engagementId)) {
        newSet.delete(engagementId);
      } else {
        newSet.add(engagementId);
      }
      return newSet;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`Some files exceed the 10 MB limit: ${oversized.map((f) => f.name).join(', ')}`);
      return;
    }

    setAttachedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSubmit = async () => {
    if (!selectedMilestone || !submissionContent.trim()) {
      toast.error('Please provide submission content');
      return;
    }

    try {
      const fileDataUrls: string[] = await Promise.all(
        attachedFiles.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const raw = reader.result as string;
                const withName = raw.replace(/^data:([^;]+);base64,/, `data:$1;name=${encodeURIComponent(file.name)};base64,`);
                resolve(withName);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      const validUrls = submissionFiles.filter((f) => f.trim());
      const allFiles = [...fileDataUrls, ...validUrls];

      submitMilestoneMutation.mutate({
        engagementId: selectedMilestone.engagementId,
        milestoneNumber: selectedMilestone.milestoneNumber,
        submissionContent: submissionContent.trim(),
        submissionFiles: allFiles,
      });
    } catch {
      toast.error('Failed to process attached files. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sidebarSections = [
    {
      title: 'Main Menu',
      items: [
        {
          label: 'Overview',
          icon: LayoutDashboard,
          onClick: () => handleTabChange('overview'),
          isActive: activeTab === 'overview',
        },
        {
          label: 'Discussions',
          icon: Calendar,
          onClick: () => handleTabChange('discussions'),
          isActive: activeTab === 'discussions',
        },
        {
          label: 'Engagements',
          icon: Briefcase,
          onClick: () => handleTabChange('engagements'),
          isActive: activeTab === 'engagements',
        },
        {
          label: 'Quotations',
          icon: FileText,
          onClick: () => handleTabChange('quotations'),
          isActive: activeTab === 'quotations',
        },
        {
          label: 'Schedule',
          icon: Clock,
          href: '/expert/schedule',
        },
        {
          label: 'Notifications',
          icon: Bell,
          href: '/expert/notifications',
          badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Profile',
          icon: User,
          href: '/expert/profile',
        },
        {
          label: 'Compliance Onboarding',
          icon: FileText,
          href: '/expert/onboarding',
        },
        {
          label: 'Settings',
          icon: Settings,
          href: '/expert/settings',
        },
        {
          label: 'Help & Support',
          icon: HelpCircle,
          href: '/expert/help-support',
        },
      ],
    },
  ];

  // Filter discussions by status
  const scheduledDiscussions = discussions?.filter(d => d.status === 'open' || d.status === 'OPEN') || [];
  const completedDiscussions = discussions?.filter(d => d.status === 'closed' || d.status === 'CLOSED') || [];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview':
        return { title: 'Dashboard Overview', subtitle: 'Track your discussions, engagements, and earnings at a glance.' };
      case 'discussions':
        return {
          title: 'Discussions',
          subtitle: `Managing ${scheduledDiscussions.length} scheduled and ${completedDiscussions.length} completed discussions`
        };
      case 'engagements':
        return { title: 'Engagements', subtitle: 'Your active and completed engagements' };
      default:
        return { title: 'Dashboard', subtitle: '' };
    }
  };

  const pageInfo = getPageTitle();

  // Prepare activities for LatestUpdates
  const activities = discussions.slice(0, 5).map(d => ({
    id: d.id,
    type: 'discussion',
    title: (d.purpose ? (d.purpose.length > 20 ? d.purpose.substring(0, 20) + '...' : d.purpose) : 'Discussion'),
    subtitle: `${d.seekerName || 'Seeker'} • ${d.status}`,
    date: d.scheduledDate || d.createdAt,
  }));

  const financials = {
    held: stats?.totalPending || 0,
    released: stats?.totalEarned || 0
  };

  // Profile Health Data
  const calculateProfileCompletion = (): number => {
    if (!profile) return 0;
    let completedFields = 0;
    const totalFields = 8; // Adjust based on required fields

    if (profile.displayName) completedFields++;
    if (profile.bio) completedFields++;
    if (profile.categories && profile.categories.length > 0) completedFields++;
    if (profile.location) completedFields++;
    if (profile.profileImageUrl) completedFields++;
    if (profile.portfolioUrls && profile.portfolioUrls.length > 0) completedFields++;
    if (profile.certifications && profile.certifications.length > 0) completedFields++;
    if (profile.timezone) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  const getVisibilityStatus = (): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    if (!profile) return { label: 'Unknown', variant: 'outline' };

    if (profile.profileStatus === 'verified' && profile.isActive) {
      return { label: 'Active', variant: 'default' };
    }
    if (profile.profileStatus === 'submitted_for_verification') {
      return { label: 'Under Review', variant: 'secondary' };
    }
    if (profile.profileStatus === 'rejected') {
      return { label: 'Rejected', variant: 'destructive' };
    }
    if (!profile.isActive) {
      return { label: 'On Hold', variant: 'outline' };
    }
    return { label: 'Draft', variant: 'outline' };
  };

  const visibilityStatus = getVisibilityStatus();

  /** Must run AFTER all hooks: early return above used to violate Rules of Hooks and blank the dashboard. */
  if (user?.role === 'expert_candidate') {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Redirecting you to finish registration…
        </p>
      </div>
    );
  }

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'Expert User',
        role: 'Marketing Expert',
      }}
      sections={sidebarSections}
      onSignOut={() => {
        logout();
        navigate('/login');
      }}
      headerTitle="Dashboard"
    >
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        {/* Header - Matching screenshot */}
        <div className="mb-6 sm:mb-8 md:mb-12 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#111926]">{pageInfo.title}</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-[#6B7280]">{pageInfo.subtitle}</p>
          </div>

          {/* Contextual Payout Status Banner */}
          <ContextualPayoutBanner
            trustStatus={profile?.trustCompliance?.trustStatus || profile?.trustStatus || 'pending'}
            onNavigateToCompliance={() => navigate('/expert/onboarding')}
            className="mb-6"
          />
        </div>

        {/* Global Document Request Alert */}
        {user?.documentsRequested && (
          <div className="mb-8 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg shadow-sm flex items-start gap-4">
            <div className="mt-1 flex-shrink-0">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-800">Action Required: Document Update Needed</h3>
              <p className="mt-1 text-orange-700 whitespace-pre-line">
                {user.documentsRequestedReason || "Our team needs some additional documents or information to verify your account."}
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => navigate('/expert/update-documents')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 px-6"
                >
                  Update Documents Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Header Snapshot — At A Glance */}
            <ExpertHeaderSnapshot stats={stats} isLoading={!stats} />



            {/* Main Content Split */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">

              {/* Left Column: Upcoming Actions & Discussions (2 cols width) */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Quick Actions */}
                <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateQuoteDialog(true)}
                        className="h-auto py-4 px-4 gap-3 bg-white border-[#E5E7EB] rounded-xl hover:bg-gray-50 shadow-sm flex-col sm:flex-row"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg shrink-0">
                          <FileText className="h-5 w-5 text-[#0EA5E9]" />
                        </div>
                        <div className="text-left sm:text-center">
                          <div className="font-semibold text-sm text-[#111926]">Create Quote</div>
                          <div className="text-xs text-[#6B7280] hidden sm:block">New quotation</div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => navigate('/expert/schedule')}
                        className="h-auto py-4 px-4 gap-3 bg-white border-[#E5E7EB] rounded-xl hover:bg-gray-50 shadow-sm flex-col sm:flex-row"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg shrink-0">
                          <Calendar className="h-5 w-5 text-[#0EA5E9]" />
                        </div>
                        <div className="text-left sm:text-center">
                          <div className="font-semibold text-sm text-[#111926]">Schedule</div>
                          <div className="text-xs text-[#6B7280] hidden sm:block">Manage availability</div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => navigate('/expert/profile')}
                        className="h-auto py-4 px-4 gap-3 bg-white border-[#E5E7EB] rounded-xl hover:bg-gray-50 shadow-sm flex-col sm:flex-row"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg shrink-0">
                          <User className="h-5 w-5 text-[#0EA5E9]" />
                        </div>
                        <div className="text-left sm:text-center">
                          <div className="font-semibold text-sm text-[#111926]">Profile</div>
                          <div className="text-xs text-[#6B7280] hidden sm:block">Edit profile</div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Discussions */}
                <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight">Upcoming Discussions</h2>
                        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Your scheduled meetings with businesses</p>
                      </div>
                      {scheduledDiscussions.length > 0 && (
                        <Badge variant="secondary" className="bg-[#F3F4F6] text-[#111926] shrink-0">
                          {scheduledDiscussions.length}
                        </Badge>
                      )}
                    </div>

                    {scheduledDiscussions.length === 0 ? (
                      <div className="p-12 text-center bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl">
                        <Video className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
                        <p className="text-[#6B7280] font-medium mb-1">No upcoming discussions</p>
                        <p className="text-sm text-[#9CA3AF]">Discussions will appear here when scheduled</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {scheduledDiscussions.map((d) => (
                          <div
                            key={d.id}
                            className="group p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#0EA5E9] hover:shadow-md transition-all"
                          >
                            <div className="flex items-start gap-3 sm:gap-4">
                              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] shrink-0">
                                <Video className="h-5 w-5 sm:h-6 sm:w-6 text-[#0EA5E9]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-sm sm:text-base text-[#111926] mb-1 truncate">{d.purpose || "Discussion"}</h3>
                                    <p className="text-xs sm:text-sm text-[#6B7280] line-clamp-2">{d.agenda || "No agenda provided"}</p>
                                  </div>
                                  <Badge variant="secondary" className="bg-[#F3F4F6] text-[#111926] shrink-0 text-xs">
                                    {d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—'}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#6B7280] mb-3">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
                                  </span>
                                  {d.scheduledTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" />
                                      {d.scheduledTime}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" />
                                    {d.seekerName || "Business"}
                                  </span>
                                </div>
                                <Button
                                  onClick={() => navigate(`/meeting/${d.id}`)}
                                  className="w-full sm:w-auto bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  {d.meetingJoinedAt || d.attendanceStatus === 'in_progress' ? 'Rejoin Discussion' : 'Join Meeting'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Quotations */}
                <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm mt-6">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight">Recent Quotations</h2>
                        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Status of your project proposals</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleTabChange('quotations')}
                        className="text-[#0EA5E9] hover:text-[#0284C7] hover:bg-blue-50 text-xs"
                      >
                        View All
                      </Button>
                    </div>

                    {quotations.length === 0 ? (
                      <div className="p-12 text-center bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl">
                        <FileText className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
                        <p className="text-[#6B7280] font-medium mb-1">No quotations sent yet</p>
                        <p className="text-sm text-[#9CA3AF]">Create a quote after your next discussion</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {quotations.slice(0, 3).map((q: ExpertQuotation) => (
                          <div
                            key={q.id}
                            className="p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#0EA5E9] transition-all flex items-center justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[10px] font-bold text-[#0EA5E9] uppercase">{q.referenceId}</span>
                                <Badge variant="outline" className="text-[10px] h-4 capitalize">{q.status}</Badge>
                              </div>
                              <h3 className="font-semibold text-sm text-[#111926] truncate">{q.seekerName}</h3>
                              <p className="text-xs text-[#6B7280]">{formatCurrency(q.totalAmount)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/expert/quotations/${q.id}`)}
                              className="h-8 w-8 p-0"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Profile Health (on top for prominent Expert ID) & Latest Updates (1 col width) */}
              <div className="space-y-6">
                {/* Profile Health */}
                <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-[#111926] tracking-tight">My Profile</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/expert/profile')}
                        className="gap-2 h-8"
                      >
                        <User className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Expert ID</span>
                        <Badge variant="outline" className="text-[10px] h-4 bg-blue-50 text-blue-600 border-blue-100">Official</Badge>
                      </div>
                      <div 
                        onClick={() => {
                          const id = profile?.expertId || user?.expertId || 'MTA-EXP-PENDING';
                          navigator.clipboard.writeText(id);
                          toast.success('Expert ID copied to clipboard');
                        }}
                        className="text-sm font-mono font-bold text-[#111926] bg-[#F9FAFB] p-2.5 rounded-lg border border-[#E5E7EB] cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between group"
                      >
                        <span>{profile?.expertId || user?.expertId || 'MTA-EXP-PENDING'}</span>
                        <Copy className="h-3.5 w-3.5 text-[#0EA5E9] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Profile Completion */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-[#4B5563]">Profile Completeness</span>
                          <span className="text-lg font-bold text-[#111926]">{profileCompletion}%</span>
                        </div>
                        <div className="h-3 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#A855F7] to-[#9333EA] transition-all duration-500"
                            style={{ width: `${profileCompletion}%` }}
                          />
                        </div>
                        {profileCompletion < 100 && (
                          <p className="text-xs text-[#6B7280]">
                            Complete your profile to increase visibility
                          </p>
                        )}
                      </div>

                      <div className="h-px bg-[#E5E7EB]" />

                      {/* Visibility Status */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-[#4B5563]">Visibility Status</span>
                          <Badge variant={visibilityStatus.variant} className="text-xs font-medium">
                            {visibilityStatus.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#6B7280] leading-relaxed">
                          {visibilityStatus.label === 'Active'
                            ? 'Your profile is visible to businesses and you can receive discussion requests.'
                            : visibilityStatus.label === 'Under Review'
                              ? 'Your profile is being reviewed by our admin team. This usually takes 1-2 business days.'
                              : visibilityStatus.label === 'Rejected'
                                ? 'Your profile was rejected. Please contact support for details and next steps.'
                                : 'Your profile is not currently visible to businesses.'}
                        </p>
                      </div>

                      {/* Approved Service Categories */}
                      {profile?.categories && profile.categories.length > 0 && (
                        <>
                          <div className="h-px bg-[#E5E7EB]" />
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-[#4B5563]">
                              Approved Service Categories
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {profile.categories.map((category, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-[#F9FAFB] border-[#E5E7EB] text-[#111926]"
                                >
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Preview Profile Link */}
                      <div className="pt-4 border-t border-[#E5E7EB]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const rawName = profile?.displayName || profile?.businessName || user?.name || '';
                            const slug = rawName ? rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';
                            const targetId = slug || profile?.slug || profile?.id || user?.id;
                            const previewUrl = window.location.hostname.includes('martechadda.com')
                              ? `https://martechadda.com/experts/${targetId}`
                              : `https://martechadda.com/experts/${targetId}`;
                            window.open(previewUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="w-full gap-2 h-10 text-sm"
                        >
                          <User className="h-4 w-4 shrink-0" />
                          <span className="truncate">Preview Public Profile</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Latest Updates & Deposit Summary */}
                <LatestUpdates activities={activities} financials={financials} />
              </div>

            </div>
          </>
        )}

        {activeTab === 'discussions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50/50 border border-slate-100 p-4 rounded-xl">
              <div>
                <h2 className="font-bold text-[#111926] text-lg">Your Discussions</h2>
                <p className="text-xs text-muted-foreground">Manage your scheduled meetings and alignment calls</p>
              </div>
              <Button 
                onClick={() => navigate('/expert/schedule')}
                className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold h-10 px-5 rounded-xl flex items-center gap-2 self-start sm:self-auto"
              >
                <Calendar className="h-4 w-4" />
                Manage Schedule
              </Button>
            </div>

            {discussionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : discussions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">No discussions yet</h3>
                <p className="text-sm text-muted-foreground">
                  Discussions will appear here when seekers schedule meetings with you
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <div key={discussion.id} className="rounded-xl border border-border bg-card p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-secondary">
                          <Video className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="font-semibold capitalize">{discussion.purpose?.replace(/_/g, ' ')}</h3>
                            {(() => {
                              const normStatus = discussion.status?.toLowerCase();
                              let badgeClass = 'bg-muted text-muted-foreground';
                              let badgeLabel = discussion.status;

                              if (normStatus === 'pending') {
                                badgeClass = 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100';
                                const isExpertInitiated = discussion.scheduledBy ? discussion.scheduledBy === user?.id : false;
                                badgeLabel = isExpertInitiated ? 'Awaiting Seeker Response' : 'Pending Action';
                              } else if (normStatus === 'rescheduled') {
                                badgeClass = 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100';
                                badgeLabel = 'Rescheduled';
                              } else if (normStatus === 'accepted' || normStatus === 'open') {
                                badgeClass = 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
                                badgeLabel = 'Scheduled';
                              } else if (normStatus === 'completed' || normStatus === 'closed') {
                                badgeClass = 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
                                badgeLabel = 'Completed';
                              } else if (normStatus === 'declined') {
                                badgeClass = 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
                                badgeLabel = 'Declined';
                              } else if (normStatus === 'cancelled') {
                                badgeClass = 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
                                badgeLabel = 'Cancelled';
                              } else if (normStatus === 'expired') {
                                badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
                                badgeLabel = 'Expired';
                              }

                              return (
                                <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
                                  {badgeLabel}
                                </Badge>
                              );
                            })()}
                            {discussion.quotationStatus && (
                              <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                discussion.quotationStatus === 'accepted'
                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50'
                                  : discussion.quotationStatus === 'revision_requested'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
                                    : discussion.quotationStatus === 'sent'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50'
                                      : discussion.quotationStatus === 'rejected' || discussion.quotationStatus === 'declined'
                                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50'
                              }`}>
                                Quotation: {formatStatusLabel(discussion.quotationStatus)}
                              </Badge>
                            )}
                          </div>
                          <p className="mb-3 text-sm text-muted-foreground">{discussion.agenda}</p>

                          {discussion.quotationRequestedAt && (
                            <div className="mb-3">
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
                                <FileText className="h-3 w-3 mr-1" />
                                Quotation Requested {new Date(discussion.quotationRequestedAt).toLocaleDateString()}
                              </Badge>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <User className="h-4 w-4 shrink-0" />
                              {discussion.seekerName || 'Business Owner'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 shrink-0" />
                              {discussion.scheduledDate ? new Date(discussion.scheduledDate).toLocaleDateString('en-IN') : '—'}
                            </span>
                            {discussion.scheduledTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4 shrink-0" />
                                {discussion.scheduledTime}
                              </span>
                            )}
                            {discussion.referenceId && (
                              <span className="font-mono text-xs text-[#0EA5E9] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {discussion.referenceId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-center justify-end sm:justify-start">
                        {/* Pending / Rescheduled Status */}
                        {(() => {
                          const statusLower = discussion.status?.toLowerCase();
                          const isExpertInitiated = discussion.scheduledBy ? discussion.scheduledBy === user?.id : false;
                          const canExpertAcceptOrDecline = (
                            (statusLower === 'pending' && !isExpertInitiated) ||
                            (statusLower === 'rescheduled' && discussion.expertResponse?.action !== 'rescheduled')
                          );
                          const isPendingSentByExpert = statusLower === 'pending' && isExpertInitiated;

                          if (canExpertAcceptOrDecline) {
                            return (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => acceptDiscussionMutation.mutate(discussion.id)}
                                  disabled={acceptDiscussionMutation.isPending}
                                  className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Accept Request
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeclineDiscussionTarget(discussion)}
                                  disabled={declineDiscussionMutation.isPending}
                                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Decline
                                </Button>
                              </>
                            );
                          }

                          if (isPendingSentByExpert) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCancelDiscussionTarget(discussion)}
                                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Cancel Request
                              </Button>
                            );
                          }

                          return null;
                        })()}
                        {/* Accepted / Open Status */}
                        {(discussion.status?.toLowerCase() === 'accepted' || discussion.status?.toLowerCase() === 'open') && (
                          <>
                            <Button size="sm" className="gap-2" asChild>
                              <Link to={`/meeting/${discussion.id}`}>
                                <Video className="h-4 w-4" />
                                {discussion.meetingJoinedAt || discussion.attendanceStatus === 'in_progress' ? 'Rejoin Discussion' : 'Join Call'}
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCancelDiscussionTarget(discussion)}
                              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel Call
                            </Button>
                          </>
                        )}
                        {/* Completed / Closed / Declined / Cancelled / Expired Status */}
                        {(discussion.status?.toLowerCase() === 'completed' || discussion.status?.toLowerCase() === 'closed') && (
                          <>
                            {(() => {
                              const qStatus = discussion.quotationStatus;
                              if (discussion.purpose === 'requirement_discussion' && (!qStatus || qStatus === 'draft')) {
                                return (
                                  <Button size="sm" className="gap-2" asChild>
                                    <Link to={`/expert/quotation/create?discussion=${discussion.id}`}>
                                      <Send className="h-4 w-4" />
                                      Create Quotation
                                    </Link>
                                  </Button>
                                );
                              }
                              if (qStatus === 'accepted' || qStatus === 'revision_requested') {
                                return (
                                  <Button
                                    size="sm"
                                    onClick={() => setScheduleClarificationTarget(discussion)}
                                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                  >
                                    <Calendar className="h-4 w-4" />
                                    Schedule Clarification
                                  </Button>
                                );
                              }
                              if (qStatus === 'sent') {
                                return (
                                  <Button size="sm" variant="secondary" className="gap-2 cursor-not-allowed" disabled>
                                    <Clock className="h-4 w-4" />
                                    Awaiting Seeker Response
                                  </Button>
                                );
                              }
                              if (qStatus === 'rejected' || qStatus === 'declined') {
                                return (
                                  <Button size="sm" variant="secondary" className="gap-2 cursor-not-allowed text-red-600 border border-red-200" disabled>
                                    <XCircle className="h-4 w-4" />
                                    Quotation Rejected
                                  </Button>
                                );
                              }
                              if (qStatus === 'expired') {
                                return (
                                  <Button size="sm" variant="secondary" className="gap-2 cursor-not-allowed" disabled>
                                    <XCircle className="h-4 w-4" />
                                    Quotation Expired
                                  </Button>
                                );
                              }
                              return (
                                <Button size="sm" variant="secondary" className="gap-2 cursor-not-allowed" disabled>
                                  <Lock className="h-4 w-4" />
                                  Quotation Accepted
                                </Button>
                              );
                            })()}
                            <Button
                              size="sm"
                              onClick={() => {
                                setSchedulePurpose('clarification');
                                const linkedQ = quotations.find(q => q.discussionId === discussion.id || q.seekerName === discussion.seekerName);
                                if (linkedQ) setScheduleSelectedQuotationId(linkedQ.id || linkedQ._id || '');
                                setShowScheduleDialog(true);
                              }}
                              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white gap-2 font-medium"
                            >
                              <Calendar className="h-4 w-4" />
                              Schedule Call
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => archiveDiscussionMutation.mutate(discussion.id)}
                              disabled={archiveDiscussionMutation.isPending}
                              className="gap-2"
                            >
                              <Archive className="h-4 w-4" />
                              Archive
                            </Button>
                          </>
                        )}
                        {/* Other terminal statuses like declined/cancelled/expired only show Archive */}
                        {['declined', 'cancelled', 'expired'].includes(discussion.status?.toLowerCase()) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => archiveDiscussionMutation.mutate(discussion.id)}
                            disabled={archiveDiscussionMutation.isPending}
                            className="gap-2"
                          >
                            <Archive className="h-4 w-4" />
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
        }

        {activeTab === 'engagements' && (
          <div className="space-y-6">
            {engagementsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : activeEngagementsForList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-slate-800">No active engagements</h3>
                <p className="text-sm text-muted-foreground">
                  Engagements will appear here after the seeker completes the deposit payment.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeEngagementsForList.map((engagement) => {
                  const isExpanded = expandedEngagements.has(engagement.id);

                  return (
                    <div key={engagement.id} className="overflow-hidden rounded-xl border border-border bg-card">
                      <div
                        className="cursor-pointer border-b border-border bg-secondary/50 p-6 transition-colors hover:bg-secondary/70"
                        onClick={() => toggleEngagement(engagement.id)}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background">
                              <Briefcase className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="mb-1 flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{engagement.seekerName}</h3>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${engagement.status.toLowerCase() === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : engagement.status.toLowerCase() === 'pending_deposit'
                                    ? 'bg-orange-100 text-orange-700'
                                    : engagement.status.toLowerCase() === 'completed'
                                      ? 'bg-gray-100 text-gray-700'
                                      : 'bg-primary text-primary-foreground'
                                  }`}>
                                  {formatStatusLabel(engagement.status)}
                                </span>
                                {engagement.depositStatus && (
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${engagement.depositStatus === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : engagement.depositStatus === 'pending'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    Deposit {engagement.depositStatus === 'paid' ? 'Paid' : engagement.depositStatus === 'pending' ? 'Pending' : 'Not Paid'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                                <span>{engagement.serviceCategory || 'Marketing'}</span>
                                {engagement.referenceId && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="font-mono text-xs break-all text-[#A855F7]">{engagement.referenceId}</span>
                                  </>
                                )}
                                <span className="hidden sm:inline">•</span>
                                <span>Started {new Date(engagement.startedAt).toLocaleDateString('en-IN')}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{engagement.progressPercentage || 0}% Complete</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            <div className="text-left sm:text-right">
                              <p className="text-base sm:text-lg font-bold">{formatCurrency(engagement.totalProjectAmount || engagement.totalDeposit)}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">Total Value</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEngagement(engagement.id);
                              }}
                              className="w-full sm:w-auto"
                            >
                              {isExpanded ? 'Hide Details' : 'View Details'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-6">
                          {/* Earnings Summary */}
                          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-lg border border-border p-4 text-center">
                              <p className="text-lg font-bold">{formatCurrency(engagement.releasedAmount)}</p>
                              <p className="text-sm text-muted-foreground">Released</p>
                            </div>
                            <div className="rounded-lg border border-border p-4 text-center">
                              <p className="text-lg font-bold">{formatCurrency(engagement.heldAmount)}</p>
                              <p className="text-sm text-muted-foreground">Awaiting Release</p>
                            </div>
                            <div className="rounded-lg border border-border p-4 text-center">
                              <p className="text-lg font-bold">
                                {engagement.progressPercentage || 0}%
                              </p>
                              <p className="text-sm text-muted-foreground">Progress</p>
                            </div>
                          </div>

                          {/* Milestones */}
                          <h4 className="mb-4 font-semibold">Milestones</h4>
                          <div className="space-y-3">
                            {engagement.milestones.map((milestone, index) => (
                              <div
                                key={milestone.id}
                                className={`rounded-lg border p-4 ${milestone.status === 'pending' &&
                                  index === engagement.milestones.findIndex(m => m.status === 'pending')
                                  ? 'border-border bg-secondary/50'
                                  : 'border-border/50'
                                  }`}
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${milestone.status === 'approved'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'border border-border bg-background'
                                        }`}
                                    >
                                      {milestone.status === 'approved' ? (
                                        <CheckCircle className="h-4 w-4" />
                                      ) : (
                                        milestone.milestoneNumber
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium">{milestone.title}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {milestone.percentage}% • {formatCurrency(milestone.amount)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${milestone.status === 'approved'
                                        ? 'bg-primary text-primary-foreground'
                                        : milestone.status === 'submitted'
                                          ? 'bg-secondary text-foreground'
                                          : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                      {milestone.status}
                                    </span>
                                    <div className="flex flex-col items-end gap-1">
                                      {milestone.status === 'pending' && (
                                        <div className="flex flex-col items-end gap-1">
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedMilestone({
                                                title: milestone.title,
                                                milestoneNumber: milestone.milestoneNumber,
                                                engagementId: engagement.id,
                                              });
                                            }}
                                            disabled={!engagement.hasPaidDeposit}
                                            className="h-8"
                                          >
                                            Submit
                                          </Button>
                                          {!engagement.hasPaidDeposit && (
                                            <span className="text-[10px] text-orange-600 font-medium">
                                              Waiting for deposit
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Engagement Actions */}
                          <div className="mt-6 flex flex-col sm:flex-row gap-2">
                            {engagement.status === 'pending_compliance' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => completeComplianceMutation.mutate(engagement.id)}
                                disabled={completeComplianceMutation.isPending}
                              >
                                {completeComplianceMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  'Complete Compliance'
                                )}
                              </Button>
                            )}
                            {engagement.status === 'active' && (engagement.progressPercentage || 0) === 100 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => completeEngagementMutation.mutate(engagement.id)}
                                disabled={completeEngagementMutation.isPending}
                              >
                                {completeEngagementMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  'Complete Engagement'
                                )}
                              </Button>
                            )}
                            {engagement.status === 'completed' && (
                              <div className="mt-4">
                                <FeedbackPrompt engagementId={engagement.id} />
                              </div>
                            )}
                            {engagement.status === 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => closeEngagementMutation.mutate(engagement.id)}
                                disabled={closeEngagementMutation.isPending}
                              >
                                {closeEngagementMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  'Close Engagement'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'quotations' && (
          <ExpertQuotationsPanel
            quotations={quotations}
            isLoading={quotationsLoading}
            onCreateNew={() => setShowCreateQuoteDialog(true)}
            formatCurrency={formatCurrency}
          />
        )}
      </div>

      {/* Milestone Submission Dialog */}
      <Dialog open={!!selectedMilestone} onOpenChange={(open) => !open && setSelectedMilestone(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Milestone</DialogTitle>
            <DialogDescription>
              Submit milestone "{selectedMilestone?.title}" for approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="submissionContent">Submission Content *</Label>
              <Textarea
                id="submissionContent"
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Describe what was delivered in this milestone..."
                rows={6}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Provide a detailed description of the work completed
              </p>
            </div>
            {/* Supporting File Attachments (Invoice, deliverables, reports, all formats) */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-semibold text-slate-800">
                  Supporting Attachments & Invoice
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Attach invoices, deliverables, work reports, designs, spreadsheets, or any relevant files supporting this milestone approval request (up to 10 MB per file).
                </p>
              </div>

              {/* Attach File Button & Dropzone */}
              <button
                type="button"
                disabled={submitMilestoneMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 rounded-xl py-5 px-4 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Paperclip className="h-6 w-6 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">📎 Attach Files / Invoice</span>
                <span className="text-xs text-muted-foreground">Click to browse (PDF, Invoices, Word, Excel, Images, ZIP, and all format types)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={submitMilestoneMutation.isPending}
              />

              {/* Attached Files List */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs font-medium text-slate-800 truncate max-w-[280px]">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          ({file.size / 1024 < 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(2)} MB`})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachedFile(idx)}
                        disabled={submitMilestoneMutation.isPending}
                        className="text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-2"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Divider for Links */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Or provide file links (URLs)</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>

              {/* URL Inputs */}
              <div className="space-y-2">
                {submissionFiles.map((file, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={file}
                      onChange={(e) => {
                        const newFiles = [...submissionFiles];
                        newFiles[index] = e.target.value;
                        setSubmissionFiles(newFiles);
                      }}
                      placeholder="https://example.com/file.pdf"
                      disabled={submitMilestoneMutation.isPending}
                    />
                    {submissionFiles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSubmissionFiles(submissionFiles.filter((_, i) => i !== index));
                        }}
                        disabled={submitMilestoneMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmissionFiles([...submissionFiles, ''])}
                  disabled={submitMilestoneMutation.isPending}
                  className="text-xs"
                >
                  Add Another URL
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMilestone(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={submitMilestoneMutation.isPending || !submissionContent.trim()}
            >
              {submitMilestoneMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Milestone'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quote Context Dialog */}
      <Dialog open={showCreateQuoteDialog} onOpenChange={setShowCreateQuoteDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select context for new quotation</DialogTitle>
            <DialogDescription>
              Choose a recent discussion as the basis for your quotation. This keeps everything tied to a clear client conversation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Recent Discussions */}
            <div>
               <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#111926]">Recent Discussions</h3>
                <span className="text-xs text-muted-foreground">
                  Showing latest {Math.min(discussions.filter((d: ExpertDiscussion) => d.purpose === 'requirement_discussion' && d.status?.toLowerCase() === 'completed').length, 5)}
                </span>
              </div>
              {discussions.filter((d: ExpertDiscussion) => d.purpose === 'requirement_discussion' && d.status?.toLowerCase() === 'completed').length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No completed Requirement Discussions found yet. Once seekers schedule a Requirement Discussion call with you and it is completed, it will appear here for quotation creation.
                </p>
              ) : (
                <div className="space-y-2">
                  {discussions
                    .filter((d: ExpertDiscussion) => d.purpose === 'requirement_discussion' && d.status?.toLowerCase() === 'completed')
                    .slice(0, 5)
                    .map((d: ExpertDiscussion) => (
                      <div
                        key={d.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#111926] truncate">
                            {d.purpose || 'Discussion'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {d.seekerName} • {new Date(d.scheduledDate || d.createdAt).toLocaleDateString('en-IN')}{d.scheduledTime ? ` at ${d.scheduledTime}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setShowCreateQuoteDialog(false);
                            navigate(`/expert/quotation/create?discussion=${d.id}`);
                          }}
                        >
                          Use for Quote
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Recent Engagements (informational) */}
            {engagements.length > 0 && (
              <div className="pt-2 border-t">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#111926]">Recent Engagements</h3>
                  <span className="text-xs text-muted-foreground">
                    Latest {Math.min(engagements.length, 3)}
                  </span>
                </div>
                <div className="space-y-2">
                  {engagements.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-dashed border-border/60 bg-muted/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#111926] truncate">
                          {e.seekerName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Status: {formatStatusLabel(e.status)} • Started{' '}
                          {new Date(e.startedAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setShowCreateQuoteDialog(false);
                          navigate(`/expert/engagements/${e.id}`);
                        }}
                      >
                        View Engagement
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Clarification Dialog */}
      <Dialog open={!!scheduleClarificationTarget} onOpenChange={(open) => { if (!open) setScheduleClarificationTarget(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Clarification Discussion</DialogTitle>
            <DialogDescription>
              Schedule a clarification discussion with {scheduleClarificationTarget?.seekerName || 'Business Owner'} to align on scope, deliverables, or revision requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-800 text-sm">Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-xl border-[#E5E7EB] bg-white shadow-sm h-10 text-sm hover:bg-slate-50",
                      !clarificationDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                    {clarificationDate ? format(new Date(`${clarificationDate}T00:00:00`), "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-white" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={clarificationDate ? new Date(`${clarificationDate}T00:00:00`) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setClarificationDate(`${year}-${month}-${day}`);
                        setClarificationTime('');
                      } else {
                        setClarificationDate('');
                        setClarificationTime('');
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const maxDate = new Date();
                      maxDate.setDate(maxDate.getDate() + 30);
                      maxDate.setHours(23, 59, 59, 999);
                      if (date < today || date > maxDate) return true;
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      return expertScheduling ? !isDateAvailableForExpert(expertScheduling, dateStr) : false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-slate-800 text-sm">Scheduled Time (IST)</Label>
              <Select
                value={clarificationTime}
                onValueChange={setClarificationTime}
                disabled={!clarificationDate || clarificationSlots.length === 0}
              >
                <SelectTrigger className="w-full rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm">
                  <SelectValue placeholder={!clarificationDate ? "Select a date first" : clarificationSlots.length === 0 ? "❌ No slots available today. Please select tomorrow." : "Select a time slot"} />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  {clarificationSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clarificationDate && clarificationSlots.length === 0 && (
                <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                  ❌ No slots available today. Please select tomorrow.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clarification-agenda" className="font-semibold text-slate-800 text-sm">Agenda (Max 300 characters)</Label>
              <Textarea
                id="clarification-agenda"
                placeholder="Describe what needs to be discussed (e.g., align on milestones, clarify requirements...)"
                value={clarificationAgenda}
                onChange={(e) => setClarificationAgenda(e.target.value)}
                maxLength={300}
                rows={4}
                className="rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm placeholder:text-muted-foreground"
              />
              <p className="text-right text-xs text-muted-foreground">
                {clarificationAgenda.length}/300 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleClarificationTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleClarification}
              disabled={
                isSchedulingClarification ||
                !clarificationDate ||
                !clarificationTime ||
                !clarificationAgenda.trim()
              }
            >
              {isSchedulingClarification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Discussion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Discussion Dialog */}
      <Dialog open={!!declineDiscussionTarget} onOpenChange={(open) => { if (!open) { setDeclineDiscussionTarget(null); setDeclineReason(''); } }}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 border-[#E5E7EB] bg-white shadow-lg animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-[#111926] flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Decline Discussion Request
            </DialogTitle>
            <DialogDescription className="text-sm text-[#6B7280]">
              You are about to decline the discussion request with {declineDiscussionTarget?.seekerName || 'Business Owner'}. Please provide a reason to help them understand why.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="decline-reason" className="font-semibold text-slate-800 text-sm">
                Reason for declining (optional)
              </Label>
              <Textarea
                id="decline-reason"
                placeholder="Enter reason for declining..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                maxLength={300}
                rows={4}
                className="rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-red-300 focus:ring-red-100 transition-all text-sm placeholder:text-muted-foreground"
              />
              <p className="text-right text-xs text-muted-foreground">
                {declineReason.length}/300 characters
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2.5 pt-2">
            <Button 
              variant="outline" 
              onClick={() => { setDeclineDiscussionTarget(null); setDeclineReason(''); }}
              className="rounded-xl font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-800 h-10"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (declineDiscussionTarget) {
                  declineDiscussionMutation.mutate({ 
                    discussionId: declineDiscussionTarget.id, 
                    reason: declineReason.trim() || undefined 
                  });
                  setDeclineDiscussionTarget(null);
                  setDeclineReason('');
                }
              }} 
              disabled={declineDiscussionMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-5 rounded-xl shadow-sm border border-red-700/10"
            >
              {declineDiscussionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Calendar className="h-5 w-5 text-[#0EA5E9]" />
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
                      {quotations.map((q: ExpertQuotation) => {
                        const itemVal = q.id || q._id || '';
                        return (
                          <SelectItem key={itemVal} value={itemVal}>
                            {q.seekerName || 'Business Owner'} - {q.title || 'Quotation'} ({formatStatusLabel(q.status)})
                          </SelectItem>
                        );
                      })}
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
                      {engagements.filter((e: ExpertEngagement) => e.status === 'active').map((e: ExpertEngagement) => {
                        const itemVal = e.id || e._id || '';
                        return (
                          <SelectItem key={itemVal} value={itemVal}>
                            {e.seekerName || 'Business Owner'} - {e.serviceCategory || 'Project'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-800 text-sm">Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-xl border-[#E5E7EB] bg-white shadow-sm h-10 text-sm hover:bg-slate-50",
                      !scheduleDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                    {scheduleDate ? format(new Date(`${scheduleDate}T00:00:00`), "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-white" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={scheduleDate ? new Date(`${scheduleDate}T00:00:00`) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setScheduleDate(`${year}-${month}-${day}`);
                        setScheduleTime('');
                      } else {
                        setScheduleDate('');
                        setScheduleTime('');
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const maxDate = new Date();
                      maxDate.setDate(maxDate.getDate() + 30);
                      maxDate.setHours(23, 59, 59, 999);
                      if (date < today || date > maxDate) return true;
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      return expertScheduling ? !isDateAvailableForExpert(expertScheduling, dateStr) : false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-800 text-sm">Scheduled Time (IST)</Label>
              <Select 
                value={scheduleTime} 
                onValueChange={setScheduleTime}
                disabled={!scheduleDate || activeSlots.length === 0}
              >
                <SelectTrigger className="w-full rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm">
                  <SelectValue placeholder={!scheduleDate ? 'Select a date first' : activeSlots.length === 0 ? '❌ No slots available today. Please select tomorrow.' : 'Select a time slot'} />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  {activeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {scheduleDate && activeSlots.length === 0 && (
                <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                  ❌ No slots available today. Please select tomorrow.
                </p>
              )}
            </div>

            {/* Agenda */}
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
                setSchedulePurpose('alignment');
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
                !scheduleDate ||
                !scheduleTime ||
                !scheduleAgenda.trim() ||
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

      {/* Cancel Discussion Call Modal Dialog */}
      <Dialog open={!!cancelDiscussionTarget} onOpenChange={(open) => { if (!open) { setCancelDiscussionTarget(null); setCancelReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Cancel Discussion Call
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm">
              Please provide a reason for cancelling this discussion call with {cancelDiscussionTarget?.seekerName || 'the business owner'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="expert-cancel-reason" className="text-sm font-semibold">
                Reason for Cancellation / Rejection *
              </Label>
              <Textarea
                id="expert-cancel-reason"
                placeholder="e.g. Schedule conflict, emergency..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setCancelDiscussionTarget(null); setCancelReason(''); }}>
              Back
            </Button>
            <Button
              variant="destructive"
              disabled={!cancelReason.trim() || cancelDiscussionMutation.isPending}
              onClick={() => {
                if (cancelDiscussionTarget) {
                  cancelDiscussionMutation.mutate({
                    discussionId: cancelDiscussionTarget.id || cancelDiscussionTarget._id || '',
                    reason: cancelReason,
                  });
                }
              }}
            >
              {cancelDiscussionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppDashboardLayout>
  );
};

export default ExpertDashboard;
