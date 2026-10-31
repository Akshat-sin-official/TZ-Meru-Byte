import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MainLayout } from '@/components/layout/MainLayout';
import { expertService } from '@/services/expertService';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle, Loader2, Info, Lock } from 'lucide-react';
import {
  QuotationFormStepper,
  type QuotationStepId,
} from '@/components/quotation/QuotationFormStepper';
import { QuotationReviewPanel } from '@/components/quotation/QuotationReviewPanel';
import { 
  INDIAN_STATES, 
  SERVICE_HEADS,
  BUSINESS_SIZES,
  BUSINESS_TYPES,
  BUSINESS_RELATIONSHIP_TYPES,
  ENGAGEMENT_MODELS,
  PRICING_STYLES,
  OPERATIONAL_MODELS,
  TURNAROUND_TIMES
} from '@/data/taxonomy';

interface MilestoneInput {
  id: string;
  name: string;
  scope: string;
  additionalDetails?: string;
  timeline: string;
  numberOfRevisions: string;
  percentage: number;
}

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const normalizeGstStatus = (
  status?: string
): 'registered' | 'not_registered' => {
  if (!status) {
    return 'not_registered';
  }

  const value = status.toLowerCase();
  if (value === 'gst_registered' || value === 'registered') {
    return 'registered';
  }

  return 'not_registered';
};

