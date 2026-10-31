import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, User, MapPin, FileText, CheckCircle, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { seekerService } from "@/services/seekerService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/services/apiClient";
import { useNavigate } from "react-router-dom";

/**
 * Profile & Compliance Section
 * Displays real-time compliance status (not_started, draft, submitted, completed, locked)
 */
export function ProfileCompliance() {
  const navigate = useNavigate();

  // Fetch seeker profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['seekerProfile'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: any }>('/v1/seeker/profile');
        return response.data.data || null;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // Check if deposit has been paid (profile should be locked)
  const { data: engagements } = useQuery({
    queryKey: ['seekerEngagements'],
    queryFn: () => seekerService.getEngagements(),
  });

  const hasPaidDeposit = engagements?.some((e) => e.hasPaidDeposit) || false;

  const complianceStatus = profile?.complianceStatus || (profile?.isProfileComplete ? 'completed' : 'not_started');
  const isSubmittedOrCompleted = profile?.isProfileComplete === true || ['submitted', 'completed', 'approved'].includes(complianceStatus);
  const isDraft = !isSubmittedOrCompleted && complianceStatus === 'draft';
  const isNotStarted = !isSubmittedOrCompleted && !isDraft;

  if (isLoading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle>Profile & Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading compliance details...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Profile & Compliance
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {hasPaidDeposit
                ? "These details were used for invoicing and compliance reference."
                : isSubmittedOrCompleted
                ? "Business compliance details submitted and ready."
                : isDraft
                ? "You have an unfinished compliance draft in progress."
                : "Complete your profile details before deposit payment."}
            </CardDescription>
          </div>
          <div>
            {hasPaidDeposit ? (
              <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            ) : isSubmittedOrCompleted ? (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 text-xs font-semibold">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Submitted
              </Badge>
            ) : isDraft ? (
              <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">
                <Clock className="h-3 w-3 text-amber-600" />
                In Progress (Draft)
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 bg-slate-100 text-slate-700 border-slate-200 text-xs font-semibold">
                Not Started
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {hasPaidDeposit ? (
          <>
            <Alert className="bg-blue-50/50 border-blue-100 text-blue-900">
              <Lock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs">
                These details are locked after deposit payment. Contact support if legal updates are required.
              </AlertDescription>
            </Alert>

            {/* Identity Section */}
            <div className="space-y-2 p-3 bg-muted/40 rounded-lg border border-border/50 text-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="font-semibold">Identity</h4>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Legal Entity Name:</span>
                  <span className="font-medium">{profile?.legalEntityName || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entity Type:</span>
                  <span className="font-medium capitalize">{profile?.entityType || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry Sector:</span>
                  <span className="font-medium">{profile?.industrySector || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST Status:</span>
                  <span className="font-medium capitalize">{profile?.gstStatus || "Not provided"}</span>
                </div>
                {profile?.gstNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST Number:</span>
                    <span className="font-mono font-medium">{profile.gstNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Place of Supply Section */}
            <div className="space-y-2 p-3 bg-muted/40 rounded-lg border border-border/50 text-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="font-semibold">Place of Supply</h4>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State:</span>
                  <span className="font-medium">{profile?.placeOfSupplyState || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country:</span>
                  <span className="font-medium">{profile?.country || "India"}</span>
                </div>
              </div>
            </div>
          </>
        ) : isSubmittedOrCompleted ? (
          <>
            <Alert className="bg-green-50/50 border-green-100 text-green-900">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs">
                Compliance information submitted. Details will freeze upon first deposit payment.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 p-3 bg-muted/40 rounded-lg border border-border/50 text-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="font-semibold">Registered Entity</h4>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Legal Entity Name:</span>
                  <span className="font-medium">{profile?.legalEntityName || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entity Type:</span>
                  <span className="font-medium capitalize">{profile?.entityType || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State:</span>
                  <span className="font-medium">{profile?.placeOfSupplyState || profile?.registeredAddress?.state || "Not provided"}</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/seeker/onboarding')}
              className="w-full text-xs font-medium gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Compliance Profile
            </Button>
          </>
        ) : isDraft ? (
          <>
            <Alert className="bg-amber-50/50 border-amber-200 text-amber-900">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs">
                You have a saved compliance draft. Complete and submit it to finalize your business profile.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => navigate('/seeker/onboarding')}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-9 gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" /> Continue Compliance Setup
            </Button>
          </>
        ) : (
          <>
            <Alert className="bg-slate-50 border-slate-200 text-slate-800">
              <FileText className="h-4 w-4 text-slate-500" />
              <AlertDescription className="text-xs">
                Complete your business profile before making a deposit payment or initiating engagements.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => navigate('/seeker/onboarding')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs h-9 gap-1.5"
            >
              <ArrowRight className="h-3.5 w-3.5" /> Start Compliance Setup
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
