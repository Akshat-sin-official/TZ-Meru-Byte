import { useState } from 'react';
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
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface Milestone {
    id: string;
    title: string;
    amount: number;
    percentage: number;
    submissionId?: string;
}

interface Engagement {
    id: string;
    expertName: string;
    totalDeposit: number;
}

interface ApproveMilestoneConfirmationDialogProps {
    open: boolean;
    milestone: Milestone;
    engagement: Engagement;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ApproveMilestoneConfirmationDialog = ({
    open,
    milestone,
    engagement,
    onConfirm,
    onCancel,
    isLoading = false,
}: ApproveMilestoneConfirmationDialogProps) => {
    const [acknowledged, setAcknowledged] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleConfirm = () => {
        if (acknowledged) {
            onConfirm();
        }
    };

    const handleCancel = () => {
        setAcknowledged(false);
        onCancel();
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        Confirm Milestone Approval
                    </DialogTitle>
                    <DialogDescription>
                        Please review the details carefully before approving this milestone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Milestone Details */}
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                        <h4 className="mb-3 font-semibold">Milestone Details</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Title:</span>
                                <span className="font-medium">{milestone.title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Expert:</span>
                                <span className="font-medium">{engagement.expertName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Percentage:</span>
                                <span className="font-medium">{milestone.percentage}%</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-2">
                                <span className="text-muted-foreground">Amount to Release:</span>
                                <span className="text-lg font-bold text-primary">
                                    {formatCurrency(milestone.amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Critical Warning */}
                    <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 dark:bg-orange-950/20">
                        <div className="mb-2 flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                            <div>
                                <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                                    This Action Cannot Be Undone
                                </h4>
                                <p className="mt-1 text-sm text-orange-800 dark:text-orange-200">
                                    Once you approve this milestone, the funds will be immediately released to the
                                    expert. You will not be able to reverse this action or recall the payment.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* What Happens Next */}
                    <div className="rounded-lg border border-border bg-card p-4">
                        <h4 className="mb-2 font-semibold">What happens when you approve:</h4>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                <span>
                                    {formatCurrency(milestone.amount)} will be released from your held deposit
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                <span>The expert will receive immediate payment notification</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                <span>Admin will process the fund transfer within 24 hours</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                <span>This milestone will be marked as complete</span>
                            </li>
                        </ul>
                    </div>

                    {/* Acknowledgment Checkbox */}
                    <div className="flex items-start space-x-3 rounded-lg border border-border bg-secondary/30 p-4">
                        <Checkbox
                            id="acknowledge"
                            checked={acknowledged}
                            onCheckedChange={(checked) => setAcknowledged(checked === true)}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <Label
                                htmlFor="acknowledge"
                                className="cursor-pointer text-sm font-medium leading-relaxed"
                            >
                                I understand that this action is final and irreversible. I have reviewed the
                                milestone submission and confirm that the work meets my requirements.
                            </Label>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!acknowledged || isLoading}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Approving...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve & Release {formatCurrency(milestone.amount)}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ApproveMilestoneConfirmationDialog;
