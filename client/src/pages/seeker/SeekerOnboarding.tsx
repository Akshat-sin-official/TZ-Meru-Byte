/**
 * Business Profile Setup
 * 
 * Collects mandatory basic business details from seekers.
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WebsiteLayout from '@/components/website/WebsiteLayout';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { apiClient, seekerService } from '@/services';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import { FiLoader, FiSave } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { INDIAN_STATES, INDUSTRY_SECTORS } from '@/data/taxonomy';
import { setOnboardingCache } from '@/components/ProtectedRoute';
import { executeSafeRedirect } from '@/utils/safeRedirect';

const ENTITY_TYPES = [
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'LLP' },
  { value: 'opc', label: 'OPC' },
  { value: 'pvt_ltd', label: 'Private Limited' },
  { value: 'public_ltd', label: 'Public Limited' },
  { value: 'individual', label: 'Individual / Freelancer' },
  { value: 'other', label: 'Other' },
];

const QUOTATION_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'director', label: 'Director' },
  { value: 'authorized_signatory', label: 'Authorized Signatory' },
  { value: 'other', label: 'Other' },
];

const SeekerOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(true);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlRedirect = searchParams.get('redirect') || searchParams.get('returnTo') || undefined;
  const rawFrom = (location.state as any)?.from;
  const returnTo: string | undefined = typeof rawFrom === 'string'
    ? rawFrom
    : (rawFrom?.pathname ? `${rawFrom.pathname}${rawFrom.search || ''}` : (urlRedirect && urlRedirect.startsWith('/') ? urlRedirect : undefined));
  const externalRedirect = ((location.state as any)?.externalRedirect as string | undefined) || urlRedirect;
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | number | null>(null);
  const hasHydratedDraftRef = useRef(false);

  // Form state
  const [formData, setFormData] = useState({
    legalEntityName: '',
    entityType: '',
    industrySector: '',
    quotationRole: 'owner',
    customQuotationRole: '',
    panAvailable: '', // 'yes' | 'no'
    isGstRegistered: '', // 'yes' | 'no'
    city: '',
    state: '',

    // Auto-filled/Hidden contact details from user context
    officialEmail: user?.email || '',
    mobileNumber: user?.mobile || '',
    authorizedContactName: user?.fullName || user?.name || '',
    whatsappNumber: '',
  });

  // Fetch official profile to check if already complete (frozen)
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['seekerProfileOnboarding'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: any }>('/v1/seeker/profile');
      return response.data?.data;
    },
    enabled: !!user?.id,
  });

  const isFrozen = profile?.isProfileComplete === true || profile?.complianceStatus === 'submitted' || profile?.complianceStatus === 'completed' || profile?.complianceStatus === 'approved';

  // Hydrate form from draft or existing profile
  useEffect(() => {
    if (isProfileLoading) return;

    const hydrateForm = async () => {
      try {
        if (isFrozen) {
          const rawRole = profile.quotationRole || 'owner';
          const isStandardRole = ['owner', 'director', 'authorized_signatory'].includes(rawRole);
          const isOtherRole = rawRole.startsWith('Other - ') || rawRole === 'other' || (!isStandardRole && rawRole);
          const parsedRole = isStandardRole ? rawRole : (isOtherRole ? 'other' : 'owner');
          const parsedCustomRole = isStandardRole ? '' : rawRole.replace(/^Other - /, '');
          const contactName = (typeof profile.userId === 'object' && profile.userId !== null && (profile.userId as any).fullName)
            || user?.fullName
            || user?.name
            || '';

          setFormData({
            legalEntityName: profile.legalEntityName || '',
            entityType: profile.entityType || '',
            industrySector: profile.industrySector || '',
            quotationRole: parsedRole,
            customQuotationRole: parsedCustomRole,
            panAvailable: profile.panAvailable !== undefined ? (profile.panAvailable ? 'yes' : 'no') : (profile.panNumber ? 'yes' : ''),
            isGstRegistered: profile.gstStatus === 'registered' ? 'yes' : (profile.gstStatus === 'not_registered' ? 'no' : ''),
            city: profile.registeredAddress?.city || profile.billingAddress?.city || '',
            state: profile.registeredAddress?.state || profile.billingAddress?.state || '',
            officialEmail: (typeof profile.userId === 'object' && profile.userId?.email) || user?.email || '',
            mobileNumber: profile.mobileNumber || user?.mobile || '',
            authorizedContactName: contactName,
            whatsappNumber: profile.whatsappNumber || '',
          });
          setIsDraftLoading(false);
          return;
        }

        // Check draft
        const draft = await seekerService.getOnboardingDraft();
        if (draft?.formData) {
          const rawRole = draft.formData.quotationRole || 'owner';
          const isStandardRole = ['owner', 'director', 'authorized_signatory'].includes(rawRole);
          const isOtherRole = rawRole.startsWith('Other - ') || rawRole === 'other' || (!isStandardRole && rawRole);
          const parsedRole = isStandardRole ? rawRole : (isOtherRole ? 'other' : 'owner');
          const parsedCustomRole = draft.formData.customQuotationRole || (isStandardRole ? '' : rawRole.replace(/^Other - /, ''));

          setFormData((prev) => ({ 
            ...prev, 
            ...draft.formData,
            quotationRole: parsedRole,
            customQuotationRole: parsedCustomRole,
            panAvailable: draft.formData.panAvailable || (draft.formData.panNumber ? 'yes' : ''),
            city: draft.formData.city || draft.formData.businessCity || '',
            state: draft.formData.state || draft.formData.businessState || '',
            industrySector: draft.formData.industrySector || prev.industrySector || '',
            mobileNumber: draft.formData.mobileNumber || prev.mobileNumber || '',
          }));
          toast.success('Previous progress restored');
        } else if (profile) {
          // Pre-populate known contact fields
          const contactName = (typeof profile.userId === 'object' && profile.userId !== null && (profile.userId as any).fullName)
            || user?.fullName
            || user?.name
            || '';
          setFormData((prev) => ({
            ...prev,
            officialEmail: (typeof profile.userId === 'object' && profile.userId?.email) || user?.email || '',
            authorizedContactName: contactName,
            mobileNumber: profile.mobileNumber || user?.mobile || '',
          }));
        }
      } catch (error) {
        console.warn('Failed to load draft:', error);
      } finally {
        hasHydratedDraftRef.current = true;
        setIsDraftLoading(false);
      }
    };

    if (user?.id) {
      hydrateForm();
    } else {
      setIsDraftLoading(false);
    }
  }, [user?.id, user?.email, user?.mobile, user?.name, user?.fullName, profile, isProfileLoading]);

  const updateFormData = useCallback((field: string, value: any) => {
    if (isFrozen) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, [isFrozen]);

  const canProceed = useMemo((): boolean => {
    const isCustomRoleValid = formData.quotationRole !== 'other' || !!formData.customQuotationRole.trim();
    return !!(
      formData.legalEntityName.trim() &&
      formData.entityType &&
      formData.industrySector &&
      formData.mobileNumber.trim().length === 10 &&
      formData.quotationRole &&
      isCustomRoleValid &&
      formData.panAvailable &&
      formData.isGstRegistered &&
      formData.city.trim() &&
      formData.state.trim()
    );
  }, [formData]);

  const saveDraftToBackend = useCallback(async (
    dataOverride?: typeof formData,
    showToast = true
  ) => {
    if (isFrozen) return;
    const draftData = dataOverride || formData;

    try {
      await seekerService.saveOnboardingDraft({
        formData: draftData,
        currentStep: 0,
      });
      if (showToast) {
        toast.success('Progress saved!');
      }
    } catch (error: unknown) {
      if (showToast) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save progress';
        toast.error(errorMessage);
      }
    }
  }, [isFrozen, formData]);

  // Autosave draft on form changes
  useEffect(() => {
    if (isDraftLoading || !hasHydratedDraftRef.current || isFrozen) {
      return;
    }

    if (draftSaveTimerRef.current) {
      window.clearTimeout(draftSaveTimerRef.current);
    }

    draftSaveTimerRef.current = window.setTimeout(() => {
      void saveDraftToBackend(formData, false);
    }, 1000);

    return () => {
      if (draftSaveTimerRef.current) {
        window.clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [formData, isDraftLoading, isFrozen]);

  const submitOnboarding = useMutation({
    mutationFn: async (data: typeof formData) => {
      const computedQuotationRole = data.quotationRole === 'other'
        ? (data.customQuotationRole.trim() ? `Other - ${data.customQuotationRole.trim()}` : 'Other')
        : data.quotationRole;

      const onboardingPayload = {
        legalEntityName: data.legalEntityName,
        entityType: data.entityType,
        industrySector: data.industrySector,
        quotationRole: computedQuotationRole,
        panAvailable: data.panAvailable === 'yes',
        gstStatus: data.isGstRegistered === 'yes' ? 'registered' : 'not_registered',
        officialEmail: data.officialEmail || user?.email || '',
        mobileNumber: data.mobileNumber || user?.mobile || '',
        authorizedContactName: data.authorizedContactName || user?.fullName || user?.name || data.legalEntityName || 'Business Contact',
        
        businessAddress: {
          line1: '',
          city: data.city,
          state: data.state,
          postalCode: '',
          country: 'India',
        },
        isBillingSameAsBusiness: true,
        billingAddress: {
          line1: '',
          city: data.city,
          state: data.state,
          postalCode: '',
          country: 'India',
        },
        billingEmail: data.officialEmail || user?.email || '',
      };

      const response = await apiClient.post('/v1/seeker/onboarding', onboardingPayload);
      return response.data;
    },
    onSuccess: async (data: any) => {
      toast.success('Business Profile Setup completed successfully!');
      if (user?.id) {
        setOnboardingCache(user.id, true);
      }
      const token = data?.token ? data.token : localStorage.getItem('accessToken');
      if (data?.token) {
        localStorage.setItem('accessToken', data.token);
      }
      if (token) {
        await refreshUser(token);
      }
      // If the user came from the marketing site experts page, redirect back there with token
      if (externalRedirect) {
        executeSafeRedirect(externalRedirect, token, navigate, '/seeker/dashboard');
      } else if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/seeker/dashboard');
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete setup';
      toast.error(errorMessage);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (isFrozen) {
      toast.info('Business Profile Setup is already completed.');
      // If the user came from the marketing site experts page, redirect back there with token
      if (externalRedirect) {
        const token = localStorage.getItem('accessToken');
        executeSafeRedirect(externalRedirect, token, navigate, '/seeker/dashboard');
      } else if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/seeker/dashboard');
      }
      return;
    }
    setIsSubmitting(true);
    submitOnboarding.mutate(formData);
  };

  if (isDraftLoading || isProfileLoading) {
    return (
      <WebsiteLayout>
        <div className="container mx-auto px-4 py-12 pt-32">
          <div className="max-w-4xl mx-auto">
            <Card className="border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-4 py-16 text-center">
                <FiLoader className="h-8 w-8 animate-spin text-orange-500" />
                <div>
                  <p className="text-lg font-semibold text-slate-900">Preparing workspace</p>
                  <p className="text-sm text-slate-500">Please wait while we set up the portal.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <div className="container mx-auto px-4 py-12 pt-32">
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Business Profile Setup</h1>
              <p className="text-slate-500">Provide basic business details to start receiving relevant quotations.</p>
            </div>
          </div>
        </div>

        {isFrozen && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 shadow-sm">
            <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900">Information Frozen</h4>
              <p className="text-sm text-amber-800">
                Business Profile Setup has been completed. These details are frozen. Any updates will submit a request to platform administrators for review before taking effect.
              </p>
            </div>
          </div>
        )}

        <Card className="max-w-4xl mx-auto border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-8">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                1
              </div>
              Business Information
            </CardTitle>
            <CardDescription className="text-emerald-600 font-semibold mt-2">
              ✓ Complete your profile to start scheduling discussions and receiving quotations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalEntityName">Legal / Brand Name *</Label>
                  <Input
                    id="legalEntityName"
                    value={formData.legalEntityName}
                    onChange={(e) => updateFormData('legalEntityName', e.target.value)}
                    placeholder="Enter legal or brand name"
                    disabled={isFrozen}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entityType">Entity Type *</Label>
                  <Select 
                    value={formData.entityType} 
                    onValueChange={(value) => updateFormData('entityType', value)}
                    disabled={isFrozen}
                  >
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

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industrySector">Industry Sector *</Label>
                  <Select 
                    value={formData.industrySector} 
                    onValueChange={(value) => updateFormData('industrySector', value)}
                    disabled={isFrozen}
                  >
                    <SelectTrigger id="industrySector">
                      <SelectValue placeholder="Select industry sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_SECTORS.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => updateFormData('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    disabled={isFrozen}
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role Accepting Quotation *</Label>
                  <Select 
                    value={formData.quotationRole} 
                    onValueChange={(value) => updateFormData('quotationRole', value)}
                    disabled={isFrozen}
                  >
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

                  {formData.quotationRole === 'other' && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="customQuotationRole">Please specify your role *</Label>
                      <Input
                        id="customQuotationRole"
                        value={formData.customQuotationRole}
                        onChange={(e) => updateFormData('customQuotationRole', e.target.value)}
                        placeholder="e.g. Marketing Lead, VP Operations, Consultant"
                        disabled={isFrozen}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="block mb-2 font-semibold">PAN Available? *</Label>
                  <RadioGroup
                    value={formData.panAvailable}
                    onValueChange={(value) => updateFormData('panAvailable', value)}
                    className="flex gap-6 pt-1"
                    disabled={isFrozen}
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

              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <Label className="font-semibold block mb-2">GST Registered? *</Label>
                <RadioGroup 
                  value={formData.isGstRegistered} 
                  onValueChange={(value) => updateFormData('isGstRegistered', value)} 
                  className="flex gap-6"
                  disabled={isFrozen}
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

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="Enter city"
                    disabled={isFrozen}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => updateFormData('state', value)}
                    disabled={isFrozen}
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

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/seeker/dashboard')}
                className="w-full sm:w-auto text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 h-11 px-5 rounded-lg"
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </Button>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                {!isFrozen && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void saveDraftToBackend(formData, true);
                    }}
                    className="w-full sm:w-auto border-dashed border-amber-400 text-amber-600 hover:bg-amber-50 transition-all h-11 px-5"
                    disabled={isSubmitting}
                  >
                    <FiSave size={18} /> Save Draft
                  </Button>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || submitOnboarding.isPending || (!isFrozen && !canProceed)}
                  className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center justify-center gap-2 h-11 px-6 rounded-lg transition-colors"
                >
                  {isSubmitting || submitOnboarding.isPending ? (
                    <>
                      <FiLoader className="animate-spin h-5 w-5" /> Submitting...
                    </>
                  ) : (
                    <>
                      {isFrozen ? 'Return to Dashboard' : 'Submit'} <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </WebsiteLayout>
  );
};

export default SeekerOnboarding;
