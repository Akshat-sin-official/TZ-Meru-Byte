import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, Lock, Sparkles } from 'lucide-react';
import {
    SERVICE_HEADS,
    ServiceHead,
    SERVICE_HEAD_TO_PRIMARY_FILTERS,
    PRIMARY_TO_SUB_FILTERS,
    ENGAGEMENT_MODELS,
    SUB_ENTITY_TYPES,
    MUMBAI_REGIONS,
} from '@/data/taxonomy';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface FilterState {
    coreServiceCategories: string[];
    subServices: string[]; // Specific Needs
    serviceHead?: string;
    primaryFilter?: string; // Focus Area

    industrySectors: string[];
    subIndustries: string[];

    engagementModels: string[];
    pricingStyle: string[];
    minProjectAmount?: number;
    maxBudget?: number;
    deliveryChannels: string[]; // Operational Models
    preferredDeliverySpeed: string[]; // Turnaround

    clientScales: string[]; // Business Stage
    businessTypesServed: string[];
    clientEngagementTypes: string[]; // Customer Type

    languages: string[];
    subEntityType: string[];
    location: string;

    experienceRange?: { min: number; max: number };

    hasPortfolio?: boolean;
    hasToolsListed?: boolean;
    kycVerified?: boolean;
    verifiedCertifications?: boolean;
    complianceCompleted?: boolean;

    serviceDeliveryStates: string[];
    serviceFilter: any;
}

interface SearchSidebarProps {
    filters: FilterState;
    onFilterChange: (newFilters: FilterState) => void;
    isAuthenticated?: boolean;
    onOpenSmartFilters?: () => void;
}

