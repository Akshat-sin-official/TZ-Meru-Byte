// SEO Routes for Static Site Generation
// Note: vite-plugin-ssg is installed but RouteRecordRaw type doesn't exist in v0.1.0
// Using custom type definition instead
type RouteRecordRaw = {
  path: string;
  component: () => Promise<any>;
  meta?: {
    title?: string;
    description?: string;
  };
};

// Lazy load SEO pages
const BrandingExperts = () => import('./pages/seo/BrandingExperts');
const StrategyConsultants = () => import('./pages/seo/StrategyConsultants');
const AdvertisingExperts = () => import('./pages/seo/AdvertisingExperts');
const CollateralDesigners = () => import('./pages/seo/CollateralDesigners');

// Filter pages
const VisualIdentityDesign = () => import('./pages/seo/filters/VisualIdentityDesign');
const SearchAdvertising = () => import('./pages/seo/filters/SearchAdvertising');
const GoToMarket = () => import('./pages/seo/filters/GoToMarket');
const PitchDeckDesign = () => import('./pages/seo/filters/PitchDeckDesign');
const EmployerBranding = () => import('./pages/seo/filters/EmployerBranding');
const SocialMediaAdvertising = () => import('./pages/seo/filters/SocialMediaAdvertising');

export const seoRoutes: RouteRecordRaw[] = [
  {
    path: '/branding-experts-mumbai',
    component: BrandingExperts,
    meta: {
      title: 'Hire Verified Branding Experts in Mumbai | MarTechAdda',
      description: 'Find verified branding experts in Mumbai for brand strategy, visual identity, employer branding and more. Direct access to specialists.',
    },
  },
  {
    path: '/marketing-strategy-consultants-mumbai',
    component: StrategyConsultants,
    meta: {
      title: 'Marketing Strategy Consultants in Mumbai | MarTechAdda',
      description: 'Connect with strategic marketing consultants in Mumbai for growth strategy, funnel planning, go-to-market strategy and CRM planning.',
    },
  },
  {
    path: '/advertising-experts-mumbai',
    component: AdvertisingExperts,
    meta: {
      title: 'Advertising Experts in Mumbai | MarTechAdda',
      description: 'Discover advertising experts in Mumbai for search, social, video, outdoor, influencer and experiential campaigns.',
    },
  },
  {
    path: '/marketing-collateral-designers-mumbai',
    component: CollateralDesigners,
    meta: {
      title: 'Marketing Collateral Designers in Mumbai | MarTechAdda',
      description: 'Find marketing collateral designers in Mumbai for websites, landing pages, pitch decks, brochures and sales assets.',
    },
  },
  // Primary Filter Pages
  {
    path: '/branding/visual-identity-design-mumbai',
    component: VisualIdentityDesign,
    meta: {
      title: 'Visual Identity Design Experts in Mumbai | MarTechAdda',
      description: 'Hire visual identity and brand identity designers in Mumbai for logos, design systems and brand guidelines.',
    },
  },
  {
    path: '/advertising/search-advertising-mumbai',
    component: SearchAdvertising,
    meta: {
      title: 'Search Advertising & PPC Experts in Mumbai | MarTechAdda',
      description: 'Connect with search advertising and Google Ads experts in Mumbai for PPC campaigns and performance marketing.',
    },
  },
  {
    path: '/strategy/go-to-market-mumbai',
    component: GoToMarket,
    meta: {
      title: 'Go-to-Market Strategy Consultants in Mumbai | MarTechAdda',
      description: 'Find go-to-market and product launch strategy consultants in Mumbai for market entry and growth planning.',
    },
  },
  {
    path: '/collateral/pitch-deck-design-mumbai',
    component: PitchDeckDesign,
    meta: {
      title: 'Pitch Deck Designers in Mumbai | MarTechAdda',
      description: 'Hire pitch deck and investor presentation designers in Mumbai for fundraising and sales presentations.',
    },
  },
  {
    path: '/branding/employer-branding-mumbai',
    component: EmployerBranding,
    meta: {
      title: 'Employer Branding Consultants in Mumbai | MarTechAdda',
      description: 'Find employer branding and EVP development experts in Mumbai for talent attraction and retention strategies.',
    },
  },
  {
    path: '/advertising/social-media-advertising-mumbai',
    component: SocialMediaAdvertising,
    meta: {
      title: 'Social Media Advertising Experts in Mumbai | MarTechAdda',
      description: 'Connect with social media advertising specialists in Mumbai for Facebook, Instagram, LinkedIn and Twitter campaigns.',
    },
  },
];