const CreateQuotation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { quotationId } = useParams();
  const [searchParams] = useSearchParams();

  // Derived discussionId state
  const searchDiscussionId = searchParams.get('discussion') || searchParams.get('discussionId');
  const [discussionId, setDiscussionId] = useState<string | null>(null);

  const DRAFT_KEY = discussionId ? `mta_quotation_draft:${discussionId}` : null;

  const [step, setStep] = useState<QuotationStepId>('context');
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isCurrentStepDraftSaved, setIsCurrentStepDraftSaved] = useState(true);
  const [draftQuotationId, setDraftQuotationId] = useState<string | null>(null);

  const markUnsaved = () => {
    setIsCurrentStepDraftSaved(false);
  };

  // Form state
  const [seekerName, setSeekerName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [engagementAlignment, setEngagementAlignment] = useState<{
    businessStage?: string;
    businessType?: string;
    customerType?: string;
    engagementModel?: string;
    pricingModel?: string;
    deliveryMode?: string;
    turnaroundTime?: string;
  }>({});
  const [discussionRefId, setDiscussionRefId] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [scope, setScope] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { id: '1', name: '', scope: '', timeline: '', numberOfRevisions: '', percentage: 100 },
  ]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [professionalFee, setProfessionalFee] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(0);
  const [gstAmount, setGstAmount] = useState<number>(0);

  const updateCommercials = (fee: number, rate: number) => {
    const calcGstAmount = Math.round((fee * rate) / 100 * 100) / 100;
    const calcTotalAmount = fee + calcGstAmount;
    setProfessionalFee(fee);
    setGstRate(rate);
    setGstAmount(calcGstAmount);
    setTotalAmount(calcTotalAmount);
    markUnsaved();
  };
  const [validity, setValidity] = useState('15');
  const [validitySelect, setValiditySelect] = useState('15');
  const [customValidity, setCustomValidity] = useState('15');
  const [timeline, setTimeline] = useState('');
  const [engagementStartDate, setEngagementStartDate] = useState('');
  const [estimatedEndDate, setEstimatedEndDate] = useState('');

  const handleValiditySelectChange = (value: string) => {
    setValiditySelect(value);
    if (value !== 'custom') {
      setValidity(value);
    } else {
      setValidity(customValidity);
    }
    markUnsaved();
  };

  const handleCustomValidityChange = (value: string) => {
    const numValue = value.replace(/\D/g, '');
    setCustomValidity(numValue);
    setValidity(numValue);
    markUnsaved();
  };
  // Place of Supply & GST Context
  const [placeOfSupplyCity, setPlaceOfSupplyCity] = useState('');
  const [placeOfSupplyState, setPlaceOfSupplyState] = useState('');
  const [placeOfSupplyCountry, setPlaceOfSupplyCountry] = useState('India');
  const [clientGSTStatus, setClientGSTStatus] = useState<'registered' | 'not_registered'>('not_registered');
  const [clientGSTIN, setClientGSTIN] = useState('');
  const [expertGSTStatus, setExpertGSTStatus] = useState<'registered' | 'not_registered'>('not_registered');
  const [expertGSTIN, setExpertGSTIN] = useState('');
  // Structured Exclusions
  const [outOfScopeItems, setOutOfScopeItems] = useState<string[]>(['']);
  const [thirdPartyCosts, setThirdPartyCosts] = useState('');
  const [changeRequestHandling, setChangeRequestHandling] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('100% deposit required before engagement begins. Funds released milestone-wise upon your approval.');

  // Fetch existing quotation if quotationId is provided
  const { data: existingQuotation } = useQuery({
    queryKey: ['quotation', quotationId],
    queryFn: () => expertService.getQuotation(quotationId!),
    enabled: !!quotationId,
  });

  // Fetch discussion if discussionId is provided
  const { data: discussion, isLoading: isDiscussionLoading } = useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: () => expertService.getDiscussion(discussionId!),
    enabled: !!discussionId,
  });

  // Fetch expert profile for GST status and expert ID
  const { data: expertProfile } = useQuery({
    queryKey: ['expertProfile'],
    queryFn: () => expertService.getProfile(),
    enabled: true,
  });

  // Sync discussionId from searchParams or existingQuotation
  useEffect(() => {
    if (searchDiscussionId) {
      setDiscussionId(searchDiscussionId);
    } else if (existingQuotation) {
      const dId = existingQuotation.discussionId?._id || existingQuotation.discussionId;
      if (dId) {
        setDiscussionId(typeof dId === 'object' ? dId.toString() : String(dId));
      }
    }
  }, [searchDiscussionId, existingQuotation]);

  // Pre-fill form from existingQuotation
  useEffect(() => {
    if (existingQuotation) {
      if (existingQuotation.businessName) setSeekerName(existingQuotation.businessName);
      if (existingQuotation.serviceCategory) setServiceCategory(existingQuotation.serviceCategory);
      
      if (existingQuotation.engagementAlignment) {
        setEngagementAlignment(existingQuotation.engagementAlignment);
      }
      
      const dId = existingQuotation.discussionId?._id || existingQuotation.discussionId;
      if (dId) {
        setDiscussionId(typeof dId === 'object' ? dId.toString() : String(dId));
      }
      
      if (existingQuotation.discussionId?.referenceId) {
        setDiscussionRefId(existingQuotation.discussionId.referenceId);
      } else if (existingQuotation.discussionId) {
        setDiscussionRefId(existingQuotation.discussionId.referenceId || existingQuotation.discussionId._id || existingQuotation.discussionId);
      }
      
      setProjectTitle(existingQuotation.draftSnapshot?.projectTitle || existingQuotation.projectTitle || '');
      setScope(existingQuotation.draftSnapshot?.scope || existingQuotation.scope || '');
      setDeliverables(existingQuotation.draftSnapshot?.deliverables || existingQuotation.deliverables || '');
      const fee = existingQuotation.professionalFee ?? existingQuotation.totalEngagementValue ?? existingQuotation.totalAmount ?? 0;
      const rate = existingQuotation.gstRate ?? 0;
      const gstAmt = existingQuotation.gstAmount ?? 0;
      setProfessionalFee(fee);
      setGstRate(rate);
      setGstAmount(gstAmt);
      setTotalAmount(fee + gstAmt);
      
      if (existingQuotation.milestones && existingQuotation.milestones.length > 0) {
        setMilestones(existingQuotation.milestones.map((m: any, index: number) => ({
          id: m.id || `milestone-${m.milestoneNumber || index + 1}`,
          name: m.name || `Milestone ${m.milestoneNumber || index + 1}`,
          scope: m.scope || m.description || '',
          additionalDetails: m.additionalDetails || '',
          timeline: m.timeline || '',
          numberOfRevisions: m.numberOfRevisions || '',
          percentage: m.depositPercentage || 0,
        })));
      }
      const valStr = existingQuotation.draftSnapshot?.validity || '15';
      setValidity(valStr);
      if (['7', '15', '30'].includes(valStr)) {
        setValiditySelect(valStr);
      } else {
        setValiditySelect('custom');
        setCustomValidity(valStr);
      }
      setTimeline(existingQuotation.draftSnapshot?.timeline || '');
      
      if (existingQuotation.engagementStartDate) {
        const dateStr = new Date(existingQuotation.engagementStartDate).toISOString().split('T')[0];
        setEngagementStartDate(dateStr);
      }
      if (existingQuotation.estimatedEndDate) {
        const dateStr = new Date(existingQuotation.estimatedEndDate).toISOString().split('T')[0];
        setEstimatedEndDate(dateStr);
      }
      
      setAssumptions(existingQuotation.dependenciesAndAssumptions || '');
      
      if (existingQuotation.placeOfSupply) {
        setPlaceOfSupplyCity(existingQuotation.placeOfSupply.city || '');
        setPlaceOfSupplyState(existingQuotation.placeOfSupply.state || '');
        setPlaceOfSupplyCountry(existingQuotation.placeOfSupply.country || 'India');
      }
      
      if (existingQuotation.gstContext) {
        setClientGSTStatus(normalizeGstStatus(existingQuotation.gstContext.clientGSTStatus));
        setClientGSTIN(existingQuotation.gstContext.clientGSTIN || '');
        setExpertGSTStatus(normalizeGstStatus(existingQuotation.gstContext.expertGSTStatus));
        setExpertGSTIN(existingQuotation.gstContext.expertGSTIN || '');
      }
      
      if (existingQuotation.exclusions) {
        setOutOfScopeItems(existingQuotation.exclusions.outOfScopeItems && existingQuotation.exclusions.outOfScopeItems.length > 0
          ? existingQuotation.exclusions.outOfScopeItems
          : ['']
        );
        setThirdPartyCosts(existingQuotation.exclusions.thirdPartyCosts || '');
        setChangeRequestHandling(existingQuotation.exclusions.changeRequestHandling || '');
      }
    }
  }, [existingQuotation]);

  useEffect(() => {
    if (discussion) {
      setSeekerName(discussion.seekerName);
      setDiscussionRefId(discussion.referenceId || discussion.id);
      if (discussion.serviceCategory && !serviceCategory) {
        setServiceCategory(discussion.serviceCategory);
      }
    }
  }, [discussion, serviceCategory]);

  const expertGstLocked = Boolean(
    expertProfile?.gstNumber?.trim() &&
      normalizeGstStatus(expertProfile.gstStatus) === 'registered'
  );

  useEffect(() => {
    if (expertProfile && !existingQuotation) {
      const status = normalizeGstStatus(expertProfile.gstStatus);
      setExpertGSTStatus(status);
      if (expertProfile.gstNumber?.trim()) {
        setExpertGSTIN(expertProfile.gstNumber.trim().toUpperCase());
      }
      
      const profileCity = expertProfile.registeredAddress?.city || 
                          (typeof expertProfile.location === 'object' ? expertProfile.location?.city : undefined) || '';
      const profileState = expertProfile.registeredAddress?.state || 
                           (typeof expertProfile.location === 'object' ? expertProfile.location?.state : undefined) || '';
      
      if (profileCity && !placeOfSupplyCity) {
        setPlaceOfSupplyCity(profileCity);
      }
      if (profileState && !placeOfSupplyState) {
        setPlaceOfSupplyState(profileState);
      }
    }
  }, [expertProfile, existingQuotation]);

  const applyDraftSnapshot = (d: Record<string, unknown>) => {
    if (d.projectTitle) setProjectTitle(String(d.projectTitle));
    if (d.scope) setScope(String(d.scope));
    if (d.deliverables) setDeliverables(String(d.deliverables));
    if (d.totalAmount != null) setTotalAmount(Number(d.totalAmount));
    if (d.professionalFee != null) setProfessionalFee(Number(d.professionalFee));
    if (d.gstRate != null) setGstRate(Number(d.gstRate));
    if (d.gstAmount != null) setGstAmount(Number(d.gstAmount));
    if (Array.isArray(d.milestones)) setMilestones(d.milestones as MilestoneInput[]);
    if (d.validity) {
      const valStr = String(d.validity);
      setValidity(valStr);
      if (['7', '15', '30'].includes(valStr)) {
        setValiditySelect(valStr);
      } else {
        setValiditySelect('custom');
        setCustomValidity(valStr);
      }
    }
    if (d.timeline) setTimeline(String(d.timeline));
    if (d.engagementStartDate) setEngagementStartDate(String(d.engagementStartDate));
    if (d.estimatedEndDate) setEstimatedEndDate(String(d.estimatedEndDate));
    if (d.assumptions) setAssumptions(String(d.assumptions));
    if (d.paymentTerms) setPaymentTerms(String(d.paymentTerms));
    if (d.engagementAlignment) setEngagementAlignment(d.engagementAlignment as typeof engagementAlignment);
    if (d.serviceCategory) setServiceCategory(String(d.serviceCategory));
    if (d.placeOfSupplyCity) setPlaceOfSupplyCity(String(d.placeOfSupplyCity));
    if (d.placeOfSupplyState) setPlaceOfSupplyState(String(d.placeOfSupplyState));
    if (d.placeOfSupplyCountry) setPlaceOfSupplyCountry(String(d.placeOfSupplyCountry));
    if (d.clientGSTStatus) setClientGSTStatus(d.clientGSTStatus as 'registered' | 'not_registered');
    if (d.clientGSTIN) setClientGSTIN(String(d.clientGSTIN));
    if (d.expertGSTStatus) setExpertGSTStatus(d.expertGSTStatus as 'registered' | 'not_registered');
    if (d.expertGSTIN) setExpertGSTIN(String(d.expertGSTIN));
    if (Array.isArray(d.outOfScopeItems)) setOutOfScopeItems(d.outOfScopeItems as string[]);
    if (d.thirdPartyCosts) setThirdPartyCosts(String(d.thirdPartyCosts));
    if (d.changeRequestHandling) setChangeRequestHandling(String(d.changeRequestHandling));
    if (d.step && typeof d.step === 'string') setStep(d.step as QuotationStepId);
  };

  const { data: serverDraft } = useQuery({
    queryKey: ['quotationDraft', discussionId],
    queryFn: () => expertService.getQuotationDraftByDiscussion(discussionId!),
    enabled: !!discussionId && !quotationId,
  });

  useEffect(() => {
    if (!serverDraft || quotationId) return;
    setDraftQuotationId(serverDraft.id);
    const snap = (serverDraft.draftSnapshot || serverDraft) as Record<string, unknown>;
    applyDraftSnapshot(snap);
    if (serverDraft.serviceCategory) setServiceCategory(String(serverDraft.serviceCategory));
    if (serverDraft.engagementAlignment) {
      setEngagementAlignment(serverDraft.engagementAlignment as typeof engagementAlignment);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverDraft?.id, quotationId]);

  useEffect(() => {
    if (!DRAFT_KEY || serverDraft || quotationId) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      applyDraftSnapshot(JSON.parse(raw));
    } catch { /* ignore corrupted draft */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DRAFT_KEY, serverDraft, quotationId]);

  const buildDraftPayload = () => {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(validity || '15', 10));

    const milestoneData = milestones.map((m, index) => {
      const amount = getMilestoneAmount(m.percentage);
      return {
        milestoneNumber: index + 1,
        name: m.name || `Milestone ${index + 1}`,
        scope: m.scope || 'To be defined',
        timeline: m.timeline || 'TBD',
        numberOfRevisions: m.numberOfRevisions || 'TBD',
        depositPercentage: m.percentage,
        depositAmount: amount,
        description: m.scope,
        amount,
      };
    });

    const snapshot = {
      step,
      projectTitle,
      scope,
      deliverables,
      professionalFee,
      gstRate,
      gstAmount,
      totalAmount,
      milestones,
      validity,
      timeline,
      engagementStartDate,
      estimatedEndDate,
      assumptions,
      paymentTerms,
      engagementAlignment,
      serviceCategory,
      placeOfSupplyCity,
      placeOfSupplyState,
      placeOfSupplyCountry,
      clientGSTStatus,
      clientGSTIN,
      expertGSTStatus,
      expertGSTIN,
      outOfScopeItems,
      thirdPartyCosts,
      changeRequestHandling,
      savedAt: new Date().toISOString(),
    };

    return {
      discussionId: discussionId!,
      serviceCategory,
      engagementAlignment,
      professionalFee,
      gstRate,
      gstAmount,
      totalAmount: totalAmount || 0,
      totalEngagementValue: totalAmount || 0,
      currency: 'INR',
      milestones: milestoneData,
      validUntil: validUntil.toISOString(),
      placeOfSupply: (placeOfSupplyCity.trim() && placeOfSupplyState) ? {
        city: placeOfSupplyCity.trim(),
        state: placeOfSupplyState,
        country: placeOfSupplyCountry,
      } : undefined,
      gstContext: {
        clientGSTStatus,
        clientGSTIN: clientGSTIN || undefined,
        expertGSTStatus,
        expertGSTIN:
          expertGSTStatus === 'registered'
            ? expertGstLocked
              ? expertProfile?.gstNumber?.trim().toUpperCase()
              : expertGSTIN.trim().toUpperCase() || undefined
            : undefined,
      },
      exclusions: {
        outOfScopeItems: outOfScopeItems.filter((item) => item.trim() !== ''),
        thirdPartyCosts: thirdPartyCosts || 'N/A',
        changeRequestHandling: changeRequestHandling || 'N/A',
      },
      dependenciesAndAssumptions: assumptions || undefined,
      engagementStartDate: engagementStartDate || undefined,
      estimatedEndDate: estimatedEndDate || undefined,
      draftSnapshot: snapshot,
    };
  };

  const saveDraftMutation = useMutation({
    mutationFn: () => expertService.saveQuotationDraft(buildDraftPayload()),
    onSuccess: (data) => {
      setDraftQuotationId(data.id);
      if (DRAFT_KEY) {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraftPayload().draftSnapshot));
        } catch { /* ignore */ }
      }
      queryClient.invalidateQueries({ queryKey: ['expertQuotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotationDraft', discussionId] });
      setIsDraftSaved(true);
      setIsCurrentStepDraftSaved(true);
      toast.success('Draft saved to your quotations list.');
      setTimeout(() => setIsDraftSaved(false), 3000);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save draft');
    },
  });

  const saveDraft = () => {
    if (!discussionId) {
      toast.error('Discussion ID is required');
      return;
    }
    saveDraftMutation.mutate();
  };

  // Create quotation mutation
  const createQuotationMutation = useMutation({
    mutationFn: (data: {
      discussionId: string;
      serviceCategory: string;
      saveAsDraft?: boolean;
      engagementAlignment?: any;
      totalEngagementValue: number;
      currency?: string;
      milestones: any[];
      validUntil: string | Date;
      placeOfSupply?: { city?: string; state: string; country: string };
      gstContext?: any;
      exclusions?: any;
      dependenciesAndAssumptions?: string;
      engagementStartDate?: Date;
      estimatedEndDate?: Date;
    }) => expertService.createQuotation(data as any),
    onSuccess: () => {
      toast.success('Quotation sent to ' + seekerName);
      if (DRAFT_KEY) {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      }
      queryClient.invalidateQueries({ queryKey: ['expertQuotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotationDraft', discussionId] });
      navigate('/expert/dashboard?tab=quotations');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to create quotation';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string | { code?: string; message?: string; details?: unknown }; message?: string; details?: any[] } } };
        const resData = axiosError.response?.data;
        const errorData = resData?.error;

        if (resData?.error === 'Validation failed' && Array.isArray(resData?.details)) {
          const detailMessages = resData.details.map((d: any) => {
            const field = d.field || (Array.isArray(d.path) ? d.path.filter((p: any) => p !== 'body').join('.') : '');
            return field ? `${field}: ${d.message}` : d.message;
          }).join(', ');
          errorMessage = `Validation failed: ${detailMessages}`;
        } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = errorData.message || 'Failed to create quotation';
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (errorMessage.includes('already been sent') || errorMessage.includes('already exists')) {
        toast.error(errorMessage, {
          duration: 5000,
        });
        // Redirect to dashboard after showing error
        setTimeout(() => {
          navigate('/expert/dashboard');
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const totalPercentage = milestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
  const isValidPercentage = totalPercentage === 100;

  const addMilestone = () => {
    const remaining = 100 - totalPercentage;
    setMilestones([
      ...milestones,
      { id: Date.now().toString(), name: '', scope: '', timeline: '', numberOfRevisions: '', percentage: remaining > 0 ? remaining : 0 },
    ]);
    markUnsaved();
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id));
      markUnsaved();
    }
  };

  const updateMilestone = (id: string, field: keyof MilestoneInput, value: string | number) => {
    setMilestones(
      milestones.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    );
    markUnsaved();
  };

  const addOutOfScopeItem = () => {
    setOutOfScopeItems([...outOfScopeItems, '']);
    markUnsaved();
  };

  const removeOutOfScopeItem = (index: number) => {
    if (outOfScopeItems.length > 1) {
      setOutOfScopeItems(outOfScopeItems.filter((_, i) => i !== index));
      markUnsaved();
    }
  };

  const updateOutOfScopeItem = (index: number, value: string) => {
    const updated = [...outOfScopeItems];
    updated[index] = value;
    setOutOfScopeItems(updated);
    markUnsaved();
  };

  const getMilestoneAmount = (percentage: number) => {
    return Math.round((percentage / 100) * totalAmount);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStepClick = (targetStep: QuotationStepId) => {
    if (!isCurrentStepDraftSaved) {
      toast.info("Unsaved edits detected. Please click 'Save Draft' to unfreeze step navigation.", {
        icon: <Lock className="h-4 w-4 text-amber-500" />,
      });
      return;
    }
    setStep(targetStep);
  };

  const DraftUnfreezeNotice = () => {
    if (isCurrentStepDraftSaved) return null;
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50/80 px-3.5 py-2 rounded-lg border border-amber-200/80 mb-3 animate-in fade-in duration-200">
        <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <span>Click <strong>Save Draft</strong> to unfreeze and proceed to the next step.</span>
      </div>
    );
  };

  // Show loading while fetching existing quotation
  if (quotationId && !existingQuotation) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading quotation details...</p>
        </div>
      </MainLayout>
    );
  }

  // Show loading while fetching discussion
  if (discussionId && isDiscussionLoading) {
    return (
      <MainLayout showFooter={false}>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading discussion details...</p>
        </div>
      </MainLayout>
    );
  }

  // Show lock screen if discussion already has an accepted quotation
  if (discussion?.hasAcceptedQuotation) {
    return (
      <MainLayout showFooter={false}>
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Quotation Locked</h1>
            <p className="mb-6 text-muted-foreground">
              A quotation for this discussion has already been accepted and approved by the Service Seeker.
              No additional quotations can be generated or updated for this completed requirement discussion.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/expert/dashboard?tab=discussions')}>
                Back to Discussions
              </Button>
              <Button variant="outline" onClick={() => navigate('/expert/dashboard?tab=engagements')}>
                View Engagements
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error if discussionId is missing
  if (!discussionId && !quotationId) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl rounded-xl border border-destructive bg-card p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h1 className="mb-2 text-2xl font-bold">Discussion ID Required</h1>
            <p className="mb-6 text-muted-foreground">
              A discussion ID is required to create a quotation. Please navigate from a discussion to create a quotation.
            </p>
            <Button onClick={() => navigate('/expert/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const canProceedFromScope = projectTitle && scope && deliverables;
  const canProceedFromMilestones =
    isValidPercentage &&
    milestones.every((m) => m.name && m.scope && m.timeline && m.numberOfRevisions?.trim()) &&
    totalAmount > 0;
  const canProceedFromTerms = validity && timeline && engagementStartDate && estimatedEndDate;

  const handleSubmit = async () => {
    if (!discussionId) {
      toast.error('Discussion ID is required. Please navigate from a discussion to create a quotation.');
      navigate('/expert/dashboard');
      return;
    }

    if (!isValidPercentage) {
      toast.error('Milestone percentages must total 100%');
      return;
    }

    if (expertGSTStatus === 'registered') {
      const gstin = expertGstLocked
        ? expertProfile?.gstNumber?.trim().toUpperCase()
        : expertGSTIN.trim().toUpperCase();
      if (!gstin) {
        toast.error('Please enter your GST number');
        return;
      }
      if (!GSTIN_REGEX.test(gstin)) {
        toast.error('Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)');
        return;
      }
    }

    // Calculate milestone amounts
    const milestoneData = milestones.map((m, index) => {
      const amount = getMilestoneAmount(m.percentage);
      return {
        milestoneNumber: index + 1,
        name: m.name,
        scope: m.scope,
        timeline: m.timeline,
        numberOfRevisions: m.numberOfRevisions.trim(),
        depositPercentage: m.percentage,
        depositAmount: amount,
        // Backward compatibility
        description: m.scope,
        amount,
      };
    });

    // Calculate validUntil date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(validity));

    // Prepare exclusions structure (all fields required by backend)
    const exclusionsData = {
      outOfScopeItems: outOfScopeItems.filter(item => item.trim() !== ''),
      thirdPartyCosts: thirdPartyCosts || 'N/A',
      changeRequestHandling: changeRequestHandling || 'N/A',
    };

    const payload = buildDraftPayload();
    createQuotationMutation.mutate({
      ...payload,
      saveAsDraft: false,
      totalEngagementValue: totalAmount,
      currency: 'INR',
      milestones: milestoneData,
      validUntil: validUntil.toISOString(),
      placeOfSupply: (placeOfSupplyCity.trim() && placeOfSupplyState) ? {
        city: placeOfSupplyCity.trim(),
        state: placeOfSupplyState,
        country: placeOfSupplyCountry,
      } : undefined,
      gstContext: {
        clientGSTStatus,
        clientGSTIN: clientGSTIN || undefined,
        expertGSTStatus,
        expertGSTIN:
          expertGSTStatus === 'registered'
            ? (expertGstLocked
                ? expertProfile?.gstNumber?.trim().toUpperCase()
                : expertGSTIN.trim().toUpperCase())
            : undefined,
      },
      exclusions: exclusionsData,
      dependenciesAndAssumptions: assumptions || undefined,
      engagementStartDate: engagementStartDate ? new Date(engagementStartDate) : new Date(),
      estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate) : validUntil,
    });
  };

  return (
    <MainLayout showFooter={false}>
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold">
                {existingQuotation?.status === 'revision_requested' ? 'Revise Quotation' : 'Create Quotation'}
              </h1>
              <p className="text-muted-foreground">
                {existingQuotation?.status === 'revision_requested' 
                  ? `Update and resubmit your quotation with milestones ${seekerName ? `for ${seekerName}` : ''}`
                  : `Build a detailed quotation with milestones ${seekerName ? `for ${seekerName}` : ''}`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={saveDraft}
              disabled={isDraftSaved || saveDraftMutation.isPending}
              className="flex items-center gap-2 shrink-0"
            >
              {saveDraftMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isDraftSaved ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Info className="h-4 w-4" />
              )}
              {saveDraftMutation.isPending ? 'Saving…' : isDraftSaved ? 'Draft Saved!' : 'Save Draft'}
            </Button>
          </div>

          {existingQuotation?.status === 'revision_requested' && (existingQuotation.rejectionReason || existingQuotation.revisionHistory?.length > 0) && (
            <Alert className="mb-6 border-orange-200 bg-orange-50/50 text-orange-950 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1 text-orange-900">Revision Requested Feedback:</span>
                <span className="italic text-sm leading-relaxed text-orange-800">
                  "{existingQuotation.rejectionReason || existingQuotation.revisionHistory[existingQuotation.revisionHistory.length - 1]?.reason}"
                </span>
              </div>
            </Alert>
          )}

          <QuotationFormStepper currentStep={step} onStepClick={handleStepClick} />
          {draftQuotationId && (
            <p className="-mt-4 mb-6 text-xs text-muted-foreground">
              Editing saved draft · last saved to your quotations workspace
            </p>
          )}

          <div className="rounded-xl border border-border bg-background p-8">
            {/* Step 1: Client & Context (Auto-filled, Read-only) */}
            {step === 'context' && (
              <>
                <h2 className="mb-6 text-xl font-semibold">Client & Context</h2>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Client Information</CardTitle>
                      <CardDescription>Auto-filled from discussion</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Business Name</Label>
                          <p className="font-medium">{seekerName || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Service Category <span className="text-destructive">*</span></Label>
                          <Select value={serviceCategory} onValueChange={(val) => { setServiceCategory(val); markUnsaved(); }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Service Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_HEADS.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Discussion Reference ID</Label>
                          <p className="font-mono text-sm">{discussionRefId || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Expert Reference ID</Label>
                          <p className="font-mono text-sm text-[#0EA5E9]">{expertProfile?.referenceId || expertProfile?.expertId || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Seeker Reference ID</Label>
                          <p className="font-mono text-sm text-[#0EA5E9]">{discussion?.seekerReferenceId || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Date of Quotation</Label>
                          <p className="font-medium">{new Date().toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div>
                    <DraftUnfreezeNotice />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setStep('alignment')}
                        className="flex-1"
                        disabled={!serviceCategory || !isCurrentStepDraftSaved}
                      >
                        Continue to Alignment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={saveDraft}
                        disabled={saveDraftMutation.isPending}
                      >
                        {saveDraftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />}
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 1.5: Engagement & Delivery Alignment */}
            {step === 'alignment' && (
              <>
                <h2 className="mb-6 text-xl font-semibold">Engagement & Delivery Alignment</h2>
                <div className="space-y-8">
                  
                  {/* Business Fit */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Business Fit</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>Business Stage</Label>
                        <Select 
                          value={engagementAlignment.businessStage || ''} 
                          onValueChange={(val) => { setEngagementAlignment({...engagementAlignment, businessStage: val}); markUnsaved(); }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Startups">Startups</SelectItem>
                            <SelectItem value="Small & Medium Businesses">Small & Medium Businesses</SelectItem>
                            <SelectItem value="Enterprises">Enterprises</SelectItem>
                            <SelectItem value="Global">Global</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Business Type</Label>
                        <Select 
                          value={engagementAlignment.businessType || ''} 
                          onValueChange={(val) => { setEngagementAlignment({...engagementAlignment, businessType: val}); markUnsaved(); }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Customer Type</Label>
                        <Select 
                          value={engagementAlignment.customerType || ''} 
                          onValueChange={(val) => { setEngagementAlignment({...engagementAlignment, customerType: val}); markUnsaved(); }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {BUSINESS_RELATIONSHIP_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Commercial Fit */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Commercial Fit</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Engagement Model</Label>
                        <Select 
                          value={engagementAlignment.engagementModel || ''} 
                          onValueChange={(val) => { setEngagementAlignment({...engagementAlignment, engagementModel: val}); markUnsaved(); }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                          <SelectContent>
                            {ENGAGEMENT_MODELS.map(em => <SelectItem key={em} value={em}>{em}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Pricing Model</Label>
                        <Select 
                          value={engagementAlignment.pricingModel || ''} 
                          onValueChange={(val) => { setEngagementAlignment({...engagementAlignment, pricingModel: val}); markUnsaved(); }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select pricing" /></SelectTrigger>
                          <SelectContent>
                            {PRICING_STYLES.map(ps => <SelectItem key={ps} value={ps}>{ps}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Delivery & Timelines */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Delivery & Timelines</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Delivery Mode</Label>
                        <Select 
                          value={engagementAlignment.deliveryMode || ''} 
                          onValueChange={(val) => { setEngagementAlignment({...engagementAlignment, deliveryMode: val}); markUnsaved(); }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                          <SelectContent>
                            {OPERATIONAL_MODELS.map(om => <SelectItem key={om} value={om}>{om}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Turnaround Time</Label>
                        <Select 
                          value={engagementAlignment.turnaroundTime || ''} 
                          onValueChange={(val) => { setEngagementAlignment({...engagementAlignment, turnaroundTime: val}); markUnsaved(); }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                          <SelectContent>
                            {TURNAROUND_TIMES.map(tt => <SelectItem key={tt} value={tt}>{tt}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <DraftUnfreezeNotice />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep('context')}>Back</Button>
                      <Button
                        onClick={() => setStep('scope')}
                        disabled={!isCurrentStepDraftSaved}
                        className="flex-1"
                      >
                        Continue to Scope
                      </Button>
                      <Button
                        variant="outline"
                        onClick={saveDraft}
                        disabled={saveDraftMutation.isPending}
                      >
                        {saveDraftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />}
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Scope */}
            {step === 'scope' && (
              <>
                <h2 className="mb-6 text-xl font-semibold">Define Scope of Work</h2>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="projectTitle">Project Title *</Label>
                    <Input
                      id="projectTitle"
                      value={projectTitle}
                      onChange={(e) => { setProjectTitle(e.target.value); markUnsaved(); }}
                      placeholder="e.g., SEO Optimization for E-commerce Platform"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scope">Scope Description *</Label>
                    <Textarea
                      id="scope"
                      value={scope}
                      onChange={(e) => { setScope(e.target.value); markUnsaved(); }}
                      placeholder="Describe the complete scope of work, objectives, and approach..."
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Be specific about what's included in this engagement
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliverables">Key Deliverables *</Label>
                    <Textarea
                      id="deliverables"
                      value={deliverables}
                      onChange={(e) => { setDeliverables(e.target.value); markUnsaved(); }}
                      placeholder="• Technical SEO audit report&#10;• On-page optimization for 50 pages&#10;• Monthly performance reports&#10;• Keyword research document"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      List all deliverables the client will receive
                    </p>
                  </div>

                  <div>
                    <DraftUnfreezeNotice />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep('alignment')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep('milestones')}
                        disabled={!canProceedFromScope || !isCurrentStepDraftSaved}
                        className="flex-1"
                      >
                        Continue to Milestones
                      </Button>
                      <Button
                        variant="outline"
                        onClick={saveDraft}
                        disabled={saveDraftMutation.isPending}
                      >
                        {saveDraftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />}
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Milestones */}
            {step === 'milestones' && (
              <>
                <h2 className="mb-6 text-xl font-semibold">Scope of Work & Milestones</h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="professionalFee">Professional Fee / service charges *</Label>
                      <Input
                        id="professionalFee"
                        type="number"
                        value={professionalFee || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateCommercials(val, gstRate);
                        }}
                        placeholder="e.g. 250000"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gstRate">GST % applicable *</Label>
                      <Input
                        id="gstRate"
                        type="number"
                        min="0"
                        max="100"
                        value={gstRate === 0 ? '0' : (gstRate || '')}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateCommercials(professionalFee, val);
                        }}
                        placeholder="e.g. 18"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gstAmount">GST Amount (INR)</Label>
                      <Input
                        id="gstAmount"
                        type="number"
                        value={gstAmount || 0}
                        disabled
                        className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="totalAmount">Total Quote Amount (INR)</Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        value={totalAmount || 0}
                        disabled
                        className="bg-gray-50 border-gray-200 text-gray-500 font-semibold cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Payment Milestones *</Label>
                      <div
                        className={`flex items-center gap-2 text-sm ${isValidPercentage ? 'text-foreground' : 'text-destructive'
                          }`}
                      >
                        {isValidPercentage ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        Total: {totalPercentage}%
                      </div>
                    </div>

                    <div className="space-y-4">
                      {milestones.map((milestone, index) => (
                        <div key={milestone.id} className="rounded-lg border border-border p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="font-mono text-sm font-bold">
                              Milestone {index + 1}
                            </span>
                            {milestones.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMilestone(milestone.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Milestone Name *</Label>
                                <Input
                                  value={milestone.name}
                                  onChange={(e) =>
                                    updateMilestone(milestone.id, 'name', e.target.value)
                                  }
                                  placeholder="e.g., M1: Technical SEO Audit"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Deposit % *</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={milestone.percentage || ''}
                                    onChange={(e) =>
                                      updateMilestone(
                                        milestone.id,
                                        'percentage',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                  />
                                  <span className="text-sm">%</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Scope / Deliverables *</Label>
                              <Textarea
                                value={milestone.scope}
                                onChange={(e) =>
                                  updateMilestone(milestone.id, 'scope', e.target.value)
                                }
                                placeholder="Describe what's included in this milestone..."
                                rows={3}
                              />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Timeline *</Label>
                                <Input
                                  value={milestone.timeline}
                                  onChange={(e) =>
                                    updateMilestone(milestone.id, 'timeline', e.target.value)
                                  }
                                  placeholder="e.g., 7 days"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>No. of Revisions *</Label>
                                <Input
                                  value={milestone.numberOfRevisions}
                                  onChange={(e) =>
                                    updateMilestone(milestone.id, 'numberOfRevisions', e.target.value)
                                  }
                                  placeholder="e.g., 2 rounds"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Additional Details (Optional)</Label>
                              <Input
                                value={milestone.additionalDetails || ''}
                                onChange={(e) =>
                                  updateMilestone(milestone.id, 'additionalDetails', e.target.value)
                                }
                                placeholder="Any additional notes..."
                              />
                            </div>
                          </div>

                          {totalAmount > 0 && (
                            <div className="mt-3 text-right">
                              <span className="font-semibold">
                                {formatCurrency(getMilestoneAmount(milestone.percentage))}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={addMilestone}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Milestone
                    </Button>

                    {!isValidPercentage && (
                      <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Milestone percentages must total exactly 100%
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <DraftUnfreezeNotice />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep('scope')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep('tax')}
                        disabled={!canProceedFromMilestones || !isCurrentStepDraftSaved}
                        className="flex-1"
                      >
                        Continue to Tax & Supply
                      </Button>
                      <Button
                        variant="outline"
                        onClick={saveDraft}
                        disabled={saveDraftMutation.isPending}
                      >
                        {saveDraftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />}
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Place of Supply & Tax Context */}
            {step === 'tax' && (
              <>
                <h2 className="mb-6 text-xl font-semibold">Supply & Tax Details</h2>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Place of Supply</CardTitle>
                      <CardDescription>Required for tax compliance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="placeOfSupplyCity">
                            City <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="placeOfSupplyCity"
                            value={placeOfSupplyCity}
                            onChange={(e) => { setPlaceOfSupplyCity(e.target.value); markUnsaved(); }}
                            placeholder="e.g., Mumbai"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="placeOfSupplyState">
                            State <span className="text-destructive">*</span>
                          </Label>
                          <Select value={placeOfSupplyState} onValueChange={(val) => { setPlaceOfSupplyState(val); markUnsaved(); }}>
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
                        <div className="space-y-2">
                          <Label htmlFor="placeOfSupplyCountry">Country</Label>
                          <Input
                            id="placeOfSupplyCountry"
                            value={placeOfSupplyCountry}
                            onChange={(e) => { setPlaceOfSupplyCountry(e.target.value); markUnsaved(); }}
                            disabled
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">GST Context</CardTitle>
                      <CardDescription>Client and Expert GST status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Client GST Status <span className="text-destructive">*</span></Label>
                        <Select value={clientGSTStatus} onValueChange={(value: 'registered' | 'not_registered') => { setClientGSTStatus(value); markUnsaved(); }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="registered">GST Registered</SelectItem>
                            <SelectItem value="not_registered">GST Not Registered</SelectItem>
                          </SelectContent>
                        </Select>
                        {clientGSTStatus === 'registered' && (
                          <div className="mt-2">
                            <Label htmlFor="clientGSTIN">Client GSTIN (Optional)</Label>
                            <Input
                              id="clientGSTIN"
                              value={clientGSTIN}
                              onChange={(e) => { setClientGSTIN(e.target.value.toUpperCase()); markUnsaved(); }}
                              placeholder="29ABCDE1234F1Z5"
                              maxLength={15}
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Expert GST Status <span className="text-destructive">*</span></Label>
                        {expertGstLocked ? (
                          <>
                            <Input
                              value="GST Registered"
                              disabled
                              className="bg-muted"
                            />
                            <div className="mt-2 space-y-1">
                              <Label className="text-xs text-muted-foreground">GSTIN (from profile)</Label>
                              <Input
                                value={expertProfile?.gstNumber?.toUpperCase() || ''}
                                disabled
                                className="bg-muted font-mono"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Sourced from your verified profile
                            </p>
                          </>
                        ) : (
                          <>
                            <Select
                              value={expertGSTStatus}
                              onValueChange={(value: 'registered' | 'not_registered') => {
                                setExpertGSTStatus(value);
                                markUnsaved();
                                if (value === 'not_registered') {
                                  setExpertGSTIN('');
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select GST status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="registered">GST Registered</SelectItem>
                                <SelectItem value="not_registered">GST Not Registered</SelectItem>
                              </SelectContent>
                            </Select>
                            {expertGSTStatus === 'registered' && (
                              <div className="mt-2 space-y-1">
                                <Label htmlFor="expertGSTIN">
                                  GST Number <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id="expertGSTIN"
                                  value={expertGSTIN}
                                  onChange={(e) => { setExpertGSTIN(e.target.value.toUpperCase()); markUnsaved(); }}
                                  placeholder="22AAAAA0000A1Z5"
                                  maxLength={15}
                                  className="font-mono"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Enter your GSTIN if not yet added in your workspace profile
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <DraftUnfreezeNotice />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep('milestones')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep('terms')}
                        disabled={!placeOfSupplyState || !placeOfSupplyCity.trim() || !isCurrentStepDraftSaved}
                        className="flex-1"
                      >
                        Continue to Terms
                      </Button>
                      <Button
                        variant="outline"
                        onClick={saveDraft}
                        disabled={saveDraftMutation.isPending}
                      >
                        {saveDraftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />}
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Terms */}
            {step === 'terms' && (
              <>
                <h2 className="mb-4 text-xl font-semibold">Timelines & Delivery Terms</h2>
                <p className="text-xs text-muted-foreground bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-center gap-2 mb-6">
                  <Info className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Estimated timeline starts after engagement activation.</span>
                </p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="timeline">Estimated Timeline *</Label>
                    <Input
                      id="timeline"
                      value={timeline}
                      onChange={(e) => { setTimeline(e.target.value); markUnsaved(); }}
                      placeholder="e.g., 8-10 weeks from engagement start"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <h3 className="font-bold text-base text-[#111926]">Engagement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="engagementStartDate">Estimated Start Date *</Label>
                        <Input
                          id="engagementStartDate"
                          type="date"
                          value={engagementStartDate}
                          onChange={(e) => { setEngagementStartDate(e.target.value); markUnsaved(); }}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estimatedEndDate">Estimated End Date *</Label>
                        <Input
                          id="estimatedEndDate"
                          type="date"
                          value={estimatedEndDate}
                          onChange={(e) => { setEstimatedEndDate(e.target.value); markUnsaved(); }}
                          min={engagementStartDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="validity">Quotation Validity (days) *</Label>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <select
                          id="validitySelect"
                          value={validitySelect}
                          onChange={(e) => handleValiditySelectChange(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="7">7 days</option>
                          <option value="15">15 days</option>
                          <option value="30">30 days</option>
                          <option value="custom">Custom period...</option>
                        </select>
                      </div>
                      
                      {validitySelect === 'custom' && (
                        <div className="flex-1 animate-in fade-in slide-in-from-left-2 duration-200">
                          <div className="relative flex items-center">
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              value={customValidity}
                              onChange={(e) => handleCustomValidityChange(e.target.value)}
                              placeholder="Enter days"
                              className="pr-12"
                            />
                            <span className="absolute right-3 text-sm text-muted-foreground">days</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">What's Not Included</CardTitle>
                      <CardDescription>Structured exclusions to prevent disputes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Out-of-Scope Items</Label>
                        {outOfScopeItems.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) => updateOutOfScopeItem(index, e.target.value)}
                              placeholder="e.g., Content writing, paid advertising budget"
                            />
                            {outOfScopeItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOutOfScopeItem(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOutOfScopeItem}
                          className="w-full gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Exclusion Item
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="thirdPartyCosts">Third-Party Costs</Label>
                        <Textarea
                          id="thirdPartyCosts"
                          value={thirdPartyCosts}
                          onChange={(e) => { setThirdPartyCosts(e.target.value); markUnsaved(); }}
                          placeholder="e.g., Tool subscriptions, stock images, paid plugins"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="changeRequestHandling">Change Request Handling</Label>
                        <Textarea
                          id="changeRequestHandling"
                          value={changeRequestHandling}
                          onChange={(e) => { setChangeRequestHandling(e.target.value); markUnsaved(); }}
                          placeholder="e.g., Changes beyond original scope will be quoted separately"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <Label htmlFor="assumptions">Assumptions</Label>
                    <Textarea
                      id="assumptions"
                      value={assumptions}
                      onChange={(e) => { setAssumptions(e.target.value); markUnsaved(); }}
                      placeholder="e.g., Client will provide timely feedback, access to necessary tools, content approvals within 48 hours"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      State key assumptions made in this quotation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Textarea
                      id="paymentTerms"
                      value={paymentTerms}
                      onChange={(e) => { setPaymentTerms(e.target.value); markUnsaved(); }}
                      rows={3}
                    />
                  </div>

                  <div>
                    <DraftUnfreezeNotice />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep('tax')}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep('review')}
                        disabled={!canProceedFromTerms || !isCurrentStepDraftSaved}
                        className="flex-1"
                      >
                        Review Quotation
                      </Button>
                      <Button
                        variant="outline"
                        onClick={saveDraft}
                        disabled={saveDraftMutation.isPending}
                      >
                        {saveDraftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />}
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 6: Review */}
            {step === 'review' && (
              <>
                <h2 className="mb-2 text-xl font-semibold">Review & Send</h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Confirm each section below. Use Edit to jump back to any step, or click a step in the bar above.
                </p>

                <div className="space-y-6">
                  <QuotationReviewPanel
                    onGoToStep={setStep}
                    seekerName={seekerName}
                    serviceCategory={serviceCategory}
                    discussionRefId={discussionRefId}
                    expertRefId={expertProfile?.referenceId || expertProfile?.expertId}
                    engagementAlignment={engagementAlignment}
                    projectTitle={projectTitle}
                    scope={scope}
                    deliverables={deliverables}
                    milestones={milestones}
                    totalAmount={totalAmount}
                    formatCurrency={formatCurrency}
                    getMilestoneAmount={getMilestoneAmount}
                    placeOfSupplyCity={placeOfSupplyCity}
                    placeOfSupplyState={placeOfSupplyState}
                    placeOfSupplyCountry={placeOfSupplyCountry}
                    clientGSTStatus={clientGSTStatus}
                    clientGSTIN={clientGSTIN}
                    expertGSTStatus={expertGSTStatus}
                    expertGSTIN={expertGstLocked ? expertProfile?.gstNumber : expertGSTIN}
                    timeline={timeline}
                    validity={validity}
                    engagementStartDate={engagementStartDate}
                    estimatedEndDate={estimatedEndDate}
                    assumptions={assumptions}
                    paymentTerms={paymentTerms}
                    outOfScopeItems={outOfScopeItems}
                    thirdPartyCosts={thirdPartyCosts}
                    changeRequestHandling={changeRequestHandling}
                  />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Commercials & Deposit Structure</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total engagement value</span>
                        <span className="font-semibold text-lg">{formatCurrency(totalAmount)}</span>
                      </div>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Deposits are managed by MarTechAdda and released to the expert only upon milestone approval.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-base">Platform Role & Important Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#111926]">Platform Role</p>
                        <p>MarTechAdda facilitates expert engagements and deposit management. Invoices are issued directly between the Service Seeker and Service Provider. For disputes, revisions, or milestone-related concerns, both parties must CC <span className="font-semibold text-[#111926]">support@martechadda.com</span> for review and resolution support.</p>
                      </div>
                      <div className="pt-2 border-t border-border mt-2 space-y-1">
                        <p className="font-semibold text-[#111926]">GST & Tax Compliance</p>
                        <p>GST rates and tax details are provided by the Service Provider. Both parties are responsible for applicable tax compliance.</p>
                      </div>
                      <div className="pt-2 border-t border-border mt-2 space-y-1">
                        <p className="font-semibold text-[#111926]">Quotation Disclaimer</p>
                        <p>This quotation is for reference and engagement approval purposes only and is not a tax invoice.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep('terms')}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={createQuotationMutation.isPending || !isCurrentStepDraftSaved}
                      className="flex-1"
                    >
                      {createQuotationMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Quotation'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={saveDraft}
                      disabled={saveDraftMutation.isPending}
                    >
                      {saveDraftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Draft
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateQuotation;
