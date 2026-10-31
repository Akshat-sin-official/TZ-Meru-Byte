import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import depositService from "@/services/depositService";
import { MilestoneSubmission } from "@/types/deposit";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ApproveMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: MilestoneSubmission;
  onSuccess: () => void;
}

export default function ApproveMilestoneDialog({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: ApproveMilestoneDialogProps) {
  const { toast } = useToast();
  const [confirmed, setConfirmed] = useState(false);

  const approveMutation = useMutation({
    mutationFn: async () => {
      return depositService.approveMilestone(submission._id);
    },
    onSuccess: () => {
      toast({
        title: "Milestone Approved",
        description: "Deposit has been released to the expert.",
      });
      setConfirmed(false);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve milestone. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (!confirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that you understand this action cannot be undone.",
        variant: "destructive",
      });
      return;
    }

    approveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Approve Milestone {submission.milestoneNumber}
          </DialogTitle>
          <DialogDescription>
            Review and approve this milestone submission
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Submission Details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
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
                  {submission.submissionFiles.map((file, idx) => (
                    <a
                      key={idx}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Attachment {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </div>
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">⚠️ This action cannot be undone</p>
              <p className="text-sm">
                Approving this milestone will immediately release the deposit to the expert.
                The released amount cannot be recovered.
              </p>
            </AlertDescription>
          </Alert>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              disabled={approveMutation.isPending}
            />
            <div className="flex-1">
              <label
                htmlFor="confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I confirm that I have reviewed the milestone deliverables and approve the
                deposit release
              </label>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>What happens next:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
              <li>Deposit will be released from held amount</li>
              <li>Expert will receive payment to their verified bank account</li>
              <li>Milestone status will be marked as "Approved"</li>
              <li>Ledger will be updated with release entry</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={!confirmed || approveMutation.isPending}
          >
            {approveMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Approve & Release Deposit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
