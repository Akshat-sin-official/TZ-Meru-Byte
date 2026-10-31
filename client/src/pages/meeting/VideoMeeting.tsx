/**
 * VideoMeeting Page
 * 
 * Integrates Daily.co for real-time video meetings
 * 
 * Flow:
 * 1. Fetch discussion details
 * 2. Get meeting access from backend (verifies ownership)
 * 3. Render DailyMeeting component with secure room access
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/contexts/AuthContext';
import { seekerService, expertService, meetingService, type SeekerDiscussion, type ExpertDiscussion } from '@/services';
import { DailyMeeting } from '@/components/meeting/DailyMeeting';
import DiscussionChecklist from '@/components/discussion/DiscussionChecklist';
import { ExpertAlignmentForm } from '@/components/discussion/ExpertAlignmentForm';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Loader2, Shield } from 'lucide-react';

const VideoMeeting = () => {
  const { discussionId } = useParams<{ discussionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [duration, setDuration] = useState(0);
  const [hasLeft, setHasLeft] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [showCountdownWarning, setShowCountdownWarning] = useState(false);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onLeaveRef = useRef<(() => void) | null>(null);

  // Fetch discussion from backend
  const { data: discussion, isLoading: discussionLoading, error: discussionError } = useQuery<ExpertDiscussion | SeekerDiscussion>({
    queryKey: ['discussion', discussionId],
    queryFn: () => {
      if (!discussionId) {
        throw new Error('Discussion ID is required');
      }
      if (user?.role === 'expert') {
        return expertService.getDiscussion(discussionId);
      } else if (user?.role === 'seeker') {
        return seekerService.getDiscussion(discussionId);
      } else {
        throw new Error('Invalid user role for discussion access');
      }
    },
    enabled: !!discussionId && !!user && (user.role === 'expert' || user.role === 'seeker'),
    retry: 1, // Retry once on failure
    retryDelay: 1000,
  });

  // Fetch meeting access from backend (verifies ownership and generates room name)
  const { data: meetingAccess, isLoading: meetingLoading, error: meetingError } = useQuery({
    queryKey: ['meetingAccess', discussionId],
    queryFn: () => meetingService.getMeetingAccess(discussionId!),
    enabled: !!discussionId && !!user && !!discussion,
    retry: false, // Don't retry on 403 errors
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Track meeting duration
  useEffect(() => {
    if (!meetingAccess || hasLeft) {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      return;
    }

    // Start duration timer
    durationIntervalRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [meetingAccess, hasLeft]);

  // Countdown timer logic
  useEffect(() => {
    if (!discussion || !meetingAccess || hasLeft) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    const totalDurationMinutes = discussion.duration || 45;
    const totalDurationSeconds = totalDurationMinutes * 60;

    // Determine when to start countdown warning
    let countdownStartMinutes: number;
    if (discussion.purpose === 'requirement_discussion') {
      countdownStartMinutes = 15;
    } else {
      countdownStartMinutes = 10;
    }
    const countdownStartSeconds = countdownStartMinutes * 60;

    const updateCountdown = () => {
      const remaining = totalDurationSeconds - duration;
      if (remaining <= countdownStartSeconds && remaining > 0) {
        setCountdownSeconds(remaining);
        setShowCountdownWarning(true);
      } else {
        setCountdownSeconds(null);
        setShowCountdownWarning(false);
      }
    };

    // Initialize and start interval
    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [discussion, meetingAccess, duration, hasLeft]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle expert leaving - create engagement and complete discussion
  const handleExpertLeave = useCallback(async () => {
    if (!discussionId || user?.role !== 'expert') {
      return;
    }

    try {
      const response = await meetingService.endMeetingAndCreateEngagement(discussionId);
      if (response.requiresQuotation) {
        toast.info('Meeting ended. Please create a quotation to proceed with the engagement.');
      } else if (response.engagementId) {
        toast.success(`Engagement created! ID: ${response.engagementId}`);
      } else {
        toast.success('Meeting ended successfully.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to complete meeting';
      toast.error(`Failed to complete meeting: ${errorMessage}`);
    }
  }, [discussionId, user?.role]);

  const handleLeave = useCallback(async () => {
    if (hasLeft) {
      return; // Prevent multiple calls
    }

    setHasLeft(true);

    // Clear duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (user?.role === 'expert') {
      await handleExpertLeave();
      navigate('/expert/discussions');
    } else {
      toast.success('Meeting ended');
      navigate('/seeker/discussions');
    }
  }, [hasLeft, navigate, user?.role, handleExpertLeave]);

  // Store handleLeave in ref for DailyMeeting
  useEffect(() => {
    onLeaveRef.current = handleLeave;
  }, [handleLeave]);

  // Determine participant names based on user role
  const otherParticipantName = user?.role === 'expert'
    ? discussion?.seekerName || 'Seeker'
    : discussion?.expertName || 'Expert';

  // Loading state
  if (discussionLoading || meetingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9FB]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading meeting...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (discussionError || !discussion) {
    const errorMessage = discussionError instanceof Error
      ? discussionError.message
      : 'Discussion not found';

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9F9FB] p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">Discussion Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            {errorMessage.includes('403') || errorMessage.includes('authorized')
              ? 'You are not authorized to view this discussion.'
              : 'The discussion you\'re trying to access doesn\'t exist or you don\'t have permission to view it.'
            }
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Meeting access error (403 - unauthorized)
  if (meetingError) {
    const errorMessage = meetingError instanceof Error ? meetingError.message : 'Failed to access meeting';
    const isUnauthorized = errorMessage.includes('403') ||
      errorMessage.includes('authorized') ||
      errorMessage.includes('Unauthorized') ||
      (meetingError as any)?.response?.status === 403;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9F9FB] p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">
            {isUnauthorized ? 'Access Denied' : 'Meeting Access Error'}
          </h1>
          <p className="mb-6 text-muted-foreground">
            {isUnauthorized
              ? 'You are not authorized to access this meeting. Only the seeker and expert of this discussion can join.'
              : errorMessage
            }
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
            <Button onClick={() => window.location.reload()}>Rejoin Discussion</Button>
          </div>
        </div>
      </div>
    );
  }

  // No meeting access data
  if (!meetingAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9F9FB] p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">Meeting Access Error</h1>
          <p className="mb-6 text-muted-foreground">
            Failed to get meeting access. Please try again.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
            <Button onClick={() => window.location.reload()}>Rejoin Discussion</Button>
          </div>
        </div>
      </div>
    );
  }

  // Render Daily.co meeting - Full screen layout
  return (
    <div className="fixed inset-0 flex flex-col bg-background font-sans">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 shadow-sm">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeave}
            className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {user?.role === 'expert' ? 'End Meeting' : 'Leave'}
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              {discussion.purpose || 'Discussion Meeting'}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-xs text-muted-foreground">
                with {otherParticipantName}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Recording Disabled Indicator */}
          <div className="flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700">
            <Shield className="h-3.5 w-3.5" />
            <span>Not Recorded</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(duration)}
          </div>
        </div>
      </header>

      {/* Privacy Notice Banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
        <div className="flex items-center gap-2 text-xs text-blue-700">
          <Shield className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            <strong>Your privacy is protected:</strong> This meeting is not being recorded. All conversations are private and secure.
          </span>
        </div>
      </div>

      {/* Countdown Warning Banner */}
      {showCountdownWarning && countdownSeconds !== null && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold">
                Discussion ending in {formatDuration(countdownSeconds)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex bg-[#1e1e1e]">
        {/* Daily Meeting Container */}
        <div
          className="flex-1 overflow-hidden relative"
        >
          <DailyMeeting
            roomUrl={meetingAccess.roomUrl}
            token={meetingAccess.token}
            displayName={meetingAccess.displayName}
            onLeave={handleLeave}
            onExpertLeave={handleExpertLeave}
            userRole={user?.role as "seeker" | "expert" | "admin" | undefined}
            discussionId={discussionId}
          />
        </div>

        {/* Discussion Checklist Sidebar (Seeker Only) */}
        {user?.role === 'seeker' && discussionId && (
          <div className="w-80 border-l bg-white overflow-y-auto p-6 shadow-xl z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Discussion Points</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/seeker/discussions/${discussionId}`)}
                className="h-8 text-xs"
              >
                View Details
              </Button>
            </div>
            <DiscussionChecklist discussionId={discussionId} isSeeker={true} />
          </div>
        )}

        {/* Expert Alignment Sidebar (Expert Only - during requirement discussion) */}
        {user?.role === 'expert' && discussion?.purpose === 'requirement_discussion' && discussionId && (
          <div className="w-80 border-l bg-white overflow-y-auto p-6 shadow-xl z-10">
            <ExpertAlignmentForm discussionId={discussionId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoMeeting;
