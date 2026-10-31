import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Engagement } from "@/types/deposit";
import depositService from "@/services/depositService";
import { Calendar, User, FileText, Info } from "lucide-react";

interface OverviewTabProps {
  engagement: Engagement;
  quotation: any;
  isExpert: boolean;
  isSeeker: boolean;
}

export default function OverviewTab({
  engagement,
  quotation,
  isExpert,
  isSeeker,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Platform Disclaimer */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <CardTitle className="text-blue-900">Platform Role</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800">
            <strong>MarTechAdda facilitates deposit holding and release only.</strong>
            <br />
            Execution and delivery are managed directly between both parties.
          </p>
        </CardContent>
      </Card>

      {/* Engagement Details */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Engagement ID</p>
                <p className="font-mono text-sm">{engagement._id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={engagement.status === "active" ? "default" : "secondary"}>
                {depositService.getEngagementStatusLabel(engagement.status)}
              </Badge>
            </div>

            {quotation && (
              <>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isExpert ? "Business" : "Expert"}
                    </p>
                    <p className="font-medium">
                      {isExpert ? quotation.businessName : quotation.expertName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quotation Reference</p>
                    <p className="font-mono text-sm">{quotation._id}</p>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {new Date(engagement.startedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {engagement.completedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed Date</p>
                  <p className="font-medium">
                    {new Date(engagement.completedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {quotation && (
            <div>
              <h4 className="font-semibold mb-2">Project Scope</h4>
              <p className="text-sm text-muted-foreground">{quotation.scope}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quotation && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    {depositService.formatDeposit(quotation.totalAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Total Milestones</p>
                  <p className="text-2xl font-bold">{quotation.milestones?.length || 0}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Released Milestones</p>
                  <p className="text-2xl font-bold">
                    {engagement.releasedMilestonesCount || 0}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Role</CardTitle>
        </CardHeader>
        <CardContent>
          {isExpert && (
            <div className="space-y-2">
              <p className="font-medium">You are the Expert</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Submit milestone completion in the Milestones tab</li>
                <li>Track deposit releases in the Deposit Ledger tab</li>
                <li>View all actions in the Activity Log tab</li>
              </ul>
            </div>
          )}

          {isSeeker && (
            <div className="space-y-2">
              <p className="font-medium">You are the Business</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Review milestone submissions in the Milestones tab</li>
                <li>Approve or request revisions for submitted milestones</li>
                <li>Track deposit status in the Deposit Ledger tab</li>
                <li>View all actions in the Activity Log tab</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
