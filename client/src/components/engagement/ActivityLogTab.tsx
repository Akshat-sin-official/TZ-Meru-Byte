import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Engagement, MilestoneSubmission, DepositLedger } from "@/types/deposit";
import { Clock, CheckCircle, XCircle, FileEdit, Flag, TrendingUp } from "lucide-react";

interface ActivityLogTabProps {
  engagement: Engagement;
  submissions: MilestoneSubmission[];
  ledger: DepositLedger | null;
}

interface Activity {
  id: string;
  timestamp: Date;
  type: "milestone_submitted" | "milestone_approved" | "milestone_rejected" | "revision_requested" | "issue_flagged" | "deposit_released" | "engagement_started" | "engagement_completed";
  description: string;
  icon: any;
  variant: "default" | "secondary" | "destructive" | "outline";
}

export default function ActivityLogTab({
  engagement,
  submissions,
  ledger,
}: ActivityLogTabProps) {
  const activities: Activity[] = [];

  // Add engagement start
  activities.push({
    id: `engagement-start-${engagement._id}`,
    timestamp: new Date(engagement.startedAt),
    type: "engagement_started",
    description: "Engagement started",
    icon: Clock,
    variant: "default",
  });

  // Add milestone submissions
  submissions.forEach((submission) => {
    // Submission activity
    activities.push({
      id: `submission-${submission._id}`,
      timestamp: new Date(submission.submittedAt),
      type: "milestone_submitted",
      description: `Milestone ${submission.milestoneNumber} submitted`,
      icon: FileEdit,
      variant: "secondary",
    });

    // Response activities
    if (submission.seekerResponseAt) {
      if (submission.status === "approved") {
        activities.push({
          id: `approved-${submission._id}`,
          timestamp: new Date(submission.seekerResponseAt),
          type: "milestone_approved",
          description: `Milestone ${submission.milestoneNumber} approved`,
          icon: CheckCircle,
          variant: "default",
        });
      } else if (submission.status === "rejected") {
        activities.push({
          id: `rejected-${submission._id}`,
          timestamp: new Date(submission.seekerResponseAt),
          type: "milestone_rejected",
          description: `Milestone ${submission.milestoneNumber} rejected`,
          icon: XCircle,
          variant: "destructive",
        });
      } else if (submission.status === "revision_requested") {
        activities.push({
          id: `revision-${submission._id}`,
          timestamp: new Date(submission.seekerResponseAt),
          type: "revision_requested",
          description: `Revision requested for Milestone ${submission.milestoneNumber}`,
          icon: FileEdit,
          variant: "outline",
        });
      }
    }

    // Flagged activity
    if (submission.issueDetails?.flaggedAt) {
      activities.push({
        id: `flagged-${submission._id}`,
        timestamp: new Date(submission.issueDetails.flaggedAt),
        type: "issue_flagged",
        description: `Issue flagged for Milestone ${submission.milestoneNumber}`,
        icon: Flag,
        variant: "destructive",
      });
    }
  });

  // Add deposit releases from ledger
  if (ledger?.auditLog) {
    ledger.auditLog.forEach((entry, index) => {
      if (entry.entryType === "RELEASE") {
        activities.push({
          id: `release-${index}`,
          timestamp: new Date(entry.timestamp),
          type: "deposit_released",
          description: entry.description,
          icon: TrendingUp,
          variant: "default",
        });
      }
    });
  }

  // Add engagement completion
  if (engagement.completedAt) {
    activities.push({
      id: `engagement-completed-${engagement._id}`,
      timestamp: new Date(engagement.completedAt),
      type: "engagement_completed",
      description: "Engagement completed",
      icon: CheckCircle,
      variant: "default",
    });
  }

  // Sort activities by timestamp (newest first)
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Chronological log of all actions and events
          </p>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activities recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="mt-1">
                      <Badge variant={activity.variant} className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.timestamp.toLocaleDateString()}{" "}
                        {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <Badge variant="outline">
                        {activity.type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
