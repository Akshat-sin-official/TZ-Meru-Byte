import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiClient } from '@/services/apiClient';
import { Loader2, Smartphone, CheckCircle2 } from 'lucide-react';

interface MobileChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMobile: string;
  onRequestSubmitted?: () => void;
}

export const MobileChangeModal: React.FC<MobileChangeModalProps> = ({
  open,
  onOpenChange,
  currentMobile,
  onRequestSubmitted,
}) => {
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newMobileNumber.trim();
    if (!cleaned) {
      toast.error('Please enter the new mobile number.');
      return;
    }

    if (!/^\+?[0-9]{10,15}$/.test(cleaned.replace(/[\s-]/g, ''))) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<{ success: boolean; message?: string }>('/v1/expert/profile/request-mobile-change', {
        newMobileNumber: cleaned,
      });

      if (response.data.success) {
        setSubmittedSuccess(true);
        toast.success(response.data.message || 'Mobile number change request submitted.');
        onRequestSubmitted?.();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to submit request.';
      const cleanMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
      toast.error(cleanMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSubmittedSuccess(false);
    setNewMobileNumber('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 font-poppins flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#FF5722]" />
            Edit Mobile Number
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            For security and account safety, mobile number changes are verified by the MarTechAdda team.
          </DialogDescription>
        </DialogHeader>

        {submittedSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Mobile Number Change Requested</h4>
            <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
              Your request has been submitted for review. We'll notify you once your mobile number is updated.
            </p>
            <Button
              onClick={handleClose}
              className="mt-4 rounded-full px-6 text-xs font-bold bg-[#FF5722] hover:bg-[#E64A19] text-white"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Current Mobile Number</Label>
              <Input
                value={currentMobile || 'N/A'}
                readOnly
                disabled
                className="mt-1 bg-gray-50 text-gray-500 font-medium"
              />
            </div>

            <div>
              <Label htmlFor="newMobileNumber" className="text-xs font-semibold text-gray-700">
                New Mobile Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="newMobileNumber"
                placeholder="+91 98765 43210"
                value={newMobileNumber}
                onChange={(e) => setNewMobileNumber(e.target.value)}
                className="mt-1 font-medium"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">Your request will be reviewed by the MarTechAdda team.</p>
            </div>

            <DialogFooter className="flex gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-full text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !newMobileNumber.trim()}
                className="rounded-full text-xs font-bold bg-[#FF5722] hover:bg-[#E64A19] text-white shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : (
                  'Request Mobile Number Change'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
