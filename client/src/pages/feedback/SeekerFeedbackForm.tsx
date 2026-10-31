import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { feedbackService } from '@/services/feedbackService';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Shield, Lock } from 'lucide-react';

// Seeker-specific options
const UNCLEAR_AREAS = [
  'Finding the right expert',
  'Understanding quotation & milestones',
  'Deposit vs payment clarity',
  'Milestone approval & release flow',
  'Communication during engagement',
  'Everything was clear',
];

const UNEXPECTED_AREAS = [
  'Sequence of steps',
  'Platform role vs expert role',
  'Deposit handling',
  'Timeline clarity',
  'Nothing unexpected',
];

const SeekerFeedbackForm = () => {
  const { engagementId } = useParams<{ engagementId: string }>();
  const navigate = useNavigate();

  const [unclearAreas, setUnclearAreas] = useState<string[]>([]);
  const [unexpectedAreas, setUnexpectedAreas] = useState<string[]>([]);
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [experienceText, setExperienceText] = useState('');
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [displayPreference, setDisplayPreference] = useState<'business_name' | 'role_only' | 'anonymous'>('anonymous');

  // Check eligibility
  const { data: eligibility } = useQuery({
    queryKey: ['feedbackEligibility', engagementId],
    queryFn: () => feedbackService.checkEligibility(engagementId!),
    enabled: !!engagementId,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      feedbackService.submitFeedback({
        engagementId: engagementId!,
        platformFlowCheck: {
          seekerUnclearAreas: unclearAreas.length > 0 ? unclearAreas : undefined,
          seekerUnexpectedAreas: unexpectedAreas.length > 0 ? unexpectedAreas : undefined,
          improvementSuggestion: improvementSuggestion.trim() || undefined,
        },
        experienceStatement: experienceText.trim()
          ? {
            text: experienceText.trim(),
            consentToPublish,
            displayPreference: consentToPublish ? displayPreference : undefined,
          }
          : undefined,
      }),
    onSuccess: () => {
      toast.success('Feedback submitted successfully');
      navigate('/seeker/dashboard');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback');
    },
  });

  const handleSubmit = () => {
    if (experienceText.trim() && !consentToPublish) {
      toast.error('Please provide consent to publish if you want to share your experience');
      return;
    }
    submitMutation.mutate();
  };

  if (!eligibility?.eligible) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">Not Eligible</h1>
          <p className="mb-4 text-muted-foreground">{eligibility?.reason || 'Engagement is not eligible for feedback'}</p>
          <Button onClick={() => navigate('/seeker/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/seeker/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Help us improve MarTechAdda</h1>
            <p className="text-muted-foreground">
              Your feedback helps us improve the platform experience for everyone.
            </p>
            <div className="mt-4 p-4 bg-secondary rounded-lg flex items-start gap-2">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                This feedback does not affect rankings, visibility, or payments. It helps us improve the platform experience for everyone.
              </p>
            </div>
          </div>

          {/* Section 1: Platform Flow Check */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Flow Check</CardTitle>
              <CardDescription>Help us understand where the process felt unclear or slow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base mb-3 block">Where did the process feel unclear or slow? (Multi-select)</Label>
                <div className="space-y-2">
                  {UNCLEAR_AREAS.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`unclear-${area}`}
                        checked={unclearAreas.includes(area)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setUnclearAreas([...unclearAreas, area]);
                          } else {
                            setUnclearAreas(unclearAreas.filter((a) => a !== area));
                          }
                        }}
                      />
                      <Label htmlFor={`unclear-${area}`} className="font-normal cursor-pointer">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-3 block">Did anything feel different from what you expected? (Multi-select)</Label>
                <div className="space-y-2">
                  {UNEXPECTED_AREAS.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`unexpected-${area}`}
                        checked={unexpectedAreas.includes(area)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setUnexpectedAreas([...unexpectedAreas, area]);
                          } else {
                            setUnexpectedAreas(unexpectedAreas.filter((a) => a !== area));
                          }
                        }}
                      />
                      <Label htmlFor={`unexpected-${area}`} className="font-normal cursor-pointer">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="improvement" className="text-base mb-2 block">
                  One suggestion to improve the process (Optional · 150 chars)
                </Label>
                <Textarea
                  id="improvement"
                  placeholder="One thing that could make this smoother…"
                  value={improvementSuggestion}
                  onChange={(e) => {
                    if (e.target.value.length <= 150) {
                      setImprovementSuggestion(e.target.value);
                    }
                  }}
                  maxLength={150}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {improvementSuggestion.length}/150 characters
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Visible only to MarTechAdda (aggregated)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Experience Statement */}
          <Card>
            <CardHeader>
              <CardTitle>Share your experience (Optional)</CardTitle>
              <CardDescription>What did MarTechAdda help you do better?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="experience" className="text-base mb-2 block">
                  Free Text (Max 200 chars)
                </Label>
                <Textarea
                  id="experience"
                  placeholder="Share your experience..."
                  value={experienceText}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) {
                      setExperienceText(e.target.value);
                    }
                  }}
                  maxLength={200}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {experienceText.length}/200 characters
                </p>
              </div>

              {experienceText.trim() && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="consent"
                      checked={consentToPublish}
                      onCheckedChange={(checked) => setConsentToPublish(checked as boolean)}
                    />
                    <Label htmlFor="consent" className="font-normal cursor-pointer">
                      I allow MarTechAdda to display this statement publicly. (Mandatory to publish)
                    </Label>
                  </div>

                  {consentToPublish && (
                    <div>
                      <Label className="text-base mb-2 block">Display preference (Optional)</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="business-name"
                            name="display"
                            value="business_name"
                            checked={displayPreference === 'business_name'}
                            onChange={() => setDisplayPreference('business_name')}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="business-name" className="font-normal cursor-pointer">
                            Show business name
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="role-only"
                            name="display"
                            value="role_only"
                            checked={displayPreference === 'role_only'}
                            onChange={() => setDisplayPreference('role_only')}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="role-only" className="font-normal cursor-pointer">
                            Show role only (Founder / Marketing Head)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="anonymous"
                            name="display"
                            value="anonymous"
                            checked={displayPreference === 'anonymous'}
                            onChange={() => setDisplayPreference('anonymous')}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="anonymous" className="font-normal cursor-pointer">
                            Keep anonymous
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="flex-1">
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate('/seeker/dashboard')}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SeekerFeedbackForm;

