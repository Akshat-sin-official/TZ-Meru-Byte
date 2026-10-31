import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { searchService } from '@/services/searchService';
import { seekerService } from '@/services/seekerService';
import { expertService } from '@/services/expertService';
import {
  getAvailableDayLabels,
  getAvailableTimeSlots,
  isDateAvailableForExpert,
  filterConflictingTimeSlots,
  getCurrentISTDate,
  getCurrentISTMinutes,
  normalizeDateString,
  type ExpertSchedulingProfile,
} from '@/utils/schedulingSlots';
import { formatTimeTo12hr } from '@/components/website/utils/helpers';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discussionId: string;
  expertId: string;
  duration?: number;
  rescheduleAttempts?: number;
  maxAttempts?: number;
  timezone?: string;
  role: 'seeker' | 'expert';
  onSuccess?: () => void;
};

export function RescheduleDiscussionDialog({
  open,
  onOpenChange,
  discussionId,
  expertId,
  duration = 30,
  rescheduleAttempts = 0,
  maxAttempts = 3,
  timezone = 'Asia/Kolkata',
  role,
  onSuccess,
}: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const { data: expertProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['expert-scheduling', expertId],
    queryFn: () => searchService.getExpertProfileByUserId(expertId),
    enabled: open && !!expertId,
  });

  const { data: bookedSessions } = useQuery({
    queryKey: ['expertBookedSlots', expertId, selectedDate],
    queryFn: () => seekerService.getExpertBookedSlots(expertId, selectedDate),
    enabled: open && !!expertId && !!selectedDate,
  });

  const expertScheduling: ExpertSchedulingProfile | null = useMemo(() => {
    if (!expertProfile) return null;
    return {
      bookingsAvailability: expertProfile.bookingsAvailability,
      availability: expertProfile.availability as ExpertSchedulingProfile['availability'],
      daysOff: expertProfile.daysOff,
    };
  }, [expertProfile]);

  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];

    const normalizedDate = normalizeDateString(selectedDate);
    const istToday = getCurrentISTDate();
    if (normalizedDate < istToday) return [];

    let slots = getAvailableTimeSlots(expertScheduling, normalizedDate, duration);

    // Enforce 15-minute buffer for same-day bookings in IST
    if (normalizedDate === istToday) {
      const minStartMinutes = getCurrentISTMinutes() + 15;
      slots = slots.filter((slot) => {
        const [slotHour, slotMin] = slot.split(':').map(Number);
        return slotHour * 60 + slotMin >= minStartMinutes;
      });
    }

    if (bookedSessions && bookedSessions.length > 0) {
      slots = filterConflictingTimeSlots(slots, normalizedDate, bookedSessions, duration, discussionId);
    }

    return slots;
  }, [expertScheduling, selectedDate, bookedSessions, duration, discussionId]);

  const availableDayLabels = useMemo(
    () => getAvailableDayLabels(expertScheduling),
    [expertScheduling]
  );

  useEffect(() => {
    if (!open) {
      setSelectedDate('');
      setSelectedTime('');
    }
  }, [open]);

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      const normalizedDate = normalizeDateString(selectedDate);
      const [y, m, d] = normalizedDate.split('-').map(Number);
      const [hh, mm] = selectedTime.split(':').map(Number);
      const targetUTC = new Date(Date.UTC(y, m - 1, d, hh, mm));
      const tzDateStr = targetUTC.toLocaleString('en-US', { timeZone: timezone || 'Asia/Kolkata' });
      const utcDateStr = targetUTC.toLocaleString('en-US', { timeZone: 'UTC' });
      const offsetMs = new Date(tzDateStr).getTime() - new Date(utcDateStr).getTime();
      const finalScheduledAt = new Date(targetUTC.getTime() - offsetMs);

      // Strict 15-minute advance buffer check
      const minBufferMs = 15 * 60 * 1000 - 30 * 1000;
      if (finalScheduledAt.getTime() < Date.now() + minBufferMs) {
        throw new Error('Proposed time must be at least 15 minutes in advance.');
      }

      if (role === 'seeker') {
        await seekerService.rescheduleScheduledDiscussion(discussionId, finalScheduledAt.toISOString());
      } else {
        await expertService.rescheduleScheduledDiscussion(discussionId, finalScheduledAt.toISOString());
      }
    },
    onSuccess: () => {
      toast.success('New time proposed successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to propose new time');
    },
  });

  const attemptsRemaining = Math.max(0, maxAttempts - rescheduleAttempts);
  const canReschedule = attemptsRemaining > 0;

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }
    if (!isDateAvailableForExpert(expertScheduling, selectedDate)) {
      toast.error('Selected date is outside expert availability');
      return;
    }
    if (!availableTimes.includes(selectedTime)) {
      toast.error('Selected time is outside expert availability');
      return;
    }
    rescheduleMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Propose new time</DialogTitle>
          <DialogDescription>
            Choose a time within the expert&apos;s availability.{' '}
            {canReschedule
              ? `${attemptsRemaining} of ${maxAttempts} rescheduling attempts remaining.`
              : 'No rescheduling attempts remaining.'}
          </DialogDescription>
        </DialogHeader>

        {profileLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {availableDayLabels.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Expert is typically available on: {availableDayLabels.join(', ')}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime('');
                }}
                min={new Date().toISOString().split('T')[0]}
                disabled={!canReschedule}
              />
              {selectedDate &&
                expertScheduling &&
                !isDateAvailableForExpert(expertScheduling, selectedDate) && (
                  <p className="text-xs text-amber-600">
                    This date may not be available for this expert.
                  </p>
                )}
            </div>
            <div className="space-y-2">
              <Label>Time (IST)</Label>
              {!selectedDate ? (
                <p className="text-sm text-muted-foreground">Select a date to see available slots.</p>
              ) : availableTimes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No time slots on this day. Pick another date or contact the expert.
                </p>
              ) : (
                <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      disabled={!canReschedule}
                      onClick={() => setSelectedTime(time)}
                      className={`rounded border p-2 text-sm ${
                        selectedTime === time
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      {formatTimeTo12hr(time)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !canReschedule ||
              rescheduleMutation.isPending ||
              !selectedDate ||
              !selectedTime
            }
          >
            {rescheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Propose time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
