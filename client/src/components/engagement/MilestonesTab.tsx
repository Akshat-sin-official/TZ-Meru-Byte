import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Engagement, MilestoneSubmission, MilestoneSubmissionStatus } from "@/types/deposit";
import depositService from "@/services/depositService";
import { CheckCircle2, Clock, XCircle, FileEdit, Flag, AlertCircle } from "lucide-react";
import SubmitMilestoneDialog from "./SubmitMilestoneDialog";
import ApproveMilestoneDialog from "./ApproveMilestoneDialog";
import RequestRevisionDialog from "./RequestRevisionDialog";
import FlagMilestoneDialog from "./FlagMilestoneDialog";
import { MilestoneSummaryTable } from "./MilestoneSummaryTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFileNameFromUrl, downloadOrOpenFile } from "@/lib/fileUtils";

interface MilestonesTabProps {
  engagement: Engagement;
  quotation: any;
  submissions: MilestoneSubmission[];
  isExpert: boolean;
  isSeeker: boolean;
  refetchSubmissions: () => void;
  refetchLedger: () => void;
}

export default function MilestonesTab({
  engagement,
  quotation,
  submissions,
  isExpert,
  isSeeker,
  refetchSubmissions,
  refetchLedger,
}: MilestonesTabProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<MilestoneSubmission | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);

  const getMilestoneStatus = (milestoneNumber: number): {
    status: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: any;
  } => {
    const submission = submissions.find((s) => s.milestoneNumber === milestoneNumber);

    if (!submission) {
      return {
        status: "Not Submitted",
        variant: "outline",
        icon: Clock,
      };
    }

    switch (submission.status) {
      case MilestoneSubmissionStatus.APPROVED:
        return {
          status: "Approved",
          variant: "default",
          icon: CheckCircle2,
        };
      case MilestoneSubmissionStatus.PENDING:
        return {
          status: "Pending Approval",
          variant: "secondary",
          icon: Clock,
        };
      case MilestoneSubmissionStatus.REVISION_REQUESTED:
        return {
          status: "Revision Requested",
          variant: "outline",
          icon: FileEdit,
        };
      case MilestoneSubmissionStatus.REJECTED:
        return {
          status: "Rejected",
          variant: "destructive",
          icon: XCircle,
        };
      case MilestoneSubmissionStatus.AUTO_RELEASED:
        return {
          status: "Auto-Released",
          variant: "default",
          icon: CheckCircle2,
        };
      default:
        return {
          status: "Unknown",
          variant: "outline",
          icon: AlertCircle,
        };
    }
  };

  const canSubmitMilestone = (milestoneNumber: number): boolean => {
    if (!isExpert) return false;
    if (engagement.status !== "active") return false;
    return depositService.canSubmitMilestone(milestoneNumber, submissions);
  };

  const canApproveMilestone = (submission: MilestoneSubmission): boolean => {
    if (!isSeeker) return false;
    if (engagement.status !== "active") return false;
    return depositService.canApproveMilestone(submission);
  };

  const handleSubmitMilestone = (milestone: any) => {
    setSelectedMilestone(milestone);
    setShowSubmitDialog(true);
  };

  const handleApprove = (submission: MilestoneSubmission) => {
    setSelectedSubmission(submission);
    setShowApproveDialog(true);
  };

  const handleRequestRevision = (submission: MilestoneSubmission) => {
    setSelectedSubmission(submission);
    setShowRevisionDialog(true);
  };

  const handleFlag = (submission: MilestoneSubmission) => {
    setSelectedSubmission(submission);
    setShowFlagDialog(true);
  };

  const onActionComplete = () => {
    refetchSubmissions();
    refetchLedger();
    setShowSubmitDialog(false);
    setShowApproveDialog(false);
    setShowRevisionDialog(false);
    setShowFlagDialog(false);
  };

  if (!quotation || !quotation.milestones) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Milestone information is not available for this engagement.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Engagement status warning */}
      {engagement.status !== "active" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This engagement is {depositService.getEngagementStatusLabel(engagement.status)}.
            No actions can be performed.
          </AlertDescription>
        </Alert>
      )}

      {/* Milestone Summary Table View */}
      {isSeeker && quotation?.milestones && (
        <MilestoneSummaryTable
          milestones={quotation.milestones.map((m: any, idx: number) => ({
            milestoneNumber: idx + 1,
            name: m.name || `Milestone ${idx + 1}`,
            amount: m.depositAmount || m.amount || 0,
            depositPercentage: m.depositPercentage || 0,
            scope: m.scope,
          }))}
          submissions={submissions}
          isSeeker={isSeeker}
          onViewSubmission={(submission) => {
            setSelectedSubmission(submission);
            // Could open a dialog or scroll to detailed view
          }}
          onApprove={handleApprove}
          onRequestRevision={handleRequestRevision}
          onReject={(submission) => {
            // Reject action - could use FlagMilestoneDialog or create a RejectDialog
            handleFlag(submission);
          }}
        />
      )}

      {/* Detailed Milestones List */}
      <Tabs defaultValue="detailed" className="w-full">
        <TabsList>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          {isSeeker && <TabsTrigger value="summary">Summary Table</TabsTrigger>}
        </TabsList>
        <TabsContent value="detailed" className="space-y-4">
        {quotation.milestones.map((milestone: any, index: number) => {
          const milestoneNumber = index + 1;
          const statusInfo = getMilestoneStatus(milestoneNumber);
          const submission = submissions.find((s) => s.milestoneNumber === milestoneNumber);
          const StatusIcon = statusInfo.icon;

          return (
            <Card key={milestone._id || index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        Milestone {milestoneNumber}: {milestone.name}
                      </CardTitle>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{milestone.scope}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Deposit Amount</p>
                    <p className="text-lg font-bold">
                      {depositService.formatDeposit(milestone.depositAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {milestone.depositPercentage}%
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Submission Details */}
                {submission && (
                  <>
                    <Separator />
                    <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm font-medium mb-1">Submission Details</p>
                        <p className="text-sm text-muted-foreground">
                          {submission.submissionContent}
                        </p>
                      </div>

                      {submission.submissionFiles && submission.submissionFiles.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Attachments</p>
                          <div className="flex flex-wrap gap-2">
                            {submission.submissionFiles.map((file, idx) => {
                              const fileName = getFileNameFromUrl(file, idx + 1);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => downloadOrOpenFile(file, fileName)}
                                  className="text-xs text-primary hover:underline bg-muted/60 px-2 py-1 rounded inline-flex items-center gap-1 cursor-pointer max-w-[220px] truncate"
                                  title={fileName}
                                >
                                  📎 <span className="truncate">{fileName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </span>
                        {submission.seekerResponseAt && (
                          <span>
                            Responded: {new Date(submission.seekerResponseAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Business Response */}
                      {submission.seekerResponse && (
                        <div className="border-l-4 border-primary pl-3">
                          <p className="text-sm font-medium mb-1">Business Response</p>
                          <p className="text-sm text-muted-foreground">
                            {submission.seekerResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {/* Expert Actions */}
                  {isExpert && canSubmitMilestone(milestoneNumber) && (
                    <Button
                      onClick={() => handleSubmitMilestone(milestone)}
                      size="sm"
                    >
                      Submit Milestone
                    </Button>
                  )}

                  {/* Business Actions */}
                  {isSeeker && submission && canApproveMilestone(submission) && (
                    <>
                      <Button
                        onClick={() => handleApprove(submission)}
                        size="sm"
                        variant="default"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve & Release Deposit
                      </Button>
                      <Button
                        onClick={() => handleRequestRevision(submission)}
                        size="sm"
                        variant="outline"
                      >
                        <FileEdit className="h-4 w-4 mr-1" />
                        Request Revision
                      </Button>
                      <Button
                        onClick={() => handleFlag(submission)}
                        size="sm"
                        variant="destructive"
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        Flag Issue
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        </TabsContent>
        {isSeeker && (
          <TabsContent value="summary">
            <MilestoneSummaryTable
              milestones={quotation.milestones.map((m: any, idx: number) => ({
                milestoneNumber: idx + 1,
                name: m.name || `Milestone ${idx + 1}`,
                amount: m.depositAmount || m.amount || 0,
                depositPercentage: m.depositPercentage || 0,
                scope: m.scope,
              }))}
              submissions={submissions}
              isSeeker={isSeeker}
              onViewSubmission={(submission) => {
                setSelectedSubmission(submission);
              }}
              onApprove={handleApprove}
              onRequestRevision={handleRequestRevision}
              onReject={(submission) => {
                handleFlag(submission);
              }}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
      {selectedMilestone && (
        <SubmitMilestoneDialog
          open={showSubmitDialog}
          onOpenChange={setShowSubmitDialog}
          engagement={engagement}
          milestone={selectedMilestone}
          milestoneNumber={quotation.milestones.indexOf(selectedMilestone) + 1}
          onSuccess={onActionComplete}
        />
      )}

      {selectedSubmission && (
        <>
          <ApproveMilestoneDialog
            open={showApproveDialog}
            onOpenChange={setShowApproveDialog}
            submission={selectedSubmission}
            onSuccess={onActionComplete}
          />
          <RequestRevisionDialog
            open={showRevisionDialog}
            onOpenChange={setShowRevisionDialog}
            submission={selectedSubmission}
            onSuccess={onActionComplete}
          />
          <FlagMilestoneDialog
            open={showFlagDialog}
            onOpenChange={setShowFlagDialog}
            submission={selectedSubmission}
            onSuccess={onActionComplete}
          />
        </>
      )}
    </div>
  );
}
