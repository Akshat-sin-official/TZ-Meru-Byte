import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiClient } from '@/services/apiClient';
import { fileToBase64 } from '@/utils/fileUtils';
import { Loader2, UploadCloud, FileCheck } from 'lucide-react';

interface LegalNameChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLegalName: string;
  onRequestSubmitted?: () => void;
}

export const LegalNameChangeModal: React.FC<LegalNameChangeModalProps> = ({
  open,
  onOpenChange,
  currentLegalName,
  onRequestSubmitted,
}) => {
  const [newLegalName, setNewLegalName] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLegalName.trim()) {
      toast.error('Please enter the new legal registered name.');
      return;
    }

    if (!docFile) {
      toast.error('Supporting document proof is mandatory for legal name change.');
      return;
    }

    setIsSubmitting(true);
    try {
      const base64Str = await fileToBase64(docFile);
      const supportingDocumentUrl = `data:${docFile.type || 'application/pdf'};base64,${base64Str}`;

      const response = await apiClient.post<{ success: boolean; message?: string }>('/v1/expert/profile/request-legal-name-change', {
        newLegalName: newLegalName.trim(),
        supportingDocumentUrl,
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Legal name change requested successfully.');
        setNewLegalName('');
        setDocFile(null);
        onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 font-poppins">
            Request Legal Name Change
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Because legal name is identity and compliance related, changes require admin verification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div>
            <Label className="text-xs font-semibold text-gray-700">Current Legal Name</Label>
            <Input
              value={currentLegalName || 'N/A'}
              readOnly
              disabled
              className="mt-1 bg-gray-50 text-gray-500 font-medium"
            />
          </div>

          <div>
            <Label htmlFor="newLegalName" className="text-xs font-semibold text-gray-700">
              New Legal Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="newLegalName"
              placeholder="Enter new legal name"
              value={newLegalName}
              onChange={(e) => setNewLegalName(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700">
              Supporting Document (Mandatory) <span className="text-red-500">*</span>
            </Label>
            <p className="text-[11px] text-gray-400 mb-2">Upload government proof of legal name change (PAN / Aadhaar / Gazette / Certificate of Incorporation, max 10MB)</p>
            
            <label className="border-2 border-dashed border-gray-200 hover:border-[#FF5722] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-orange-50/20">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('File size must be under 10MB');
                      return;
                    }
                    setDocFile(file);
                  }
                }}
              />
              {docFile ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <FileCheck className="w-5 h-5" />
                  <span className="text-xs font-semibold truncate max-w-[200px]">{docFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <UploadCloud className="w-6 h-6 text-gray-400" />
                  <span className="text-xs font-medium">Click to upload document</span>
                  <span className="text-[10px] text-gray-400">PDF, PNG, JPG</span>
                </div>
              )}
            </label>
          </div>

          <DialogFooter className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-full text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !newLegalName.trim() || !docFile}
              className="rounded-full text-xs font-bold bg-[#FF5722] hover:bg-[#E64A19] text-white shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                'Request Name Change'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
