/**
 * Final Profile Review - Replaced with Seeker Onboarding Form
 * 
 * Collects and validates all Legal, Tax, Address, and compliance details before deposit.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MainLayout } from '@/components/layout/MainLayout';
import { INDIAN_STATES } from '@/data/taxonomy';
import { apiClient, seekerService } from '@/services';
import { Loader2, ArrowRight, Save, Lock, Upload, FileCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fileToBase64 } from '@/utils/fileUtils';

const ENTITY_TYPES = [
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'LLP' },
  { value: 'opc', label: 'OPC' },
  { value: 'private_limited', label: 'Private Limited' },
  { value: 'public_limited', label: 'Public Limited' },
];

const QUOTATION_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'director', label: 'Director' },
  { value: 'authorized_signatory', label: 'Authorized Signatory' },
];

const ProfileReview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const quotationId = searchParams.get('quotationId');
  const engagementIdFromQuery = searchParams.get('engagementId');
  const [currentStep, setCurrentStep] = useState<'identity' | 'contact' | 'legal' | 'review'>('identity');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch seeker profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['seekerProfileReview'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/seeker/profile');
      return response.data.data;
    },
  });

  const [formData, setFormData] = useState({
    // Identity
    legalEntityName: '',
    entityType: '',
    quotationRole: 'owner',
    panAvailable: '', // 'yes' | 'no'
    isGstRegistered: '',
    city: '',
    state: '',
    panNumber: '',
    gstNumber: '',

    // Contact
    officialEmail: user?.email || '',
    mobileNumber: '',
    whatsappNumber: '',
    isWhatsappSameAsMobile: false,
    authorizedContactName: '',

    // Legal & Compliance
    businessAddressLine1: '',
    businessAddressLine2: '',
    businessCity: '',
    businessState: '',
    businessPinCode: '',
    isBillingSameAsBusiness: 'yes',
    
    billingAddressLine1: '',
    billingAddressLine2: '',
    billingCity: '',
    billingState: '',
    billingPinCode: '',

    // Uploads (base64)
    businessProofFile: null as any,
    gstCertificateFile: null as any,
    panCardFile: null as any,
    bankProofFile: null as any,

    // Bank Details
    bankAccountHolderName: '',
    bankAccountNumber: '',
    bankIfscCode: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        legalEntityName: profile.legalEntityName || '',
        entityType: profile.entityType || '',
        quotationRole: profile.quotationRole || 'owner',
        panAvailable: profile.panAvailable !== undefined ? (profile.panAvailable ? 'yes' : 'no') : (profile.panNumber ? 'yes' : ''),
        isGstRegistered: profile.gstStatus === 'registered' ? 'yes' : (profile.gstStatus === 'not_registered' ? 'no' : ''),
        city: profile.registeredAddress?.city || profile.billingAddress?.city || '',
        state: profile.registeredAddress?.state || profile.billingAddress?.state || '',
        panNumber: profile.panNumber || '',
        gstNumber: profile.gstNumber || '',

        officialEmail: profile.userId?.email || user?.email || '',
        mobileNumber: profile.mobileNumber || '',
        whatsappNumber: profile.whatsappNumber || '',
        isWhatsappSameAsMobile: profile.whatsappNumber === profile.mobileNumber,
        authorizedContactName: profile.userId?.fullName || user?.fullName || '',

        businessAddressLine1: profile.registeredAddress?.line1 || profile.billingAddress?.line1 || '',
        businessAddressLine2: profile.registeredAddress?.line2 || profile.billingAddress?.line2 || '',
        businessCity: profile.registeredAddress?.city || profile.billingAddress?.city || '',
        businessState: profile.registeredAddress?.state || profile.billingAddress?.state || '',
        businessPinCode: profile.registeredAddress?.pincode || profile.billingAddress?.postalCode || '',
        isBillingSameAsBusiness: profile.isBillingSameAsBusiness === false ? 'no' : 'yes',

        billingAddressLine1: profile.billingAddress?.line1 || '',
        billingAddressLine2: profile.billingAddress?.line2 || '',
        billingCity: profile.billingAddress?.city || '',
        billingState: profile.billingAddress?.state || '',
        billingPinCode: profile.billingAddress?.postalCode || '',

        businessProofFile: profile.documents?.find((d: any) => d.documentType === 'business_proof') ? { name: 'Uploaded Business Proof', base64: '' } : null,
        gstCertificateFile: profile.documents?.find((d: any) => d.documentType === 'gst_certificate') ? { name: 'Uploaded GST', base64: '' } : null,
        panCardFile: profile.documents?.find((d: any) => d.documentType === 'pan_card') ? { name: 'Uploaded PAN', base64: '' } : null,
        bankProofFile: profile.bankDetails?.proofUrl ? { name: 'Uploaded Bank Proof', base64: '' } : null,

        bankAccountHolderName: profile.bankDetails?.accountHolderName || '',
        bankAccountNumber: profile.bankDetails?.accountNumber || '',
        bankIfscCode: profile.bankDetails?.ifscCode || '',
      });
    }
  }, [profile, user]);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'city' && !prev.businessCity) {
        next.businessCity = value;
      }
      if (field === 'state' && !prev.businessState) {
        next.businessState = value;
      }
      return next;
    });
  };

  const handleMobileChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      mobileNumber: value,
      whatsappNumber: prev.isWhatsappSameAsMobile ? value : prev.whatsappNumber,
    }));
  };

  const toggleWhatsappSync = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isWhatsappSameAsMobile: checked,
      whatsappNumber: checked ? prev.mobileNumber : prev.whatsappNumber,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      updateFormData(fileKey, {
        base64,
        name: file.name,
        type: file.type,
      });
      toast.success(`${file.name} attached`);
    } catch (err) {
      toast.error('Failed to convert file');
    }
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        legalEntityName: data.legalEntityName,
        entityType: data.entityType,
        quotationRole: data.quotationRole,
        panAvailable: data.panAvailable === 'yes',
        panNumber: data.panNumber,
        gstStatus: data.isGstRegistered === 'yes' ? 'registered' : 'not_registered',
        gstNumber: data.gstNumber || undefined,

        officialEmail: data.officialEmail,
        mobileNumber: data.mobileNumber,
        whatsappNumber: data.whatsappNumber || undefined,
        authorizedContactName: data.authorizedContactName,

        businessAddress: {
          line1: data.businessAddressLine1,
          line2: data.businessAddressLine2 || '',
          city: data.businessCity,
          state: data.businessState,
          postalCode: data.businessPinCode,
          country: 'India',
        },
        isBillingSameAsBusiness: data.isBillingSameAsBusiness === 'yes',
        
        billingAddress: data.isBillingSameAsBusiness === 'yes' ? {
          line1: data.businessAddressLine1,
          line2: data.businessAddressLine2 || '',
          city: data.businessCity,
          state: data.businessState,
          postalCode: data.businessPinCode,
          country: 'India',
        } : {
          line1: data.billingAddressLine1,
          line2: data.billingAddressLine2 || '',
          city: data.billingCity,
          state: data.billingState,
          postalCode: data.billingPinCode,
          country: 'India',
        },
        billingEmail: data.officialEmail,

        bankDetails: (data.bankAccountHolderName && data.bankAccountNumber && data.bankIfscCode) ? {
          accountHolderName: data.bankAccountHolderName,
          bankName: 'Client Associated Bank',
          accountNumber: data.bankAccountNumber,
          ifscCode: data.bankIfscCode,
          proofUrl: data.bankProofFile?.base64 ? `data:${data.bankProofFile.type};base64,${data.bankProofFile.base64}` : undefined,
        } : undefined,

        documents: [
          data.businessProofFile?.base64 && {
            documentType: 'business_proof',
            fileUrl: `data:${data.businessProofFile.type};base64,${data.businessProofFile.base64}`,
            verified: false,
            uploadedAt: new Date(),
          },
          data.gstCertificateFile?.base64 && {
            documentType: 'gst_certificate',
            fileUrl: `data:${data.gstCertificateFile.type};base64,${data.gstCertificateFile.base64}`,
            verified: false,
            uploadedAt: new Date(),
          },
          data.panCardFile?.base64 && {
            documentType: 'pan_card',
            fileUrl: `data:${data.panCardFile.type};base64,${data.panCardFile.base64}`,
            verified: false,
            uploadedAt: new Date(),
          },
        ].filter(Boolean) as any[],
      };

      const response = await apiClient.post('/v1/seeker/onboarding', payload);
      return response.data;
    },
    onSuccess: () => {
      setIsSaving(false);
      toast.success('Onboarding profile completed successfully!');
      
      // Auto-validate billing details internally
      if (engagementIdFromQuery) {
        navigate(`/payment/deposit?engagementId=${engagementIdFromQuery}`);
      } else {
        navigate('/seeker/dashboard');
      }
    },
    onError: (error: unknown) => {
      setIsSaving(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile details';
      toast.error(errorMessage);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    saveProfileMutation.mutate(formData);
  };

  const canProceedFromStep = (step: typeof currentStep): boolean => {
    switch (step) {
      case 'identity':
        return !!(
          formData.legalEntityName &&
          formData.entityType &&
          formData.quotationRole &&
          formData.panAvailable &&
          formData.isGstRegistered &&
          formData.city &&
          formData.state
        );
      case 'contact':
        return !!(formData.officialEmail && formData.mobileNumber && formData.authorizedContactName);
      case 'legal':
        const hasBusinessAddress = !!(formData.businessAddressLine1 && formData.businessCity && formData.businessState && formData.businessPinCode);
        const hasBillingAddress = formData.isBillingSameAsBusiness === 'yes' || !!(formData.billingAddressLine1 && formData.billingCity && formData.billingState && formData.billingPinCode);
        const isPanValid = formData.panAvailable !== 'yes' || !!formData.panNumber;
        const isGstValid = formData.isGstRegistered !== 'yes' || !!formData.gstNumber;
        return hasBusinessAddress && hasBillingAddress && isPanValid && isGstValid;
      default:
        return true;
    }
  };

  if (profileLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto border-2 border-foreground shadow-2xl bg-white">
          <CardHeader className="bg-slate-50 border-b pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Complete Business Profile for Compliance</CardTitle>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-[#FFF4F0] text-[#E55A2B] uppercase">Required for Deposit</span>
            </div>
            <CardDescription className="mt-2 text-slate-500">
              Please complete your onboarding profile details. These tax and billing fields are legally mandatory before you can deposit payments.
            </CardDescription>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <Lock className="h-4 w-4 text-yellow-600 shrink-0" />
              <p className="text-xs text-yellow-800 font-medium">
                Payment deposit is locked until legal profile setup is completed.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Step navigation tabs */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {(['identity', 'contact', 'legal', 'review'] as const).map((step, idx) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`py-2 text-xs font-bold uppercase rounded-md border text-center transition-all ${
                    currentStep === step 
                      ? 'bg-orange-600 text-white border-orange-600 shadow-md' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}. {step === 'legal' ? 'Legal Address' : step}
                </button>
              ))}
            </div>

            {/* IDENTITY STEP */}
            {currentStep === 'identity' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="legalEntityName">Legal / Brand Name *</Label>
                    <Input
                      id="legalEntityName"
                      value={formData.legalEntityName}
                      onChange={(e) => updateFormData('legalEntityName', e.target.value)}
                      placeholder="Enter legal or brand name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entityType">Entity Type *</Label>
                    <Select value={formData.entityType} onValueChange={(value) => updateFormData('entityType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quotationRole">Role Accepting Quotation *</Label>
                    <Select value={formData.quotationRole} onValueChange={(value) => updateFormData('quotationRole', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUOTATION_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="block mb-2 font-semibold">PAN Available? *</Label>
                    <RadioGroup
                      value={formData.panAvailable}
                      onValueChange={(value) => updateFormData('panAvailable', value)}
                      className="flex gap-6 pt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="pan-yes" />
                        <Label htmlFor="pan-yes" className="cursor-pointer font-normal">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="pan-no" />
                        <Label htmlFor="pan-no" className="cursor-pointer font-normal">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <Label className="font-semibold block mb-1">GST Registered? *</Label>
                  <RadioGroup 
                    value={formData.isGstRegistered} 
                    onValueChange={(value) => updateFormData('isGstRegistered', value)} 
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="gst-yes" />
                      <Label htmlFor="gst-yes" className="cursor-pointer font-normal">Yes, Registered</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="gst-no" />
                      <Label htmlFor="gst-no" className="cursor-pointer font-normal">No, Unregistered</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => updateFormData('state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* CONTACT STEP */}
            {currentStep === 'contact' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="authorizedContactName">Authorized Contact Person *</Label>
                    <Input
                      id="authorizedContactName"
                      value={formData.authorizedContactName}
                      onChange={(e) => updateFormData('authorizedContactName', e.target.value)}
                      placeholder="Contact Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="officialEmail">Official Business Email *</Label>
                    <Input
                      id="officialEmail"
                      type="email"
                      value={formData.officialEmail}
                      onChange={(e) => updateFormData('officialEmail', e.target.value)}
                      placeholder="email@company.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Input
                      id="mobileNumber"
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={(e) => handleMobileChange(e.target.value)}
                      placeholder="Mobile number"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="whatsappNumber">WhatsApp Number (Optional)</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sameAsMobile"
                          checked={formData.isWhatsappSameAsMobile}
                          onChange={(e) => toggleWhatsappSync(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3 animate-none"
                        />
                        <label htmlFor="sameAsMobile" className="text-xs text-slate-500 cursor-pointer select-none">Same as mobile</label>
                      </div>
                    </div>
                    <Input
                      id="whatsappNumber"
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={(e) => updateFormData('whatsappNumber', e.target.value)}
                      placeholder="WhatsApp number"
                      disabled={formData.isWhatsappSameAsMobile}
                      className={formData.isWhatsappSameAsMobile ? 'bg-muted' : ''}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* LEGAL & COMPLIANCE STEP */}
            {currentStep === 'legal' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Conditional PAN and GST fields at the top of Step 3 */}
                {(formData.panAvailable === 'yes' || formData.isGstRegistered === 'yes') && (
                  <div className="p-4 bg-slate-50 border rounded-lg grid gap-4 sm:grid-cols-2">
                    {formData.panAvailable === 'yes' && (
                      <div className="space-y-2">
                        <Label htmlFor="panNumber">PAN Number *</Label>
                        <Input
                          id="panNumber"
                          value={formData.panNumber}
                          onChange={(e) => updateFormData('panNumber', e.target.value.toUpperCase())}
                          placeholder="e.g. ABCDE1234F"
                          maxLength={10}
                        />
                      </div>
                    )}
                    {formData.isGstRegistered === 'yes' && (
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber">GST Number *</Label>
                        <Input
                          id="gstNumber"
                          value={formData.gstNumber}
                          onChange={(e) => updateFormData('gstNumber', e.target.value.toUpperCase())}
                          placeholder="e.g. 27AAAAA1111A1Z1"
                          maxLength={15}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800">Registered Business Address</h4>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddressLine1">Address Line 1 *</Label>
                    <Input
                      id="businessAddressLine1"
                      value={formData.businessAddressLine1}
                      onChange={(e) => updateFormData('businessAddressLine1', e.target.value)}
                      placeholder="Registered street address"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="businessCity">City *</Label>
                      <Input
                        id="businessCity"
                        value={formData.businessCity}
                        onChange={(e) => updateFormData('businessCity', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessState">State *</Label>
                      <Select value={formData.businessState} onValueChange={(value) => updateFormData('businessState', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPinCode">Pincode *</Label>
                      <Input
                        id="businessPinCode"
                        value={formData.businessPinCode}
                        onChange={(e) => updateFormData('businessPinCode', e.target.value)}
                        placeholder="Pincode"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <Label className="font-semibold block mb-1">Billing address same as business address? *</Label>
                  <RadioGroup 
                    value={formData.isBillingSameAsBusiness} 
                    onValueChange={(value) => updateFormData('isBillingSameAsBusiness', value)} 
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="billing-yes" />
                      <Label htmlFor="billing-yes" className="cursor-pointer font-normal">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="billing-no" />
                      <Label htmlFor="billing-no" className="cursor-pointer font-normal">No</Label>
                    </div>
                  </RadioGroup>

                  {formData.isBillingSameAsBusiness === 'no' && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-slate-200">
                      <div className="space-y-2">
                        <Label htmlFor="billingAddressLine1">Billing Address Line 1 *</Label>
                        <Input
                          id="billingAddressLine1"
                          value={formData.billingAddressLine1}
                          onChange={(e) => updateFormData('billingAddressLine1', e.target.value)}
                          placeholder="Billing Street address"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <Label htmlFor="billingCity">City *</Label>
                          <Input
                            id="billingCity"
                            value={formData.billingCity}
                            onChange={(e) => updateFormData('billingCity', e.target.value)}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingState">State *</Label>
                          <Select value={formData.billingState} onValueChange={(value) => updateFormData('billingState', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="billingPinCode">Pincode *</Label>
                          <Input
                            id="billingPinCode"
                            value={formData.billingPinCode}
                            onChange={(e) => updateFormData('billingPinCode', e.target.value)}
                            placeholder="Pincode"
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold text-slate-800">Compliance Document Verification</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-3 border border-dashed rounded-lg">
                      <Label className="font-semibold block mb-1">Business Proof (Optional)</Label>
                      <input type="file" id="review-proof" className="hidden" onChange={(e) => handleFileChange(e, 'businessProofFile')} />
                      <Label htmlFor="review-proof" className="w-full flex items-center justify-center gap-2 border rounded-md p-2 hover:bg-slate-50 cursor-pointer bg-white text-xs font-semibold">
                        {formData.businessProofFile ? <FileCheck className="h-4 w-4 text-green-500 animate-bounce" /> : <Upload className="h-4 w-4 text-slate-400" />}
                        {formData.businessProofFile ? formData.businessProofFile.name.substring(0, 15) : 'Upload COI/Shop Act'}
                      </Label>
                    </div>

                    <div className="p-3 border border-dashed rounded-lg">
                      <Label className="font-semibold block mb-1">PAN Card (Optional)</Label>
                      <input type="file" id="review-pan" className="hidden" onChange={(e) => handleFileChange(e, 'panCardFile')} />
                      <Label htmlFor="review-pan" className="w-full flex items-center justify-center gap-2 border rounded-md p-2 hover:bg-slate-50 cursor-pointer bg-white text-xs font-semibold">
                        {formData.panCardFile ? <FileCheck className="h-4 w-4 text-green-500 animate-bounce" /> : <Upload className="h-4 w-4 text-slate-400" />}
                        {formData.panCardFile ? formData.panCardFile.name.substring(0, 15) : 'Upload PAN Card'}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold text-slate-800">Bank Details & Verification (Optional)</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor="holder">Holder Name</Label>
                      <Input id="holder" value={formData.bankAccountHolderName} onChange={(e) => updateFormData('bankAccountHolderName', e.target.value)} placeholder="Holder" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="acct">Account Number</Label>
                      <Input id="acct" value={formData.bankAccountNumber} onChange={(e) => updateFormData('bankAccountNumber', e.target.value)} placeholder="Account #" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ifsc">IFSC Code</Label>
                      <Input id="ifsc" value={formData.bankIfscCode} onChange={(e) => updateFormData('bankIfscCode', e.target.value.toUpperCase())} placeholder="IFSC" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REVIEW & SUBMIT STEP */}
            {currentStep === 'review' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-4 p-5 bg-slate-50 rounded-xl border">
                  <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                    <div className="space-y-1">
                      <p><span className="text-slate-400">Legal / Brand Name:</span> <strong className="font-semibold text-slate-900">{formData.legalEntityName}</strong></p>
                      <p><span className="text-slate-400">Entity Structure:</span> <strong className="font-semibold text-slate-900">{formData.entityType}</strong></p>
                      <p><span className="text-slate-400">PAN Available:</span> <strong className="font-semibold text-slate-900">{formData.panAvailable === 'yes' ? 'Yes' : 'No'}</strong></p>
                      {formData.panAvailable === 'yes' && (
                        <p><span className="text-slate-400">PAN Number:</span> <strong className="font-semibold text-slate-900">{formData.panNumber}</strong></p>
                      )}
                      <p><span className="text-slate-400">GST Registered:</span> <strong className="font-semibold text-slate-900">{formData.isGstRegistered === 'yes' ? 'Yes' : 'No'}</strong></p>
                      {formData.isGstRegistered === 'yes' && (
                        <p><span className="text-slate-400">GST Number:</span> <strong className="font-semibold text-slate-900">{formData.gstNumber}</strong></p>
                      )}
                      <p><span className="text-slate-400">City / State:</span> <strong className="font-semibold text-slate-900">{formData.city}, {formData.state}</strong></p>
                    </div>
                    <div className="space-y-1">
                      <p><span className="text-slate-400">Contact Person:</span> <strong className="font-semibold text-slate-900">{formData.authorizedContactName}</strong></p>
                      <p><span className="text-slate-400">Official Email:</span> <strong className="font-semibold text-slate-900">{formData.officialEmail}</strong></p>
                      <p><span className="text-slate-400">Mobile Number:</span> <strong className="font-semibold text-slate-900">{formData.mobileNumber}</strong></p>
                    </div>
                  </div>

                  <hr className="my-3" />

                  <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Registered Address</p>
                      <p className="font-semibold leading-relaxed">
                        {formData.businessAddressLine1}<br />
                        {formData.businessCity}, {formData.businessState} - {formData.businessPinCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Billing Address</p>
                      <p className="font-semibold leading-relaxed">
                        {formData.isBillingSameAsBusiness === 'yes' ? (
                          <span className="italic font-normal text-slate-400">Same as Registered Address</span>
                        ) : (
                          <>
                            {formData.billingAddressLine1}<br />
                            {formData.billingCity}, {formData.billingState} - {formData.billingPinCode}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Card Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              {currentStep !== 'identity' ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const steps = ['identity', 'contact', 'legal', 'review'] as const;
                    const idx = steps.indexOf(currentStep);
                    if (idx > 0) {
                      setCurrentStep(steps[idx - 1]);
                    }
                  }} 
                  className="flex-1"
                >
                  Back
                </Button>
              ) : (
                <div className="flex-1" />
              )}

              {currentStep !== 'review' ? (
                <Button
                  onClick={() => {
                    const steps = ['identity', 'contact', 'legal', 'review'] as const;
                    const idx = steps.indexOf(currentStep);
                    setCurrentStep(steps[idx + 1]);
                  }}
                  disabled={!canProceedFromStep(currentStep)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={isSaving || saveProfileMutation.isPending || !canProceedFromStep('legal')}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                >
                  {isSaving || saveProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving & Deploying...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save & Continue to Deposit
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProfileReview;
