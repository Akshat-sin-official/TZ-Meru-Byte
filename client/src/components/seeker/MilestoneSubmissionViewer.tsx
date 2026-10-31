import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getFileNameFromUrl, downloadOrOpenFile } from '@/lib/fileUtils';

interface MilestoneSubmission {
    id: string;
    milestoneNumber: number;
    title: string;
    submissionContent: string;
    submissionFiles?: string[];
    submittedAt: string;
    autoReleaseEligibleAt?: string;
    expertName: string;
}

interface MilestoneSubmissionViewerProps {
    open: boolean;
    submission: MilestoneSubmission | null;
    onClose: () => void;
    onApprove?: () => void;
    onReject?: () => void;
}

const MilestoneSubmissionViewer = ({
    open,
    submission,
    onClose,
    onApprove,
    onReject,
}: MilestoneSubmissionViewerProps) => {
    if (!submission) return null;

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'PPp');
        } catch {
            return dateString;
        }
    };

    const getTimeRemaining = () => {
        if (!submission.autoReleaseEligibleAt) return null;

        const now = new Date();
        const deadline = new Date(submission.autoReleaseEligibleAt);
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
            return { text: 'Auto-release eligible now', isUrgent: true };
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        if (days > 0) {
            return {
                text: `${days} day${days > 1 ? 's' : ''} ${remainingHours}h remaining`,
                isUrgent: days < 1,
            };
        }

        return {
            text: `${hours} hour${hours > 1 ? 's' : ''} remaining`,
            isUrgent: hours < 24,
        };
    };

    const timeRemaining = getTimeRemaining();

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Milestone Submission Details
                    </DialogTitle>
                    <DialogDescription>
                        Review the expert's submission before making a decision
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Milestone Info */}
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                        <div className="mb-3 flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold">{submission.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Milestone #{submission.milestoneNumber} • Submitted by {submission.expertName}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">Submitted</p>
                                    <p className="font-medium">{formatDate(submission.submittedAt)}</p>
                                </div>
                            </div>

                            {timeRemaining && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Auto-release</p>
                                        <p
                                            className={`font-medium ${timeRemaining.isUrgent ? 'text-orange-600' : ''
                                                }`}
                                        >
                                            {timeRemaining.text}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Auto-Release Warning */}
                    {timeRemaining && timeRemaining.isUrgent && (
                        <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-3 dark:bg-orange-950/20">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                                <div>
                                    <p className="font-semibold text-orange-900 dark:text-orange-100">
                                        Action Required Soon
                                    </p>
                                    <p className="text-sm text-orange-800 dark:text-orange-200">
                                        {timeRemaining.text} before funds are automatically released. Please review and
                                        respond.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submission Content */}
                    <div className="rounded-lg border border-border bg-card p-4">
                        <h4 className="mb-3 font-semibold">Submission Details</h4>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {submission.submissionContent}
                            </p>
                        </div>
                    </div>

                    {/* Attached Files */}
                    {submission.submissionFiles && submission.submissionFiles.length > 0 && (
                        <div className="rounded-lg border border-border bg-card p-4">
                            <h4 className="mb-3 font-semibold">Attached Files</h4>
                            <div className="space-y-2">
                                {submission.submissionFiles.map((file, index) => {
                                    const fileName = getFileNameFromUrl(file, index + 1);
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 pr-3">
                                                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate max-w-[320px]">{fileName}</p>
                                                    <p className="text-xs text-muted-foreground">Attachment {index + 1}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="shrink-0"
                                                onClick={() => downloadOrOpenFile(file, fileName)}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Guidance */}
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                        <h4 className="mb-2 font-semibold">Review Checklist</h4>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li>• Does the submission meet the milestone requirements?</li>
                            <li>• Have all deliverables been provided?</li>
                            <li>• Is the quality of work acceptable?</li>
                            <li>• Are there any issues that need revision?</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {onReject && (
                        <Button variant="outline" onClick={onReject} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            Request Changes
                        </Button>
                    )}
                    {onApprove && (
                        <Button onClick={onApprove} className="bg-primary hover:bg-primary/90">
                            Approve Milestone
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MilestoneSubmissionViewer;
