import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ShieldAlert } from 'lucide-react';
import { expertService } from '@/services/expertService';
import { useQueryClient } from '@tanstack/react-query';

const ENTITY_TYPE_OPTIONS = [
    { value: 'individual', label: 'Individual' },
    { value: 'proprietorship', label: 'Proprietorship' },
    { value: 'opc', label: 'One Person Company (OPC)' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
    { value: 'private_limited', label: 'Private Limited' },
    { value: 'public_limited', label: 'Public Limited' },
];

interface BankDetailsForm {
    accountHolderName: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: 'savings' | 'current';
    upiId: string;
}

interface ComplianceUpdateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    field: string; // 'entityType' | 'bankDetails' | legacy single field name
    fieldLabel: string;
    currentValues?: {
        entityType?: string;
        bankDetails?: Partial<BankDetailsForm>;
        businessName?: string;
    };
    pendingValues?: {
        entityType?: string;
        bankDetails?: Partial<BankDetailsForm>;
        businessName?: string;
    };
    changeRequestStatus?: string;
}

export const ComplianceUpdateModal = ({
    open,
    onOpenChange,
    field,
    fieldLabel,
    currentValues,
    pendingValues,
    changeRequestStatus,
}: ComplianceUpdateModalProps) => {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [entityType, setEntityType] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [bankDetails, setBankDetails] = useState<BankDetailsForm>({
        accountHolderName: '',
        bankName: '',
        branchName: '',
        accountNumber: '',
        ifscCode: '',
        accountType: 'savings',
        upiId: '',
    });

    // Pre-populate when revising
    useEffect(() => {
        if (open) {
            if (changeRequestStatus === 'changes_requested' && pendingValues) {
                if (field === 'entityType' && pendingValues.entityType) {
                    setEntityType(pendingValues.entityType);
                }
                if (field === 'businessName' && pendingValues.businessName) {
                    setBusinessName(pendingValues.businessName);
                }
                if (field === 'bankDetails' && pendingValues.bankDetails) {
                    setBankDetails({
                        accountHolderName: pendingValues.bankDetails.accountHolderName || '',
                        bankName: pendingValues.bankDetails.bankName || '',
                        branchName: pendingValues.bankDetails.branchName || '',
                        accountNumber: pendingValues.bankDetails.accountNumber || '',
                        ifscCode: pendingValues.bankDetails.ifscCode || '',
                        accountType: pendingValues.bankDetails.accountType || 'savings',
                        upiId: pendingValues.bankDetails.upiId || '',
                    });
                }
            } else {
                // Reset form
                setEntityType(currentValues?.entityType || '');
                setBusinessName(currentValues?.businessName || '');
                setBankDetails({
                    accountHolderName: '',
                    bankName: '',
                    branchName: '',
                    accountNumber: '',
                    ifscCode: '',
                    accountType: 'savings',
                    upiId: '',
                });
            }
            setReason('');
        }
    }, [open, field, changeRequestStatus, pendingValues, currentValues]);

    const validateBankDetails = (): string | null => {
        if (!bankDetails.accountHolderName.trim()) return 'Account Holder Name is required';
        if (!bankDetails.bankName.trim()) return 'Bank Name is required';
        if (!bankDetails.accountNumber.trim()) return 'Account Number is required';
        if (!/^\d{9,18}$/.test(bankDetails.accountNumber.trim())) return 'Account Number must be 9-18 digits';
        if (!bankDetails.ifscCode.trim()) return 'IFSC Code is required';
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bankDetails.ifscCode.trim())) return 'Invalid IFSC format (e.g., HDFC0001234)';
        return null;
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error('Please provide a reason for the update request');
            return;
        }

        // Validate based on field type
        if (field === 'entityType' && !entityType) {
            toast.error('Please select an entity type');
            return;
        }

        if (field === 'businessName' && !businessName.trim()) {
            toast.error('Please enter a new business name');
            return;
        }

        if (field === 'bankDetails') {
            const bankError = validateBankDetails();
            if (bankError) {
                toast.error(bankError);
                return;
            }
        }

        setLoading(true);
        try {
            const payload: any = { reason: reason.trim() };

            if (field === 'entityType') {
                payload.entityType = entityType;
            } else if (field === 'businessName') {
                payload.businessName = businessName.trim();
            } else if (field === 'bankDetails') {
                payload.bankDetails = {
                    accountHolderName: bankDetails.accountHolderName.trim(),
                    bankName: bankDetails.bankName.trim(),
                    branchName: bankDetails.branchName.trim(),
                    accountNumber: bankDetails.accountNumber.trim(),
                    ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
                    accountType: bankDetails.accountType,
                    upiId: bankDetails.upiId.trim(),
                };
            }

            await expertService.requestComplianceUpdate(payload);

            toast.success(`Update request for ${fieldLabel} submitted. Our team will review it shortly.`);
            queryClient.invalidateQueries({ queryKey: ['expertProfile'] });
            onOpenChange(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to submit request';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => {
        if (field === 'businessName') {
            return (
                <div className="space-y-2">
                    <Label>New Business / Full Name</Label>
                    <Input
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        placeholder="Enter your new business or full name"
                    />
                    {currentValues?.businessName && (
                        <p className="text-xs text-muted-foreground">Current: {currentValues.businessName}</p>
                    )}
                </div>
            );
        }

        if (field === 'entityType') {
            return (
                <div className="space-y-2">
                    <Label>New Entity Type</Label>
                    <Select value={entityType} onValueChange={setEntityType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select entity type" />
                        </SelectTrigger>
                        <SelectContent>
                            {ENTITY_TYPE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {currentValues?.entityType && (
                        <p className="text-xs text-muted-foreground">Current: {currentValues.entityType}</p>
                    )}
                </div>
            );
        }

        if (field === 'bankDetails') {
            return (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Account Holder Name *</Label>
                            <Input
                                value={bankDetails.accountHolderName}
                                onChange={e => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                                placeholder="As per bank records"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Bank Name *</Label>
                            <Input
                                value={bankDetails.bankName}
                                onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                placeholder="e.g., HDFC Bank"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Branch Name</Label>
                            <Input
                                value={bankDetails.branchName}
                                onChange={e => setBankDetails({ ...bankDetails, branchName: e.target.value })}
                                placeholder="Branch name"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Account Type *</Label>
                            <Select value={bankDetails.accountType} onValueChange={(v: 'savings' | 'current') => setBankDetails({ ...bankDetails, accountType: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="savings">Savings</SelectItem>
                                    <SelectItem value="current">Current</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Account Number *</Label>
                            <Input
                                value={bankDetails.accountNumber}
                                onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '') })}
                                placeholder="9-18 digit account number"
                                maxLength={18}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">IFSC Code *</Label>
                            <Input
                                value={bankDetails.ifscCode}
                                onChange={e => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                                placeholder="e.g., HDFC0001234"
                                maxLength={11}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">UPI ID (optional)</Label>
                        <Input
                            value={bankDetails.upiId}
                            onChange={e => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                            placeholder="e.g., name@upi"
                        />
                    </div>
                </div>
            );
        }

        // Legacy fallback for other fields (e.g., businessName)
        return null;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <ShieldAlert className="h-5 w-5" />
                        {changeRequestStatus === 'changes_requested' ? 'Revise & Resubmit' : 'Request Update'}: {fieldLabel}
                    </DialogTitle>
                    <DialogDescription>
                        This field is part of your verified legal identity. Updates require review by our compliance team.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {renderForm()}

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Change *</Label>
                        <Textarea
                            id="reason"
                            placeholder={`Why do you need to update your ${fieldLabel.toLowerCase()}?`}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                        <p className="font-medium">What happens next?</p>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>Our team will review your request within 24-48 hours.</li>
                            <li>Your current details remain active until approval.</li>
                            <li>You'll be notified once the update is processed.</li>
                        </ul>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !reason.trim()}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {changeRequestStatus === 'changes_requested' ? 'Resubmit' : 'Submit Request'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
