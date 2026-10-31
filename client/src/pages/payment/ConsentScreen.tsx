/**
 * Mandatory Consent Screen
 * 
 * Shows after quotation acceptance, before deposit
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/MainLayout';
import { seekerService } from '@/services/seekerService';
import { Loader2, ArrowRight, Shield, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { faqSections } from '@/data/faqData';

const ConsentScreen = () => {
  const { quotationId } = useParams<{ quotationId: string }>();
  const navigate = useNavigate();
  const [consentGiven, setConsentGiven] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Fetch quotation details
  const { data: quotation, isLoading } = useQuery({
    queryKey: ['seekerQuotation', quotationId],
    queryFn: () => seekerService.getQuotation(quotationId!),
    enabled: !!quotationId,
  });

  // Accept quotation and create engagement before moving to profile review
  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!quotationId) {
        throw new Error('Quotation ID is required');
      }
      const result = await seekerService.acceptQuotation(quotationId);
      return result; // { engagementId, quotationId }
    },
    onSuccess: ({ engagementId }) => {
      setIsAccepting(false);
      toast.success('Quotation accepted successfully');
      // Go to profile review with both quotationId and engagementId
      navigate(`/payment/profile-review?quotationId=${quotationId}&engagementId=${engagementId}`);
    },
    onError: (error: unknown) => {
      setIsAccepting(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept quotation';
      toast.error(errorMessage);
    },
  });

  const handleProceed = () => {
    if (!consentGiven) {
      toast.error('Please confirm the consent to proceed');
      return;
    }
    if (!quotationId) {
      toast.error('Quotation ID missing');
      return;
    }
    setIsAccepting(true);
    acceptMutation.mutate();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!quotation) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">Quotation Not Found</h1>
          <Button onClick={() => navigate('/seeker/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto border-2 border-foreground">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Quotation Accepted</CardTitle>
            </div>
            <CardDescription>
              Before we collect any deposit, please confirm the following for compliance and engagement safety.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* System Status Info */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
              <p className="font-semibold">System Status (Auto-Updated):</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Seeker Onboarding → Completed</li>
                <li>Quotation status → Accepted</li>
                <li>Engagement status → Pending Compliance</li>
                <li>Deposit action → Locked</li>
              </ul>
            </div>

            {/* Consent Checkbox */}
            <div className="space-y-4 p-6 border-2 border-foreground/10 rounded-lg">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked === true)}
                  className="mt-1"
                />
                <Label htmlFor="consent" className="text-base font-medium cursor-pointer leading-relaxed">
                  I confirm that:
                </Label>
              </div>
              <ul className="ml-8 space-y-2 text-sm text-muted-foreground list-disc">
                <li>I am authorized to accept this quotation on behalf of the business</li>
                <li>This step is Deposit initiation only, not payment</li>
                <li>Funds will be released strictly against agreed milestones</li>
                <li>MarTechAdda acts as a neutral facilitation platform</li>
              </ul>
            </div>

            {/* FAQ Section */}
            <div className="mt-6 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-sm">Have Questions?</h4>
              </div>
              <FAQAccordion
                items={[
                  ...faqSections.find(s => s.id === 'quotations')?.items.slice(0, 2) || [],
                  ...faqSections.find(s => s.id === 'milestones')?.items.slice(0, 2) || [],
                ]}
              />
              <Button
                variant="link"
                onClick={() => window.open('/help-support', '_blank')}
                className="text-xs mt-2 p-0 h-auto"
              >
                View All FAQs →
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => navigate('/seeker/dashboard')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleProceed}
                disabled={!consentGiven || isAccepting}
                className="flex-1 gap-2"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    Proceed to Final Review
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ConsentScreen;

