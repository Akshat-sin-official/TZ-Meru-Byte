/**
 * Request Discussion Dialog
 * 
 * Business-side component to request a discussion with an expert
 * 
 * CRITICAL LANGUAGE RULE: "Schedule a Discussion" (NOT "book a call")
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, AlertCircle } from 'lucide-react';
import { requestDiscussion } from '@/services/discussionService';
import { DiscussionPurpose } from '@/types/discussion';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RequestDiscussionDialogProps {
  expertId: string;
  expertName: string;
  expertBusinessName?: string;
  triggerButton?: React.ReactNode;
}

export default function RequestDiscussionDialog({
  expertId,
  expertName,
  expertBusinessName,
  triggerButton,
}: RequestDiscussionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purpose, setPurpose] = useState<DiscussionPurpose>(DiscussionPurpose.REQUIREMENT_DISCUSSION);
  const [scheduledAt, setScheduledAt] = useState('');
  const [agenda, setAgenda] = useState('');
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!scheduledAt || !agenda.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (agenda.length > 300) {
      toast({
        title: 'Validation Error',
        description: 'Agenda must be 300 characters or less',
        variant: 'destructive',
      });
      return;
    }

    const minBufferMs = 15 * 60 * 1000 - 30 * 1000;
    if (new Date(scheduledAt).getTime() < Date.now() + minBufferMs) {
      toast({
        title: 'Validation Error',
        description: 'Discussions must be scheduled at least 15 minutes in advance.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await requestDiscussion({
        expertId,
        purpose,
        agenda: agenda.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        duration: 15,
      });

      toast({
        title: 'Discussion Requested',
        description: 'Your request has been sent to the expert',
      });

      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Request Failed',
        description: error.response?.data?.error || 'Failed to send discussion request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPurpose(DiscussionPurpose.REQUIREMENT_DISCUSSION);
    setScheduledAt('');
    setAgenda('');
  };

  const getMinDateTime = () => {
    const now = new Date(Date.now() + 15 * 60 * 1000); // Minimum 15 mins from now
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="default" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedule a Discussion
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule a Discussion</DialogTitle>
          <DialogDescription>
            Request a discussion with {expertName}
            {expertBusinessName && ` from ${expertBusinessName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Purpose Selection */}
          <div className="space-y-2">
            <Label htmlFor="purpose">
              Purpose <span className="text-destructive">*</span>
            </Label>
            <Select
              value={purpose}
              onValueChange={(value) => setPurpose(value as DiscussionPurpose)}
            >
              <SelectTrigger id="purpose">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DiscussionPurpose.REQUIREMENT_DISCUSSION}>
                  Requirement Discussion
                </SelectItem>
                <SelectItem value={DiscussionPurpose.CLARIFICATION}>
                  Clarification
                </SelectItem>
                <SelectItem value={DiscussionPurpose.ALIGNMENT}>
                  Alignment
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {purpose === DiscussionPurpose.REQUIREMENT_DISCUSSION &&
                'Initial discussion to understand your requirements'}
              {purpose === DiscussionPurpose.CLARIFICATION &&
                'Clarify specific details or questions'}
              {purpose === DiscussionPurpose.ALIGNMENT &&
                'Align on approach, timeline, and expectations'}
            </p>
          </div>

          {/* Preferred Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">
              Preferred Date & Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={getMinDateTime()}
            />
            <p className="text-xs text-muted-foreground">
              Duration: 15 minutes (expert can accept or propose a new time)
            </p>
          </div>

          {/* Agenda */}
          <div className="space-y-2">
            <Label htmlFor="agenda">
              Agenda <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="agenda"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Briefly describe what you'd like to discuss..."
              rows={4}
              maxLength={300}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Maximum 300 characters</span>
              <span className={agenda.length > 300 ? 'text-destructive' : ''}>
                {agenda.length}/300
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Important:</strong> This discussion is for alignment only. No commitments are
              made at this stage. The expert may accept, decline, or propose a new time.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
