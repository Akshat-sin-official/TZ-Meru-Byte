import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, Building, CreditCard, FileCheck, CheckCircle2, Loader2, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiClient } from '@/services';
import { ContextualPayoutBanner } from './ContextualPayoutBanner';

interface WorkspaceTrustTabProps {
  initialData?: any;
  onSaved?: () => void;
}

export const WorkspaceTrustTab: React.FC<WorkspaceTrustTabProps> = ({
  initialData,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);

  // Legal Entity Type
  const [entityType, setEntityType] = useState(initialData?.entityType || 'proprietorship');

  // Prefilled & Frozen GST Data from Onboarding
  const gstRegistered = initialData?.gstStatus === 'gst_registered' || !!initialData?.gstNumber || initialData?.gstApplicable;
  const gstNumber = initialData?.gstNumber || 'Not Registered';

  // Address Verification
  const [addressLine1, setAddressLine1] = useState(initialData?.addressLine1 || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || 'Maharashtra');
  const [pincode, setPincode] = useState(initialData?.pincode || '');

  // Entity & Identity Proofs
  const [panNumber, setPanNumber] = useState(initialData?.panNumber || '');
  const [panProofFile, setPanProofFile] = useState<File | null>(null);
  const [coiFile, setCoiFile] = useState<File | null>(null);
  const [deedFile, setDeedFile] = useState<File | null>(null);
  const [signatoryPanFile, setSignatoryPanFile] = useState<File | null>(null);

  // Bank Details
  const [accountHolderName, setAccountHolderName] = useState(initialData?.accountHolderName || '');
  const [bankName, setBankName] = useState(initialData?.bankName || '');
  const [branchName, setBranchName] = useState(initialData?.branchName || '');
  const [accountType, setAccountType] = useState(initialData?.accountType || 'savings');
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(initialData?.ifscCode || '');
  const [bankProofFile, setBankProofFile] = useState<File | null>(null);
  const [upiId, setUpiId] = useState(initialData?.upiId || '');

  // Synchronize state when initialData loads or changes
  useEffect(() => {
    if (!initialData) return;
    const tc = initialData.trustCompliance || {};
    const bd = initialData.bankDetails || {};
    const addr = initialData.registeredAddress || {};

    if (initialData.entityType) setEntityType(initialData.entityType);
    if (tc.addressLine1 || initialData.addressLine1 || addr.line1) {
      setAddressLine1(tc.addressLine1 || initialData.addressLine1 || addr.line1 || '');
    }
    if (tc.city || initialData.city || addr.city) {
      setCity(tc.city || initialData.city || addr.city || '');
    }
    if (tc.state || initialData.state || addr.state) {
      setState(tc.state || initialData.state || addr.state || 'Maharashtra');
    }
    if (tc.pincode || initialData.pincode || addr.pincode) {
      setPincode(tc.pincode || initialData.pincode || addr.pincode || '');
    }
    if (tc.panNumber || initialData.panNumber) {
      setPanNumber(tc.panNumber || initialData.panNumber || '');
    }
    if (tc.accountHolderName || bd.accountHolderName || initialData.accountHolderName) {
      setAccountHolderName(tc.accountHolderName || bd.accountHolderName || initialData.accountHolderName || '');
    }
    if (tc.bankName || bd.bankName || initialData.bankName) {
      setBankName(tc.bankName || bd.bankName || initialData.bankName || '');
    }
    if (tc.branchName || bd.branchName || initialData.branchName) {
      setBranchName(tc.branchName || bd.branchName || initialData.branchName || '');
    }
    if (tc.accountType || bd.accountType || initialData.accountType) {
      setAccountType(tc.accountType || bd.accountType || initialData.accountType || 'savings');
    }
    if (tc.accountNumber || bd.accountNumber || initialData.accountNumber) {
      setAccountNumber(tc.accountNumber || bd.accountNumber || initialData.accountNumber || '');
    }
    if (tc.ifscCode || bd.ifscCode || initialData.ifscCode) {
      setIfscCode(tc.ifscCode || bd.ifscCode || initialData.ifscCode || '');
    }
    if (tc.upiId || bd.upiId || initialData.upiId) {
      setUpiId(tc.upiId || bd.upiId || initialData.upiId || '');
    }
  }, [initialData]);

  // Status & Lock
  const trustStatus = (initialData?.trustCompliance?.trustStatus || initialData?.trustStatus || 'pending').toLowerCase();
  const isFormLocked = trustStatus === 'submitted' || trustStatus === 'under_verification' || trustStatus === 'verified';

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      await apiClient.post('/v1/expert/onboarding/stage4', {
        trustCompliance: {
          entityType,
          addressLine1,
          city,
          state,
          pincode,
          panNumber: panNumber.toUpperCase(),
          accountHolderName,
          bankName,
          branchName,
          accountType,
          accountNumber,
          ifscCode: ifscCode.toUpperCase(),
          upiId,
          trustStatus: 'draft',
        },
      });
      toast.success('Draft saved successfully!');
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      toast.error(err?.response?.data?.error || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/v1/expert/compliance/request-update', {
        entityType,
        reason: 'Workspace Legal & Compliance Verification Submission',
        bankDetails: {
          accountHolderName,
          bankName,
          branchName,
          accountType: accountType as 'savings' | 'current',
          accountNumber,
          ifscCode: ifscCode.toUpperCase(),
          upiId,
        },
      });

      toast.success('Legal & Compliance submitted for verification!');
      if (onSaved) onSaved();
    } catch (err: any) {
      // Fallback attempt to stage4 payload if request-update status is none
      try {
        await apiClient.post('/v1/expert/onboarding/stage4', {
          trustCompliance: {
            entityType,
            addressLine1,
            city,
            state,
            pincode,
            panNumber: panNumber.toUpperCase(),
            accountHolderName,
            bankName,
            branchName,
            accountType,
            accountNumber,
            ifscCode: ifscCode.toUpperCase(),
            upiId,
            trustStatus: 'submitted',
          },
        });
        toast.success('Legal & Compliance submitted for verification!');
        if (onSaved) onSaved();
      } catch (stage4Err: any) {
        console.error('Failed to submit Legal & Compliance:', stage4Err);
        toast.error(stage4Err?.response?.data?.error || err?.response?.data?.error || 'Failed to submit details');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Contextual Payout Banner */}
      <ContextualPayoutBanner trustStatus={trustStatus} />

      <form onSubmit={handleSubmitForVerification} className="space-y-8">

        {/* Section 1: Entity Type & Frozen GST Information */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-poppins">Legal Entity &amp; GST Details</h3>
              <p className="text-xs text-gray-500">GST information collected during onboarding is prefilled and frozen.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entityType" className="text-xs font-bold text-gray-700">Legal Entity Type *</Label>
              <select
                id="entityType"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                disabled={isFormLocked}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none disabled:bg-gray-100"
              >
                <option value="proprietorship">Sole Proprietorship / Individual</option>
                <option value="partnership">Partnership Firm</option>
                <option value="llp">Limited Liability Partnership (LLP)</option>
                <option value="pvt_ltd">Private Limited / Public Limited</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">GST Registered Status (Prefilled)</Label>
              <Input
                value={gstRegistered ? 'GST Registered' : 'Not GST Registered'}
                disabled
                className="mt-1 text-sm bg-gray-100 font-semibold text-gray-700"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">GSTIN Number (Prefilled)</Label>
              <Input
                value={gstNumber}
                disabled
                className="mt-1 text-sm bg-gray-100 font-mono text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dynamic Identity & Entity Proofs */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-poppins">Identity &amp; Entity Documents</h3>
              <p className="text-xs text-gray-500">
                Required document uploads customized for your selected Entity Type ({entityType.toUpperCase()}).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="panNumber" className="text-xs font-bold text-gray-700">Permanent Account Number (PAN) *</Label>
              <Input
                id="panNumber"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                required
                disabled={isFormLocked}
                className="mt-1 text-sm font-mono uppercase"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">Upload Entity / Individual PAN Proof *</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={isFormLocked}
                onChange={(e) => setPanProofFile(e.target.files?.[0] || null)}
                className="mt-1 text-xs"
              />
            </div>

            {/* Dynamic fields based on Entity Type */}
            {(entityType === 'llp' || entityType === 'pvt_ltd') && (
              <div>
                <Label className="text-xs font-bold text-gray-700">
                  Certificate of Incorporation (COI) *
                </Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={isFormLocked}
                  onChange={(e) => setCoiFile(e.target.files?.[0] || null)}
                  className="mt-1 text-xs"
                />
              </div>
            )}

            {entityType === 'partnership' && (
              <div>
                <Label className="text-xs font-bold text-gray-700">Partnership Deed *</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={isFormLocked}
                  onChange={(e) => setDeedFile(e.target.files?.[0] || null)}
                  className="mt-1 text-xs"
                />
              </div>
            )}

            {entityType !== 'proprietorship' && (
              <div>
                <Label className="text-xs font-bold text-gray-700">Authorised Signatory PAN Proof *</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={isFormLocked}
                  onChange={(e) => setSignatoryPanFile(e.target.files?.[0] || null)}
                  className="mt-1 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Business Address Verification */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-poppins">Business Address Verification</h3>
              <p className="text-xs text-gray-500">Shop Act Certificate, Utility Bill, or Rent Agreement</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="addressLine1" className="text-xs font-bold text-gray-700">Address Line 1 *</Label>
              <Input
                id="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Building, Street name"
                required
                disabled={isFormLocked}
                className="mt-1 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="text-xs font-bold text-gray-700">City *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  required
                  disabled={isFormLocked}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-xs font-bold text-gray-700">State *</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  required
                  disabled={isFormLocked}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="pincode" className="text-xs font-bold text-gray-700">Pincode *</Label>
                <Input
                  id="pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Pincode"
                  required
                  disabled={isFormLocked}
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Bank Details for Payouts */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-poppins">Bank Details for Payouts</h3>
              <p className="text-xs text-gray-500">Required for platform payouts. Encrypted and protected.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountHolderName" className="text-xs font-bold text-gray-700">Account Holder Name *</Label>
              <Input
                id="accountHolderName"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Name as per bank records"
                required
                disabled={isFormLocked}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="bankName" className="text-xs font-bold text-gray-700">Bank Name *</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="HDFC Bank"
                required
                disabled={isFormLocked}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="accountType" className="text-xs font-bold text-gray-700">Account Type *</Label>
              <select
                id="accountType"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                disabled={isFormLocked}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none disabled:bg-gray-100"
              >
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
              </select>
            </div>
            <div>
              <Label htmlFor="accountNumber" className="text-xs font-bold text-gray-700">Account Number *</Label>
              <Input
                id="accountNumber"
                type="password"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account Number"
                required
                disabled={isFormLocked}
                className="mt-1 text-sm font-mono"
              />
            </div>
            <div>
              <Label htmlFor="ifscCode" className="text-xs font-bold text-gray-700">IFSC Code *</Label>
              <Input
                id="ifscCode"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="HDFC0001234"
                maxLength={11}
                required
                disabled={isFormLocked}
                className="mt-1 text-sm font-mono uppercase"
              />
            </div>
            <div>
              <Label htmlFor="upiId" className="text-xs font-bold text-gray-700">UPI ID (Optional)</Label>
              <Input
                id="upiId"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@bank / upi"
                disabled={isFormLocked}
                className="mt-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Controls: Save Draft + Submit for Verification */}
        {!isFormLocked && (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={loading}
              className="w-full sm:w-auto rounded-full px-6 py-3 text-sm font-semibold border-gray-300"
            >
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-full px-8 py-3 text-sm font-bold bg-primary hover:bg-primary/95 text-white shadow-md"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Submit for Verification</>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
