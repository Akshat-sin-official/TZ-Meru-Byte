import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { expertService } from '@/services';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, CloudLightning } from 'lucide-react';
import {
  BUSINESS_TYPES,
  BUSINESS_RELATIONSHIP_TYPES,
  ENGAGEMENT_MODELS,
  PRICING_STYLES,
  OPERATIONAL_MODELS,
  TURNAROUND_TIMES
} from '@/data/taxonomy';

interface ExpertAlignmentFormProps {
  discussionId: string;
}

interface AlignmentState {
  businessStage?: string;
  businessType?: string;
  customerType?: string;
  engagementModel?: string;
  pricingModel?: string;
  deliveryMode?: string;
  turnaroundTime?: string;
}

export const ExpertAlignmentForm = ({ discussionId }: ExpertAlignmentFormProps) => {
  const queryClient = useQueryClient();

  // Fetch the existing quotation draft (if any)
  const { data: serverDraft, isLoading: draftLoading } = useQuery({
    queryKey: ['quotationDraft', discussionId],
    queryFn: () => expertService.getQuotationDraftByDiscussion(discussionId),
    enabled: !!discussionId,
  });

  const [state, setState] = useState<AlignmentState>({
    businessStage: '',
    businessType: '',
    customerType: '',
    engagementModel: '',
    pricingModel: '',
    deliveryMode: '',
    turnaroundTime: '',
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load alignment values from server draft
  useEffect(() => {
    if (draftLoading) return;
    
    if (serverDraft?.engagementAlignment) {
      const alignment = serverDraft.engagementAlignment as AlignmentState;
      setState({
        businessStage: alignment.businessStage || '',
        businessType: alignment.businessType || '',
        customerType: alignment.customerType || '',
        engagementModel: alignment.engagementModel || '',
        pricingModel: alignment.pricingModel || '',
        deliveryMode: alignment.deliveryMode || '',
        turnaroundTime: alignment.turnaroundTime || '',
      });
      setIsInitialized(true);
    } else if (!isInitialized && serverDraft === null) {
      // No draft exists yet, keep defaults
      setIsInitialized(true);
    }
  }, [serverDraft, draftLoading, isInitialized]);

  // Mutation to save/update draft quotation
  const saveDraftMutation = useMutation({
    mutationFn: (alignmentData: AlignmentState) => {
      setSavingStatus('saving');
      return expertService.saveQuotationDraft({
        discussionId,
        engagementAlignment: alignmentData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotationDraft', discussionId] });
      setSavingStatus('saved');
      setTimeout(() => {
        setSavingStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
    },
    onError: (error: unknown) => {
      setSavingStatus('error');
      const msg = error instanceof Error ? error.message : 'Failed to save alignment';
      toast.error(msg);
    },
  });

  // Debounced auto-save effect
  const lastStateRef = useRef<string>('');
  
  useEffect(() => {
    if (!isInitialized || draftLoading) return;

    const currentStateStr = JSON.stringify(state);
    
    // Check if state actually changed from the last saved state
    if (lastStateRef.current === currentStateStr) return;

    const timeoutId = setTimeout(() => {
      lastStateRef.current = currentStateStr;
      saveDraftMutation.mutate(state);
    }, 1200); // 1.2s debounce

    return () => clearTimeout(timeoutId);
  }, [state, isInitialized, draftLoading, saveDraftMutation]);

  const updateField = (field: keyof AlignmentState, value: string) => {
    setState(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (draftLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Loading alignment details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Engagement & Delivery</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time sync to quotation</p>
        </div>
        <div className="flex items-center text-xs">
          {savingStatus === 'saving' && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
            </span>
          )}
          {savingStatus === 'saved' && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          {savingStatus === 'error' && (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              Error
            </span>
          )}
          {savingStatus === 'idle' && (
            <span className="flex items-center gap-1 text-gray-400">
              <CloudLightning className="h-3.5 w-3.5" /> Auto-saves
            </span>
          )}
        </div>
      </div>

      {/* Business Fit Section */}
      <div className="space-y-4">
        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Business Fit</h5>
        
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Business Stage</Label>
          <Select 
            value={state.businessStage} 
            onValueChange={(val) => updateField('businessStage', val)}
          >
            <SelectTrigger className="h-9 text-xs bg-gray-50/50 hover:bg-gray-50 border-gray-200">
              <SelectValue placeholder="Select business stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Startups">Startups</SelectItem>
              <SelectItem value="Small & Medium Businesses">Small & Medium Businesses</SelectItem>
              <SelectItem value="Enterprises">Enterprises</SelectItem>
              <SelectItem value="Global">Global</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Business Type</Label>
          <Select 
            value={state.businessType} 
            onValueChange={(val) => updateField('businessType', val)}
          >
            <SelectTrigger className="h-9 text-xs bg-gray-50/50 hover:bg-gray-50 border-gray-200">
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map(bt => (
                <SelectItem key={bt} value={bt} className="text-xs">{bt}</SelectItem>
              ))}
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Customer Type</Label>
          <Select 
            value={state.customerType} 
            onValueChange={(val) => updateField('customerType', val)}
          >
            <SelectTrigger className="h-9 text-xs bg-gray-50/50 hover:bg-gray-50 border-gray-200">
              <SelectValue placeholder="Select customer type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_RELATIONSHIP_TYPES.map(bt => (
                <SelectItem key={bt} value={bt} className="text-xs">{bt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Commercial Fit Section */}
      <div className="space-y-4 pt-2 border-t">
        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Commercial Fit</h5>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Engagement Model</Label>
          <Select 
            value={state.engagementModel} 
            onValueChange={(val) => updateField('engagementModel', val)}
          >
            <SelectTrigger className="h-9 text-xs bg-gray-50/50 hover:bg-gray-50 border-gray-200">
              <SelectValue placeholder="Select engagement model" />
            </SelectTrigger>
            <SelectContent>
              {ENGAGEMENT_MODELS.map(em => (
                <SelectItem key={em} value={em} className="text-xs">{em}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Pricing Model</Label>
          <Select 
            value={state.pricingModel} 
            onValueChange={(val) => updateField('pricingModel', val)}
          >
            <SelectTrigger className="h-9 text-xs bg-gray-50/50 hover:bg-gray-50 border-gray-200">
              <SelectValue placeholder="Select pricing model" />
            </SelectTrigger>
            <SelectContent>
              {PRICING_STYLES.map(ps => (
                <SelectItem key={ps} value={ps} className="text-xs">{ps}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Delivery & Timelines Section */}
      <div className="space-y-4 pt-2 border-t">
        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery & Timelines</h5>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Delivery Mode</Label>
          <Select 
            value={state.deliveryMode} 
            onValueChange={(val) => updateField('deliveryMode', val)}
          >
            <SelectTrigger className="h-9 text-xs bg-gray-50/50 hover:bg-gray-50 border-gray-200">
              <SelectValue placeholder="Select delivery mode" />
            </SelectTrigger>
            <SelectContent>
              {OPERATIONAL_MODELS.map(om => (
                <SelectItem key={om} value={om} className="text-xs">{om}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Turnaround Time</Label>
          <Select 
            value={state.turnaroundTime} 
            onValueChange={(val) => updateField('turnaroundTime', val)}
          >
            <SelectTrigger className="h-9 text-xs bg-gray-50/50 hover:bg-gray-50 border-gray-200">
              <SelectValue placeholder="Select turnaround time" />
            </SelectTrigger>
            <SelectContent>
              {TURNAROUND_TIMES.map(tt => (
                <SelectItem key={tt} value={tt} className="text-xs">{tt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
