/**
 * Engagement Feedback Component
 * 
 * Post-engagement feedback form shown to seekers and experts
 * Only shown after all milestones are completed
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { feedbackService, PlatformFlowCheck, ExperienceStatement } from '@/services/feedbackService';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

interface EngagementFeedbackProps {
  engagementId: string;
  userRole: 'seeker' | 'expert';
  onComplete?: () => void;
}

const SEEKER_UNCLEAR_OPTIONS = [
  { value: 'finding_expert', label: 'Finding the right expert' },
  { value: 'quotation_understanding', label: 'Understanding quotation & milestones' },
  { value: 'deposit_clarity', label: 'Deposit vs payment clarity' },
  { value: 'milestone_flow', label: 'Milestone approval & release flow' },
  { value: 'communication', label: 'Communication during engagement' },
  { value: 'everything_clear', label: 'Everything was clear' },
];

const SEEKER_UNEXPECTED_OPTIONS = [
  { value: 'process_sequence', label: 'Sequence of steps' },
  { value: 'platform_role', label: 'Platform role vs expert role' },
  { value: 'deposit_handling', label: 'Deposit handling' },
  { value: 'timeline_clarity', label: 'Timeline clarity' },
  { value: 'nothing_unexpected', label: 'Nothing unexpected' },
];

const EXPERT_UNCLEAR_OPTIONS = [
  { value: 'discussion_quotation_flow', label: 'Discussion & quotation flow' },
  { value: 'milestone_deposit_logic', label: 'Milestone & deposit logic' },
  { value: 'client_approval_timing', label: 'Client approval timing' },
  { value: 'platform_communication', label: 'Platform communication' },
  { value: 'everything_clear', label: 'Everything was clear' },
];

const EXPERT_FRICTION_OPTIONS = [
  { value: 'client_responsiveness', label: 'Client responsiveness' },
  { value: 'approval_expectations', label: 'Approval expectations' },
  { value: 'deposit_release_clarity', label: 'Deposit release clarity' },
  { value: 'platform_role_understanding', label: 'Platform role understanding' },
  { value: 'no_friction', label: 'No friction' },
];

export function EngagementFeedback({ engagementId, userRole, onComplete }: EngagementFeedbackProps) {
  const navigate = useNavigate();

  // Platform flow check state
  const [unclearAreas, setUnclearAreas] = useState<string[]>([]);
  const [unexpectedOrFrictionAreas, setUnexpectedOrFrictionAreas] = useState<string[]>([]);
  const [improvementSuggestion, setImprovementSuggestion] = useState('');

  // Experience statement state
  const [experienceText, setExperienceText] = useState('');
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [displayPreference, setDisplayPreference] = useState<'business_name' | 'role_only' | 'anonymous'>('anonymous');

  // Check eligibility
  const { data: eligibility, isLoading: checkingEligibility } = useQuery({
    queryKey: ['feedback-eligibility', engagementId],
    queryFn: () => feedbackService.checkEligibility(engagementId),
  });

  // Submit feedback mutation
  const submitMutation = useMutation({
    mutationFn: feedbackService.submitFeedback,
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      onComplete?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build platform flow check
    const platformFlowCheck: PlatformFlowCheck = {
      improvementSuggestion: improvementSuggestion.trim() || undefined,
    };

    if (userRole === 'seeker') {
      platformFlowCheck.seekerUnclearAreas = unclearAreas;
      platformFlowCheck.seekerUnexpectedAreas = unexpectedOrFrictionAreas;
    } else {
      platformFlowCheck.expertUnclearAreas = unclearAreas;
      platformFlowCheck.expertFrictionPoints = unexpectedOrFrictionAreas;
    }

    // Build experience statement if provided
    let experienceStatement: ExperienceStatement | undefined;
    if (experienceText.trim()) {
      if (!consentToPublish) {
        toast.error('Please provide consent to publish your experience statement');
        return;
      }
      experienceStatement = {
        text: experienceText.trim(),
        consentToPublish,
        displayPreference,
      };
    }

    submitMutation.mutate({
      engagementId,
      platformFlowCheck,
      experienceStatement,
    });
  };

  const handleUnclearToggle = (value: string) => {
    setUnclearAreas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleUnexpectedOrFrictionToggle = (value: string) => {
    setUnexpectedOrFrictionAreas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  if (checkingEligibility) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Checking eligibility...</p>
        </CardContent>
      </Card>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Feedback not available yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {eligibility?.reason || 'This engagement is not eligible for feedback yet.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unclearOptions = userRole === 'seeker' ? SEEKER_UNCLEAR_OPTIONS : EXPERT_UNCLEAR_OPTIONS;
  const secondOptions = userRole === 'seeker' ? SEEKER_UNEXPECTED_OPTIONS : EXPERT_FRICTION_OPTIONS;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Microcopy */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">This feedback does not affect rankings, visibility, or payments.</p>
              <p className="mt-1">It helps us improve the platform experience for everyone.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Platform Flow Check (Internal Only) */}
      <Card>
        <CardHeader>
          <CardTitle>Help us improve MarTechAdda</CardTitle>
          <CardDescription>
            Your feedback helps us make the platform better for everyone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question 1 */}
          <div className="space-y-3">
            <Label className="text-base">
              {userRole === 'seeker'
                ? 'Where did the process feel unclear or slow?'
                : 'Where did the process feel unclear or heavy?'}
            </Label>
            <div className="space-y-2">
              {unclearOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`unclear-${option.value}`}
                    checked={unclearAreas.includes(option.value)}
                    onCheckedChange={() => handleUnclearToggle(option.value)}
                  />
                  <label
                    htmlFor={`unclear-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-3">
            <Label className="text-base">
              {userRole === 'seeker'
                ? 'Did anything feel different from what you expected?'
                : 'Did any step create friction for you?'}
            </Label>
            <div className="space-y-2">
              {secondOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`second-${option.value}`}
                    checked={unexpectedOrFrictionAreas.includes(option.value)}
                    onCheckedChange={() => handleUnexpectedOrFrictionToggle(option.value)}
                  />
                  <label
                    htmlFor={`second-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Question 3 */}
          <div className="space-y-3">
            <Label htmlFor="improvement" className="text-base">
              One suggestion to improve the process (Optional)
            </Label>
            <Textarea
              id="improvement"
              placeholder="One thing that could make this smoother..."
              value={improvementSuggestion}
              onChange={(e) => setImprovementSuggestion(e.target.value.slice(0, 150))}
              maxLength={150}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {improvementSuggestion.length}/150 characters · Visible only to MarTechAdda (aggregated)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Experience Statement (Optional, Public with Consent) */}
      <Card>
        <CardHeader>
          <CardTitle>Share your experience (Optional)</CardTitle>
          <CardDescription>
            {userRole === 'seeker'
              ? 'What did MarTechAdda help you do better?'
              : 'What felt most valuable about working through MarTechAdda?'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Textarea
              id="experience"
              placeholder={
                userRole === 'seeker'
                  ? 'Share how MarTechAdda helped your business...'
                  : 'Share what you valued about this platform...'
              }
              value={experienceText}
              onChange={(e) => setExperienceText(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{experienceText.length}/200 characters</p>
          </div>

          {experienceText.trim() && (
            <>
              {/* Consent */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consent"
                  checked={consentToPublish}
                  onCheckedChange={(checked) => setConsentToPublish(checked as boolean)}
                />
                <label
                  htmlFor="consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I allow MarTechAdda to display this statement publicly
                </label>
              </div>

              {/* Display Preference */}
              {consentToPublish && (
                <div className="space-y-3">
                  <Label className="text-base">Display preference (Optional)</Label>
                  <RadioGroup value={displayPreference} onValueChange={(v) => setDisplayPreference(v as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="business_name" id="business_name" />
                      <label htmlFor="business_name" className="text-sm cursor-pointer">
                        Show {userRole === 'seeker' ? 'business name' : 'brand/expert name'}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="role_only" id="role_only" />
                      <label htmlFor="role_only" className="text-sm cursor-pointer">
                        Show role only ({userRole === 'seeker' ? 'Founder / Marketing Head' : 'Consultant / Agency'})
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="anonymous" id="anonymous" />
                      <label htmlFor="anonymous" className="text-sm cursor-pointer">
                        Keep anonymous
                      </label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Skip for now
        </Button>
        <Button type="submit" disabled={submitMutation.isPending}>
          {submitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </div>
    </form>
  );
}
