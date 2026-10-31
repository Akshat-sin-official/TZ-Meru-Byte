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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import depositService from "@/services/depositService";
import { MilestoneSubmission } from "@/types/deposit";
import { Loader2, Flag, AlertTriangle } from "lucide-react";

interface FlagMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: MilestoneSubmission;
  onSuccess: () => void;
}

export default function FlagMilestoneDialog({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: FlagMilestoneDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");

  const flagMutation = useMutation({
    mutationFn: async () => {
      return depositService.flagMilestoneIssue(submission._id, {
        issueDescription: reason.trim(),
        flaggedBy: "seeker", // This will be set by backend from auth
      });
    },
    onSuccess: () => {
      toast({
        title: "Issue Flagged",
        description: "This milestone has been flagged for admin review. The ledger is now frozen.",
      });
      setReason("");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Flag Failed",
        description: error.message || "Failed to flag issue. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please describe the issue.",
        variant: "destructive",
      });
      return;
    }

    if (reason.trim().length < 20) {
      toast({
        title: "Validation Error",
        description: "Issue description must be at least 20 characters.",
        variant: "destructive",
      });
      return;
    }

    flagMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-600" />
            Flag Issue - Milestone {submission.milestoneNumber}
          </DialogTitle>
          <DialogDescription>
            Escalate this milestone for admin review
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
          </div>

          {/* Issue Description */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Issue Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Describe the issue with this milestone submission..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={6}
              disabled={flagMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Provide detailed information about the problem. Minimum 20 characters.
            </p>
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">⚠️ Critical Action</p>
              <div className="text-sm space-y-1">
                <p>Flagging this milestone will:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Freeze the entire deposit ledger</li>
                  <li>Prevent any further releases</li>
                  <li>Escalate to admin for review</li>
                  <li>Require admin intervention to unfreeze</li>
                </ul>
                <p className="mt-2 font-medium">
                  Only flag if there is a serious issue that requires admin attention.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>When to flag an issue:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
              <li>Expert is unresponsive to revision requests</li>
              <li>Submitted work is significantly different from agreed scope</li>
              <li>There are concerns about deliverable quality or authenticity</li>
              <li>Communication has broken down</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={flagMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={flagMutation.isPending}
            variant="destructive"
          >
            {flagMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Flag Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
