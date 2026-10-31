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
import { Loader2, FileEdit, Info } from "lucide-react";

interface RequestRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: MilestoneSubmission;
  onSuccess: () => void;
}

export default function RequestRevisionDialog({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: RequestRevisionDialogProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");

  const revisionMutation = useMutation({
    mutationFn: async () => {
      return depositService.requestMilestoneRevision(submission._id, {
        revisionNotes: comment.trim(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Revision Requested",
        description: "The expert has been notified about the requested changes.",
      });
      setComment("");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to request revision. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!comment.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide revision instructions.",
        variant: "destructive",
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Validation Error",
        description: "Revision notes must be at least 10 characters.",
        variant: "destructive",
      });
      return;
    }

    revisionMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-orange-600" />
            Request Revision - Milestone {submission.milestoneNumber}
          </DialogTitle>
          <DialogDescription>
            Provide feedback for the expert to revise their submission
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Submission */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Current Submission</p>
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

          {/* Revision Notes */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              Revision Instructions <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="comment"
              placeholder="Explain what needs to be changed or improved..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              disabled={revisionMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what changes are required. Minimum 10 characters.
            </p>
          </div>

          {/* Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm">
                The expert will be notified of your feedback and can resubmit the milestone.
                No deposit will be released until you approve the revised submission.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={revisionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={revisionMutation.isPending}
            variant="outline"
          >
            {revisionMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Request Revision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
