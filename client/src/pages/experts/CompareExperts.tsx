/**
 * Compare Experts Page
 * 
 * Allows users to compare up to 3 experts side-by-side across a 14-row structured comparison table (Pages 14-16)
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import WebsiteLayout from '@/components/website/WebsiteLayout';
import { useAuth } from '@/contexts/AuthContext';
import { searchService } from '@/services/searchService';
import { shortlistService } from '@/services/shortlistService';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Award,
  Clock,
  DollarSign,
  XCircle,
  X,
  Users,
  Languages,
  FileText,
  TrendingUp,
  Shield,
  Zap,
  Check,
  Calendar,
  Sparkles,
  Briefcase,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BrowseServiceContext, hasBrowseContext, normContains, parseBrowseContext, serializeBrowseQuery, slugify } from '@/pages/experts/browseContext';

function contextualCompareExpertiseLabels(expert: any, ctx: BrowseServiceContext): string[] {
  if (!hasBrowseContext(ctx)) {
    const c = expert.categories || [];
    return Array.isArray(c) ? c.slice(0, 3) : c ? [c] : [];
  }
  const labels: string[] = [];
  if (ctx.svc) {
    const cats = expert.categories || [];
    if (Array.isArray(cats)) {
      const hit = cats.find((x: string) => normContains(x, ctx.svc!) || normContains(ctx.svc!, x));
      if (hit) labels.push(hit);
      else labels.push(ctx.svc);
    } else labels.push(ctx.svc);
  }
  const structured = expert.services;
  if (Array.isArray(structured) && structured.length > 0) {
    for (const row of structured) {
      if (ctx.svc && !normContains(String(row.serviceHead || ''), ctx.svc)) continue;
      if (ctx.focus) {
        const hit = (row.primaryFilters || []).find(
          (p: string) => normContains(p, ctx.focus!) || normContains(ctx.focus!, p)
        );
        if (hit) labels.push(hit);
      }
      if (ctx.needs.length) {
        for (const n of ctx.needs) {
          const hit = (row.subFilters || []).find((s: string) => normContains(s, n) || normContains(n, s));
          if (hit) labels.push(hit);
        }
      }
    }
  } else {
    const subs = expert.subServices || [];
    if (ctx.focus && Array.isArray(subs)) {
      const hit = subs.find((s: string) => normContains(s, ctx.focus!) || normContains(ctx.focus!, s));
      if (hit) labels.push(hit);
    }
    if (ctx.needs.length && Array.isArray(subs)) {
      for (const n of ctx.needs) {
        const hit = subs.find((s: string) => normContains(s, n));
        if (hit) labels.push(hit);
      }
    }
  }
  const uniq = [...new Set(labels)].filter(Boolean);
  if (uniq.length) return uniq.slice(0, 8);
  const c = expert.categories || [];
  return Array.isArray(c) ? c.slice(0, 3) : c ? [c] : [];
}

const CompareExperts = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const expertIds = useMemo(() => {
    return searchParams.get('ids')?.split(',').filter(Boolean).map(id => id.trim()) || [];
  }, [searchParams]);

  const browseCtx = useMemo(() => parseBrowseContext(searchParams), [searchParams]);
  const browseSuffix = useMemo(() => serializeBrowseQuery(browseCtx), [browseCtx]);

  // Remove an expert from comparison by updating URL params
  const handleRemoveExpert = useCallback((expertIdToRemove: string) => {
    const remaining = expertIds.filter(id => id !== expertIdToRemove);
    if (remaining.length < 2) {
      navigate(`/experts${browseSuffix}`);
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set('ids', remaining.join(','));
    navigate(`/experts/compare?${params.toString()}`, { replace: true });
  }, [expertIds, searchParams, navigate, browseSuffix]);

  // Bulk fetch expert profiles for better performance
  const { data: expertsData, isLoading, error } = useQuery({
    queryKey: ['expertProfilesBulk', expertIds],
    queryFn: () => searchService.getExpertProfilesBulk(expertIds),
    enabled: expertIds.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1, // Only retry once to avoid long loading on failure
    refetchOnWindowFocus: false,
  });

  const experts = expertsData || [];

  // Track comparison event (PDF Pages 4-5: Compare Event, Deduplicated)
  useEffect(() => {
    if (isAuthenticated && expertIds.length >= 2) {
      const serviceContext = browseCtx.svc || browseCtx.focus || browseCtx.needs?.[0] || undefined;
      shortlistService.trackCompare(expertIds, serviceContext).catch((err) => {
        console.debug('Comparison tracking error:', err);
      });
    }
  }, [isAuthenticated, expertIds, browseCtx.svc, browseCtx.focus, browseCtx.needs]);

  if (expertIds.length < 2) {
    return (
      <WebsiteLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <XCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="mb-4 text-2xl font-bold">Invalid Comparison</h1>
            <p className="mb-6 text-muted-foreground">
              Please select at least 2 experts to compare.
            </p>
            <Button onClick={() => navigate(`/experts${browseSuffix}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Discovery
            </Button>
          </div>
        </div>
      </WebsiteLayout>
    );
  }

  if (isLoading) {
    return (
      <WebsiteLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Fetching comparison details...</p>
        </div>
      </WebsiteLayout>
    );
  }

  if (error || experts.length === 0) {
    return (
      <WebsiteLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="mb-4 text-2xl font-bold">Error Loading Experts</h1>
            <p className="mb-6 text-muted-foreground">
              Failed to load expert profiles for comparison.
            </p>
            <Button onClick={() => navigate(`/experts${browseSuffix}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Discovery
            </Button>
          </div>
        </div>
      </WebsiteLayout>
    );
  }

  // Define columns based on experts
  const gridTemplate = `220px repeat(${experts.length}, minmax(240px, 1fr))`;

  return (
    <WebsiteLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/experts${browseSuffix}`)}
              className="gap-2 -ml-2 mb-2 hover:bg-primary/5 text-primary cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
            <h1 className="text-3xl md:text-4xl font-black font-poppins tracking-tight text-ink flex items-center gap-3">
              Expert Comparison
              <span className="text-primary text-lg px-3 py-0.5 bg-primary/10 rounded-full font-bold">
                {experts.length}
              </span>
            </h1>
            <p className="text-sm text-ink-soft mt-1 font-sans">
              Side-by-side comparison across 14 dimensions: expertise, fit, commercial, credibility, business details, and working preferences.
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="relative border border-border/60 rounded-[28px] bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 pb-4">
            <div
              style={{ gridTemplateColumns: gridTemplate }}
              className="grid min-w-[760px]"
            >
              {/* Header Row: Expert Profile Cards */}
              <div className="sticky left-0 top-0 z-20 p-6 bg-[#FAF9F6] border-b border-border/40 flex flex-col justify-end shadow-[2px_2px_10px_rgba(0,0,0,0.015)]">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-ink-soft font-poppins">Metric Profile</span>
              </div>
              {experts.map((expert) => (
                <div key={`header-${expert.userId}`} className="sticky top-0 z-10 p-6 bg-[#FAF9F6] border-b border-border/40 border-l border-border/30 relative">
                  {/* Remove from comparison button */}
                  <button
                    onClick={() => handleRemoveExpert(expert.userId)}
                    className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white border border-border/50 shadow-sm flex items-center justify-center hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all cursor-pointer text-ink-soft"
                    title="Remove from comparison"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {(() => {
                    const getAvatarBg = (name: string) => {
                      const colors = ["#F5E3D2", "#DDECD4", "#D8E5F5", "#FAF6F0"];
                      const charCode = name.charCodeAt(0) || 0;
                      return colors[charCode % colors.length];
                    };
                    return (
                      <div className="flex flex-col items-center text-center">
                        <div 
                          className="w-16 h-16 rounded-[20px] border border-ink/10 flex items-center justify-center text-ink font-bold text-[24px] font-poppins mb-3 shadow-sm"
                          style={{ backgroundColor: getAvatarBg(expert.displayName) }}
                        >
                          {expert.displayName.charAt(0)}
                        </div>
                        <h3 className="font-bold text-[15.5px] font-poppins text-ink mb-1 leading-tight">
                          {expert.displayName}
                        </h3>
                        <p className="text-[11.5px] text-primary/90 font-semibold line-clamp-1 mb-0.5">
                          {expert.subEntityType || expert.businessRole || 'Independent Consultant'}
                        </p>
                        <p className="text-[11px] text-ink-soft line-clamp-1 mb-2">
                          {expert.categories?.[0] || 'Marketing Expert'}
                        </p>
                        <div className="flex items-center justify-center mb-4">
                          <span className="text-[9.5px] text-[#16A34A] font-bold flex items-center gap-0.5 bg-[#16A34A]/8 px-2 py-0.5 rounded-full border border-[#16A34A]/15">
                            <Sparkles className="w-2.5 h-2.5" /> Best Aligned
                          </span>
                        </div>
                        <div className="w-full flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full rounded-full text-[12px] font-bold font-poppins cursor-pointer"
                            onClick={() => navigate(`/experts/${slugify(expert.displayName)}${browseSuffix}`)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            className="w-full rounded-full text-[12px] font-bold font-poppins cursor-pointer"
                            onClick={() => {
                              const category = browseCtx.svc || expert.categories?.[0] || '';
                              navigate(`/experts/${expert.userId}/connect?category=${encodeURIComponent(category)}`);
                            }}
                          >
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            Book a Free Discussion
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}

              {/* ──────────────── CATEGORY 1: EXPERTISE ──────────────── */}
              <div className="sticky left-0 col-span-full py-3.5 px-6 bg-primary/[0.04] border-b border-border/40 z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary font-poppins">01. EXPERTISE</span>
              </div>

              {/* Row 1: Primary Focus */}
              <TableRow label="Primary Focus" icon={<Award className="w-4 h-4" />}>
                {experts.map(e => {
                  const badges = contextualCompareExpertiseLabels(e, browseCtx);
                  return (
                    <div key={`cat-${e.userId}`} className="flex flex-wrap gap-1 items-center">
                      {badges.length ? (
                        badges.map((c: string) => (
                          <Badge key={c} variant="secondary" className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-tight bg-[#FAF6F0] text-ink border-border/50">
                            {c}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </div>
                  );
                })}
              </TableRow>

              {/* Row 2: Specific Needs / Sub-Services */}
              <TableRow label="Specific Needs" icon={<Sparkles className="w-4 h-4" />}>
                {experts.map(e => {
                  const subs = (e.subServices || []).slice(0, 3);
                  return (
                    <div key={`sub-${e.userId}`} className="flex flex-wrap gap-1 items-center">
                      {subs.length ? (
                        subs.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-[10px] px-2 py-0.5 font-medium border-primary/25 bg-primary/5 text-primary">
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-ink-soft/70 text-[11px] italic">Broad Service Offering</span>
                      )}
                    </div>
                  );
                })}
              </TableRow>

              {/* Row 3: Delivery Channels / Operational Models */}
              <TableRow label="Delivery Channels" icon={<Briefcase className="w-4 h-4" />}>
                {experts.map(e => {
                  const channels = Array.from(new Set([...(e.deliveryChannels || []), ...(e.engagementModels || [])])).slice(0, 3);
                  return (
                    <div key={`chan-${e.userId}`} className="flex flex-wrap gap-1 items-center">
                      {channels.length ? (
                        channels.map((c: string) => (
                          <span key={c} className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-ink-soft/70 text-[11px]">Direct Engagement</span>
                      )}
                    </div>
                  );
                })}
              </TableRow>

              {/* ──────────────── CATEGORY 2: FIT ──────────────── */}
              <div className="sticky left-0 col-span-full py-3.5 px-6 bg-primary/[0.04] border-b border-border/40 z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary font-poppins">02. FIT</span>
              </div>

              {/* Row 4: Industries Served */}
              <TableRow label="Industries Served" icon={<TrendingUp className="w-4 h-4" />}>
                {experts.map(e => {
                  const sectors = (e.industrySectors || []).slice(0, 3);
                  return (
                    <div key={`ind-${e.userId}`} className="flex flex-wrap gap-1">
                      {sectors.length ? (
                        sectors.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-[10px] px-2 py-0.5 font-semibold text-ink border-border/50">
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-ink-soft/70 text-[11px]">Multi-industry</span>
                      )}
                    </div>
                  );
                })}
              </TableRow>

              {/* Row 5: Client Business Stage (Scale) */}
              <TableRow label="Business Stage (Scale)" icon={<Users className="w-4 h-4" />}>
                {experts.map(e => {
                  const scales = (e.clientScales || []).slice(0, 3);
                  return (
                    <div key={`scale-${e.userId}`} className="flex flex-wrap gap-1">
                      {scales.length ? (
                        scales.map((s: string) => (
                          <span key={s} className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-ink-soft/70 text-[11px]">All Stages</span>
                      )}
                    </div>
                  );
                })}
              </TableRow>

              {/* Row 6: Engagement Models */}
              <TableRow label="Engagement Models" icon={<Globe className="w-4 h-4" />}>
                {experts.map(e => {
                  const models = (e.engagementModels || []).slice(0, 3);
                  return (
                    <div key={`model-${e.userId}`} className="flex flex-wrap gap-1">
                      {models.length ? (
                        models.map((m: string) => (
                          <span key={m} className="rounded-md border border-border/50 bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink">
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-ink-soft/70 text-[11px]">Flexible Engagement</span>
                      )}
                    </div>
                  );
                })}
              </TableRow>

              {/* ──────────────── CATEGORY 3: COMMERCIAL ──────────────── */}
              <div className="sticky left-0 col-span-full py-3.5 px-6 bg-primary/[0.04] border-b border-border/40 z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary font-poppins">03. COMMERCIAL</span>
              </div>

              {/* Row 7: Minimum Engagement Value */}
              <TableRow label="Project Value" icon={<DollarSign className="w-4 h-4 text-[#16A34A]" />}>
                {experts.map(e => (
                  <div key={`val-${e.userId}`}>
                    <span className="font-semibold text-ink bg-[#DDECD4]/70 px-2.5 py-1 rounded-md border border-[#DDECD4] text-[11.5px]">
                      {e.minEngagementValue && Number(e.minEngagementValue) > 0 ? `₹ ${Number(e.minEngagementValue).toLocaleString('en-IN')} minimum` : 'To Be Discussed'}
                    </span>
                  </div>
                ))}
              </TableRow>

              {/* Row 8: Pricing Style */}
              <TableRow label="Pricing Style" icon={<DollarSign className="w-4 h-4" />}>
                {experts.map(e => (
                  <div key={`ps-${e.userId}`} className="flex flex-wrap gap-1">
                    {Array.isArray(e.pricingStyle) && e.pricingStyle.length > 0 ? (
                      e.pricingStyle.map((s: string) => (
                        <Badge key={s} variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-ink-soft text-[11px]">Flexible</span>
                    )}
                  </div>
                ))}
              </TableRow>

              {/* Row 9: Turnaround Time */}
              <TableRow label="Turnaround Time" icon={<Clock className="w-4 h-4" />}>
                {experts.map(e => (
                  <div key={`tat-${e.userId}`} className="text-[12px] font-medium text-ink">
                    {e.preferredDeliverySpeed?.[0] || 'Standard (2-3 weeks)'}
                  </div>
                ))}
              </TableRow>

              {/* ──────────────── CATEGORY 4: EXPERIENCE & PROOF ──────────────── */}
              <div className="sticky left-0 col-span-full py-3.5 px-6 bg-primary/[0.04] border-b border-border/40 z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary font-poppins">04. EXPERIENCE & PROOF</span>
              </div>

              {/* Row 10: Years of Experience */}
              <TableRow label="Experience" icon={<Award className="w-4 h-4" />}>
                {experts.map(e => (
                  <div key={`exp-${e.userId}`} className="font-bold text-[13.5px] text-ink font-poppins">
                    {e.yearsExperience ? `${e.yearsExperience} Years` : '5+ Years'}
                  </div>
                ))}
              </TableRow>

              {/* Row 11: Portfolio & Case Studies */}
              <TableRow label="Portfolio & Proof" icon={<FileText className="w-4 h-4" />}>
                {experts.map(e => (
                  <div key={`p-${e.userId}`} className="text-[12px] font-medium text-ink">
                    {e.hasPortfolio || (e.portfolioUrls && e.portfolioUrls.length > 0) ? (
                      <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        {e.portfolioUrls?.length || 1}+ Portfolio Items Listed
                      </span>
                    ) : (
                      <span className="text-ink-soft">Available on discussion</span>
                    )}
                  </div>
                ))}
              </TableRow>

              {/* Row 12: Tools & Technologies */}
              <TableRow label="Tools & Tech Stack" icon={<Zap className="w-4 h-4" />}>
                {experts.map(e => (
                  <div key={`stack-${e.userId}`} className="flex flex-wrap gap-1">
                    {Array.isArray(e.tools) && e.tools.length > 0 ? (
                      <>
                        {e.tools.slice(0, 3).map((t: string) => (
                          <Badge key={t} variant="outline" className="text-[9.5px] border-primary/20 text-primary font-bold">
                            {t}
                          </Badge>
                        ))}
                        {e.tools.length > 3 && <span className="text-[10px] text-primary self-center">+{e.tools.length - 3}</span>}
                      </>
                    ) : (
                      <span className="text-ink-soft/70 italic text-[11px]">Domain standard tools</span>
                    )}
                  </div>
                ))}
              </TableRow>

              {/* ──────────────── CATEGORY 5: BUSINESS DETAILS ──────────────── */}
              <div className="sticky left-0 col-span-full py-3.5 px-6 bg-primary/[0.04] border-b border-border/40 z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary font-poppins">05. BUSINESS DETAILS</span>
              </div>

              {/* Row 13: Legal Entity & Registration */}
              <TableRow label="Entity & Compliance" icon={<Shield className="w-4 h-4" />}>
                {experts.map(e => {
                  const isGst = e.isGstRegistered || e.documents?.some((d: any) => d.documentType === 'GST');
                  const isPan = e.isPanRegistered || e.documents?.some((d: any) => d.documentType === 'PAN');
                  return (
                    <div key={`ent-${e.userId}`} className="space-y-1 text-[11.5px]">
                      <div className="font-semibold text-ink">
                        {e.legalName || e.subEntityType || e.entityType || 'Independent Consultant'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 font-medium ${isGst ? 'text-[#16A34A]' : 'text-ink-soft'}`}>
                          <Check className="w-3 h-3" /> GST: {isGst ? 'Yes' : 'No'}
                        </span>
                        <span className="text-border">·</span>
                        <span className={`inline-flex items-center gap-1 font-medium ${isPan ? 'text-[#16A34A]' : 'text-ink-soft'}`}>
                          <Check className="w-3 h-3" /> PAN: {isPan ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </TableRow>

              {/* ──────────────── CATEGORY 6: WORKING PREFERENCES ──────────────── */}
              <div className="sticky left-0 col-span-full py-3.5 px-6 bg-primary/[0.04] border-b border-border/40 z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary font-poppins">06. WORKING PREFERENCES</span>
              </div>

              {/* Row 14: Languages & Location */}
              <TableRow label="Languages & Location" icon={<Languages className="w-4 h-4" />}>
                {experts.map(e => {
                  const loc = typeof e.location === 'string' ? e.location : (e.location?.city || 'Mumbai');
                  const langs = Array.isArray(e.languages) && e.languages.length > 0 ? e.languages.slice(0, 2).join(', ') : 'English';
                  return (
                    <div key={`pref-${e.userId}`} className="space-y-1 text-[12px]">
                      <div className="flex items-center gap-1 text-ink font-medium">
                        <MapPin className="w-3 h-3 text-ink-soft" />
                        <span>{loc}</span>
                        {e.panIndiaAvailable && (
                          <span className="ml-1 text-[9px] bg-[#16A34A]/8 text-[#16A34A] px-1.5 py-0.5 rounded-full font-bold border border-[#16A34A]/15">Pan-India</span>
                        )}
                      </div>
                      <div className="text-[11.5px] text-ink-soft">
                        Languages: <span className="text-ink font-semibold">{langs}</span>
                      </div>
                    </div>
                  );
                })}
              </TableRow>

            </div>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
};

// Unified Table Row component using grid
const TableRow = ({ label, icon, children }: { label: string, icon: React.ReactNode, children: React.ReactNode[] }) => (
  <div className="contents group">
    <div className="sticky left-0 z-10 px-6 py-4 font-bold text-[13px] font-poppins text-ink bg-white border-b border-border/30 flex items-center gap-2.5 group-hover:bg-primary/[0.02] transition-colors shadow-[4px_0_8px_rgba(0,0,0,0.015)]">
      <div className="text-primary/70 shrink-0">{icon}</div>
      <span>{label}</span>
    </div>
    {children.map((child, idx) => (
      <div key={idx} className="px-6 py-4 border-b border-l border-border/30 flex items-center group-hover:bg-primary/[0.01] transition-colors bg-white">
        {child}
      </div>
    ))}
  </div>
);

export default CompareExperts;