export const SearchSidebar = ({
    filters,
    onFilterChange,
    isAuthenticated = false,
    onOpenSmartFilters,
}: SearchSidebarProps) => {
    const [localLocation, setLocalLocation] = useState(filters.location);

    // Debounce location update
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localLocation !== filters.location) {
                onFilterChange({ ...filters, location: localLocation });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localLocation]);

    // Keep localLocation in sync if filters.location changes from parent/URL
    useEffect(() => {
        setLocalLocation(filters.location || '');
    }, [filters.location]);

    const updateArrayFilter = (field: keyof FilterState, value: string) => {
        const current = (filters[field] as string[]) || [];
        const updated = current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value];
        onFilterChange({ ...filters, [field]: updated });
    };

    const updateServiceHead = (head: string) => {
        onFilterChange({
            ...filters,
            coreServiceCategories: [head],
            serviceHead: head,
            primaryFilter: undefined,
            subServices: [],
        });
    };

    const updatePrimaryFilter = (primary: string) => {
        onFilterChange({
            ...filters,
            primaryFilter: primary,
            subServices: [],
        });
    };

    const clearAll = () => {
        onFilterChange({
            ...filters,
            serviceHead: undefined,
            primaryFilter: undefined,
            coreServiceCategories: [],
            subServices: [],
            industrySectors: [],
            subIndustries: [],
            engagementModels: [],
            pricingStyle: [],
            deliveryChannels: [],
            preferredDeliverySpeed: [],
            clientScales: [],
            businessTypesServed: [],
            clientEngagementTypes: [],
            languages: [],
            subEntityType: [],
            location: '',
            hasPortfolio: undefined,
            hasToolsListed: undefined,
            kycVerified: undefined,
            verifiedCertifications: undefined,
            complianceCompleted: undefined,
            serviceDeliveryStates: [],
            experienceRange: undefined,
            minProjectAmount: undefined,
            maxBudget: undefined,
        });
        setLocalLocation('');
    };

    return (
        <div className="w-full flex flex-col h-full border-r border-border/40 bg-white">
            {/* Header: Primary Filter */}
            <div className="pt-6 pb-4 px-5 border-b border-border/40 flex items-center justify-between">
                <h2 className="font-bold font-poppins text-[15px] text-ink flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" /> Primary Filter
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-[11.5px] h-7 font-bold text-ink-soft hover:text-primary rounded-full hover:bg-primary/5 px-2.5 transition-colors cursor-pointer"
                >
                    Reset All
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4.5 space-y-4">

                    {/* 01 — Location */}
                    <div className="border border-border/40 rounded-[20px] p-4 bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-2">
                        <div className="space-y-0.5">
                            <h3 className="font-bold font-poppins text-[13.5px] text-ink">
                                01 — Location
                            </h3>
                            <p className="text-[11.5px] text-ink-soft">Where you need support.</p>
                        </div>
                        <Select
                            value={localLocation || 'all'}
                            onValueChange={(val) => setLocalLocation(val === 'all' ? '' : val)}
                        >
                            <SelectTrigger className="h-10 text-[13px] rounded-xl border-border/50 bg-white text-ink font-medium focus:ring-4 focus:ring-primary/5">
                                <SelectValue placeholder="City or Region..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/50 shadow-lg">
                                <SelectItem value="all" className="text-[13px]">
                                    Any Location
                                </SelectItem>
                                {MUMBAI_REGIONS.map((region) => (
                                    <SelectItem key={region} value={region} className="text-[13px]">
                                        {region}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 02 — Service Category */}
                    <div className="border border-border/40 rounded-[20px] p-4 bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-2">
                        <div className="space-y-0.5">
                            <h3 className="font-bold font-poppins text-[13.5px] text-ink">
                                02 — Service Category
                            </h3>
                            <p className="text-[11.5px] text-ink-soft">What marketing area do you need?</p>
                        </div>
                        <Select value={filters.serviceHead || ''} onValueChange={updateServiceHead}>
                            <SelectTrigger className="h-10 text-[13px] rounded-xl border border-border/50 bg-white text-ink font-semibold focus:ring-4 focus:ring-primary/5 shadow-sm">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border border-border/50 shadow-lg">
                                {SERVICE_HEADS.map((head) => (
                                    <SelectItem key={head} value={head} className="text-[13px] font-medium">
                                        {head}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 03 — Focus Area */}
                    {filters.serviceHead && (
                        <div className="border border-border/40 rounded-[20px] p-4 bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-2 animate-in fade-in duration-200">
                            <div className="space-y-0.5">
                                <h3 className="font-bold font-poppins text-[13.5px] text-ink">
                                    03 — Focus Area
                                </h3>
                                <p className="text-[11.5px] text-ink-soft">What specific area do you need?</p>
                            </div>
                            <Select value={filters.primaryFilter || ''} onValueChange={updatePrimaryFilter}>
                                <SelectTrigger className="h-10 text-[13px] rounded-xl border border-border/50 bg-white text-ink font-semibold focus:ring-4 focus:ring-primary/5 shadow-sm">
                                    <SelectValue placeholder="Select Focus Area" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-border/50 shadow-lg">
                                    {SERVICE_HEAD_TO_PRIMARY_FILTERS[filters.serviceHead as ServiceHead]?.map((primary) => (
                                        <SelectItem key={primary} value={primary} className="text-[13px] font-medium">
                                            {primary}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* 04 — Specific Need */}
                    {filters.primaryFilter && (
                        <div className="border border-border/40 rounded-[20px] p-4 bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-2.5 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h3 className="font-bold font-poppins text-[13.5px] text-ink">
                                        04 — Specific Need
                                    </h3>
                                    <p className="text-[11.5px] text-ink-soft">What exactly do you need help with?</p>
                                </div>
                                {(() => {
                                    const subFilters = PRIMARY_TO_SUB_FILTERS[filters.primaryFilter!] || [];
                                    const allSelected = subFilters.length > 0 && subFilters.every((sf) => filters.subServices.includes(sf));
                                    return (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10 px-2 rounded-full"
                                            onClick={() => {
                                                const currentOther = filters.subServices.filter((s) => !subFilters.includes(s));
                                                const updated = allSelected ? currentOther : [...currentOther, ...subFilters];
                                                onFilterChange({ ...filters, subServices: updated });
                                            }}
                                        >
                                            {allSelected ? 'Deselect All' : 'Select All'}
                                        </Button>
                                    );
                                })()}
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {PRIMARY_TO_SUB_FILTERS[filters.primaryFilter!]?.map((sub) => (
                                    <div key={sub} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`sub-${sub}`}
                                            checked={filters.subServices.includes(sub)}
                                            onCheckedChange={() => updateArrayFilter('subServices', sub)}
                                        />
                                        <Label htmlFor={`sub-${sub}`} className="text-[12.5px] font-normal cursor-pointer leading-tight">
                                            {sub}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 05 — Engagement Model */}
                    <div className="border border-border/40 rounded-[20px] p-4 bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-2">
                        <div className="space-y-0.5">
                            <h3 className="font-bold font-poppins text-[13.5px] text-ink">
                                05 — Engagement Model
                            </h3>
                            <p className="text-[11.5px] text-ink-soft">How do you want to engage?</p>
                        </div>
                        <div className="space-y-1.5 pt-1">
                            {ENGAGEMENT_MODELS.map((model) => (
                                <div key={model} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`em-${model}`}
                                        checked={filters.engagementModels.includes(model)}
                                        onCheckedChange={() => updateArrayFilter('engagementModels', model)}
                                    />
                                    <Label htmlFor={`em-${model}`} className="text-[12.5px] font-normal cursor-pointer leading-tight">
                                        {model}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 06 — Expert role Type */}
                    <div className="border border-border/40 rounded-[20px] p-4 bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-2">
                        <div className="space-y-0.5">
                            <h3 className="font-bold font-poppins text-[13.5px] text-ink">
                                06 — Expert role Type
                            </h3>
                            <p className="text-[11.5px] text-ink-soft">What type of specialist do you prefer?</p>
                        </div>
                        <div className="space-y-1.5 pt-1">
                            {SUB_ENTITY_TYPES.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`set-${type}`}
                                        checked={filters.subEntityType.includes(type)}
                                        onCheckedChange={() => updateArrayFilter('subEntityType', type)}
                                    />
                                    <Label htmlFor={`set-${type}`} className="text-[12.5px] font-normal cursor-pointer leading-tight">
                                        {type}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SMART FILTERS 🔒 (Pages 8-9) */}
                    {!isAuthenticated ? (
                        <div className="mt-6 p-5 rounded-[20px] border border-dashed border-primary/30 bg-primary/5 text-center space-y-3">
                            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold font-poppins text-[14px] text-ink flex items-center justify-center gap-1.5">
                                    Unlock Smart Filters
                                </h4>
                                <p className="text-[12px] text-ink-soft leading-relaxed">
                                    Create a free account to refine your search further.
                                </p>
                            </div>
                            {(() => {
                                let cleanUrl = typeof window !== 'undefined' ? window.location.href : '';
                                try {
                                    const u = new URL(cleanUrl);
                                    u.searchParams.delete('token');
                                    u.searchParams.delete('accessToken');
                                    u.hash = '';
                                    cleanUrl = u.toString();
                                } catch {
                                    // fallback
                                }
                                return (
                                    <div className="space-y-2 pt-1">
                                        <Button
                                            asChild
                                            className="w-full rounded-full bg-primary hover:bg-primary/95 text-white font-bold font-poppins text-[12.5px] h-9 shadow-sm cursor-pointer"
                                        >
                                            <a
                                                href={`https://app.martechadda.com/register-seeker?redirect=${encodeURIComponent(cleanUrl)}`}
                                                onClick={() => {
                                                    sessionStorage.setItem('addServiceFilters', JSON.stringify(filters));
                                                    sessionStorage.setItem('expertsPageHasSearched', 'true');
                                                }}
                                            >
                                                Create Free Account →
                                            </a>
                                        </Button>
                                        <div className="pt-0.5 text-center">
                                            <span className="text-[11.5px] text-ink-soft">Already have an account? </span>
                                            <a
                                                href={`https://app.martechadda.com/login?redirect=${encodeURIComponent(cleanUrl)}`}
                                                onClick={() => {
                                                    sessionStorage.setItem('addServiceFilters', JSON.stringify(filters));
                                                    sessionStorage.setItem('expertsPageHasSearched', 'true');
                                                }}
                                                className="text-[11.5px] font-bold text-primary hover:underline cursor-pointer"
                                            >
                                                Log In
                                            </a>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="mt-6 p-4 rounded-[20px] border border-primary/20 bg-primary/5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold font-poppins text-[13px] text-ink flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Smart Filters
                                </span>
                                <span className="text-[10.5px] font-bold text-primary bg-white px-2 py-0.5 rounded-full border border-primary/20">
                                    Available
                                </span>
                            </div>
                            <p className="text-[11.5px] text-ink-soft">
                                Use the Smart Filters drawer on the right to refine results by budget, industry fit, experience, and working preferences.
                            </p>
                            {onOpenSmartFilters && (
                                <Button
                                    size="sm"
                                    onClick={onOpenSmartFilters}
                                    className="w-full rounded-full bg-primary text-white font-bold font-poppins text-[12px] h-8 mt-1 cursor-pointer"
                                >
                                    Open Smart Filters Drawer →
                                </Button>
                            )}
                        </div>
                    )}

                </div>
            </ScrollArea>
        </div>
    );
};
