import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { feedbackService } from '@/services/feedbackService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, X } from 'lucide-react';
import { useState } from 'react';

interface FeedbackPromptProps {
  engagementId: string;
}

export const FeedbackPrompt = ({ engagementId }: FeedbackPromptProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Check if feedback already submitted
  const { data: feedbacks } = useQuery({
    queryKey: ['feedback', engagementId],
    queryFn: () => feedbackService.getFeedbackByEngagement(engagementId),
    enabled: !!engagementId && !dismissed,
  });

  // Check eligibility
  const { data: eligibility } = useQuery({
    queryKey: ['feedbackEligibility', engagementId],
    queryFn: () => feedbackService.checkEligibility(engagementId),
    enabled: !!engagementId && !dismissed,
  });

  if (dismissed || !eligibility?.eligible) {
    return null;
  }

  // Check if user has already submitted feedback
  const hasSubmittedFeedback = feedbacks?.some(
    (feedback) => feedback.userId === (user?.id || user?.userId)
  );

  if (hasSubmittedFeedback) {
    return null;
  }

  const feedbackRoute =
    user?.role === 'seeker'
      ? `/feedback/seeker/${engagementId}`
      : `/feedback/expert/${engagementId}`;

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <CardTitle className="text-lg">Share Your Experience</CardTitle>
              <CardDescription className="mt-1">
                Help us improve MarTechAdda by sharing your feedback about this engagement.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button onClick={() => navigate(feedbackRoute)} className="flex-1">
            Provide Feedback
          </Button>
          <Button variant="outline" onClick={() => setDismissed(true)}>
            Maybe Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

