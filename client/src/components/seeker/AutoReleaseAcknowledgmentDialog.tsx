import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle, Clock, Shield, CheckCircle } from 'lucide-react';

interface AutoReleaseAcknowledgmentDialogProps {
    open: boolean;
    onAcknowledge: () => void;
    onClose: () => void;
}

const AutoReleaseAcknowledgmentDialog = ({
    open,
    onAcknowledge,
    onClose,
}: AutoReleaseAcknowledgmentDialogProps) => {
    const [acknowledged, setAcknowledged] = useState(false);

    // Reset acknowledgment when dialog opens
    useEffect(() => {
        if (open) {
            setAcknowledged(false);
        }
    }, [open]);

    const handleAcknowledge = () => {
        if (acknowledged) {
            onAcknowledge();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        Important: Auto-Release Policy
                    </DialogTitle>
                    <DialogDescription>
                        Please read and acknowledge our milestone approval policy
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Main Policy Explanation */}
                    <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 dark:bg-orange-950/20">
                        <div className="mb-3 flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-orange-600" />
                            <div>
                                <h4 className="mb-1 font-semibold text-orange-900 dark:text-orange-100">
                                    2 Business Day Response Window
                                </h4>
                                <p className="text-sm text-orange-800 dark:text-orange-200">
                                    When an expert submits a milestone for your review, you have{' '}
                                    <strong>2 business days</strong> to respond. If you don't approve, reject, or
                                    request revisions within this timeframe, the funds will be{' '}
                                    <strong>automatically released</strong> to the expert.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-lg border border-border bg-card p-4">
                        <h4 className="mb-3 font-semibold">How It Works:</h4>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                    1
                                </div>
                                <div>
                                    <p className="font-medium">Expert Submits Milestone</p>
                                    <p className="text-sm text-muted-foreground">
                                        You'll receive an immediate notification with submission details
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                                    2
                                </div>
                                <div>
                                    <p className="font-medium">Day 1: First Reminder</p>
                                    <p className="text-sm text-muted-foreground">
                                        We'll send you a reminder to review the submission
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                                    3
                                </div>
                                <div>
                                    <p className="font-medium">Day 2: Final Notice</p>
                                    <p className="text-sm text-muted-foreground">
                                        Final reminder that auto-release is scheduled
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                                    !
                                </div>
                                <div>
                                    <p className="font-medium text-orange-600">After 2 Business Days</p>
                                    <p className="text-sm text-muted-foreground">
                                        If no response, admin will execute auto-release and funds will be transferred
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Your Options */}
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                        <h4 className="mb-3 font-semibold">Your Response Options:</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                                <span>
                                    <strong>Approve:</strong> Release funds immediately if work meets requirements
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                                <span>
                                    <strong>Request Revision:</strong> Ask expert to make changes (timer resets on
                                    resubmission)
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                                <span>
                                    <strong>Reject:</strong> Decline the submission with detailed feedback
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Dispute Protection */}
                    <div className="rounded-lg border border-border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold">Dispute Protection</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            If you raise a dispute on an engagement, auto-release is automatically blocked for
                            all pending milestones until the dispute is resolved. Your funds remain protected.
                        </p>
                    </div>

                    {/* Acknowledgment Checkbox */}
                    <div className="flex items-start space-x-3 rounded-lg border-2 border-primary bg-primary/5 p-4">
                        <Checkbox
                            id="acknowledge-auto-release"
                            checked={acknowledged}
                            onCheckedChange={(checked) => setAcknowledged(checked === true)}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <Label
                                htmlFor="acknowledge-auto-release"
                                className="cursor-pointer text-sm font-medium leading-relaxed"
                            >
                                I understand and acknowledge the 2 business day auto-release policy. I will respond
                                to milestone submissions within this timeframe to maintain control over fund
                                releases.
                            </Label>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleAcknowledge}
                        disabled={!acknowledged}
                        className="w-full bg-primary hover:bg-primary/90"
                    >
                        I Understand — Continue to Dashboard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AutoReleaseAcknowledgmentDialog;
