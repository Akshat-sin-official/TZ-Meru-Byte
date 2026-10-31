import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import WebsiteLayout from '@/components/website/WebsiteLayout';
import SEO from '@/components/website/SEO';
import SchemaMarkup from '@/components/website/SchemaMarkup';
import { searchService } from '@/services/searchService';
import { toast } from 'sonner';
import {
  MapPin,
  Users,
  Globe,
  Heart,
  ExternalLink,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Loader2,

  Briefcase,
  Zap,
  TrendingUp,
  FileText,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useShortlist } from '@/contexts/ShortlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasBrowseContext, normContains, parseBrowseContext, serializeBrowseQuery, slugify } from '@/pages/experts/browseContext';

// Helper to format location
const formatLocation = (location: { city?: string; state?: string; country?: string } | string | undefined | null): string => {
  if (!location) return 'Not specified';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    const city = location.city || '';
    const country = location.country || '';
    const parts = [city, country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  }
  return 'Not specified';
};

const ExpertProfile = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const browseCtx = useMemo(() => parseBrowseContext(searchParams), [searchParams]);
  const browseSuffix = useMemo(() => serializeBrowseQuery(browseCtx), [browseCtx]);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'portfolio' | 'experience'>('overview');
  const { isAuthenticated, user } = useAuth();
  const { shortlistedIds, toggleShortlist } = useShortlist();

  const isServiceSeeker = !user || user.role === 'seeker' || user.role === 'visitor';

  const ensureAbsoluteUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
      return trimmed;
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || (
      typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? 'https://app.martechadda.com/api'
        : 'http://localhost:6001/api'
    );
    const serverBase = apiBase.replace(/\/api\/?$/, '');

    if (trimmed.startsWith('/') || trimmed.startsWith('uploads/') || trimmed.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i)) {
      const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return `${serverBase}${cleanPath}`;
    }

    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return `https://${trimmed}`;
    }

    return trimmed;
  };

  const handleViewDocument = (url: string) => {
    if (!url || !url.trim()) {
      toast.error('No document file or URL available to preview');
      return;
    }
    const finalUrl = ensureAbsoluteUrl(url);
    if (!finalUrl) {
      toast.error('No document file or URL available to preview');
      return;
    }

    if (finalUrl.startsWith('data:')) {
      try {
        const byteString = atob(finalUrl.split(',')[1]);
        const mimeString = finalUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (e) {
        console.error('Failed to open data URI:', e);
        toast.error('Failed to open document preview');
      }
    } else {
      window.open(finalUrl, '_blank');
    }
  };

  // Extract clean userId from URL parameter
  const extractUserId = (param: string | undefined): string | null => {
    if (!param) return null;
    if (/^[0-9a-fA-F]{24}$/.test(param)) {
      return param;
    }
    const objectIdMatch = param.match(/ObjectId\(['"]([0-9a-fA-F]{24})['"]\)/);
    if (objectIdMatch) {
      return objectIdMatch[1];
    }
    try {
      const decoded = decodeURIComponent(param);
      const objectIdMatch2 = decoded.match(/['"]([0-9a-fA-F]{24})['"]/);
      if (objectIdMatch2) {
        return objectIdMatch2[1];
      }
    } catch {
      // Ignore decode errors
    }
    return null;
  };

  const isSlug = rawId && !/^[0-9a-fA-F]{24}$/.test(rawId);

  // If it is a slug, we fetch the expert list to resolve the slug to a userId
  const { data: resolvedUserId, isLoading: isResolvingSlug } = useQuery({
    queryKey: ['resolveExpertSlug', rawId],
    queryFn: async () => {
      if (!rawId) return null;
      const res = await searchService.searchExperts({ limit: 100 });
      const found = res.experts.find(e => slugify(e.displayName) === rawId);
      return found ? (found.userId || found.expertId) : null;
    },
    enabled: !!isSlug,
  });

  const id = isSlug ? resolvedUserId : extractUserId(rawId);

  // Fetch expert profile
  const { data: expert, isLoading: isProfileLoading, error } = useQuery({
    queryKey: ['expertProfile', id],
    queryFn: () => searchService.getExpertProfileByUserId(id!),
    enabled: !!id && /^[0-9a-fA-F]{24}$/.test(id),
  });

  const isLoading = isProfileLoading || isResolvingSlug;

  const contextualExpertiseRows = useMemo(() => {
    if (!expert || !hasBrowseContext(browseCtx)) return null;
    const structured = expert.services || [];
    if (!structured.length) {
      const cats =
        browseCtx.svc && expert.categories?.length
          ? expert.categories.filter((c) => normContains(c, browseCtx.svc!) || normContains(browseCtx.svc!, c))
          : [];

      let subs = expert.subServices || [];
      if (browseCtx.focus) {
        subs = subs.filter((s) => normContains(s, browseCtx.focus!) || normContains(browseCtx.focus!, s));
      }
      if (browseCtx.needs.length) {
        subs = subs.filter((s) => browseCtx.needs.some((n) => normContains(s, n)));
      }
      return {
        structured: [] as typeof structured,
        categories: browseCtx.svc ? cats.slice(0, 8) : [],
        legacySubServices: subs.slice(0, 12),
        legacyOnly: true,
      };
    }

    let rows = structured.filter((r) =>
      browseCtx.svc ? normContains(String(r.serviceHead || ''), browseCtx.svc) : true
    );
    if (browseCtx.focus) {
      rows = rows.filter((r) =>
        (r.primaryFilters || []).some((p) => normContains(p, browseCtx.focus!))
      );
    }
    if (browseCtx.needs.length) {
      rows = rows.filter((r) =>
        browseCtx.needs.some((n) => (r.subFilters || []).some((sf) => normContains(sf, n)))
      );
    }

    return { structured: rows, categories: [], legacySubServices: [] as string[], legacyOnly: false };
  }, [expert, browseCtx]);

  // Fetch seeker's discussions if authenticated as seeker


  const handleScheduleDiscussion = () => {
    if (!id) {
      toast.error('Expert ID not found');
      return;
    }

    const category = browseCtx.svc || expert?.categories?.[0] || '';

    // Always ensure searchContext is initialized/updated for a consistent flow
    const savedContextRaw = sessionStorage.getItem('searchContext');
    let contextData: any = {};
    try {
      contextData = savedContextRaw ? JSON.parse(savedContextRaw) : {};
    } catch (e) {
      contextData = {};
    }

    if (expert) {
      const focus = browseCtx.focus || '';
      const updatedContext = {
        ...contextData,
        serviceCategory: category,
        primaryFilter: focus || contextData.primaryFilter || '',
        subFilter: (browseCtx.needs.length > 0 ? browseCtx.needs[0] : null) || contextData.subFilter || '',
        location: contextData.location || formatLocation(expert.location),
        industry: contextData.industry || (expert.industrySectors?.[0] || ''),
      };
      sessionStorage.setItem('searchContext', JSON.stringify(updatedContext));
    }

    // Persist booking intent and redirect unauthenticated seekers to auth
    const schedulePath = `/discussions/schedule/${id}${category ? `?category=${encodeURIComponent(category)}` : ''}`;
    if (!isAuthenticated) {
      sessionStorage.setItem('bookingIntent', JSON.stringify({ expertId: id, category }));
      window.location.href = `https://app.martechadda.com/login?redirect=${encodeURIComponent(schedulePath)}`;
      return;
    }

    navigate(schedulePath);
  };

  const handleShortlistClick = async () => {
    if (!expert) return;

    const isAlreadyShortlisted = shortlistedIds.includes(expert.userId);

    if (!isAuthenticated) {
      await toggleShortlist(expert.userId);
      
      if (!isAlreadyShortlisted) {
        toast.success('Expert added to your temporary shortlist.');
      } else {
        toast.success('Removed expert from temporary shortlist.');
      }
      return;
    }

    await toggleShortlist(expert.userId);
  };



  if (isLoading) {
    return (
      <WebsiteLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading expert profile...</p>
        </div>
      </WebsiteLayout>
    );
  }

  if (error || !expert) {
    return (
      <WebsiteLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="mb-4 text-2xl font-bold">Expert Not Found</h1>
            <p className="mb-6 text-muted-foreground">
              The expert profile you're looking for doesn't exist or has been removed.
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

  const location = formatLocation(expert.location);
  const canonicalSlug = expert.displayName ? slugify(expert.displayName) : rawId;
  
  const expertTitle = expert.displayName
    ? `${expert.displayName} - Verified Marketing Expert | MarTechAdda`
    : 'Marketing Expert Profile | MarTechAdda';
  
  const expertDescription = expert.displayName
    ? `Hire ${expert.displayName} for contracts, campaigns, and projects. View verified services, portfolio, client history, and book consultations directly on MarTechAdda.`
    : `View this marketing expert's profile, portfolio, experience, and connect directly. Verified professional on MarTechAdda.`;

  // Breadcrumbs for expert profile
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Find Experts', path: `/experts${browseSuffix}` },
    { name: expert.displayName || 'Expert Profile', path: `/experts/${canonicalSlug}${browseSuffix}` }
  ]

  return (
    <WebsiteLayout>
      <SEO
        title={expertTitle}
        description={expertDescription}
        canonical={`https://martechadda.com/experts/${canonicalSlug}`}
        ogType="profile"
      />
      <SchemaMarkup
        type="Person"
        person={{
          name: expert.displayName,
          description: expert.bio || expertDescription,
          jobTitle: expert.businessRole || 'Marketing Expert',
          organization: 'Independent Marketing Professional',
          image: expert.profileImageUrl || undefined
        }}
        breadcrumbs={breadcrumbs}
      />

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden bg-background bg-[radial-gradient(ellipse_at_top,_var(--color-primary)/0.035,_var(--color-background),_var(--color-background))]">
        {/* Ambient blurs — same as Hero.tsx */}
        <div className="absolute top-[-10%] left-[20%] h-[300px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-[30%] right-[15%] h-[250px] w-[400px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-[1240px] px-5 py-10 relative z-10">
          {/* Back nav */}
          <button
            onClick={() => navigate(`/experts${browseSuffix}`)}
            className="mb-8 inline-flex items-center gap-2 text-[13px] font-semibold font-poppins text-ink-soft hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discovery
          </button>

          <div className="grid gap-10 lg:grid-cols-12 items-start">
            {/* Left: Identity */}
            <div className="lg:col-span-7 flex flex-col">

              {/* Status pill — matches Hero.tsx */}
              <div className="mb-5 w-fit rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[12px] font-semibold font-poppins tracking-wide text-primary flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {expert.availabilityStatus === 'available' ? 'Available for New Projects' : 'Currently Engaged'}
              </div>

              {/* Avatar + Name row */}
              <div className="flex items-center gap-5 mb-4">
                {expert.profileImageUrl ? (
                  <img
                    src={expert.profileImageUrl}
                    alt={expert.displayName}
                    className="h-20 w-20 rounded-[20px] object-cover border-2 border-border/50 shadow-[0_8px_30px_rgba(0,0,0,0.06)] shrink-0"
                  />
                ) : (
                  <div
                    className="h-20 w-20 shrink-0 rounded-[20px] border-2 border-border/50 font-poppins text-3xl font-bold text-ink flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                    style={{ backgroundColor: ['#F5E3D2','#DDECD4','#D8E5F5','#FAF6F0'][expert.displayName.charCodeAt(0) % 4] }}
                  >
                    {expert.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold font-poppins leading-[1.1] tracking-[-0.03em] text-ink">
                    {expert.displayName}
                  </h1>
                  <p className="mt-1 text-[16px] text-ink-soft font-medium">
                    {expert.categories?.[0] || ''}{expert.subServices?.[0] ? ` · ${expert.subServices[0]}` : ''}{!expert.categories?.length ? 'Marketing Expert' : ''}
                  </p>
                </div>
              </div>

              {/* Meta row — location, entity, verified */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {expert.subEntityType && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1 text-[12px] font-bold font-poppins text-ink-soft">
                    <Users className="h-3.5 w-3.5" />
                    {expert.subEntityType}
                  </span>
                )}
                {location && location !== 'Not specified' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1 text-[12px] font-bold font-poppins text-ink-soft">
                    <MapPin className="h-3.5 w-3.5" />
                    {location}
                  </span>
                )}
                {expert.yearsExperience && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1 text-[12px] font-bold font-poppins text-ink-soft">
                    <Briefcase className="h-3.5 w-3.5" />
                    {expert.yearsExperience} yrs exp
                  </span>
                )}
                {expert.isVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A]/10 px-3 py-1 text-[12px] font-bold font-poppins text-[#16A34A]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
                {expert.panIndiaAvailable && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-[12px] font-bold font-poppins text-primary">
                    <Globe className="h-3.5 w-3.5" />
                    Pan-India
                  </span>
                )}
              </div>

              {/* Service tags */}
              {(expert.categories?.length || expert.subServices?.length) ? (
                <div className="flex flex-wrap gap-2">
                  {[...(expert.categories || []).slice(0, 3), ...(expert.subServices || []).slice(0, 4)].map((tag) => (
                    <span key={tag} className="rounded-full border border-border/60 bg-surface/30 px-3 py-1 text-[12px] font-semibold text-ink-soft">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Right: Booking card — matches landing page card style */}
            <div className="lg:col-span-5">
              <div className="rounded-[28px] border border-border/70 bg-surface/30 p-6 shadow-[0_15px_35px_-15px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border/40">
                  <div className="flex-1">
                    <p className="text-[12px] font-bold font-poppins uppercase tracking-[0.12em] text-ink-soft mb-1">Availability</p>
                    {expert.availabilityStatus === 'available' ? (
                      <span className="inline-flex items-center gap-1.5 text-[#16A34A] font-bold text-[14px]">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                        Available Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold text-[14px]">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Currently Busy
                      </span>
                    )}
                  </div>
                  {expert.timezone && (
                    <span className="text-[12px] text-ink-soft font-medium">{expert.timezone}</span>
                  )}
                </div>

                {/* Minimum Engagement Value & Turnaround Time (Page 7) */}
                <div className="mb-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-1 font-poppins">Minimum Engagement Value</p>
                    <span className="font-semibold text-ink bg-[#DDECD4]/70 px-3 py-1 rounded-md border border-[#DDECD4] text-[12.5px] inline-block">
                      {expert.minEngagementValue && Number(expert.minEngagementValue) > 0 ? `₹${Number(expert.minEngagementValue).toLocaleString('en-IN')} minimum` : 'To Be Discussed'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-1 font-poppins">Turnaround Time</p>
                    <span className="text-[13px] font-medium text-ink">
                      {expert.preferredDeliverySpeed?.[0] || 'Standard Delivery (2-3 weeks)'}
                    </span>
                  </div>
                </div>

                {/* Pricing */}
                {(Array.isArray(expert.pricingStyle) && expert.pricingStyle.length > 0) && (
                  <div className="mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2 font-poppins">Pricing Style</p>
                    <div className="flex flex-wrap gap-1.5">
                      {expert.pricingStyle.map((s) => (
                        <span key={s} className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-bold text-ink-soft">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement models */}
                {expert.engagementModels?.length ? (
                  <div className="mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2 font-poppins">Engagement</p>
                    <div className="flex flex-wrap gap-1.5">
                      {expert.engagementModels.slice(0, 3).map((m) => (
                        <span key={m} className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-bold text-ink-soft">{m}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Action buttons */}
                <div className="space-y-3 mt-2">
                  <Button
                    size="lg"
                    className={`w-full rounded-full text-[14px] font-bold font-poppins py-2.5 gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm ${
                      shortlistedIds.includes(expert.userId)
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                        : 'bg-primary text-white hover:bg-primary/95'
                    }`}
                    onClick={handleShortlistClick}
                  >
                    <Heart className={`h-4 w-4 ${shortlistedIds.includes(expert.userId) ? 'fill-current' : ''}`} />
                    {shortlistedIds.includes(expert.userId) ? 'Shortlisted' : 'Shortlist Expert'}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full text-[14px] font-bold font-poppins py-2.5 gap-2 transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                    onClick={handleScheduleDiscussion}
                    disabled={!shortlistedIds.includes(expert.userId)}
                  >
                    <Calendar className="h-4 w-4" />
                    Book a Free Discussion
                  </Button>
                </div>

                {!shortlistedIds.includes(expert.userId) && (
                  <p className="mt-3 text-center text-[12px] text-ink-soft/70">
                    <Zap className="inline h-3 w-3 text-amber-500 fill-amber-500 mr-1" />
                    Shortlist first to unlock booking
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TABS ─── */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="mx-auto max-w-[1240px] px-5">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {([
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'services', label: 'Services', icon: Briefcase },
              { id: 'portfolio', label: 'Portfolio', icon: Sparkles },
              { id: 'experience', label: 'Experience', icon: TrendingUp },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 border-b-2 px-5 py-4 text-[12.5px] font-bold tracking-wide uppercase font-poppins transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-soft hover:text-ink hover:border-ink/20'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div className="bg-[#FAFAF8] border-t border-border/30 min-h-[60vh]">
        <div className="mx-auto max-w-[1240px] px-5 py-14">
          <div className="grid gap-10 lg:grid-cols-12">

            {/* ── Main column ── */}
            <div className="lg:col-span-8 space-y-14">

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <>
                  {/* About */}
                  {expert.bio && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">About</span>
                      <h2 className="mt-2 text-[22px] font-bold font-poppins leading-snug tracking-[-0.02em] text-ink mb-4">
                        Who is <span className="font-serif italic">{expert.displayName}?</span>
                      </h2>
                      <p className="text-[15px] leading-[1.8] text-ink-soft">{expert.bio}</p>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-border/40" />

                  {/* Client Fit */}
                  {(expert.clientScales?.length || expert.businessTypesServed?.length || expert.engagementModels?.length) ? (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Client Fit</span>
                      <h2 className="mt-2 text-[22px] font-bold font-poppins tracking-[-0.02em] text-ink mb-5">
                        Who do they <span className="font-serif italic">work best with?</span>
                      </h2>
                      <div className="space-y-5">
                        {expert.clientScales?.length ? (
                          <div>
                            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2.5 font-poppins">Client Scale</p>
                            <div className="flex flex-wrap gap-2">
                              {expert.clientScales.map((s) => <span key={s} className="rounded-full bg-ink/5 px-3 py-1 text-[12.5px] font-semibold text-ink-soft">{s}</span>)}
                            </div>
                          </div>
                        ) : null}
                        {expert.businessTypesServed?.length ? (
                          <div>
                            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2.5 font-poppins">Business Types</p>
                            <div className="flex flex-wrap gap-2">
                              {expert.businessTypesServed.map((t) => <span key={t} className="rounded-full bg-ink/5 px-3 py-1 text-[12.5px] font-semibold text-ink-soft">{t}</span>)}
                            </div>
                          </div>
                        ) : null}
                        {expert.engagementModels?.length ? (
                          <div>
                            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2.5 font-poppins">Engagement Types</p>
                            <div className="flex flex-wrap gap-2">
                              {expert.engagementModels.map((m) => <span key={m} className="rounded-full border border-border/60 bg-surface/30 px-3 py-1 text-[12.5px] font-semibold text-ink-soft">{m}</span>)}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {/* Industries */}
                  {(expert.industrySectors?.length || expert.subIndustries?.length) ? (
                    <>
                      <div className="border-t border-border/40" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Industry Expertise</span>
                        <h2 className="mt-2 text-[22px] font-bold font-poppins tracking-[-0.02em] text-ink mb-5">
                          Sectors they <span className="font-serif italic">specialise in</span>
                        </h2>
                        {expert.industrySectors?.length ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {expert.industrySectors
                              .filter((s) => !['Primary', 'Secondary', 'Tertiary', 'Quaternary'].includes(s))
                              .map((s) => (
                              <span key={s} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[12.5px] font-bold font-poppins text-primary">{s}</span>
                            ))}
                          </div>
                        ) : null}
                        {expert.subIndustries?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {expert.subIndustries.map((s) => <span key={s} className="rounded-full bg-ink/5 px-3 py-1 text-[12px] font-semibold text-ink-soft">{s}</span>)}
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </>
              )}

              {/* SERVICES TAB */}
              {activeTab === 'services' && (
                <div className="space-y-10">
                  {/* Core Services */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Core Services</span>
                    <h2 className="mt-2 text-[22px] font-bold font-poppins tracking-[-0.02em] text-ink mb-6">
                      What they <span className="font-serif italic">deliver</span>
                    </h2>
                    {contextualExpertiseRows ? (
                      <div className="space-y-6">
                        <p className="text-[13px] text-ink-soft">
                          Showing matched expertise.{' '}
                          <button type="button" className="text-primary underline-offset-4 underline font-semibold hover:no-underline cursor-pointer"
                            onClick={() => id && navigate(`/experts/${id}`, { replace: true })}>
                            View full catalogue →
                          </button>
                        </p>
                        {!contextualExpertiseRows.legacyOnly && contextualExpertiseRows.structured.map((row, idx) => (
                          <div key={idx} className="rounded-[22px] border border-border/70 bg-surface/30 p-6 space-y-4 hover:shadow-[0_12px_35px_-15px_rgba(0,0,0,0.08)] transition-all duration-300">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2 font-poppins">Category</p>
                              <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[12.5px] font-bold font-poppins text-primary">{row.serviceHead}</span>
                            </div>
                            {(browseCtx.focus ? (row.primaryFilters||[]).filter(p=>normContains(p,browseCtx.focus!)||normContains(browseCtx.focus!,p)) : row.primaryFilters||[]).length > 0 && (
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2 font-poppins">Focus Area</p>
                                <div className="flex flex-wrap gap-2">
                                  {(browseCtx.focus ? (row.primaryFilters||[]).filter(p=>normContains(p,browseCtx.focus!)||normContains(browseCtx.focus!,p)) : row.primaryFilters||[]).map(p=>(
                                    <span key={p} className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[11.5px] font-bold text-ink-soft">{p}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(browseCtx.needs.length ? (row.subFilters||[]).filter(sf=>browseCtx.needs.some(n=>normContains(sf,n)||normContains(n,sf))) : row.subFilters||[]).length > 0 && (
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2 font-poppins">Specific Need</p>
                                <div className="flex flex-wrap gap-2">
                                  {(browseCtx.needs.length ? (row.subFilters||[]).filter(sf=>browseCtx.needs.some(n=>normContains(sf,n)||normContains(n,sf))) : row.subFilters||[]).map(s=>(
                                    <span key={s} className="rounded-full border border-border/60 bg-surface/30 px-2.5 py-0.5 text-[11.5px] font-semibold text-ink-soft">{s}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {contextualExpertiseRows.legacyOnly && (
                          <div className="rounded-[22px] border border-border/70 bg-surface/30 p-6 space-y-4">
                            {browseCtx.svc && (
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2 font-poppins">Category</p>
                                <div className="flex flex-wrap gap-2">
                                  {(contextualExpertiseRows.categories.length ? contextualExpertiseRows.categories : [browseCtx.svc]).map(c=>(
                                    <span key={c} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[12.5px] font-bold font-poppins text-primary">{c}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {browseCtx.focus && (
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2 font-poppins">Focus Area</p>
                                <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[11.5px] font-bold text-ink-soft">{browseCtx.focus}</span>
                              </div>
                            )}
                            {contextualExpertiseRows.legacySubServices.length > 0 && (
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2 font-poppins">Capabilities</p>
                                <div className="flex flex-wrap gap-2">
                                  {contextualExpertiseRows.legacySubServices.map(s=>(
                                    <span key={s} className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[11.5px] font-bold text-ink-soft">{s}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {expert.categories?.length ? (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2.5 font-poppins">Service Categories</p>
                            <div className="flex flex-wrap gap-2">
                              {expert.categories.map(c=>(
                                <span key={c} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[12.5px] font-bold font-poppins text-primary">{c}</span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {expert.subServices?.length ? (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2.5 font-poppins">Focus Areas</p>
                            <div className="flex flex-wrap gap-2">
                              {expert.subServices.map(s=>(
                                <span key={s} className="rounded-full bg-ink/5 px-3 py-1 text-[12.5px] font-semibold text-ink-soft">{s}</span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Commercial Fit */}
                  {(expert.engagementModels?.length || expert.deliveryChannels?.length || (Array.isArray(expert.preferredDeliverySpeed) && expert.preferredDeliverySpeed.length) || (Array.isArray(expert.pricingStyle) && expert.pricingStyle.length)) && (
                    <>
                      <div className="border-t border-border/40" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Commercial Fit</span>
                        <h2 className="mt-2 text-[22px] font-bold font-poppins tracking-[-0.02em] text-ink mb-5">
                          How they <span className="font-serif italic">engage & price</span>
                        </h2>
                        <div className="space-y-4">
                          {expert.engagementModels?.length ? (
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2.5 font-poppins">Engagement Models</p>
                              <div className="flex flex-wrap gap-2">{expert.engagementModels.map(m=><span key={m} className="rounded-full bg-ink/5 px-3 py-1 text-[12.5px] font-semibold text-ink-soft">{m}</span>)}</div>
                            </div>
                          ) : null}
                          {expert.deliveryChannels?.length ? (
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2.5 font-poppins">Delivery Channels</p>
                              <div className="flex flex-wrap gap-2">{expert.deliveryChannels.map(c=><span key={c} className="rounded-full bg-ink/5 px-3 py-1 text-[12.5px] font-semibold text-ink-soft">{c}</span>)}</div>
                            </div>
                          ) : null}
                          {Array.isArray(expert.pricingStyle) && expert.pricingStyle.length ? (
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2.5 font-poppins">Pricing Style</p>
                              <div className="flex flex-wrap gap-2">{expert.pricingStyle.map(p=><span key={p} className="rounded-full border border-border/60 bg-surface/30 px-3 py-1 text-[12.5px] font-semibold text-ink-soft">{p}</span>)}</div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Coverage */}
                  {(expert.panIndiaAvailable || expert.serviceDeliveryStates?.length) && (
                    <>
                      <div className="border-t border-border/40" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Coverage</span>
                        <h2 className="mt-2 text-[22px] font-bold font-poppins tracking-[-0.02em] text-ink mb-5">
                          Where they <span className="font-serif italic">operate</span>
                        </h2>
                        {expert.panIndiaAvailable && (
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                            <span className="text-[14px] font-semibold text-ink">Available Pan-India</span>
                          </div>
                        )}
                        {expert.serviceDeliveryStates?.length ? (
                          <div className="flex flex-wrap gap-2">{expert.serviceDeliveryStates.map(s=><span key={s} className="rounded-full bg-ink/5 px-3 py-1 text-[12.5px] font-semibold text-ink-soft">{s}</span>)}</div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* PORTFOLIO TAB */}
              {activeTab === 'portfolio' && (
                <div className="space-y-10">
                  {expert.portfolioItems?.length ? (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Portfolio</span>
                      <h2 className="mt-2 text-[22px] font-bold font-poppins tracking-[-0.02em] text-ink mb-6">
                        Featured <span className="font-serif italic">work & case studies</span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {expert.portfolioItems.map((item, i) => {
                          const isImage = item.type === 'image';
                          const isPDF = item.type === 'pdf';
                          const isVideo = item.type === 'video';
                          const isURL = item.type === 'url' || !item.type;
                          const hasUrl = Boolean(item.url && String(item.url).trim());
                          return (
                            <div key={i} className="group rounded-[22px] border border-border/70 bg-surface/30 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_35px_-15px_rgba(0,0,0,0.08)]">
                              {isImage && hasUrl && (
                                <div className="h-44 overflow-hidden">
                                  <img src={ensureAbsoluteUrl(item.url)} alt={item.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                                </div>
                              )}
                              <div className="p-5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/8 px-2 py-0.5 rounded-full">{item.type || 'item'}</span>
                                <h4 className="font-bold text-[15px] font-poppins text-ink mt-2 mb-1 line-clamp-1">{item.title}</h4>
                                {item.description && <p className="text-[13px] text-ink-soft mb-4 line-clamp-2">{item.description}</p>}
                                {hasUrl ? (
                                  <button type="button" onClick={() => handleViewDocument(item.url)}
                                    className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary hover:underline cursor-pointer">
                                    {isPDF ? 'View PDF' : isURL ? 'Visit Link' : isVideo ? 'Watch Video' : 'View Image'}
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-ink-soft italic">No document attached</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Portfolio Links */}
                  <div>
                    <div className="border-t border-border/40 mb-8" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Links</span>
                    <h2 className="mt-2 text-[22px] font-bold font-poppins tracking-[-0.02em] text-ink mb-5">
                      External <span className="font-serif italic">portfolio</span>
                    </h2>
                    {expert.portfolioUrls?.length ? (
                      <div className="space-y-2">
                        {expert.portfolioUrls.map((url, i) => (
                          <a key={i} href={ensureAbsoluteUrl(url)} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-[16px] border border-border/70 bg-surface/30 p-4 text-[13.5px] font-medium text-ink-soft hover:text-primary hover:border-primary/30 transition-all duration-200">
                            <ExternalLink className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate">{url}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[14px] text-ink-soft">Portfolio samples may be shared during discussion.</p>
                    )}
                  </div>

                  {/* Tools */}
                  {expert.tools?.length ? (
                    <>
                      <div className="border-t border-border/40" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Stack</span>
                        <h2 className="mt-2 text-[22px] font-bold font-poppins tracking-[-0.02em] text-ink mb-5">
                          Tools & <span className="font-serif italic">technologies</span>
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {expert.tools.map(t=><span key={t} className="rounded-full border border-border/60 bg-surface/30 px-3 py-1 text-[12.5px] font-semibold text-ink-soft">{t}</span>)}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* EXPERIENCE TAB */}
              {activeTab === 'experience' && (
                <div className="space-y-10">
                  {/* Summary stats */}
                  {(expert.yearsExperience || expert.subEntityType) && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Background</span>
                      <h2 className="mt-2 text-[22px] font-bold font-poppins tracking-[-0.02em] text-ink mb-6">
                        Experience <span className="font-serif italic">at a glance</span>
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {expert.yearsExperience && (
                          <div className="rounded-[22px] border border-border/70 bg-surface/30 py-6 px-5 text-center">
                            <p className="text-[32px] font-bold font-poppins text-ink leading-none">{expert.yearsExperience}</p>
                            <p className="mt-1.5 text-[11px] font-semibold text-ink-soft uppercase tracking-wider font-poppins">Years Exp</p>
                          </div>
                        )}
                        {expert.subEntityType && (
                          <div className="rounded-[22px] border border-border/70 bg-surface/30 py-6 px-5 text-center">
                            <p className="text-[16px] font-bold font-poppins text-ink leading-none capitalize">{expert.subEntityType}</p>
                            <p className="mt-1.5 text-[11px] font-semibold text-ink-soft uppercase tracking-wider font-poppins">Entity Type</p>
                          </div>
                        )}
                        {expert.panIndiaAvailable && (
                          <div className="rounded-[22px] border border-border/70 bg-surface/30 py-6 px-5 text-center">
                            <p className="text-[16px] font-bold font-poppins text-[#16A34A] leading-none">Pan-India</p>
                            <p className="mt-1.5 text-[11px] font-semibold text-ink-soft uppercase tracking-wider font-poppins">Coverage</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {expert.languages?.length ? (
                    <>
                      <div className="border-t border-border/40" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Languages</span>
                        <p className="mt-3 text-[15px] font-semibold text-ink">{expert.languages.join(' · ')}</p>
                      </div>
                    </>
                  ) : null}

                  {/* Trust & Compliance — only for non-seekers */}
                  {!isServiceSeeker && (
                    <>
                      <div className="border-t border-border/40" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft font-poppins">Trust & Compliance</span>
                        <h2 className="mt-2 text-[22px] font-bold font-poppins tracking-[-0.02em] text-ink mb-5">
                          Verification <span className="font-serif italic">status</span>
                        </h2>
                        <div className="space-y-3">
                          {[
                            { label: 'Identity Verification (KYC)', ok: expert.kycVerified },
                            { label: 'Certifications', ok: expert.certifications && expert.certifications.length > 0 },
                            { label: 'Compliance', ok: expert.complianceCompleted },
                            { label: 'Profile Complete', ok: expert.isProfileComplete },
                          ].map(({ label, ok }) => (
                            <div key={label} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                              <span className="text-[13.5px] font-medium text-ink">{label}</span>
                              {ok ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A] font-poppins">
                                  <CheckCircle2 className="h-3 w-3" /> Done
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-bold text-ink-soft font-poppins">
                                  Pending
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Sticky Sidebar ── */}
            <div className="lg:col-span-4 space-y-5">
              <div className="lg:sticky lg:top-[72px]">

                {/* BUSINESS DETAILS card (Page 7) */}
                <div className="rounded-[22px] border border-border/70 bg-surface/30 p-6 space-y-4">
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-ink-soft font-poppins">BUSINESS DETAILS</h3>

                  <div className="space-y-3 text-[13.5px]">
                    <div className="flex items-center justify-between py-1 border-b border-border/30">
                      <span className="text-ink-soft font-medium">Legal Entity</span>
                      <span className="text-ink font-semibold">{expert.legalName || expert.subEntityType || expert.entityType || 'Independent Consultant'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/30">
                      <span className="text-ink-soft font-medium">GST Registered</span>
                      <span className={`font-semibold ${(expert.isGstRegistered || (expert as any).gstRegistered === 'yes' || (expert as any).gstNumber || (expert.documents as any)?.some((d: any) => d.documentType === 'GST')) ? 'text-[#16A34A]' : 'text-ink-soft'}`}>
                        {(expert.isGstRegistered || (expert as any).gstRegistered === 'yes' || (expert as any).gstNumber || (expert.documents as any)?.some((d: any) => d.documentType === 'GST')) ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/30">
                      <span className="text-ink-soft font-medium">PAN Registered</span>
                      <span className={`font-semibold ${(expert.isPanRegistered || (expert as any).panRegistered === 'yes' || (expert as any).panNumber || (expert.documents as any)?.some((d: any) => d.documentType === 'PAN')) ? 'text-[#16A34A]' : 'text-ink-soft'}`}>
                        {(expert.isPanRegistered || (expert as any).panRegistered === 'yes' || (expert as any).panNumber || (expert.documents as any)?.some((d: any) => d.documentType === 'PAN')) ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/30">
                      <span className="text-ink-soft font-medium">Turnaround Time</span>
                      <span className="text-ink font-semibold">{expert.preferredDeliverySpeed?.[0] || 'Standard (2-3 weeks)'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/30">
                      <span className="text-ink-soft font-medium">Minimum Project</span>
                      <span className="text-ink font-semibold text-[#16A34A]">
                        {expert.minEngagementValue && Number(expert.minEngagementValue) > 0 ? `₹ ${Number(expert.minEngagementValue).toLocaleString('en-IN')}` : 'To Be Discussed'}
                      </span>
                    </div>

                    {location && location !== 'Not specified' && (
                      <div className="flex items-center justify-between py-1 border-b border-border/30">
                        <span className="text-ink-soft font-medium">Location</span>
                        <span className="text-ink font-semibold">{location}</span>
                      </div>
                    )}

                    {expert.timezone && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-ink-soft font-medium">Timezone</span>
                        <span className="text-ink font-semibold">{expert.timezone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs CTA mirror */}
                <div className="mt-4 rounded-[22px] border border-border/70 bg-surface/30 p-6 space-y-3">
                  <Button size="lg"
                    className={`w-full rounded-full text-[14px] font-bold font-poppins py-2.5 gap-2 active:scale-[0.98] cursor-pointer shadow-sm ${
                      shortlistedIds.includes(expert.userId)
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                        : 'bg-primary text-white hover:bg-primary/95'
                    }`}
                    onClick={handleShortlistClick}>
                    <Heart className={`h-4 w-4 ${shortlistedIds.includes(expert.userId) ? 'fill-current' : ''}`} />
                    {shortlistedIds.includes(expert.userId) ? 'Shortlisted' : 'Shortlist Expert'}
                  </Button>
                  <Button variant="outline" size="lg"
                    className="w-full rounded-full text-[14px] font-bold font-poppins py-2.5 gap-2 active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                    onClick={handleScheduleDiscussion}
                    disabled={!shortlistedIds.includes(expert.userId)}>
                    <Calendar className="h-4 w-4" />
                    Book a Free Discussion
                  </Button>
                  {!shortlistedIds.includes(expert.userId) && (
                    <p className="text-center text-[11.5px] text-ink-soft/70">
                      <Zap className="inline h-3 w-3 text-amber-500 fill-amber-500 mr-0.5" />
                      Shortlist first to unlock booking
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default ExpertProfile;

