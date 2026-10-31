import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import WebsiteLayout from '@/components/website/WebsiteLayout';
import SEO from '@/components/website/SEO';
import SchemaMarkup from '@/components/website/SchemaMarkup';
import { searchService, ExpertSearchResult, ExpertSortOption } from '@/services/searchService';
import { InitialDiscovery } from '@/components/filters/InitialDiscovery';
import { SearchSidebar } from './SearchSidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Search,
  MapPin,
  ArrowRight,
  Loader2,
  X,
  Sparkles,
  Filter,
  GitCompare,
  Heart,
  Lock,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useShortlist } from '@/contexts/ShortlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { SmartFiltersDrawer } from './SmartFiltersDrawer';
import { browseContextFromDiscoveryFilters, serializeBrowseQuery, slugify } from './browseContext';
import { SERVICE_HEAD_TO_PRIMARY_FILTERS } from '@/data/taxonomy';

const CANONICAL_FOCUS_MAP: Record<string, string> = {
  // Advertising
  'search advertising': 'Search Engine Advertising (SEM)',
  'search engine advertising': 'Search Engine Advertising (SEM)',
  'search engine advertising (sem)': 'Search Engine Advertising (SEM)',
  'sem': 'Search Engine Advertising (SEM)',
  'video & rich media advertising': 'Video Advertising & Rich Media',
  'video advertising & rich media': 'Video Advertising & Rich Media',
  'experiential & activation advertising': 'Experiential Marketing & Brand Activations',
  'experiential marketing & brand activations': 'Experiential Marketing & Brand Activations',
  'guerrilla advertising': 'Guerrilla Marketing',
  'guerrilla marketing': 'Guerrilla Marketing',
  // Growth & GTM Strategy
  'content & experience strategy': 'Content & Customer Experience Planning',
  'content & customer experience planning': 'Content & Customer Experience Planning',
  'content strategy': 'Content & Customer Experience Planning',
  'campaign & go-to-market strategy': 'Go-to-Market & Campaign Planning',
  'go-to-market & campaign planning': 'Go-to-Market & Campaign Planning',
  'go-to-market strategy': 'Go-to-Market & Campaign Planning',
  'research & market intelligence': 'Market Research & Intelligence',
  'market research & intelligence': 'Market Research & Intelligence',
  'channel & media strategy': 'Channel & Media Planning',
  'channel & media planning': 'Channel & Media Planning',
  'crm & relationship strategy': 'Customer Relationship Management (CRM)',
  'customer relationship management (crm)': 'Customer Relationship Management (CRM)',
  'crm': 'Customer Relationship Management (CRM)',
  // Sales & Marketing Assets
  'website & conversion collateral': 'Website & Landing Page Assets',
  'website & landing page assets': 'Website & Landing Page Assets',
  'email marketing collateral': 'Email Marketing Assets',
  'email marketing assets': 'Email Marketing Assets',
  'social media visual collateral': 'Social Media Creative Assets',
  'social media creative assets': 'Social Media Creative Assets',
  'presentation & pitch collateral': 'Sales & Business Assets',
  'sales & business assets': 'Sales & Business Assets',
  'long-form digital collateral': 'Content Marketing Assets',
  'content marketing assets': 'Content Marketing Assets',
  'event & trade show collateral': 'Event & Exhibition Assets',
  'event & exhibition assets': 'Event & Exhibition Assets',
  'promotional & merchandise collateral': 'Promotional Merchandise',
  'promotional merchandise': 'Promotional Merchandise',
  'print production & large format graphics': 'Large Format Printing & Production',
  'large format printing & production': 'Large Format Printing & Production',
};

const CANONICAL_NEED_MAP: Record<string, string> = {
  'seo & discovery strategy': 'SEO & Search Visibility Strategy',
  'seo & search visibility strategy': 'SEO & Search Visibility Strategy',
  'seo strategy': 'SEO & Search Visibility Strategy',
  'seo': 'SEO & Search Visibility Strategy',
  'search engine optimization': 'SEO & Search Visibility Strategy',
  'google search ads (ppc)': 'Google Ads Search Campaigns',
  'google ads search campaigns': 'Google Ads Search Campaigns',
  'google ads': 'Google Ads Search Campaigns',
  'search engine marketing (sem)': 'Google Ads Search Campaigns',
  'pay-per-click (ppc)': 'Google Ads Search Campaigns',
  'ppc': 'Google Ads Search Campaigns',
  'facebook & instagram ads': 'Meta Ads (Facebook & Instagram)',
  'meta ads': 'Meta Ads (Facebook & Instagram)',
  'meta ads (facebook & instagram)': 'Meta Ads (Facebook & Instagram)',
  'instagram ads': 'Meta Ads (Facebook & Instagram)',
  'pitch deck': 'Pitch Decks',
  'pitch decks': 'Pitch Decks',
  'logo': 'Logo Design',
  'logo design': 'Logo Design',
};

const CANONICAL_HEAD_MAP: Record<string, string> = {
  'branding services': 'Branding & Identity',
  'branding & identity': 'Branding & Identity',
  'strategic marketing services': 'Growth & GTM Strategy',
  'growth & gtm strategy': 'Growth & GTM Strategy',
  'advertising services': 'Paid & Performance Advertising',
  'paid & performance advertising': 'Paid & Performance Advertising',
  'marketing collateral services': 'Sales & Marketing Assets',
  'sales & marketing assets': 'Sales & Marketing Assets',
};

function normalizeHead(head: string | null | undefined): string | undefined {
  if (!head) return undefined;
  const lower = head.trim().toLowerCase();
  return CANONICAL_HEAD_MAP[lower] || head.trim();
}

function normalizeFocus(focus: string | null | undefined): string | undefined {
  if (!focus) return undefined;
  const lower = focus.trim().toLowerCase();
  return CANONICAL_FOCUS_MAP[lower] || focus.trim();
}

function normalizeNeed(need: string | null | undefined): string[] {
  if (!need) return [];
  return need.split(',').map(s => {
    const trimmed = s.trim();
    const lower = trimmed.toLowerCase();
    return CANONICAL_NEED_MAP[lower] || trimmed;
  }).filter(Boolean);
}

function inferHeadFromFocus(focus: string | undefined): string | undefined {
  if (!focus) return undefined;
  const normFocus = normalizeFocus(focus);
  for (const [head, primaries] of Object.entries(SERVICE_HEAD_TO_PRIMARY_FILTERS)) {
    if ((primaries as readonly string[]).some(p => p.toLowerCase() === normFocus?.toLowerCase())) {
      return head;
    }
  }
  return undefined;
}

interface FilterState {
  // New 3-column service filter structure
  serviceFilter: any;
  serviceHead?: string;
  // Service: category (head), focus area (primary), specific needs (sub)
  coreServiceCategories: string[];
  primaryFilter?: string; // Focus area – sent as primaryFilters to backend
  subServices: string[];
  industrySectors: string[];
  subIndustries: string[];
  location: string;
  clientScales: string[];
  businessTypesServed: string[];
  clientEngagementTypes: string[];
  engagementModels: string[];
  deliveryChannels: string[];
  preferredDeliverySpeed: string[];
  languages: string[];
  pricingStyle: string[];
  minProjectAmount?: number;
  maxBudget?: number;
  hasPortfolio?: boolean;
  hasToolsListed?: boolean;
  kycVerified?: boolean;
  verifiedCertifications?: boolean;
  complianceCompleted?: boolean;
  serviceDeliveryStates: string[];
  subEntityType: string[];
  experienceRange?: { min: number; max: number };
}

