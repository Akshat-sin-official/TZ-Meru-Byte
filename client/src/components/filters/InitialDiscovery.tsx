import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DescribeRequirementModal } from './DescribeRequirementModal';
import { 
    CheckCircle2, 
    ShieldCheck, 
    Sparkles, 
    Scale, 
    ArrowRight, 
    ArrowLeft,
    Palette,
    TrendingUp,
    Megaphone,
    FileText
} from 'lucide-react';
import {
    SERVICE_HEADS,
    SERVICE_HEAD_TO_PRIMARY_FILTERS,
    type ServiceHead,
} from '@/data/taxonomy';

export interface InitialDiscoverySelection {
    serviceHead: ServiceHead | null;
    primaryFilter: string | null;
    location: string;
}

interface InitialDiscoveryProps {
    initialSelection?: Partial<InitialDiscoverySelection>;
    onSearch: (selection: InitialDiscoverySelection) => void;
    onApplyFilters?: (filters: any) => void;
}

export const InitialDiscovery: React.FC<InitialDiscoveryProps> = ({
    initialSelection,
    onSearch,
    onApplyFilters,
}) => {
    const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
    const [selection, setSelection] = useState<InitialDiscoverySelection>({
        serviceHead: initialSelection?.serviceHead || null,
        primaryFilter: initialSelection?.primaryFilter || null,
        location: initialSelection?.location || '',
    });

    const [currentStep, setCurrentStep] = useState<number>(
        initialSelection?.serviceHead ? 2 : 1
    );

    const [isAreaChanging, setIsAreaChanging] = useState<boolean>(false);

    useEffect(() => {
        if (initialSelection?.serviceHead) {
            setSelection({
                serviceHead: initialSelection.serviceHead,
                primaryFilter: initialSelection.primaryFilter || null,
                location: initialSelection.location || '',
            });
            setCurrentStep(2);
            setIsAreaChanging(false);
        }
    }, [initialSelection?.serviceHead, initialSelection?.primaryFilter, initialSelection?.location]);

    const availableFocusAreas = useMemo(() => {
        if (!selection.serviceHead) return [];
        return SERVICE_HEAD_TO_PRIMARY_FILTERS[selection.serviceHead] || [];
    }, [selection.serviceHead]);

    const handleServiceHeadSelect = (serviceHead: ServiceHead) => {
        const isNew = serviceHead !== selection.serviceHead;
        setSelection(prev => ({
            ...prev,
            serviceHead,
            primaryFilter: isNew ? null : prev.primaryFilter,
        }));
        setIsAreaChanging(false);
        setCurrentStep(2); // Auto-advance to refine step
    };

    const handleFocusAreaSelect = (focusArea: string) => {
        setSelection(prev => ({
            ...prev,
            primaryFilter: prev.primaryFilter === focusArea ? null : focusArea,
        }));
    };

    const handleLocationChange = (loc: string) => {
        setSelection(prev => ({
            ...prev,
            location: prev.location === loc ? '' : loc
        }));
    };

    const getServiceHeadIcon = (head: ServiceHead) => {
        switch (head) {
            case 'Branding Services':
                return Palette;
            case 'Strategic Marketing Services':
                return TrendingUp;
            case 'Advertising Services':
                return Megaphone;
            case 'Marketing Collateral Services':
                return FileText;
            default:
                return Sparkles;
        }
    };

    const getServiceHeadDesc = (head: ServiceHead) => {
        switch (head) {
            case 'Branding Services':
                return 'Establish brand strategy, messaging and visual identity.';
            case 'Strategic Marketing Services':
                return 'Understand your market, reach customers and build your growth strategy.';
            case 'Advertising Services':
                return 'Reach and acquire customers through paid advertising.';
            case 'Marketing Collateral Services':
                return 'Create the materials your business needs to market and sell.';
            default:
                return '';
        }
    };

    const searchButtonText = useMemo(() => {
        if (!selection.serviceHead) return 'Find Marketing Experts';
        if (selection.primaryFilter) {
            return `Explore ${selection.primaryFilter} Experts`;
        }
        return `Explore ${selection.serviceHead} Experts`;
    }, [selection.serviceHead, selection.primaryFilter]);

    return (
        <div className="w-full space-y-6 md:space-y-8 font-sans">

            {/* ── STEP PROGRESS BAR ── */}
            <div className="space-y-3 mb-4 text-center">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft font-poppins block">
                    Matching flow
                </span>
                <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
                    {[
                        { n: 1, label: '01 — Area', unlocked: true },
                        { n: 2, label: '02 — Expertise', unlocked: !!selection.serviceHead },
                        { n: 3, label: '03 — Discover', unlocked: !!selection.serviceHead },
                    ].map((step, idx) => (
                        <div key={step.n} className="flex items-center flex-1 last:flex-initial">
                            <button
                                type="button"
                                disabled={!step.unlocked}
                                onClick={() => {
                                    setCurrentStep(step.n);
                                    if (step.n === 1) setIsAreaChanging(false);
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                                    currentStep === step.n
                                        ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                                        : step.unlocked
                                        ? 'text-ink hover:bg-ink/5 font-semibold cursor-pointer'
                                        : 'text-ink-soft/40 cursor-not-allowed'
                                }`}
                            >
                                <span
                                    className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10.5px] font-bold transition-colors duration-300 ${
                                        currentStep === step.n
                                            ? 'bg-primary text-white'
                                            : step.unlocked
                                            ? 'bg-ink/10 text-ink'
                                            : 'bg-border/60 text-ink-soft/30'
                                    }`}
                                >
                                    {step.n}
                                </span>
                                <span className="text-[12px] tracking-wide font-poppins font-medium hidden sm:inline">
                                    {step.label}
                                </span>
                            </button>
                            {idx < 2 && (
                                <div className={`h-px flex-1 mx-2 transition-colors duration-300 ${step.unlocked ? 'bg-ink/20' : 'bg-border/50'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MAIN CONSOLE ── */}
            <div className="bg-white border border-border/40 rounded-[32px] shadow-[0_16px_48px_-16px_rgba(0,0,0,0.08)] p-6 md:p-8 min-h-[420px] flex flex-col justify-between">
                
                {/* ── STEP 1: MARKETING AREA ── */}
                {currentStep === 1 && (
                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                        {selection.serviceHead && !isAreaChanging ? (
                            /* ── LOCKED SELECTED STATE ── */
                            <div className="max-w-2xl mx-auto w-full space-y-4 text-left">
                                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-poppins">
                                        STEP 01 — MARKETING AREA
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsAreaChanging(true)}
                                        className="text-xs font-bold font-poppins text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        Change Marketing Area →
                                    </button>
                                </div>

                                <div className="rounded-[24px] border-2 border-primary bg-primary/5 p-6 shadow-xs flex items-start gap-4">
                                    <span className="w-10 h-10 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm mt-0.5">
                                        ✓
                                    </span>
                                    <div className="space-y-1.5 flex-1">
                                        <h3 className="text-xl font-bold font-poppins text-ink">
                                            {selection.serviceHead}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                                            {getServiceHeadDesc(selection.serviceHead)}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button
                                        onClick={() => setCurrentStep(2)}
                                        className="rounded-full bg-primary hover:bg-primary/95 text-white font-bold font-poppins px-6 py-2.5 text-xs shadow-sm flex items-center gap-2 cursor-pointer"
                                    >
                                        Proceed to Refine Expertise <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* ── FULL 4-CARD SELECTION GRID ── */
                            <>
                                <div className="text-center max-w-md mx-auto space-y-2">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-poppins">Step 01</span>
                                    <h2 className="text-2xl font-bold font-poppins text-ink tracking-tight">Select Marketing Area</h2>
                                    <p className="text-sm text-ink-soft">What broad area of marketing support do you need?</p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 max-w-4xl mx-auto w-full pt-4">
                                    {SERVICE_HEADS.map((serviceHead) => {
                                        const Icon = getServiceHeadIcon(serviceHead);
                                        const desc = getServiceHeadDesc(serviceHead);
                                        const isSelected = selection.serviceHead === serviceHead;
                                        return (
                                            <button
                                                key={serviceHead}
                                                onClick={() => handleServiceHeadSelect(serviceHead)}
                                                className={`text-left p-5 rounded-[24px] border-2 transition-all duration-300 flex flex-col justify-between h-[150px] group cursor-pointer ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/5 text-ink shadow-[0_8px_30px_-10px_rgba(37,99,235,0.15)]'
                                                        : 'border-border/50 hover:border-primary/30 hover:bg-[#F8F7F4] text-ink-soft hover:shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between w-full">
                                                    <span className={`p-2 rounded-xl transition-colors ${
                                                        isSelected ? 'bg-primary text-white' : 'bg-ink/5 text-ink-soft group-hover:text-primary group-hover:bg-primary/10'
                                                    }`}>
                                                        <Icon className="w-5 h-5" />
                                                    </span>
                                                    {isSelected && (
                                                        <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
                                                    )}
                                                </div>
                                                <div className="mt-auto">
                                                    <span className={`text-[15px] font-bold tracking-tight block transition-colors ${isSelected ? 'text-ink' : 'text-ink group-hover:text-primary'}`}>
                                                        {serviceHead}
                                                    </span>
                                                    <span className="text-[11.5px] leading-relaxed text-ink-soft block mt-1 line-clamp-1">
                                                        {desc}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── STEP 2: MARKETING EXPERTISE ── */}
                {currentStep === 2 && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-border/40 pb-4">
                                <button
                                    onClick={() => {
                                        setIsAreaChanging(false);
                                        setCurrentStep(1);
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-bold text-ink-soft hover:text-ink transition-colors cursor-pointer font-poppins"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-poppins">Step 02</span>
                                        <p className="text-xs text-ink-soft font-medium mt-0.5">Area: <strong className="text-ink">{selection.serviceHead}</strong></p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAreaChanging(true);
                                            setCurrentStep(1);
                                        }}
                                        className="text-xs font-bold font-poppins text-primary hover:underline flex items-center gap-1 cursor-pointer border border-primary/20 bg-primary/5 px-3 py-1 rounded-full"
                                    >
                                        Change Marketing Area →
                                    </button>
                                </div>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-4">
                                <div className="text-center space-y-1">
                                    <h2 className="text-2xl font-bold font-poppins text-ink tracking-tight">Refine Your Expertise</h2>
                                    <p className="text-sm text-ink-soft">What specific marketing capability are you looking for? (Optional)</p>
                                </div>

                                <div className="grid gap-3 pt-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                                    {availableFocusAreas.map((area) => {
                                        const isSelected = selection.primaryFilter === area;
                                        return (
                                            <button
                                                key={area}
                                                onClick={() => handleFocusAreaSelect(area)}
                                                className={`text-left px-5 py-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                                                    isSelected
                                                        ? 'border-primary/40 bg-primary/5 text-ink font-semibold shadow-sm'
                                                        : 'border-border/50 hover:border-primary/30 hover:bg-[#F8F7F4] text-ink-soft'
                                                }`}
                                            >
                                                <span className={`text-[13.5px] font-medium transition-colors ${isSelected ? 'font-bold text-ink' : 'text-ink group-hover:text-primary'}`}>
                                                    {area}
                                                </span>
                                                {isSelected && (
                                                    <CheckCircle2 className="h-4.5 w-4.5 text-[#16A34A] shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-border/40 max-w-2xl mx-auto w-full mt-4">
                            <span className="text-[12px] text-ink-soft/70 font-medium">Not sure? You can skip this step and continue.</span>
                            <Button 
                                onClick={() => setCurrentStep(3)}
                                className="rounded-full bg-ink hover:bg-primary text-white text-[12.5px] font-bold font-poppins px-6 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                {selection.primaryFilter ? 'Continue' : 'Skip & Continue'} <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: LOCATION & DISCOVER ── */}
                {currentStep === 3 && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-border/40 pb-4">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-ink-soft hover:text-ink transition-colors cursor-pointer font-poppins"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                                </button>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-poppins">Step 03</span>
                                    <p className="text-xs text-ink-soft font-medium mt-0.5">Area: <strong className="text-ink">{selection.serviceHead}</strong></p>
                                </div>
                            </div>

                            <div className="max-w-xl mx-auto space-y-6">
                                <div className="text-center space-y-1">
                                    <h2 className="text-2xl font-bold font-poppins text-ink tracking-tight">Select Preferred Location</h2>
                                    <p className="text-sm text-ink-soft">Where would you prefer your marketing expert to be located? (Optional)</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                                    {['Mumbai', 'Navi Mumbai', 'Thane', 'Raigad'].map((district) => {
                                        const isSelected = selection.location === district;
                                        return (
                                            <button
                                                key={district}
                                                type="button"
                                                onClick={() => handleLocationChange(district)}
                                                className={`py-3.5 rounded-2xl border text-[13px] font-bold transition-all duration-300 text-center cursor-pointer ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/5 text-ink shadow-sm'
                                                        : 'border-border/50 hover:border-primary/20 hover:bg-[#F8F7F4] text-ink-soft'
                                                }`}
                                            >
                                                {district}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-center text-[12px] text-ink-soft/70 font-medium">
                                    Leave blank to discover experts across all available locations.
                                </p>

                                {/* Final selection summary banner */}
                                <div className="bg-[#FAF9F6] border border-border/40 rounded-2xl p-4 space-y-2 mt-4 max-w-md mx-auto">
                                    <p className="font-bold text-ink/40 uppercase tracking-widest text-[9.5px] font-poppins">Summary of Selections</p>
                                    <div className="space-y-1 text-[13px]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#16A34A] font-bold">✓</span>
                                            <span className="text-ink-soft">Area: <strong className="text-ink">{selection.serviceHead}</strong></span>
                                        </div>
                                        {selection.primaryFilter && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#16A34A] font-bold">✓</span>
                                                <span className="text-ink-soft">Expertise: <strong className="text-ink">{selection.primaryFilter}</strong></span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#16A34A] font-bold">✓</span>
                                            <span className="text-ink-soft">Location: <strong className="text-ink">{selection.location || 'All Locations'}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border/40 max-w-md mx-auto w-full mt-4 flex justify-center">
                            <Button
                                className="w-full h-12 text-[14px] font-bold rounded-full transition-all duration-300 cursor-pointer bg-primary hover:bg-[#2A2A27] text-white shadow-[0_8px_30px_rgba(37,99,235,0.2)] hover:shadow-lg flex items-center justify-center gap-2 font-poppins"
                                onClick={() => onSearch(selection)}
                            >
                                <span>{searchButtonText}</span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
                {/* ── AI REQUIREMENTS CTA (Displayed on all 3 steps) ── */}
                <div className="mt-8 pt-5 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF8F5] p-4 rounded-2xl border border-primary/10">
                    <div className="text-left">
                        <p className="text-[13px] font-bold text-ink font-poppins">Not sure what you need?</p>
                        <p className="text-[11.5px] text-ink-soft">Tell us what you're trying to solve. We'll help you find the right expert.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsAiModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white px-4 py-2 text-[12px] font-bold font-poppins text-primary hover:bg-primary hover:text-white transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                        <span>Find the Right Expert</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── AI REQUIREMENT SEARCH MODAL ── */}
                <DescribeRequirementModal
                    isOpen={isAiModalOpen}
                    onClose={() => setIsAiModalOpen(false)}
                    onApplyFilters={onApplyFilters}
                />
            </div>

            {/* ── TRUST SECTION: Why MarTechAdda Matching? ── */}
            <div className="space-y-4 pt-4">
                <h3 className="text-center font-bold font-poppins text-lg text-ink">Why MarTechAdda Matching?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            icon: Sparkles,
                            emoji: '🎯',
                            color: 'text-primary',
                            bg: 'bg-primary/8',
                            title: 'Requirement-First Matching',
                            desc: 'Experts are matched based on your selected business requirements—not paid visibility.',
                        },
                        {
                            icon: ShieldCheck,
                            emoji: '✓',
                            color: 'text-[#16A34A]',
                            bg: 'bg-[#16A34A]/8',
                            title: 'Vetted Experts',
                            desc: 'Expertise and profiles are reviewed before experts become discoverable on MarTechAdda.',
                        },
                        {
                            icon: Scale,
                            emoji: '⚖️',
                            color: 'text-blue-600',
                            bg: 'bg-blue-600/8',
                            title: 'Transparent Comparison',
                            desc: 'Compare relevant experts across expertise, experience, engagement fit and other business criteria.',
                        },
                    ].map(({ emoji, title, desc }) => (
                        <div key={title} className="flex items-start gap-4 p-5 bg-white border border-border/40 rounded-2xl hover:border-border/60 transition-colors shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
                            <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-base shrink-0">
                                {emoji}
                            </span>
                            <div>
                                <p className="text-[13.5px] font-bold text-ink font-poppins leading-tight">{emoji === '✓' ? '✓ ' : ''}{title}</p>
                                <p className="text-[12px] text-ink-soft leading-relaxed mt-1">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
