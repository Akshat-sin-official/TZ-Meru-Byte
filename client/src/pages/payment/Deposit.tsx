/**
 * Deposit Payment Page
 * 
 * Allows seekers to make deposit payments for accepted quotations
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { CashfreeCheckout } from '@/components/payment/CashfreeCheckout';
import { seekerService } from '@/services/seekerService';
import { searchService } from '@/services/searchService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, AlertCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { formatStatusLabel } from '@/lib/statusUtils';

export default function Deposit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const engagementId = searchParams.get('engagementId');
  const [isConsentGiven, setIsConsentGiven] = useState(false);

  // Fetch engagement details
  const { data: engagements, isLoading, error } = useQuery({
    queryKey: ['seekerEngagements'],
    queryFn: () => seekerService.getEngagements(),
    enabled: !!engagementId,
  });

  // Fetch billing validation details
  const { data: billingValidation, isLoading: billingLoading } = useQuery({
    queryKey: ['seekerBillingValidation'],
    queryFn: () => seekerService.validateBillingDetails(),
  });

  // Find the specific engagement
  const engagement = engagementId
    ? engagements?.find((e) => e.id === engagementId || (e as any)._id === engagementId)
    : null;

  // Extract clean string quotationId
  const rawQuotationId = engagement?.quotationId;
  const quotationIdStr = typeof rawQuotationId === 'object' && rawQuotationId !== null
    ? ((rawQuotationId as any)._id?.toString() || (rawQuotationId as any).id)
    : (typeof rawQuotationId === 'string' && (rawQuotationId.includes('_id:') || rawQuotationId.includes('ObjectId')))
      ? (rawQuotationId.match(/ObjectId\(['"]([0-9a-fA-F]{24})['"]\)/)?.[1] || rawQuotationId.match(/['"]([0-9a-fA-F]{24})['"]/)?.[1] || rawQuotationId)
      : rawQuotationId;

  // Fetch quotation details
  const { data: quotation, isLoading: quotationLoading } = useQuery({
    queryKey: ['seekerQuotation', quotationIdStr],
    queryFn: () => seekerService.getQuotation(quotationIdStr!),
    enabled: !!engagement && !!quotationIdStr,
  });

  const isExpired = quotation && quotation.validUntil && new Date(quotation.validUntil) < new Date();

  if (!engagementId) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20">
          <Card>
            <CardContent className="py-8">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Engagement ID is required. Please accept a quotation first.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => navigate('/seeker/dashboard')}
                className="mt-4"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (isLoading || billingLoading || (engagement && !!engagement.quotationId && quotationLoading)) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading details and billing validation...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error || !engagement) {
    // Extract error message safely
    let errorMessage = 'Engagement not found. Please try again.';
    if (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle error objects from API
        const errorObj = error as Record<string, unknown>;
        if ('message' in errorObj && typeof errorObj.message === 'string') {
          errorMessage = errorObj.message;
        } else if ('error' in errorObj && typeof errorObj.error === 'string') {
          errorMessage = errorObj.error;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
    }

    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20">
          <Card>
            <CardContent className="py-8">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => navigate('/seeker/dashboard')}
                className="mt-4"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (isExpired) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <Card className="border-2 border-destructive shadow-md animate-in fade-in-50 duration-300">
            <CardHeader className="bg-red-50/50">
              <CardTitle className="text-red-800 text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                Quotation Expired
              </CardTitle>
              <CardDescription className="text-red-700">
                This quotation's validity has expired. Payment is locked because the validity date ({new Date(quotation.validUntil).toLocaleDateString('en-IN')}) has passed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="text-sm text-slate-600">
                To proceed with this engagement, please contact the expert (<span className="font-semibold text-slate-800">{engagement.expertName}</span>) and request them to extend the quotation validity or submit a revised quotation.
              </p>
              <Button onClick={() => navigate('/seeker/dashboard')} className="w-full">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Check if deposit is already fully paid
  // Allow payment if remainingBalance > 0 (supports partial payments)
  const status = engagement.status.toLowerCase();
  const remainingBalance = engagement.remainingBalance || 0;

  // If remaining balance is 0 or negative, deposit is fully paid
  if (remainingBalance <= 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Status</CardTitle>
              <CardDescription>Your engagement deposit information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Deposit has already been paid for this engagement.
                  {engagement.status === 'active' && ' Your engagement is active.'}
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate('/seeker/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Also check if status allows payment (for initial deposits)
  // Allow payment for: quotation_accepted, pending_deposit, or active (for partial payments)
  const allowedStatuses = ['quotation_accepted', 'pending_deposit', 'active', 'pending_compliance'];
  if (!allowedStatuses.includes(status) && remainingBalance <= 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Status</CardTitle>
              <CardDescription>Your engagement deposit information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  This engagement is in {formatStatusLabel(engagement.status)} status. Deposit payment is not required at this time.
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate('/seeker/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/seeker/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">
            {engagement.hasPaidDeposit ? 'Complete Remaining Payment' : 'Complete Deposit Payment'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {engagement.hasPaidDeposit
              ? `Pay the remaining balance to complete your engagement with ${engagement.expertName}`
              : `Pay the deposit amount to activate your engagement with ${engagement.expertName}`}
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expert:</span>
                <span className="font-medium">{engagement.expertName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Project Amount:</span>
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                  }).format(engagement.totalProjectAmount || engagement.totalDeposit)}
                </span>
              </div>
              {engagement.hasPaidDeposit && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already Paid:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      }).format(engagement.totalDeposit)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Remaining Balance:</span>
                    <span className="font-bold text-lg text-primary">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      }).format(engagement.remainingBalance)}
                    </span>
                  </div>
                </>
              )}
              {!engagement.hasPaidDeposit && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Amount to Pay:</span>
                  <span className="font-bold text-lg text-primary">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                    }).format(engagement.remainingBalance)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">
                  {formatStatusLabel(engagement.status)}
                </span>
              </div>
            </CardContent>
          </Card>

          {billingValidation && !billingValidation.isValid ? (
            <Card className="border-2 border-destructive shadow-md">
              <CardHeader className="bg-red-50/50">
                <CardTitle className="text-red-800 text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                  Compliance Details Required
                </CardTitle>
                <CardDescription className="text-red-700">
                  Before you can make a deposit, you must complete your business billing and tax details to comply with facilitator regulations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="text-sm space-y-2">
                  <p className="font-semibold text-slate-800">The following information is missing:</p>
                  <ul className="list-disc pl-5 text-slate-600 space-y-1">
                    {billingValidation.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
                <Button 
                  onClick={() => navigate(`/payment/profile-review?engagementId=${engagementId}`)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                >
                  Complete Billing & Tax Info
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consent"
                      checked={isConsentGiven}
                      onCheckedChange={(checked) => setIsConsentGiven(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="consent"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I understand and agree to the neutral facilitation role
                      </label>
                      <p className="text-sm text-muted-foreground">
                        By proceeding, I confirm that I understand MarTechAdda acts as a neutral facilitator and is not a party to the service agreement between me and the expert.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isConsentGiven && (
                <CashfreeCheckout
                  engagementId={engagementId}
                  onSuccess={async () => {
                    toast.success('Payment successful! Your engagement has been activated.');

                    // Auto-save requirement from search context
                    try {
                      const savedContext = sessionStorage.getItem('searchContext');
                      if (savedContext) {
                        const context = JSON.parse(savedContext);
                        // Convert context to filters format
                        const filters = {
                          coreServiceCategories: context.serviceCategory ? [context.serviceCategory] : undefined,
                          industrySectors: context.industry ? [context.industry] : undefined,
                          location: context.location || undefined,
                          engagementModels: context.engagementModel ? [context.engagementModel] : undefined,
                        };
                        // Only save if we have meaningful filters
                        if (filters.coreServiceCategories || filters.industrySectors || filters.location) {
                          await searchService.saveRequirement(filters, 'Last Engagement');
                        }
                      }
                    } catch (error) {
                      // Silent fail - not critical for user experience
                    }

                    // Show post-hire prompt
                    navigate('/seeker/dashboard?payment=success&showPostHirePrompt=true');
                  }}
                  onError={(error) => {
                    toast.error(`Payment error: ${error}`);
                  }}
                />
              )}
              {!isConsentGiven && (
                <Button disabled className="w-full">
                  Please Confirm Consent to Proceed
                </Button>
              )}
            </>
          )}
        </div>
      </div >
    </MainLayout >
  );
}

