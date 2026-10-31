import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, RotateCcw, Check } from 'lucide-react';
import {
  INDUSTRY_SECTORS,
  INDUSTRY_SECTOR_TO_SUB_SECTORS,
  BUSINESS_SIZES,
  BUSINESS_TYPES,
  BUSINESS_RELATIONSHIP_TYPES,
  PRICING_STYLES,
  OPERATIONAL_MODELS,
  TURNAROUND_TIMES,
  LANGUAGES,
} from '@/data/taxonomy';

export interface SmartFiltersState {
  maxBudget?: number;
  industrySectors: string[];
  subIndustries: string[];
  clientScales: string[];
  businessTypesServed: string[];
  clientEngagementTypes: string[];
  experienceRange?: { min: number; max: number };
  hasPortfolio?: boolean;
  hasToolsListed?: boolean;
  pricingStyle: string[];
  deliveryChannels: string[];
  preferredDeliverySpeed: string[];
  languages: string[];
}

interface SmartFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onApplyFilters: (updatedFilters: any) => void;
  bounds?: {
    experience: { min: number; max: number };
    budget: { min: number; max: number };
  };
}

export const SmartFiltersDrawer: React.FC<SmartFiltersDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  bounds = {
    experience: { min: 1, max: 35 },
    budget: { min: 10000, max: 800000 },
  },
}) => {
  // Local state for editing in drawer before clicking "Apply Filters"
  const [localFilters, setLocalFilters] = useState<SmartFiltersState>({
    maxBudget: filters.maxBudget || filters.minProjectAmount,
    industrySectors: filters.industrySectors || [],
    subIndustries: filters.subIndustries || [],
    clientScales: filters.clientScales || [],
    businessTypesServed: filters.businessTypesServed || [],
    clientEngagementTypes: filters.clientEngagementTypes || [],
    experienceRange: filters.experienceRange,
    hasPortfolio: filters.hasPortfolio,
    hasToolsListed: filters.hasToolsListed,
    pricingStyle: filters.pricingStyle || [],
    deliveryChannels: filters.deliveryChannels || [],
    preferredDeliverySpeed: filters.preferredDeliverySpeed || [],
    languages: filters.languages || [],
  });

  // Sync with incoming filters when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters({
        maxBudget: filters.maxBudget || filters.minProjectAmount,
        industrySectors: filters.industrySectors || [],
        subIndustries: filters.subIndustries || [],
        clientScales: filters.clientScales || [],
        businessTypesServed: filters.businessTypesServed || [],
        clientEngagementTypes: filters.clientEngagementTypes || [],
        experienceRange: filters.experienceRange,
        hasPortfolio: filters.hasPortfolio,
        hasToolsListed: filters.hasToolsListed,
        pricingStyle: filters.pricingStyle || [],
        deliveryChannels: filters.deliveryChannels || [],
        preferredDeliverySpeed: filters.preferredDeliverySpeed || [],
        languages: filters.languages || [],
      });
    }
  }, [isOpen, filters]);

  const updateArrayField = (field: keyof SmartFiltersState, item: string) => {
    const current = (localFilters[field] as string[]) || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    setLocalFilters((prev) => ({ ...prev, [field]: updated }));
  };

  const clearAllSmartFilters = () => {
    setLocalFilters({
      maxBudget: undefined,
      industrySectors: [],
      subIndustries: [],
      clientScales: [],
      businessTypesServed: [],
      clientEngagementTypes: [],
      experienceRange: undefined,
      hasPortfolio: undefined,
      hasToolsListed: undefined,
      pricingStyle: [],
      deliveryChannels: [],
      preferredDeliverySpeed: [],
      languages: [],
    });
  };

  const handleApply = () => {
    onApplyFilters({
      ...filters,
      maxBudget: localFilters.maxBudget,
      minProjectAmount: localFilters.maxBudget,
      industrySectors: localFilters.industrySectors,
      subIndustries: localFilters.subIndustries,
      clientScales: localFilters.clientScales,
      businessTypesServed: localFilters.businessTypesServed,
      clientEngagementTypes: localFilters.clientEngagementTypes,
      experienceRange: localFilters.experienceRange,
      hasPortfolio: localFilters.hasPortfolio,
      hasToolsListed: localFilters.hasToolsListed,
      pricingStyle: localFilters.pricingStyle,
      deliveryChannels: localFilters.deliveryChannels,
      preferredDeliverySpeed: localFilters.preferredDeliverySpeed,
      languages: localFilters.languages,
    });
    onClose();
  };

  const minExp = bounds.experience.min || 1;
  const maxExp = bounds.experience.max || 35;
  const currentExpMin = localFilters.experienceRange?.min ?? minExp;

  const minBudget = bounds.budget.min || 10000;
  const maxBudget = bounds.budget.max || 800000;
  const currentBudget = localFilters.maxBudget ?? maxBudget;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col bg-white border-l border-border/60 shadow-2xl z-50"
      >
        {/* Header */}
        <SheetHeader className="p-5 border-b border-border/40 bg-surface/50 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <SheetTitle className="font-bold font-poppins text-[16px] text-ink text-left">
                Smart Filters
              </SheetTitle>
              <p className="text-[11px] text-ink-soft text-left">
                Advanced parameters to refine matched experts
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllSmartFilters}
            className="text-[11.5px] font-bold text-ink-soft hover:text-primary rounded-full hover:bg-primary/5 px-2.5 h-8 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear All
          </Button>
        </SheetHeader>

        {/* Scrollable Form Body */}
        <ScrollArea className="flex-1 p-5 space-y-6">
          <div className="space-y-6 pb-6">

            {/* 01 — Budget */}
            <div className="p-4 rounded-2xl border border-border/50 bg-[#FAF9F6] space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-bold font-poppins text-[13.5px] text-ink">
                  01 — Budget
                </h4>
                <p className="text-[11px] italic text-[#DC2626] font-medium">
                  Stay within your spending range.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-ink-soft">Maximum Budget:</span>
                  <span className="font-bold text-ink font-poppins text-primary">
                    {localFilters.maxBudget !== undefined
                      ? `₹${Number(localFilters.maxBudget).toLocaleString('en-IN')}`
                      : 'Any Budget'}
                  </span>
                </div>
                <Slider
                  min={minBudget}
                  max={maxBudget}
                  step={5000}
                  value={[currentBudget]}
                  onValueChange={(vals) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      maxBudget: vals[0],
                    }))
                  }
                  className="py-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10.5px] text-ink-soft font-medium">
                  <span>₹{Number(minBudget).toLocaleString('en-IN')}</span>
                  <span>₹{Number(maxBudget).toLocaleString('en-IN')}+</span>
                </div>
              </div>
            </div>

            {/* 02 — Industry Fit */}
            <div className="p-4 rounded-2xl border border-border/50 bg-[#FAF9F6] space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-bold font-poppins text-[13.5px] text-ink">
                  02 — Industry Fit
                </h4>
                <p className="text-[11px] italic text-[#DC2626] font-medium">
                  Match your business industry.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-ink/80 font-poppins uppercase tracking-wider">
                    Industry Sector
                  </Label>
                  <Select
                    value={localFilters.industrySectors[0] || 'all'}
                    onValueChange={(val) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        industrySectors: val === 'all' ? [] : [val],
                        subIndustries: [],
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 text-[13px] rounded-xl border border-border/50 bg-white text-ink font-medium">
                      <SelectValue placeholder="Any Industry Sector" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/50 shadow-lg">
                      <SelectItem value="all" className="text-[13px]">
                        Any Industry Sector
                      </SelectItem>
                      {INDUSTRY_SECTORS.map((sec) => (
                        <SelectItem key={sec} value={sec} className="text-[13px]">
                          {sec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {localFilters.industrySectors[0] && (
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-ink/80 font-poppins uppercase tracking-wider">
                      Industry Sub-Sector
                    </Label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {INDUSTRY_SECTOR_TO_SUB_SECTORS[localFilters.industrySectors[0]]?.map(
                        (sub) => (
                          <div key={sub} className="flex items-center space-x-2">
                            <Checkbox
                              id={`sub-ind-${sub}`}
                              checked={localFilters.subIndustries.includes(sub)}
                              onCheckedChange={() =>
                                updateArrayField('subIndustries', sub)
                              }
                            />
                            <Label
                              htmlFor={`sub-ind-${sub}`}
                              className="text-[12.5px] font-normal cursor-pointer leading-tight"
                            >
                              {sub}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 03 — Business Fit */}
            <div className="p-4 rounded-2xl border border-border/50 bg-[#FAF9F6] space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-bold font-poppins text-[13.5px] text-ink">
                  03 — Business Fit
                </h4>
                <p className="text-[11px] italic text-[#DC2626] font-medium">
                  Match your business profile.
                </p>
              </div>

              {/* Business Stage */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] font-bold text-ink/80 font-poppins uppercase tracking-wider">
                  Business Stage
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {BUSINESS_SIZES.map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`size-${size}`}
                        checked={localFilters.clientScales.includes(size)}
                        onCheckedChange={() =>
                          updateArrayField('clientScales', size)
                        }
                      />
                      <Label
                        htmlFor={`size-${size}`}
                        className="text-[12px] font-normal cursor-pointer leading-tight truncate"
                      >
                        {size}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Type */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-[11px] font-bold text-ink/80 font-poppins uppercase tracking-wider">
                  Business Type
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {BUSINESS_TYPES.map((btype) => (
                    <div key={btype} className="flex items-center space-x-2">
                      <Checkbox
                        id={`btype-${btype}`}
                        checked={localFilters.businessTypesServed.includes(btype)}
                        onCheckedChange={() =>
                          updateArrayField('businessTypesServed', btype)
                        }
                      />
                      <Label
                        htmlFor={`btype-${btype}`}
                        className="text-[12px] font-normal cursor-pointer leading-tight truncate"
                      >
                        {btype}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Type */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-[11px] font-bold text-ink/80 font-poppins uppercase tracking-wider">
                  Customer Type
                </Label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_RELATIONSHIP_TYPES.map((ctype) => (
                    <div key={ctype} className="flex items-center space-x-1.5">
                      <Checkbox
                        id={`ctype-${ctype}`}
                        checked={localFilters.clientEngagementTypes.includes(ctype)}
                        onCheckedChange={() =>
                          updateArrayField('clientEngagementTypes', ctype)
                        }
                      />
                      <Label
                        htmlFor={`ctype-${ctype}`}
                        className="text-[12px] font-normal cursor-pointer leading-tight"
                      >
                        {ctype}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 04 — Experience & Trust */}
            <div className="p-4 rounded-2xl border border-border/50 bg-[#FAF9F6] space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-bold font-poppins text-[13.5px] text-ink">
                  04 — Experience &amp; Trust
                </h4>
                <p className="text-[11px] italic text-[#DC2626] font-medium">
                  Set experience and credibility preferences.
                </p>
              </div>

              {/* Minimum Experience Slider (Pages 11-12) */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-ink-soft">Minimum Experience:</span>
                  <span className="font-bold text-ink font-poppins text-primary">
                    {localFilters.experienceRange?.min !== undefined
                      ? `${localFilters.experienceRange.min}+ Years`
                      : 'Any Experience'}
                  </span>
                </div>
                <Slider
                  min={minExp}
                  max={maxExp}
                  step={1}
                  value={[currentExpMin]}
                  onValueChange={(vals) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      experienceRange: { min: vals[0], max: 100 },
                    }))
                  }
                  className="py-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10.5px] text-ink-soft font-medium">
                  <span>{minExp} yrs</span>
                  <span>{maxExp}+ yrs</span>
                </div>
              </div>

              {/* Portfolio & Tools Checkboxes */}
              <div className="pt-2 space-y-2 border-t border-border/40">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smart-has-portfolio"
                    checked={localFilters.hasPortfolio || false}
                    onCheckedChange={(checked) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        hasPortfolio: checked ? true : undefined,
                      }))
                    }
                  />
                  <Label
                    htmlFor="smart-has-portfolio"
                    className="text-[12.5px] font-medium cursor-pointer"
                  >
                    Has Portfolio / Work Samples Listed
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smart-has-tools"
                    checked={localFilters.hasToolsListed || false}
                    onCheckedChange={(checked) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        hasToolsListed: checked ? true : undefined,
                      }))
                    }
                  />
                  <Label
                    htmlFor="smart-has-tools"
                    className="text-[12.5px] font-medium cursor-pointer"
                  >
                    Has Tech Stack / Tools Listed
                  </Label>
                </div>
              </div>
            </div>

            {/* 05 — Commercial Fit */}
            <div className="p-4 rounded-2xl border border-border/50 bg-[#FAF9F6] space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-bold font-poppins text-[13.5px] text-ink">
                  05 — Commercial Fit
                </h4>
                <p className="text-[11px] italic text-[#DC2626] font-medium">
                  Match how you prefer to work.
                </p>
              </div>

              {/* Pricing Model */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] font-bold text-ink/80 font-poppins uppercase tracking-wider">
                  Pricing Model
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRICING_STYLES.map((ps) => (
                    <div key={ps} className="flex items-center space-x-2">
                      <Checkbox
                        id={`ps-${ps}`}
                        checked={localFilters.pricingStyle.includes(ps)}
                        onCheckedChange={() => updateArrayField('pricingStyle', ps)}
                      />
                      <Label
                        htmlFor={`ps-${ps}`}
                        className="text-[12px] font-normal cursor-pointer leading-tight truncate"
                      >
                        {ps}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Mode */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-[11px] font-bold text-ink/80 font-poppins uppercase tracking-wider">
                  Delivery Mode
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {OPERATIONAL_MODELS.map((om) => (
                    <div key={om} className="flex items-center space-x-2">
                      <Checkbox
                        id={`om-${om}`}
                        checked={localFilters.deliveryChannels.includes(om)}
                        onCheckedChange={() =>
                          updateArrayField('deliveryChannels', om)
                        }
                      />
                      <Label
                        htmlFor={`om-${om}`}
                        className="text-[12px] font-normal cursor-pointer leading-tight truncate"
                      >
                        {om}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Turnaround Time */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-[11px] font-bold text-ink/80 font-poppins uppercase tracking-wider">
                  Turnaround Time
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TURNAROUND_TIMES.map((tt) => (
                    <div key={tt} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tt-${tt}`}
                        checked={localFilters.preferredDeliverySpeed.includes(tt)}
                        onCheckedChange={() =>
                          updateArrayField('preferredDeliverySpeed', tt)
                        }
                      />
                      <Label
                        htmlFor={`tt-${tt}`}
                        className="text-[12px] font-normal cursor-pointer leading-tight truncate"
                      >
                        {tt}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 06 — Operational Fit */}
            <div className="p-4 rounded-2xl border border-border/50 bg-[#FAF9F6] space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-bold font-poppins text-[13.5px] text-ink">
                  06 — Operational Fit
                </h4>
                <p className="text-[11px] italic text-[#DC2626] font-medium">
                  Match practical working preferences.
                </p>
              </div>

              {/* Language */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] font-bold text-ink/80 font-poppins uppercase tracking-wider">
                  Language
                </Label>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {LANGUAGES.map((lang) => (
                    <div key={lang} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang}`}
                        checked={localFilters.languages.includes(lang)}
                        onCheckedChange={() => updateArrayField('languages', lang)}
                      />
                      <Label
                        htmlFor={`lang-${lang}`}
                        className="text-[12px] font-normal cursor-pointer leading-tight truncate"
                      >
                        {lang}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <SheetFooter className="p-4 border-t border-border/40 bg-surface/50 flex flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={clearAllSmartFilters}
            className="flex-1 rounded-full font-bold font-poppins text-[13px] h-11"
          >
            Clear All
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-full bg-primary hover:bg-primary/95 text-white font-bold font-poppins text-[13px] h-11 shadow-md gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