const DISCOVERY_SEARCH_PLACEHOLDERS = [
  'What are you looking to achieve?',
  'e.g., We need a brand strategy for our B2B SaaS launch',
  'e.g., Scale Google Ads & Meta Ads with a proven agency',
  'e.g., Fractional CMO to build our full go-to-market plan',
  'e.g., Complete rebranding with new visual identity & guidelines',
  'e.g., Search Engine Optimization (SEO) & organic visibility',
  'e.g., High-converting landing page & sales pitch deck',
];

const ExpertDiscovery = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  // State
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<ExpertSortOption>('recently_active');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isSmartFiltersOpen, setIsSmartFiltersOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });
  const { shortlistedIds, toggleShortlist } = useShortlist();
  const { isAuthenticated } = useAuth();

  // Search state & rotating placeholder animation (Hero experience)
  const [isExecutingSearch, setIsExecutingSearch] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [clarificationPrompt, setClarificationPrompt] = useState<string | null>(null);
  const [clarificationAnswer, setClarificationAnswer] = useState('');
  const [mappedFilters, setMappedFilters] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % DISCOVERY_SEARCH_PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Dynamic boundaries for experience and budget sliders (Pages 11-12)
  const { data: searchBounds } = useQuery({
    queryKey: ['searchBounds'],
    queryFn: () => searchService.getSearchBounds(),
    staleTime: 5 * 60 * 1000,
  });

  // Initialize filters
  const getInitialFilters = (): FilterState => {
    const savedFilters = sessionStorage.getItem('addServiceFilters');
    let initial: FilterState = {
      serviceFilter: null,
      coreServiceCategories: [],
      primaryFilter: undefined,
      subServices: [],
      industrySectors: [],
      subIndustries: [],
      location: '',
      clientScales: [],
      businessTypesServed: [],
      clientEngagementTypes: [],
      engagementModels: [],
      deliveryChannels: [],
      preferredDeliverySpeed: [],
      languages: [],
      pricingStyle: [],
      minProjectAmount: undefined,
      maxBudget: undefined,
      serviceDeliveryStates: [],
      subEntityType: [],
    };

    if (mode === 'add-service' && savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        initial = { ...initial, ...parsed };
      } catch { }
    } else {
      const category = searchParams.get('category');
      const svc = searchParams.get('svc');
      const sc = searchParams.get('sc');
      const rawCat = category || svc || sc;
      const rawFocus = searchParams.get('focus');
      const rawNeed = searchParams.get('need');
      const industry = searchParams.get('industry');
      const locationVal = searchParams.get('location');
      const opModel = searchParams.get('opModel');

      const normalizedFocus = normalizeFocus(rawFocus);
      const normalizedNeed = normalizeNeed(rawNeed);
      const targetCat = normalizeHead(rawCat) || inferHeadFromFocus(normalizedFocus);

      if (targetCat) {
        initial.coreServiceCategories = [targetCat];
        initial.serviceHead = targetCat;
      }
      if (normalizedFocus) {
        initial.primaryFilter = normalizedFocus;
      }
      if (normalizedNeed.length > 0) {
        initial.subServices = normalizedNeed;
      }
      if (industry) {
        initial.industrySectors = industry.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (locationVal) {
        initial.location = locationVal.trim();
      }
      if (opModel) {
        initial.engagementModels = opModel.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (targetCat) {
        initial.serviceFilter = { serviceHead: targetCat, primaryFilter: normalizedFocus || undefined, location: locationVal || '' };
      }
    }
    return initial;
  };

  const [filters, setFilters] = useState<FilterState>(getInitialFilters());

  useEffect(() => {
    // If filters are pre-loaded from Add Service, or specific refined parameters (focus, need, keyword, explicit search flag) are present, go straight to results.
    let rawSearch = location.search;
    if (rawSearch.startsWith('?')) {
      rawSearch = '?' + rawSearch.substring(1).replace(/\?/g, '&');
    }
    const safeParams = new URLSearchParams(rawSearch);
    const keywordVal = safeParams.get('keyword');
    const hasFocus = !!safeParams.get('focus');
    const hasNeed = !!safeParams.get('need');
    const isExplicitSearch = safeParams.get('search') === 'true';
    const hasIndustry = !!safeParams.get('industry');
    const hasLocation = !!safeParams.get('location');
    const hasOpModel = !!safeParams.get('opModel');
    const isAddService = mode === 'add-service';

    // If returning from auth (token in URL), always show results directly - skip the wizard
    const hasTokenInUrl = safeParams.get('token') || safeParams.get('accessToken');
    const returnedFromAuth = hasTokenInUrl || sessionStorage.getItem('expertsPageHasSearched') === 'true';
    sessionStorage.removeItem('expertsPageHasSearched');

    const hasRefinedParams = hasFocus || hasNeed || isExplicitSearch || hasIndustry || hasLocation || hasOpModel;

    if (returnedFromAuth || isAddService || keywordVal || hasRefinedParams) {
      setHasSearched(true);
      if (keywordVal) {
        setSearchQuery(keywordVal.trim());
      }
      if (isAddService) {
        sessionStorage.removeItem('addServiceFilters');
      }
    } else {
      setHasSearched(false);
    }
  }, []);

  // Sync URL search params with filter state when URL changes dynamically
  useEffect(() => {
    const category = searchParams.get('category');
    const svc = searchParams.get('svc');
    const sc = searchParams.get('sc');
    const rawCat = category || svc || sc;
    const rawFocus = searchParams.get('focus');
    const rawNeed = searchParams.get('need');
    const isExplicitSearch = searchParams.get('search') === 'true';
    const keyword = searchParams.get('keyword');
    const industry = searchParams.get('industry');
    const locationVal = searchParams.get('location');
    const opModel = searchParams.get('opModel');

    const normalizedFocus = normalizeFocus(rawFocus);
    const normalizedNeeds = normalizeNeed(rawNeed);
    const targetCat = normalizeHead(rawCat) || inferHeadFromFocus(normalizedFocus);

    const hasRefinedParams = !!(normalizedFocus || normalizedNeeds.length > 0 || isExplicitSearch || keyword || industry || locationVal || opModel);

    // Keep top searchbar input in sync with URL parameters
    if (keyword) {
      setSearchQuery(keyword.trim());
    } else if (rawFocus) {
      setSearchQuery(rawFocus.trim());
    } else if (rawCat) {
      setSearchQuery(rawCat.trim());
    }

    if (targetCat || hasRefinedParams) {
      setFilters(prev => ({
        ...prev,
        coreServiceCategories: targetCat ? [targetCat] : prev.coreServiceCategories,
        serviceHead: targetCat || prev.serviceHead,
        primaryFilter: normalizedFocus || undefined,
        subServices: normalizedNeeds.length > 0 ? normalizedNeeds : [],
        industrySectors: industry ? industry.split(',').map(s => s.trim()).filter(Boolean) : prev.industrySectors,
        location: locationVal ? locationVal.trim() : prev.location,
        engagementModels: opModel ? opModel.split(',').map(s => s.trim()).filter(Boolean) : prev.engagementModels,
        serviceFilter: targetCat ? { serviceHead: targetCat, primaryFilter: normalizedFocus || undefined, location: locationVal || '' } : null,
      }));

      // When arriving via a category card or link without sub-filters or explicit search flag,
      // show guided InitialDiscovery step wizard (starts at Step 2: Focus Area / Sub-filter)
      if (!hasRefinedParams && targetCat && !isExplicitSearch) {
        setHasSearched(false);
      } else {
        setHasSearched(true);
      }
    } else if (!hasRefinedParams && mode !== 'add-service') {
      // Direct navigation to /experts (no category and no refined params) -> show initial discovery wizard
      setFilters(getInitialFilters());
      setHasSearched(false);
      setSearchQuery('');
    }
  }, [searchParams]);

  // Sync serviceFilter with legacy fields
  useEffect(() => {
    if (filters.serviceFilter) {
      setFilters(prev => ({
        ...prev,
        coreServiceCategories: filters.serviceFilter?.serviceHead ? [filters.serviceFilter.serviceHead] : [],
      }));
    }
  }, [filters.serviceFilter]);

  // Build backend search filters
  const backendFilters = useMemo(() => {
    const filterObj: any = {};

    if (filters.coreServiceCategories.length > 0) {
      filterObj.coreServiceCategories = filters.coreServiceCategories.map(cat => {
        switch (cat) {
          case 'Branding & Identity':
            return 'Branding Services';
          case 'Growth & GTM Strategy':
            return 'Strategic Marketing Services';
          case 'Paid & Performance Advertising':
            return 'Advertising Services';
          case 'Sales & Marketing Assets':
            return 'Marketing Collateral Services';
          default:
            return cat;
        }
      });
    }
    // Focus area (primary filter) – backend matches services.primaryFilters
    if (filters.primaryFilter && filters.primaryFilter.trim()) {
      filterObj.primaryFilters = [filters.primaryFilter.trim()];
    }
    if (filters.subServices.length > 0) {
      filterObj.subServices = filters.subServices;
    }
    if (filters.industrySectors.length > 0) {
      filterObj.industrySectors = filters.industrySectors;
    }
    if (filters.subIndustries.length > 0) {
      filterObj.subIndustries = filters.subIndustries;
    }
    if (filters.location) {
      filterObj.location = filters.location;
    }
    if (filters.clientScales.length > 0) {
      filterObj.clientScales = filters.clientScales;
    }
    if (filters.businessTypesServed.length > 0) {
      filterObj.businessTypesServed = filters.businessTypesServed;
    }
    if (filters.clientEngagementTypes.length > 0) {
      filterObj.clientEngagementTypes = filters.clientEngagementTypes;
    }
    if (filters.engagementModels.length > 0) {
      filterObj.engagementModels = filters.engagementModels;
    }
    if (filters.deliveryChannels.length > 0) {
      filterObj.deliveryChannels = filters.deliveryChannels;
    }
    if (filters.preferredDeliverySpeed.length > 0) {
      filterObj.preferredDeliverySpeed = filters.preferredDeliverySpeed;
    }
    if (filters.languages.length > 0) {
      filterObj.languages = filters.languages;
    }
    if (filters.pricingStyle.length > 0) {
      filterObj.pricingStyle = filters.pricingStyle;
    }
    if (filters.hasPortfolio !== undefined) {
      filterObj.hasPortfolio = filters.hasPortfolio;
    }
    if (filters.hasToolsListed !== undefined) {
      filterObj.hasToolsListed = filters.hasToolsListed;
    }
    if (filters.kycVerified !== undefined) {
      filterObj.kycVerified = filters.kycVerified;
    }
    if (filters.verifiedCertifications !== undefined) {
      filterObj.verifiedCertifications = filters.verifiedCertifications;
    }
    if (filters.complianceCompleted !== undefined) {
      filterObj.complianceCompleted = filters.complianceCompleted;
    }
    if (filters.serviceDeliveryStates.length > 0) {
      filterObj.serviceDeliveryStates = filters.serviceDeliveryStates;
    }
    if (filters.subEntityType.length > 0) {
      filterObj.subEntityType = filters.subEntityType;
    }
    if (filters.experienceRange) {
      filterObj.experienceRange = filters.experienceRange;
    }
    if (filters.maxBudget !== undefined && filters.maxBudget > 0) {
      filterObj.maxBudget = filters.maxBudget;
    } else if (filters.minProjectAmount && filters.minProjectAmount > 0) {
      filterObj.minProjectAmount = filters.minProjectAmount;
    }
    // Add keyword search ONLY when explicitly provided via ?keyword= URL param
    const keywordFromUrl = searchParams.get('keyword');
    if (keywordFromUrl && keywordFromUrl.trim().length > 0) {
      filterObj.keyword = keywordFromUrl.trim();
    }

    return filterObj;
  }, [filters, searchParams]);

  // Fetch experts with dynamic sorting (Page 13)
  const { data: searchData, isLoading, error } = useQuery({
    queryKey: ['experts', backendFilters, sortOption],
    queryFn: () =>
      searchService.searchExperts({
        filters: Object.keys(backendFilters).length > 0 ? backendFilters : undefined,
        sort: {
          field: sortOption,
          order: sortOption.endsWith('_asc') ? 'asc' : 'desc',
        },
        page: 1,
        limit: 500,
      }),
    refetchOnWindowFocus: false,
    enabled: hasSearched,
  });

  // Calculate active smart filters count for badge display (Page 10)
  const activeSmartFilterCount = useMemo(() => {
    let count = 0;
    if (filters.maxBudget !== undefined || (filters.minProjectAmount !== undefined && filters.minProjectAmount > 0)) count++;
    if (filters.industrySectors && filters.industrySectors.length > 0) count++;
    if ((filters.clientScales && filters.clientScales.length > 0) ||
        (filters.businessTypesServed && filters.businessTypesServed.length > 0) ||
        (filters.clientEngagementTypes && filters.clientEngagementTypes.length > 0)) count++;
    if (filters.experienceRange && filters.experienceRange.min > 0) count++;
    if (filters.hasPortfolio || filters.hasToolsListed) count++;
    if ((filters.pricingStyle && filters.pricingStyle.length > 0) ||
        (filters.deliveryChannels && filters.deliveryChannels.length > 0) ||
        (filters.preferredDeliverySpeed && filters.preferredDeliverySpeed.length > 0)) count++;
    if (filters.languages && filters.languages.length > 0) count++;
    return count;
  }, [filters]);

  const navigateWithSearchFilters = (mappedObj: any, userQueryText: string) => {
    const params = new URLSearchParams();
    if (mappedObj.serviceHead) {
      params.set('category', mappedObj.serviceHead);
    }
    if (mappedObj.primaryFilters && mappedObj.primaryFilters.length > 0) {
      params.set('focus', mappedObj.primaryFilters[0]);
    }
    if (mappedObj.subFilters && mappedObj.subFilters.length > 0) {
      params.set('need', mappedObj.subFilters.join(','));
    }
    const industryArr = mappedObj.industry || mappedObj.industrySectors;
    if (industryArr && industryArr.length > 0) {
      params.set('industry', industryArr.join(','));
    }
    if (mappedObj.mumbaiRegion && mappedObj.mumbaiRegion.length > 0) {
      params.set('location', mappedObj.mumbaiRegion[0]);
    }
    const opModelArr = mappedObj.operationalModel || mappedObj.engagementModels;
    if (opModelArr && opModelArr.length > 0) {
      params.set('opModel', opModelArr[0]);
    }
    params.set('search', 'true');

    setSearchQuery(userQueryText);
    navigate(`/experts?${params.toString()}`);
  };

  const handleExecuteDiscoverySearch = async (queryText?: string) => {
    const targetQuery = (queryText !== undefined ? queryText : searchQuery).trim() || DISCOVERY_SEARCH_PLACEHOLDERS[placeholderIdx];
    if (!targetQuery || targetQuery === 'What are you looking to achieve?') return;

    setIsExecutingSearch(true);
    setClarificationPrompt(null);
    setClarificationAnswer('');

    try {
      const response = await searchService.mapNaturalLanguageQuery(targetQuery);
      if (response.success && response.filters) {
        setMappedFilters(response.filters);
        if (response.missingInfoPrompt) {
          setClarificationPrompt(response.missingInfoPrompt);
        } else {
          navigateWithSearchFilters(response.filters, targetQuery);
        }
      } else {
        setSearchQuery(targetQuery);
        navigate(`/experts?keyword=${encodeURIComponent(targetQuery)}&search=true`);
      }
    } catch (err) {
      console.error('Failed to map search query in ExpertDiscovery:', err);
      setSearchQuery(targetQuery);
      navigate(`/experts?keyword=${encodeURIComponent(targetQuery)}&search=true`);
    } finally {
      setIsExecutingSearch(false);
      setHasSearched(true);
    }
  };

  const handleClarificationSubmit = async () => {
    if (!clarificationAnswer.trim() || !mappedFilters) return;
    setIsExecutingSearch(true);
    const combinedQuery = `${searchQuery}. Clarification: ${clarificationAnswer}`;
    setClarificationPrompt(null);

    try {
      const response = await searchService.mapNaturalLanguageQuery(combinedQuery);
      if (response.success && response.filters) {
        navigateWithSearchFilters(response.filters, combinedQuery);
      } else {
        navigateWithSearchFilters(mappedFilters, searchQuery);
      }
    } catch {
      navigateWithSearchFilters(mappedFilters, searchQuery);
    } finally {
      setIsExecutingSearch(false);
      setClarificationAnswer('');
    }
  };

  const skipClarification = () => {
    if (mappedFilters) {
      navigateWithSearchFilters(mappedFilters, searchQuery);
    } else {
      navigate(`/experts?keyword=${encodeURIComponent(searchQuery)}&search=true`);
    }
    setClarificationPrompt(null);
    setClarificationAnswer('');
  };

  const clearAllFilters = () => {
    setFilters({
      serviceFilter: null,
      coreServiceCategories: [],
      serviceHead: undefined,
      primaryFilter: undefined,
      subServices: [],
      industrySectors: [],
      subIndustries: [],
      location: '',
      clientScales: [],
      businessTypesServed: [],
      clientEngagementTypes: [],
      engagementModels: [],
      deliveryChannels: [],
      preferredDeliverySpeed: [],
      languages: [],
      pricingStyle: [],
      serviceDeliveryStates: [],
      subEntityType: [],
    });
    setSearchQuery('');
    setHasSearched(true);
    navigate('/experts?search=true', { replace: true });
  };

  const handleCompare = () => {
    if (!isAuthenticated) {
      // Prompt modal as required on Page 14
      setAuthPrompt({
        open: true,
        title: 'Compare Experts',
        message: 'Create a free account to compare experts and shortlist the ones you want to consider.',
      });
      return;
    }
    if (visibleShortlistedIds.length < 2) return;
    const compareIds = visibleShortlistedIds.slice(0, 3);
    const p = new URLSearchParams();
    p.set('ids', compareIds.join(','));
    const bc = browseContextFromDiscoveryFilters(filters);
    if (bc.svc) p.set('svc', bc.svc);
    if (bc.focus) p.set('focus', bc.focus);
    if (bc.needs.length) p.set('need', bc.needs.join(','));
    navigate(`/experts/compare?${p.toString()}`);
  };

  const filteredExperts = useMemo(() => {
    if (!searchData?.experts) return [];
    return searchData.experts;
  }, [searchData]);

  // Only compare shortlisted experts currently visible/matching in the search results
  const visibleShortlistedIds = useMemo(() => {
    const visibleIds = filteredExperts.map(e => e.userId || e.expertId);
    return shortlistedIds.filter(id => visibleIds.includes(id));
  }, [filteredExperts, shortlistedIds]);

  const matchCount = searchData?.total || 0;

  const discoveryBrowseSuffix = serializeBrowseQuery(browseContextFromDiscoveryFilters(filters));

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Find Experts', path: '/experts' }
  ];

  // Layer A: Initial Search State
  if (!hasSearched) {
    return (
      <WebsiteLayout>
        <SEO
          title="Find Marketing Experts - Search & Compare Verified Professionals"
          description="Discover verified marketing experts on MarTechAdda. Filter by service, industry, location, and more."
          canonical="https://martechadda.com/experts"
        />
        <SchemaMarkup type="WebPage" breadcrumbs={breadcrumbs} />

        {/* ── PAGE HERO ── */}
        <div className="relative overflow-hidden bg-background bg-[radial-gradient(ellipse_at_top,_var(--color-primary)/0.035,_var(--color-background),_var(--color-background))] border-b border-border/30">
          {/* Soft background ambient glows */}
          <div className="absolute top-[-10%] left-[25%] h-[300px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
          <div className="absolute top-[20%] right-[20%] h-[250px] w-[400px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none" />
          
          <div className="mx-auto max-w-[900px] px-5 pt-20 pb-10 md:pb-12 text-center space-y-6 relative z-10">
            {/* Trust Pills */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-white px-4 py-1.5 text-[11.5px] font-bold text-ink-soft uppercase tracking-widest shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                NO PAID RANKINGS · NO SPONSORED VISIBILITY
              </span>
            </div>

            <h1 className="text-[36px] md:text-[52px] font-bold font-poppins leading-tight tracking-[-0.03em] text-ink">
              Get matched with relevant <br className="hidden md:block" />
              <span className="font-serif italic font-normal text-primary">marketing expertise.</span>
            </h1>
            <p className="text-[16px] md:text-[17.5px] text-ink-soft font-medium leading-relaxed max-w-[560px] mx-auto">
              Based on your business requirements—not paid visibility or profile popularity.
            </p>
          </div>
        </div>

        {/* ── DISCOVERY CONSOLE ── */}
        <div className="mx-auto max-w-[1100px] px-5 py-8 md:py-10">
          <InitialDiscovery
            key={filters.serviceHead || filters.coreServiceCategories[0] || 'default'}
            initialSelection={{
              serviceHead: (filters.serviceHead as any) || (filters.coreServiceCategories[0] as any) || null,
              primaryFilter: filters.primaryFilter || null,
              location: filters.location,
            }}
            onApplyFilters={(appliedFilters) => {
              const normHead = normalizeHead(appliedFilters.serviceHead);
              const normFocus = normalizeFocus(appliedFilters.primaryFilters?.[0]);
              const normNeeds = normalizeNeed(appliedFilters.subFilters?.join(','));
              const targetHead = normHead || inferHeadFromFocus(normFocus);
              const loc = appliedFilters.location || (appliedFilters.mumbaiRegion?.[0] || '');

              setFilters((prev) => ({
                ...prev,
                coreServiceCategories: targetHead ? [targetHead] : [],
                serviceHead: targetHead,
                primaryFilter: normFocus,
                subServices: normNeeds,
                location: loc || prev.location,
                industrySectors: appliedFilters.industrySectors || appliedFilters.industry || prev.industrySectors,
                engagementModels: appliedFilters.operationalModel || appliedFilters.engagementModels || prev.engagementModels,
                serviceFilter: targetHead ? { serviceHead: targetHead, primaryFilter: normFocus, location: loc } : null,
              }));
              setHasSearched(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSearch={(selection) => {
              setFilters((prev) => ({
                ...prev,
                serviceFilter: selection,
                coreServiceCategories: selection.serviceHead ? [selection.serviceHead] : [],
                serviceHead: selection.serviceHead || undefined,
                primaryFilter: selection.primaryFilter || undefined,
                subServices: [],
                location: selection.location || prev.location,
              }));
              setHasSearched(true);
              const p = new URLSearchParams();
              if (selection.serviceHead) p.set('category', selection.serviceHead);
              if (selection.primaryFilter) p.set('focus', selection.primaryFilter);
              if (selection.location) p.set('location', selection.location);
              p.set('search', 'true');
              navigate(`/experts?${p.toString()}`, { replace: true });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      </WebsiteLayout>
    );
  }

  // Layer B: Results with Sidebar
  return (
    <WebsiteLayout>
      <SEO
        title={`Marketing Experts - ${matchCount} Results`}
        description="Browse verified marketing experts matching your criteria."
        canonical="https://martechadda.com/experts"
      />
      <div className="flex flex-col min-h-screen bg-[#FAF9F6]">
        {/* Top Bar (Mobile) */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-sm">{matchCount} results</span>

          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" /> Smart Filter
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px] sm:w-[400px]">
              <SearchSidebar
                filters={filters}
                onFilterChange={setFilters}
                isAuthenticated={isAuthenticated}
                onOpenSmartFilters={() => setIsSmartFiltersOpen(true)}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block w-[360px] xl:w-[400px] sticky top-[64px] h-[calc(100vh-64px)] z-10 bg-white border-r border-border/40 shrink-0">
            <SearchSidebar
              filters={filters}
              onFilterChange={setFilters}
              isAuthenticated={isAuthenticated}
              onOpenSmartFilters={() => setIsSmartFiltersOpen(true)}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 lg:pt-8 lg:pb-12 lg:px-10 overflow-y-auto bg-[#FAF9F6]">

            {/* Top Search Engine Bar (Matches Hero Search Engine experience) */}
            <div className="bg-white rounded-[24px] border border-border/70 p-5 md:p-6 mb-6 shadow-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteDiscoverySearch();
                }}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={DISCOVERY_SEARCH_PLACEHOLDERS[placeholderIdx]}
                    className="w-full pl-11 pr-10 py-3 rounded-full border border-border/60 bg-surface/50 text-[14px] font-medium text-ink placeholder:text-ink-soft/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors p-1"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isExecutingSearch}
                  className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/95 text-white font-bold font-poppins px-8 py-3 text-[14px] shadow-sm shrink-0 flex items-center justify-center gap-2 disabled:opacity-80 cursor-pointer"
                >
                  {isExecutingSearch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </form>

              {/* Popular quick-intent chips */}
              <div className="flex items-center gap-2 mt-3.5 text-[12px] text-ink-soft font-medium flex-wrap">
                <span className="font-bold text-ink">Popular:</span>
                {['Brand Strategy', 'Paid Ads', 'SEO', 'Content Marketing'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    disabled={isExecutingSearch}
                    onClick={() => {
                      setSearchQuery(tag);
                      handleExecuteDiscoverySearch(tag);
                    }}
                    className="px-3 py-1 rounded-full bg-surface hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-[12px] font-medium border border-border/40 disabled:opacity-60"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Refinement Clarification Modal (just like Hero) */}
            {clarificationPrompt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                <div className="w-full max-w-[500px] bg-white rounded-3xl border border-border/80 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-start justify-between pb-3 border-b border-border/50">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                        <Sparkles className="w-3.5 h-3.5" /> AI refinement
                      </span>
                      <h3 className="text-[17px] font-bold text-ink font-poppins mt-1">Help us narrow your search</h3>
                    </div>
                    <button
                      onClick={() => setClarificationPrompt(null)}
                      className="p-1 hover:bg-ink/5 rounded-full transition-colors text-ink-soft cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[13.5px] text-ink-soft leading-relaxed font-semibold">
                      {clarificationPrompt}
                    </p>
                    <input
                      type="text"
                      value={clarificationAnswer}
                      onChange={(e) => setClarificationAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && clarificationAnswer.trim()) {
                          handleClarificationSubmit();
                        }
                      }}
                      className="w-full h-11 border border-border/80 bg-white px-4 rounded-xl text-[14px] focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                      placeholder="Type your answer here..."
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      onClick={skipClarification}
                      className="px-4 py-2 text-[13px] font-bold font-poppins text-ink-soft hover:text-ink transition-colors cursor-pointer"
                    >
                      Skip &amp; Search
                    </button>
                    <button
                      onClick={handleClarificationSubmit}
                      disabled={!clarificationAnswer.trim()}
                      className="h-10 px-6 rounded-full bg-primary hover:bg-primary/95 text-white font-bold font-poppins text-[13px] shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Header with Compare, Smart Filters drawer button, and Gated Sort By */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold font-poppins tracking-tight text-ink">Experts Relevant to Your Requirement</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {visibleShortlistedIds.length > 0 && (
                  <Button onClick={handleCompare} size="sm" className="gap-2 rounded-full cursor-pointer" disabled={visibleShortlistedIds.length < 2}>
                    <GitCompare className="h-4 w-4" />
                    Compare Shortlist ({Math.min(visibleShortlistedIds.length, 3)})
                  </Button>
                )}

                {/* Smart Filters button opening right drawer (Page 10) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isAuthenticated) {
                      setIsSmartFiltersOpen(true);
                    } else {
                      setAuthPrompt({
                        open: true,
                        title: 'Unlock Smart Filters',
                        message: 'Create a free account to refine your search further.',
                      });
                    }
                  }}
                  className="gap-2 rounded-full border-primary/30 text-primary hover:bg-primary/5 font-semibold text-[13px] h-9 px-4 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Smart Filters {activeSmartFilterCount > 0 ? `(${activeSmartFilterCount})` : ''}
                </Button>

                {/* Gated Sort By Dropdown (Page 13: visible once account created) */}
                {isAuthenticated && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-soft">Sort:</span>
                    <Select value={sortOption} onValueChange={(v: ExpertSortOption) => setSortOption(v)}>
                      <SelectTrigger className="w-[185px] h-9 text-[12.5px] rounded-full font-medium border-border/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-lg">
                        <SelectItem value="recently_active" className="text-[12.5px]">Recently Active</SelectItem>
                        <SelectItem value="experience_desc" className="text-[12.5px]">Experience — High to Low</SelectItem>
                        <SelectItem value="experience_asc" className="text-[12.5px]">Experience — Low to High</SelectItem>
                        <SelectItem value="budget_asc" className="text-[12.5px]">Budget — Low to High</SelectItem>
                        <SelectItem value="budget_desc" className="text-[12.5px]">Budget — High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Applied Filters Summary */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(filters.coreServiceCategories.length > 0) && (
                <Badge variant="secondary" className="px-3 py-1 gap-1.5 text-[10.5px] font-bold uppercase tracking-wider font-poppins rounded-md border border-border/50 bg-[#FAF6F0] text-ink-soft hover:bg-[#FAF6F0]/80">
                  {filters.coreServiceCategories[0]}
                  <X className="w-3 h-3 cursor-pointer hover:text-ink transition-colors" onClick={() => setFilters({ ...filters, coreServiceCategories: [], serviceHead: undefined, primaryFilter: undefined, subServices: [] })} />
                </Badge>
              )}
              {filters.primaryFilter && (
                <Badge variant="outline" className="px-3 py-1 gap-1.5 text-[10.5px] font-bold uppercase tracking-wider font-poppins rounded-md border border-border/50 bg-[#FAF6F0] text-ink-soft hover:bg-[#FAF6F0]/80">
                  {filters.primaryFilter}
                  <X className="w-3 h-3 cursor-pointer hover:text-ink transition-colors" onClick={() => setFilters({ ...filters, primaryFilter: undefined, subServices: [] })} />
                </Badge>
              )}
              {filters.subServices.map(s => (
                <Badge key={s} variant="outline" className="px-3 py-1 gap-1.5 text-[10.5px] font-bold uppercase tracking-wider font-poppins rounded-md border border-border/50 bg-[#FAF6F0] text-ink-soft hover:bg-[#FAF6F0]/80">
                  {s}
                  <X className="w-3 h-3 cursor-pointer hover:text-ink transition-colors" onClick={() => setFilters({ ...filters, subServices: filters.subServices.filter(i => i !== s) })} />
                </Badge>
              ))}
              {filters.minProjectAmount !== undefined && filters.minProjectAmount > 0 && (
                <Badge variant="outline" className="px-3 py-1 gap-1.5 text-[10.5px] font-bold uppercase tracking-wider font-poppins rounded-md border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/80">
                  Min Project: ₹{Number(filters.minProjectAmount).toLocaleString('en-IN')}+
                  <X className="w-3 h-3 cursor-pointer hover:text-amber-950 transition-colors" onClick={() => setFilters({ ...filters, minProjectAmount: undefined })} />
                </Badge>
              )}
              {filters.experienceRange !== undefined && filters.experienceRange.min > 0 && (
                <Badge variant="outline" className="px-3 py-1 gap-1.5 text-[10.5px] font-bold uppercase tracking-wider font-poppins rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10">
                  Exp: {filters.experienceRange.min}+ Years
                  <X className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" onClick={() => setFilters({ ...filters, experienceRange: undefined })} />
                </Badge>
              )}
              {(filters.subServices.length > 0 || filters.coreServiceCategories.length > 0 || filters.primaryFilter || filters.minProjectAmount || filters.experienceRange) && (
                <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-ink-soft hover:text-primary rounded-full hover:bg-primary/5 px-2.5 transition-colors cursor-pointer" onClick={clearAllFilters}>Clear All</Button>
              )}
            </div>

            {/* Progressive Fallback Notice Banner (PDF Pages 12-16) */}
            {searchData?.fallbackBanner && searchData.fallbackLevel && searchData.fallbackLevel !== 'EXACT' && searchData.fallbackLevel !== 'NO_MATCH' && (
              <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50/80 text-amber-950 text-sm flex items-start justify-between gap-4 shadow-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-950 text-sm">
                      {searchData.fallbackBanner}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-amber-800">
                    <span className="font-bold text-amber-900">
                      {searchData.total} {searchData.total === 1 ? 'provider' : 'providers'}
                    </span>
                    {searchData.fallbackMatchedScope && (
                      <>
                        <span className="text-amber-400">•</span>
                        <span>
                          <strong>Matched on:</strong> {searchData.fallbackMatchedScope}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 border-amber-300 bg-amber-100/80 text-amber-900 font-bold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {searchData.fallbackLevel === 'FOCUS_AREA' ? 'Broader Match' : 'Category Match'}
                </Badge>
              </div>
            )}

            {/* Results Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm">Finding the best matches...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-destructive">
                <p>Failed to load experts. Please try again.</p>
              </div>
            ) : (filteredExperts.length === 0 && !isLoading) ? (
              <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-semibold text-ink">No providers found in this service area yet.</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                  Try another marketing requirement or broaden your selection.
                </p>
                <Button variant="outline" onClick={clearAllFilters}>Reset Filters</Button>
              </div>
            ) : (
                <div className="space-y-8">
                  {/* Main Grid: Displays 4 fully clear cards when unauthenticated, or all when authenticated */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(isAuthenticated ? filteredExperts : filteredExperts.slice(0, 4)).map((expert) => (
                      <ExpertCard
                        key={expert.expertId}
                        expert={expert}
                        profileBrowseSuffix={discoveryBrowseSuffix}
                        isShortlisted={shortlistedIds.includes(expert.userId || expert.expertId)}
                        onToggleShortlist={() => toggleShortlist(expert.userId || expert.expertId)}
                        filters={filters}
                        isAuthenticated={isAuthenticated}
                        isBlurred={false}
                      />
                    ))}
                  </div>

                  {/* Unlock Banner shown below the 4 cards when more matches exist */}
                  {!isAuthenticated && filteredExperts.length > 4 && (
                    <div className="relative mt-4">
                      {/* Teaser: Next 2 blurred cards peaking through */}
                      <div className="relative overflow-hidden rounded-[24px] max-h-[110px] pointer-events-none select-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 blur-[3px]">
                          {filteredExperts.slice(4, 6).map((expert) => (
                            <ExpertCard
                              key={expert.expertId}
                              expert={expert}
                              profileBrowseSuffix={discoveryBrowseSuffix}
                              isShortlisted={false}
                              onToggleShortlist={() => {}}
                              filters={filters}
                              isAuthenticated={false}
                              isBlurred={true}
                            />
                          ))}
                        </div>

                        {/* Gradient fade over the teaser cards */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FAF9F6]/60 to-[#FAF9F6] pointer-events-none" />
                      </div>

                      {/* The Unlock Banner Card */}
                      <div className="-mt-8 relative z-10 w-full overflow-hidden rounded-[28px] border border-border/70 bg-white p-6 md:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)] flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Ambient Glows */}
                        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-primary/4 blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-[#16A34A]/4 blur-[100px] pointer-events-none" />
                        
                        <div className="relative z-10 max-w-[620px] space-y-3.5 text-left">
                          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10.5px] font-bold font-poppins tracking-wider text-primary uppercase">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            UNLOCK YOUR FULL MATCHES
                          </span>
                          <h3 className="text-[22px] md:text-[26px] font-bold font-poppins text-ink leading-tight tracking-[-0.02em]">
                            {matchCount > 4 ? matchCount - 4 : (filteredExperts.length > 4 ? filteredExperts.length - 4 : 14)} More Experts Match Your Requirement
                          </h3>
                          <div>
                            <h4 className="text-[15px] font-bold text-ink font-poppins mb-1">
                              Find Your Best-Fit Marketing Expert
                            </h4>
                            <p className="text-[13.5px] text-ink-soft leading-relaxed font-sans font-medium">
                              Create a free account to unlock all matching experts, compare profiles, understand why they match, shortlist, and schedule a discussion.
                            </p>
                          </div>
                        </div>

                        <div className="relative z-10 shrink-0 flex flex-col items-center gap-3 w-full md:w-auto">
                          {(() => {
                            let cleanUrl = window.location.href;
                            try {
                              const u = new URL(window.location.href);
                              u.searchParams.delete('token');
                              u.searchParams.delete('accessToken');
                              u.hash = '';
                              cleanUrl = u.toString();
                            } catch {
                              // fallback
                            }
                            return (
                              <>
                                <a
                                  href={`https://app.martechadda.com/register-seeker?redirect=${encodeURIComponent(cleanUrl)}`}
                                  onClick={() => {
                                    sessionStorage.setItem('addServiceFilters', JSON.stringify(filters));
                                    sessionStorage.setItem('expertsPageHasSearched', 'true');
                                  }}
                                  className="w-full sm:w-auto text-center rounded-full bg-primary text-white font-bold font-poppins text-[14px] px-8 py-3.5 shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all duration-300 inline-block"
                                >
                                  Create Free Account
                                </a>
                                <a
                                  href={`https://app.martechadda.com/login?redirect=${encodeURIComponent(cleanUrl)}`}
                                  onClick={() => {
                                    sessionStorage.setItem('addServiceFilters', JSON.stringify(filters));
                                    sessionStorage.setItem('expertsPageHasSearched', 'true');
                                  }}
                                  className="text-[13px] font-medium text-ink-soft hover:text-primary transition-colors font-sans underline underline-offset-4 cursor-pointer"
                                >
                                  Already have an account? Sign In
                                </a>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Filters Drawer (Pages 9-10) */}
      <SmartFiltersDrawer
        isOpen={isSmartFiltersOpen}
        onClose={() => setIsSmartFiltersOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setHasSearched(true);
        }}
        bounds={searchBounds}
      />

      {/* Auth Prompt Modal (Page 14: Compare Gating & Page 9: Smart Filters Gating) */}
      <Dialog open={authPrompt.open} onOpenChange={(open) => setAuthPrompt(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[440px] rounded-[28px] p-6 text-center space-y-4 border border-border/80 shadow-2xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-[19px] font-bold font-poppins text-ink">
              {authPrompt.title}
            </DialogTitle>
            <DialogDescription className="text-[13.5px] text-ink-soft leading-relaxed font-sans">
              {authPrompt.message}
            </DialogDescription>
          </div>
          <div className="space-y-2.5 pt-2">
            <Button
              asChild
              className="w-full rounded-full bg-primary hover:bg-primary/95 text-white font-bold font-poppins h-11 text-[13.5px] shadow-sm cursor-pointer"
            >
              <a
                href={`https://app.martechadda.com/register?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                onClick={() => {
                  sessionStorage.setItem('addServiceFilters', JSON.stringify(filters));
                  sessionStorage.setItem('expertsPageHasSearched', 'true');
                }}
              >
                Create Free Account →
              </a>
            </Button>
            <div className="text-[12.5px] text-ink-soft pt-1">
              Already have an account?{' '}
              <a
                href={`https://app.martechadda.com/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                onClick={() => {
                  sessionStorage.setItem('addServiceFilters', JSON.stringify(filters));
                  sessionStorage.setItem('expertsPageHasSearched', 'true');
                }}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Sign In
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </WebsiteLayout>
  );
};

// Extracted Expert Card Component
const ExpertCard = ({ expert, isShortlisted, onToggleShortlist, profileBrowseSuffix = '', filters, isAuthenticated = false, isBlurred = false }: {
  expert: ExpertSearchResult,
  isShortlisted: boolean,
  onToggleShortlist: () => void,
  profileBrowseSuffix?: string,
  filters: FilterState,
  isAuthenticated?: boolean;
  isBlurred?: boolean;
}) => {
  const getMatchLabel = () => {
    if (isShortlisted) {
      return "Best Aligned";
    }

    const hasSmartFilters = 
      (filters.subServices && filters.subServices.length > 0) ||
      (filters.industrySectors && filters.industrySectors.length > 0) ||
      (filters.subIndustries && filters.subIndustries.length > 0) ||
      (filters.clientScales && filters.clientScales.length > 0) ||
      (filters.businessTypesServed && filters.businessTypesServed.length > 0) ||
      (filters.clientEngagementTypes && filters.clientEngagementTypes.length > 0) ||
      (filters.engagementModels && filters.engagementModels.length > 0) ||
      (filters.deliveryChannels && filters.deliveryChannels.length > 0) ||
      (filters.preferredDeliverySpeed && filters.preferredDeliverySpeed.length > 0) ||
      (filters.languages && filters.languages.length > 0) ||
      (filters.pricingStyle && filters.pricingStyle.length > 0) ||
      (filters.serviceDeliveryStates && filters.serviceDeliveryStates.length > 0) ||
      (filters.subEntityType && filters.subEntityType.length > 0) ||
      filters.hasPortfolio !== undefined ||
      filters.hasToolsListed !== undefined ||
      filters.kycVerified !== undefined ||
      filters.verifiedCertifications !== undefined ||
      filters.complianceCompleted !== undefined ||
      filters.experienceRange !== undefined;

    if (hasSmartFilters) {
      return "Strong Match";
    }

    return "Best Fit";
  };

  const getMatchReason = () => {
    const reasons: string[] = [];
    if (expert.categories && filters.coreServiceCategories.length > 0) {
      const hit = expert.categories.find((c: string) => filters.coreServiceCategories.some(fc => c.toLowerCase().includes(fc.toLowerCase()) || fc.toLowerCase().includes(c.toLowerCase())));
      if (hit) reasons.push(`Service: ${hit}`);
    }
    if (filters.primaryFilter) {
      reasons.push(`Focus Area: ${filters.primaryFilter}`);
    }
    if (filters.subServices && filters.subServices.length > 0 && (expert as any).subServices) {
      const subHits = (expert as any).subServices.filter((s: string) => filters.subServices.includes(s));
      if (subHits.length > 0) reasons.push(`Need: ${subHits.join(', ')}`);
    }
    if (filters.location) {
      const locStr = typeof expert.location === 'object' ? (expert.location as any).city : expert.location;
      if (locStr) reasons.push(`Location: ${locStr}`);
    }
    if (reasons.length > 0) {
      return reasons.join(' • ');
    }
    return `Aligned with ${expert.categories?.[0] || 'your requirement'}`;
  };

  const getAvatarBg = (name: string) => {
    const colors = ["#F5E3D2", "#DDECD4", "#D8E5F5", "#FAF6F0"];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  return (
    <div className={`group relative h-full flex flex-col rounded-[24px] border border-border/60 bg-white transition-all duration-300 overflow-hidden ${
      isBlurred 
        ? 'pointer-events-none select-none border-border/40 opacity-70' 
        : 'hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.10)] hover:border-primary/20 hover:cursor-pointer'
    }`}>

      {/* Top content area */}
      <div className="p-5 flex-1 flex flex-col">

        {/* Header: avatar + name + save */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar with availability badge */}
          <div className="relative shrink-0">
            {expert.profileImageUrl ? (
              <img
                src={expert.profileImageUrl}
                alt={expert.displayName}
                className={`h-[56px] w-[56px] rounded-[16px] object-cover border border-border/40 shadow-sm ${isBlurred ? 'blur-[4px]' : ''}`}
              />
            ) : (
              <div
                className={`h-[56px] w-[56px] rounded-[16px] border border-border/40 flex items-center justify-center font-bold text-[22px] font-poppins text-ink shadow-sm ${isBlurred ? 'blur-[4px]' : ''}`}
                style={{ backgroundColor: getAvatarBg(expert.displayName) }}
              >
                {expert.displayName.charAt(0)}
              </div>
            )}
            {/* Availability dot badge */}
            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${expert.availabilityStatus === 'available' ? 'bg-[#16A34A]' : 'bg-amber-400'}`} />
          </div>

          {/* Name & subtitle */}
          <div className="flex-1 min-w-0">
            {isBlurred ? (
              <span className="font-bold text-[15.5px] font-poppins leading-tight text-ink block truncate blur-[5px]">
                {expert.displayName}
              </span>
            ) : (
              <Link
                to={`/experts/${slugify(expert.displayName)}${profileBrowseSuffix}`}
                className="font-bold text-[15.5px] font-poppins leading-tight text-ink hover:text-primary transition-colors block truncate"
              >
                {expert.displayName}
              </Link>
            )}

            {/* 1) Expert Type displayed in between/middle of expert name and Service category (Page 6) */}
            <p className="text-[12px] font-semibold text-primary/90 mt-0.5 line-clamp-1 font-poppins">
              {expert.subEntityType || expert.businessRole || 'Independent Consultant'}
            </p>

            <p className={`text-[12px] text-ink-soft mt-0.5 line-clamp-1 ${isBlurred ? 'blur-[3px]' : ''}`}>
              {expert.categories?.[0] || 'Marketing Expert'}
            </p>
            {/* Match label & reason (For authenticated users) */}
            {isAuthenticated && (
              <div className="mt-1 flex flex-col gap-0.5">
                <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold text-[#16A34A] ${isBlurred ? 'blur-[3px]' : ''}`}>
                  <Sparkles className="w-2.5 h-2.5" />
                  {getMatchLabel()}
                </span>
                <span className="text-[11px] text-ink-soft/80 font-medium">
                  {getMatchReason()}
                </span>
              </div>
            )}
          </div>

          {/* Save button */}
          {!isBlurred && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleShortlist(); }}
              className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isShortlisted
                  ? 'bg-rose-50 text-rose-500 border border-rose-200'
                  : 'bg-ink/5 text-ink-soft border border-border/40 hover:bg-rose-50 hover:text-rose-400 hover:border-rose-200'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isShortlisted ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Bio */}
        {expert.bio && (
          <p className={`text-[12.5px] text-ink-soft leading-relaxed line-clamp-2 mb-4 ${isBlurred ? 'blur-[4px]' : ''}`}>
            {expert.bio}
          </p>
        )}

        {/* Service tags */}
        <div className={`flex flex-wrap gap-1.5 mb-4 ${isBlurred ? 'blur-[3.5px]' : ''}`}>
          {expert.categories.slice(0, 2).map((cat: string) => (
            <span key={cat} className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-bold text-ink-soft">
              {cat}
            </span>
          ))}
          {(expert as any).subServices?.slice(0, 1).map((s: string) => (
            <span key={s} className="rounded-full bg-primary/8 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              {s}
            </span>
          ))}
          {expert.categories.length > 2 && (
            <span className="text-[10.5px] text-ink-soft/60 font-semibold self-center">+{expert.categories.length - 2} more</span>
          )}
        </div>

        {/* Meta row: location + minimum engagement value in highlighted green area (Page 6) */}
        <div className={`flex items-center justify-between text-[11.5px] text-ink-soft border-t border-border/40 pt-3 mt-auto ${isBlurred ? 'blur-[4px]' : ''}`}>
          <div className="flex items-center gap-1.5 font-medium flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-ink-soft/50 shrink-0" />
              <span>{typeof expert.location === 'object' ? (expert.location as any).city : (expert.location || 'Mumbai')}</span>
              {expert.panIndiaAvailable ? (
                <span className="ml-0.5 text-[9px] bg-[#16A34A]/8 text-[#16A34A] px-1.5 py-0.5 rounded-full font-bold border border-[#16A34A]/15">Pan-India</span>
              ) : (() => {
                const baseCity = typeof expert.location === 'object' ? (expert.location as any).city : (expert.location || '');
                const allRegions = Array.from(new Set([...(expert.serviceDeliveryStates || []), ...(expert.serviceArea || [])])).filter(Boolean);
                const additional = allRegions.filter(r => r.toLowerCase().trim() !== (baseCity || '').toLowerCase().trim());
                return additional.length > 0 ? (
                  <span className="ml-0.5 text-[9px] bg-ink/5 text-ink-soft px-1.5 py-0.5 rounded-full font-bold border border-ink/10" title={allRegions.join(', ')}>+{additional.length} regions</span>
                ) : null;
              })()}
            </span>
            <span className="text-ink/30 mx-0.5">·</span>
            {/* 2) Minimum engagement value in highlighted green area */}
            <span className="font-semibold text-ink bg-[#DDECD4]/70 px-2 py-0.5 rounded-md border border-[#DDECD4] text-[11px]">
              Project Value: {expert.minEngagementValue && Number(expert.minEngagementValue) > 0 ? `₹ ${Number(expert.minEngagementValue).toLocaleString('en-IN')} minimum` : 'To Be Discussed'}
            </span>
          </div>
          <span className="font-bold text-ink text-[11.5px] shrink-0 ml-2">
            {Array.isArray(expert.pricingStyle) && expert.pricingStyle[0] ? expert.pricingStyle[0] : 'Flexible'}
          </span>
        </div>
      </div>

      {/* Footer CTA — full-width with hover fill */}
      {isBlurred ? (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/40 text-[13px] font-bold font-poppins text-ink-soft blur-[3.5px]">
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      ) : (
        <Link
          to={`/experts/${slugify(expert.displayName)}${profileBrowseSuffix}`}
          className="flex items-center justify-between px-5 py-3.5 border-t border-border/40 text-[13px] font-bold font-poppins text-ink-soft group-hover:text-primary group-hover:bg-primary/3 transition-all duration-200"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
};

export default ExpertDiscovery;
