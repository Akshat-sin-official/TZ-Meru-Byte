import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MilestoneSubmission, MilestoneSubmissionStatus } from "@/types/deposit";
import depositService from "@/services/depositService";
import { CheckCircle2, Clock, XCircle, FileEdit, Eye, Lock } from "lucide-react";

interface MilestoneSummaryTableProps {
  milestones: Array<{
    milestoneNumber: number;
    name: string;
    amount: number;
    depositPercentage: number;
    scope?: string;
  }>;
  submissions: MilestoneSubmission[];
  isSeeker: boolean;
  onViewSubmission?: (submission: MilestoneSubmission) => void;
  onApprove?: (submission: MilestoneSubmission) => void;
  onRequestRevision?: (submission: MilestoneSubmission) => void;
  onReject?: (submission: MilestoneSubmission) => void;
}

/**
 * Milestone Summary Table Component
 * Matches spec: Milestone, Amount, Expert Submission, Your Decision, Admin Action, Status
 */
export function MilestoneSummaryTable({
  milestones,
  submissions,
  isSeeker,
  onViewSubmission,
  onApprove,
  onRequestRevision,
  onReject,
}: MilestoneSummaryTableProps) {
  const getSubmissionStatus = (milestoneNumber: number) => {
    const submission = submissions.find((s) => s.milestoneNumber === milestoneNumber);
    if (!submission) {
      return {
        status: "Not Submitted",
        variant: "outline" as const,
        icon: Lock,
        submission: null,
      };
    }

    switch (submission.status) {
      case MilestoneSubmissionStatus.PENDING:
        return {
          status: "Pending Your Approval",
          variant: "secondary" as const,
          icon: Clock,
          submission,
        };
      case MilestoneSubmissionStatus.APPROVED:
        return {
          status: "Approved",
          variant: "default" as const,
          icon: CheckCircle2,
          submission,
        };
      case MilestoneSubmissionStatus.REVISION_REQUESTED:
        return {
          status: "Revision Requested",
          variant: "outline" as const,
          icon: FileEdit,
          submission,
        };
      case MilestoneSubmissionStatus.REJECTED:
        return {
          status: "Rejected",
          variant: "destructive" as const,
          icon: XCircle,
          submission,
        };
      case MilestoneSubmissionStatus.AUTO_RELEASED:
        return {
          status: "Auto-Released",
          variant: "default" as const,
          icon: CheckCircle2,
          submission,
        };
      default:
        return {
          status: "Unknown",
          variant: "outline" as const,
          icon: Clock,
          submission,
        };
    }
  };

  const getAdminAction = (submission: MilestoneSubmission | null) => {
    if (!submission) return "—";
    
    // Check if milestone was released (admin action)
    if (
      submission.status === MilestoneSubmissionStatus.APPROVED ||
      submission.status === MilestoneSubmissionStatus.AUTO_RELEASED
    ) {
      return "Released";
    }
    
    if (submission.status === MilestoneSubmissionStatus.REVISION_REQUESTED) {
      return "Awaiting Revision";
    }
    
    if (submission.status === MilestoneSubmissionStatus.REJECTED) {
      return "Not Released";
    }
    
    return "—";
  };

  const canTakeAction = (submission: MilestoneSubmission | null) => {
    if (!submission || !isSeeker) return false;
    return submission.status === MilestoneSubmissionStatus.PENDING;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestone Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Expert Submission</TableHead>
                <TableHead>Your Decision</TableHead>
                <TableHead>Admin Action</TableHead>
                <TableHead>Status</TableHead>
                {isSeeker && <TableHead className="text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((milestone, index) => {
                const statusInfo = getSubmissionStatus(milestone.milestoneNumber);
                const StatusIcon = statusInfo.icon;
                const submission = statusInfo.submission;
                const adminAction = getAdminAction(submission);
                const canAction = canTakeAction(submission);

                return (
                  <TableRow key={milestone.milestoneNumber}>
                    <TableCell className="font-medium">
                      M{milestone.milestoneNumber}
                      <div className="text-xs text-muted-foreground mt-1">
                        {milestone.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-bold">
                        {depositService.formatDeposit(milestone.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {milestone.depositPercentage}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Invoice submitted
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                          {onViewSubmission && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs p-0"
                              onClick={() => onViewSubmission(submission)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission ? (
                        <div className="space-y-1">
                          {submission.status === MilestoneSubmissionStatus.PENDING ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          ) : submission.status === MilestoneSubmissionStatus.APPROVED ? (
                            <Badge variant="default" className="flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" />
                              Approved
                            </Badge>
                          ) : submission.status === MilestoneSubmissionStatus.REVISION_REQUESTED ? (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <FileEdit className="h-3 w-3" />
                              Revision Requested
                            </Badge>
                          ) : submission.status === MilestoneSubmissionStatus.REJECTED ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {submission.seekerResponse && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                              {submission.seekerResponse}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{adminAction}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.status}
                      </Badge>
                    </TableCell>
                    {isSeeker && (
                      <TableCell>
                        {canAction && submission ? (
                          <div className="flex gap-1">
                            {onApprove && (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs"
                                onClick={() => onApprove(submission)}
                              >
                                Approve
                              </Button>
                            )}
                            {onRequestRevision && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => onRequestRevision(submission)}
                              >
                                Revision
                              </Button>
                            )}
                            {onReject && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => onReject(submission)}
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Microcopy */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground italic">
            Your decision determines whether funds are released for this milestone.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

