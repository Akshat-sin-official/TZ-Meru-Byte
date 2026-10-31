/**
 * MASTER TAXONOMY DATA (Frontend)
 * 
 * Production-ready taxonomy structure strictly based on prompt.md specifications.
 * Mirrors server/src/data/taxonomy.ts
 * 
 * Structure:
 * - PHASE 1: WHAT THEY NEED (Service Heads → Primary Filters → Sub-Filters)
 * - PHASE 2: CONTEXT & INTENT REFINEMENT (Industry, Business Type, Engagement, etc.)
 */

// ============================================================================
// PHASE 1 — CORE SERVICE TAXONOMY (WHAT THEY NEED)
// ============================================================================

/**
 * STEP 1 — Service Heads (Top-Level Entry Point)
 * Only ONE Service Head can be selected at a time.
 */
export const SERVICE_HEADS = [
  'Branding Services',
  'Strategic Marketing Services',
  'Advertising Services',
  'Marketing Collateral Services',
] as const;

export type ServiceHead = typeof SERVICE_HEADS[number];

/**
 * STEP 2 — Primary Filters (Outcome Buckets)
 * Strategic outcome categories, not execution.
 */

// Branding Services → Primary Filters (8 total)
export const BRANDING_PRIMARY_FILTERS = [
  'Brand Strategy & Foundations',
  'Brand Audit & Research',
  'Go-to-Market & Launch Strategy',
  'Visual Identity Design',
  'Verbal Identity & Messaging',
  'Brand Experience & Touchpoints',
  'Employer Branding',
  'Personal Branding',
] as const;

// Strategic Marketing Services → Primary Filters (6 total)
export const STRATEGIC_MARKETING_PRIMARY_FILTERS = [
  'Research & Market Intelligence',
  'Funnel & Growth Strategy',
  'Campaign & Go-to-Market Strategy',
  'Channel & Media Strategy',
  'Content & Experience Strategy',
  'CRM & Relationship Strategy',
] as const;

// Advertising Services → Primary Filters (12 total)
export const ADVERTISING_PRIMARY_FILTERS = [
  'Search Advertising',
  'Display & Programmatic Advertising',
  'Social Media Advertising',
  'Video & Rich Media Advertising',
  'Print Advertising',
  'Broadcast Advertising',
  'Outdoor & Transit Advertising',
  'Experiential & Activation Advertising',
  'Guerrilla Advertising',
  'Influencer & Native Advertising',
  'Aerial Advertising',
  'Aqua & Marine Advertising',
] as const;

// Marketing Collateral Services → Primary Filters (13 total)
export const COLLATERAL_PRIMARY_FILTERS = [
  'Website & Conversion Collateral',
  'Email Marketing Collateral',
  'Social Media Visual Collateral',
  'Long-Form Digital Collateral',
  'Print Marketing Collateral',
  'Business Identity Collateral',
  'Catalog & Listing Collateral',
  'Presentation & Pitch Collateral',
  'Event & Trade Show Collateral',
  'Promotional & Merchandise Collateral',
  'Testimonials & Case Study Collateral',
  'Signage & Environmental Graphics',
  'Print Production & Large Format Graphics',
] as const;

/**
 * STEP 3 — Sub-Filters (Multi-Select, Granular Needs)
 * Each Primary Filter expands into Sub-Filters.
 * Every Primary Filter MUST include "Custom Scope" for edge cases.
 */

// Branding Services → Brand Strategy & Foundations → Sub-Filters
export const BRAND_STRATEGY_FOUNDATIONS_SUB_FILTERS = [
  'Brand Positioning',
  'Brand Architecture',
  'Brand Purpose & Values',
  'Naming & Tagline Development',
  'Custom Scope',
] as const;

// Branding Services → Brand Audit & Research → Sub-Filters
export const BRAND_AUDIT_RESEARCH_SUB_FILTERS = [
  'Competitive Analysis',
  'Consumer Insights',
  'Market Research Reports',
  'Custom Scope',
] as const;

// Branding Services → Go-to-Market & Launch Strategy → Sub-Filters
export const GTM_LAUNCH_STRATEGY_SUB_FILTERS = [
  'Brand Launch Planning',
  'Market Entry Positioning',
  'Rollout Campaign Strategy',
  'Custom Scope',
] as const;

// Branding Services → Visual Identity Design → Sub-Filters
export const VISUAL_IDENTITY_DESIGN_SUB_FILTERS = [
  'Logo & Icon Design',
  'Color System',
  'Brand Style Guides',
  'Motion Branding (Animated Logos, Brand Motion)',
  'Custom Scope',
] as const;

// Branding Services → Verbal Identity & Messaging → Sub-Filters
export const VERBAL_IDENTITY_MESSAGING_SUB_FILTERS = [
  'Tone of Voice Definition',
  'Messaging Frameworks',
  'Brand Storytelling & Narrative',
  'Custom Scope',
] as const;

// Branding Services → Brand Experience & Touchpoints → Sub-Filters
export const BRAND_EXPERIENCE_TOUCHPOINTS_SUB_FILTERS = [
  'Packaging & Product Presentation',
  'Digital Brand Assets (UI/UX, App Interfaces)',
  'Retail & Environmental Branding',
  'Custom Scope',
] as const;

// Branding Services → Employer Branding → Sub-Filters
export const EMPLOYER_BRANDING_SUB_FILTERS = [
  'Employer Value Proposition (EVP)',
  'Internal Brand Communication',
  'Employer Branding Campaigns',
  'Custom Scope',
] as const;

// Branding Services → Personal Branding → Sub-Filters
export const PERSONAL_BRANDING_SUB_FILTERS = [
  'Executive & Founder Branding',
  'Creator & Influencer Branding',
  'Personal Brand Collateral (CVs, Pitch Decks, Portfolios)',
  'Custom Scope',
] as const;

// Strategic Marketing Services → Research & Market Intelligence → Sub-Filters
export const RESEARCH_MARKET_INTELLIGENCE_SUB_FILTERS = [
  'Consumer & Customer Research',
  'Competitive & Category Analysis',
  'Market & Trend Forecasting',
  'Data & Insight Frameworks',
  'Custom Scope',
] as const;

// Strategic Marketing Services → Funnel & Growth Strategy → Sub-Filters
export const FUNNEL_GROWTH_STRATEGY_SUB_FILTERS = [
  'Awareness Strategy',
  'Consideration Strategy',
  'Conversion Strategy',
  'Retention & Loyalty Strategy',
  'Advocacy & Referral Strategy',
  'Custom Scope',
] as const;

// Strategic Marketing Services → Campaign & Go-to-Market Strategy → Sub-Filters
export const CAMPAIGN_GTM_STRATEGY_SUB_FILTERS = [
  'Product / Brand Launch Strategy',
  'Seasonal & Promotional Campaigns',
  'Engagement & Loyalty Campaigns',
  'Crisis & Reputation Strategy',
  'Integrated Campaign Planning',
  'Custom Scope',
] as const;

// Strategic Marketing Services → Channel & Media Strategy → Sub-Filters
export const CHANNEL_MEDIA_STRATEGY_SUB_FILTERS = [
  'Owned Media Strategy',
  'Paid Media Strategy',
  'Earned Media Strategy',
  'Shared / Community Channels',
  'Cross-Channel Planning',
  'Custom Scope',
] as const;

// Strategic Marketing Services → Content & Experience Strategy → Sub-Filters
export const CONTENT_EXPERIENCE_STRATEGY_SUB_FILTERS = [
  'Content Architecture & Editorial Planning',
  'SEO & Discovery Strategy',
  'Social Content Mapping',
  'Influencer & Creator Strategy',
  'Personalization & Experience Design',
  'Custom Scope',
] as const;

// Strategic Marketing Services → CRM & Relationship Strategy → Sub-Filters
export const CRM_RELATIONSHIP_STRATEGY_SUB_FILTERS = [
  'Customer Segmentation Frameworks',
  'Lead Nurturing Strategy',
  'Lifecycle Communication Planning',
  'Churn Prevention Strategy',
  'Loyalty & Advocacy Programs',
  'Custom Scope',
] as const;

// Advertising Services → Search Advertising → Sub-Filters
export const SEARCH_ADVERTISING_SUB_FILTERS = [
  'Search Engine Marketing (SEM)',
  'Pay-Per-Click (PPC)',
  'Branded Search Campaigns',
  'Non-Branded Search Campaigns',
  'Custom Scope',
] as const;

// Advertising Services → Display & Programmatic Advertising → Sub-Filters
export const DISPLAY_PROGRAMMATIC_ADVERTISING_SUB_FILTERS = [
  'Banner Display Ads',
  'Programmatic Display Networks',
  'Dynamic Remarketing',
  'Cross-Channel Remarketing',
  'Custom Scope',
] as const;

// Advertising Services → Social Media Advertising → Sub-Filters
export const SOCIAL_MEDIA_ADVERTISING_SUB_FILTERS = [
  'Facebook & Instagram Ads',
  'LinkedIn Ads',
  'Twitter / X Ads',
  'TikTok Ads',
  'Snapchat Ads',
  'Other Social Platforms',
  'Custom Scope',
] as const;

// Advertising Services → Video & Rich Media Advertising → Sub-Filters
export const VIDEO_RICH_MEDIA_ADVERTISING_SUB_FILTERS = [
  'YouTube & Video Platforms',
  'OTT / CTV Advertising',
  'Pre-Roll / Mid-Roll / Post-Roll Ads',
  'In-App Video Ads',
  'Interactive / Rich Media Ads',
  'Custom Scope',
] as const;

// Advertising Services → Print Advertising → Sub-Filters
export const PRINT_ADVERTISING_SUB_FILTERS = [
  'Newspaper Advertising',
  'Magazine Advertising',
  'Direct Mail Campaigns',
  'Custom Scope',
] as const;

// Advertising Services → Broadcast Advertising → Sub-Filters
export const BROADCAST_ADVERTISING_SUB_FILTERS = [
  'Television Advertising',
  'Radio Advertising',
  'Custom Scope',
] as const;

// Advertising Services → Outdoor & Transit Advertising → Sub-Filters
export const OUTDOOR_TRANSIT_ADVERTISING_SUB_FILTERS = [
  'Billboards & Hoardings',
  'Transit Advertising',
  'Street Furniture & Outdoor Media',
  'Custom Scope',
] as const;

// Advertising Services → Experiential & Activation Advertising → Sub-Filters
export const EXPERIENTIAL_ACTIVATION_ADVERTISING_SUB_FILTERS = [
  'Event Activations',
  'Pop-Ups & Brand Experiences',
  'AR / VR Experiences',
  'Virtual & Hybrid Events',
  'Custom Scope',
] as const;

// Advertising Services → Guerrilla Advertising → Sub-Filters
export const GUERRILLA_ADVERTISING_SUB_FILTERS = [
  'Sampling Campaigns',
  'Flash Mobs & Stunts',
  'Unconventional Brand Experiences',
  'Custom Scope',
] as const;

// Advertising Services → Influencer & Native Advertising → Sub-Filters
export const INFLUENCER_NATIVE_ADVERTISING_SUB_FILTERS = [
  'Influencer Collaborations',
  'Micro-Influencer Campaigns',
  'Sponsored Content',
  'Affiliate Marketing',
  'Native Placements',
  'Custom Scope',
] as const;

// Advertising Services → Aerial Advertising → Sub-Filters
export const AERIAL_ADVERTISING_SUB_FILTERS = [
  'Drone Shows & Light Displays',
  'Skywriting & Airborne Banners',
  'Aerial Brand Stunts',
  'Custom Scope',
] as const;

// Advertising Services → Aqua & Marine Advertising → Sub-Filters
export const AQUA_MARINE_ADVERTISING_SUB_FILTERS = [
  'Boat Wraps & Marine Branding',
  'Floating Billboards',
  'Water-Based Brand Experiences',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Website & Conversion Collateral → Sub-Filters
export const WEBSITE_CONVERSION_COLLATERAL_SUB_FILTERS = [
  'Microsites',
  'Campaign Landing Pages',
  'Conversion-Optimized Pages',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Email Marketing Collateral → Sub-Filters
export const EMAIL_MARKETING_COLLATERAL_SUB_FILTERS = [
  'Newsletter Templates',
  'Drip / Automation Templates',
  'Branded Email Designs',
  'Campaign Email Layouts',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Social Media Visual Collateral → Sub-Filters
export const SOCIAL_MEDIA_VISUAL_COLLATERAL_SUB_FILTERS = [
  'Post & Feed Graphics',
  'Story & Reel Templates',
  'Banner & Cover Designs',
  'Profile Visuals',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Long-Form Digital Collateral → Sub-Filters
export const LONG_FORM_DIGITAL_COLLATERAL_SUB_FILTERS = [
  'E-Books & Guides',
  'White Papers & Reports',
  'Research Documents',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Print Marketing Collateral → Sub-Filters
export const PRINT_MARKETING_COLLATERAL_SUB_FILTERS = [
  'Flyers & Leaflets',
  'Product Brochures',
  'Posters & Print Ads',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Business Identity Collateral → Sub-Filters
export const BUSINESS_IDENTITY_COLLATERAL_SUB_FILTERS = [
  'Business Cards',
  'Letterheads & Stationery',
  'Corporate Templates',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Catalog & Listing Collateral → Sub-Filters
export const CATALOG_LISTING_COLLATERAL_SUB_FILTERS = [
  'Print Catalogs',
  'Digital Catalogs',
  'Interactive Catalogs',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Presentation & Pitch Collateral → Sub-Filters
export const PRESENTATION_PITCH_COLLATERAL_SUB_FILTERS = [
  'Pitch Decks',
  'Sales Presentations',
  'Investor Presentations',
  'Product Demo Decks',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Event & Trade Show Collateral → Sub-Filters
export const EVENT_TRADE_SHOW_COLLATERAL_SUB_FILTERS = [
  'Booth & Stall Designs',
  'Pop-Up Displays',
  'Event Branding Materials',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Promotional & Merchandise Collateral → Sub-Filters
export const PROMOTIONAL_MERCHANDISE_COLLATERAL_SUB_FILTERS = [
  'Branded Merchandise',
  'Corporate Gifting',
  'Event Giveaways',
  'Eco-Friendly Merchandise',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Testimonials & Case Study Collateral → Sub-Filters
export const TESTIMONIALS_CASE_STUDY_COLLATERAL_SUB_FILTERS = [
  'Written Case Studies',
  'Visual Case Studies',
  'Video Testimonials',
  'Customer Reviews',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Signage & Environmental Graphics → Sub-Filters
export const SIGNAGE_ENVIRONMENTAL_GRAPHICS_SUB_FILTERS = [
  'Store Branding',
  'Corporate & Office Signage',
  'Retail Signage',
  'Wayfinding Systems',
  'Environmental Branding',
  'Event & Exhibition Signage',
  'Outdoor Signage',
  'Digital Signage',
  'Vehicle Branding',
  'Signage Fabrication & Installation',
  'Custom Signage Solutions',
  'Custom Scope',
] as const;

// Marketing Collateral Services → Print Production & Large Format Graphics → Sub-Filters
export const PRINT_PRODUCTION_LARGE_FORMAT_SUB_FILTERS = [
  'Retail Graphics Printing',
  'Office & Corporate Graphics Printing',
  'Large Format Printing',
  'Fabric & Textile Printing',
  'Exhibition & Event Graphics Printing',
  'Wallpaper & Interior Graphics',
  'Window & Glass Graphics',
  'Custom Print Production',
  'Custom Scope',
] as const;

/**
 * Complete mapping of Primary Filters to Sub-Filters
 * This structure allows easy lookup and validation
 */
export const PRIMARY_TO_SUB_FILTERS: Record<string, readonly string[]> = {
  // Branding Services
  'Brand Strategy & Foundations': BRAND_STRATEGY_FOUNDATIONS_SUB_FILTERS,
  'Brand Audit & Research': BRAND_AUDIT_RESEARCH_SUB_FILTERS,
  'Go-to-Market & Launch Strategy': GTM_LAUNCH_STRATEGY_SUB_FILTERS,
  'Visual Identity Design': VISUAL_IDENTITY_DESIGN_SUB_FILTERS,
  'Verbal Identity & Messaging': VERBAL_IDENTITY_MESSAGING_SUB_FILTERS,
  'Brand Experience & Touchpoints': BRAND_EXPERIENCE_TOUCHPOINTS_SUB_FILTERS,
  'Employer Branding': EMPLOYER_BRANDING_SUB_FILTERS,
  'Personal Branding': PERSONAL_BRANDING_SUB_FILTERS,

  // Strategic Marketing Services
  'Research & Market Intelligence': RESEARCH_MARKET_INTELLIGENCE_SUB_FILTERS,
  'Funnel & Growth Strategy': FUNNEL_GROWTH_STRATEGY_SUB_FILTERS,
  'Campaign & Go-to-Market Strategy': CAMPAIGN_GTM_STRATEGY_SUB_FILTERS,
  'Channel & Media Strategy': CHANNEL_MEDIA_STRATEGY_SUB_FILTERS,
  'Content & Experience Strategy': CONTENT_EXPERIENCE_STRATEGY_SUB_FILTERS,
  'CRM & Relationship Strategy': CRM_RELATIONSHIP_STRATEGY_SUB_FILTERS,

  // Advertising Services
  'Search Advertising': SEARCH_ADVERTISING_SUB_FILTERS,
  'Display & Programmatic Advertising': DISPLAY_PROGRAMMATIC_ADVERTISING_SUB_FILTERS,
  'Social Media Advertising': SOCIAL_MEDIA_ADVERTISING_SUB_FILTERS,
  'Video & Rich Media Advertising': VIDEO_RICH_MEDIA_ADVERTISING_SUB_FILTERS,
  'Print Advertising': PRINT_ADVERTISING_SUB_FILTERS,
  'Broadcast Advertising': BROADCAST_ADVERTISING_SUB_FILTERS,
  'Outdoor & Transit Advertising': OUTDOOR_TRANSIT_ADVERTISING_SUB_FILTERS,
  'Experiential & Activation Advertising': EXPERIENTIAL_ACTIVATION_ADVERTISING_SUB_FILTERS,
  'Guerrilla Advertising': GUERRILLA_ADVERTISING_SUB_FILTERS,
  'Influencer & Native Advertising': INFLUENCER_NATIVE_ADVERTISING_SUB_FILTERS,
  'Aerial Advertising': AERIAL_ADVERTISING_SUB_FILTERS,
  'Aqua & Marine Advertising': AQUA_MARINE_ADVERTISING_SUB_FILTERS,

  // Marketing Collateral Services
  'Website & Conversion Collateral': WEBSITE_CONVERSION_COLLATERAL_SUB_FILTERS,
  'Email Marketing Collateral': EMAIL_MARKETING_COLLATERAL_SUB_FILTERS,
  'Social Media Visual Collateral': SOCIAL_MEDIA_VISUAL_COLLATERAL_SUB_FILTERS,
  'Long-Form Digital Collateral': LONG_FORM_DIGITAL_COLLATERAL_SUB_FILTERS,
  'Print Marketing Collateral': PRINT_MARKETING_COLLATERAL_SUB_FILTERS,
  'Business Identity Collateral': BUSINESS_IDENTITY_COLLATERAL_SUB_FILTERS,
  'Catalog & Listing Collateral': CATALOG_LISTING_COLLATERAL_SUB_FILTERS,
  'Presentation & Pitch Collateral': PRESENTATION_PITCH_COLLATERAL_SUB_FILTERS,
  'Event & Trade Show Collateral': EVENT_TRADE_SHOW_COLLATERAL_SUB_FILTERS,
  'Promotional & Merchandise Collateral': PROMOTIONAL_MERCHANDISE_COLLATERAL_SUB_FILTERS,
  'Testimonials & Case Study Collateral': TESTIMONIALS_CASE_STUDY_COLLATERAL_SUB_FILTERS,
  'Signage & Environmental Graphics': SIGNAGE_ENVIRONMENTAL_GRAPHICS_SUB_FILTERS,
  'Print Production & Large Format Graphics': PRINT_PRODUCTION_LARGE_FORMAT_SUB_FILTERS,
};

/**
 * Service Head to Primary Filters mapping
 */
export const SERVICE_HEAD_TO_PRIMARY_FILTERS: Record<ServiceHead, readonly string[]> = {
  'Branding Services': BRANDING_PRIMARY_FILTERS,
  'Strategic Marketing Services': STRATEGIC_MARKETING_PRIMARY_FILTERS,
  'Advertising Services': ADVERTISING_PRIMARY_FILTERS,
  'Marketing Collateral Services': COLLATERAL_PRIMARY_FILTERS,
};

// ============================================================================
// PHASE 2 — INTENT REFINEMENT (WHO, CONTEXT & DELIVERY)
// ============================================================================

/**
 * STEP 4 — Industry Sector Classification
 * Single Select
 */
export const INDUSTRY_SECTORS = [
  'Agriculture & Natural Resources',
  'Manufacturing & Industrial',
  'Financial Services',
  'Healthcare',
  'Wellness & Fitness',
  'Education',
  'Hospitality & Tourism',
  'Transportation & Logistics',
  'Retail & Commerce',
  'Media & Entertainment',
  'Real Estate',
  'Legal & Compliance',
  'Food & Beverage',
  'Events & Experiences',
  'Professional Services',
  'Technology',
  'Consulting & Advisory',
  'Government & Public Sector',
  'Non-Profit & Social Sector',
] as const;

export type IndustrySector = typeof INDUSTRY_SECTORS[number];

/**
 * STEP 4 — Industry Sub-Sectors
 * Multi-Select
 */

// Primary Sector Sub-Sectors
export const AGRICULTURE_SUB_SECTORS = [
  'Agriculture & Farming',
  'Animal Husbandry & Dairy',
  'Fisheries & Aquaculture',
  'Forestry & Timber',
  'Mining & Minerals',
  'Organic & Sustainable Farming',
  'Other',
] as const;

export const MANUFACTURING_SUB_SECTORS = [
  'Manufacturing',
  'Construction & Infrastructure',
  'Energy & Utilities',
  'Chemicals & Refining',
  'Textiles & Apparel',
  'Automotive & Machinery',
  'Electronics & Hardware',
  'Packaging & Industrial Design',
  'Waste Management & Recycling',
  'Other',
] as const;

export const FINANCIAL_SERVICES_SUB_SECTORS = [
  'Banking',
  'Insurance',
  'Investment & Wealth Management',
  'FinTech',
  'Accounting & Tax Services',
  'Financial Advisory',
  'Other',
] as const;

export const HEALTHCARE_SUB_SECTORS = [
  'Hospitals',
  'Clinics',
  'Diagnostic Centres',
  'Dental Clinics',
  'Pharmaceuticals',
  'Medical Devices',
  'Healthcare Technology',
  'Veterinary Services',
  'Other',
] as const;

export const WELLNESS_FITNESS_SUB_SECTORS = [
  'Gyms & Fitness Centres',
  'Yoga Studios',
  'Personal Fitness',
  'Nutrition & Wellness',
  'Mental Wellness',
  'Wellness Brands',
  'Other',
] as const;

export const EDUCATION_SUB_SECTORS = [
  'Schools',
  'Colleges & Universities',
  'Coaching Institutes',
  'EdTech',
  'Corporate Training',
  'Vocational Training',
  'Skill Development',
  'Other',
] as const;

export const HOSPITALITY_TOURISM_SUB_SECTORS = [
  'Hotels & Resorts',
  'Restaurants & Cafés',
  'Quick Service Restaurants (QSR)',
  'Travel Agencies',
  'Tourism Operators',
  'Homestays & Vacation Rentals',
  'Other',
] as const;

export const TRANSPORTATION_LOGISTICS_SUB_SECTORS = [
  'Freight & Cargo',
  'Warehousing',
  'Shipping & Distribution',
  'Last-Mile Delivery',
  'Logistics Technology',
  'Other',
] as const;

export const RETAIL_COMMERCE_SUB_SECTORS = [
  'Retail Stores',
  'E-Commerce',
  'Wholesale',
  'Direct-to-Consumer (D2C)',
  'Marketplace Sellers',
  'Consumer Goods',
  'Fashion & Lifestyle',
  'Consumer Electronics',
  'Other',
] as const;

export const MEDIA_ENTERTAINMENT_SUB_SECTORS = [
  'Publishing',
  'Production Houses',
  'Broadcasting',
  'Music & Audio',
  'Gaming',
  'Digital Media',
  'Other',
] as const;

export const REAL_ESTATE_SUB_SECTORS = [
  'Residential Real Estate',
  'Commercial Real Estate',
  'Property Management',
  'Real Estate Advisory',
  'Construction Projects',
  'Other',
] as const;

export const LEGAL_COMPLIANCE_SUB_SECTORS = [
  'Law Firms',
  'Company Secretarial',
  'Compliance Advisory',
  'Tax & Regulatory',
  'Intellectual Property',
  'Other',
] as const;

export const FOOD_BEVERAGE_SUB_SECTORS = [
  'Food Manufacturing',
  'Packaged Foods',
  'Beverage Companies',
  'Restaurants & Cafés',
  'Cloud Kitchens',
  'Food Retail',
  'Other',
] as const;

export const EVENTS_EXPERIENCES_SUB_SECTORS = [
  'Event Management',
  'Corporate Events',
  'Exhibitions & Trade Shows',
  'Weddings & Social Events',
  'Concerts & Live Shows',
  'Sports Events',
  'Other',
] as const;

export const PROFESSIONAL_SERVICES_SUB_SECTORS = [
  'Human Resources',
  'Recruitment',
  'Accounting Services',
  'Administrative Services',
  'Business Support Services',
  'Corporate Services',
  'Other',
] as const;

export const TECHNOLOGY_SUB_SECTORS = [
  'SaaS',
  'Software Products',
  'IT Services',
  'Artificial Intelligence (AI)',
  'Data & Analytics',
  'Cloud & Infrastructure',
  'Cybersecurity',
  'Hardware & IoT',
  'Other',
] as const;

export const CONSULTING_ADVISORY_SUB_SECTORS = [
  'Management Consulting',
  'Business Advisory',
  'Research & Innovation',
  'BPO / KPO',
  'Specialized Consulting',
  'Other',
] as const;

export const GOVERNMENT_PUBLIC_SUB_SECTORS = [
  'Government Departments',
  'Public Enterprises',
  'Municipal Bodies',
  'Development Authorities',
  'Public Programs & Missions',
  'Other',
] as const;

export const NON_PROFIT_SOCIAL_SUB_SECTORS = [
  'Non-Governmental Organizations (NGOs)',
  'Charitable Organizations',
  'Foundations',
  'Associations & Societies',
  'Social Enterprises',
  'Community Organizations',
  'Other',
] as const;

// Aliases for legacy backward compatibility
export const PRIMARY_SUB_SECTORS = AGRICULTURE_SUB_SECTORS;
export const SECONDARY_SUB_SECTORS = MANUFACTURING_SUB_SECTORS;
export const TERTIARY_SUB_SECTORS = FINANCIAL_SERVICES_SUB_SECTORS;
export const QUATERNARY_SUB_SECTORS = TECHNOLOGY_SUB_SECTORS;

/**
 * Industry Sector to Sub-Sectors mapping
 */
export const INDUSTRY_SECTOR_TO_SUB_SECTORS: Record<string, readonly string[]> = {
  'Agriculture & Natural Resources': AGRICULTURE_SUB_SECTORS,
  'Manufacturing & Industrial': MANUFACTURING_SUB_SECTORS,
  'Financial Services': FINANCIAL_SERVICES_SUB_SECTORS,
  'Healthcare': HEALTHCARE_SUB_SECTORS,
  'Wellness & Fitness': WELLNESS_FITNESS_SUB_SECTORS,
  'Education': EDUCATION_SUB_SECTORS,
  'Hospitality & Tourism': HOSPITALITY_TOURISM_SUB_SECTORS,
  'Transportation & Logistics': TRANSPORTATION_LOGISTICS_SUB_SECTORS,
  'Retail & Commerce': RETAIL_COMMERCE_SUB_SECTORS,
  'Media & Entertainment': MEDIA_ENTERTAINMENT_SUB_SECTORS,
  'Real Estate': REAL_ESTATE_SUB_SECTORS,
  'Legal & Compliance': LEGAL_COMPLIANCE_SUB_SECTORS,
  'Food & Beverage': FOOD_BEVERAGE_SUB_SECTORS,
  'Events & Experiences': EVENTS_EXPERIENCES_SUB_SECTORS,
  'Professional Services': PROFESSIONAL_SERVICES_SUB_SECTORS,
  'Technology': TECHNOLOGY_SUB_SECTORS,
  'Consulting & Advisory': CONSULTING_ADVISORY_SUB_SECTORS,
  'Government & Public Sector': GOVERNMENT_PUBLIC_SUB_SECTORS,
  'Non-Profit & Social Sector': NON_PROFIT_SOCIAL_SUB_SECTORS,
};

/**
 * STEP 5 — Who They Serve (Business Relationship Type)
 * Multi-Select
 */
export const BUSINESS_RELATIONSHIP_TYPES = [
  'B2B',
  'B2B2C',
  'B2C',
  'B2C2B',
  'B2G',
  'C2B',
  'C2C',
  'D2C',
  'G2B',
  'G2C',
] as const;

/**
 * STEP 6 — Business Context (Client Type)
 */

// Business Type (Multi-Select)
export const BUSINESS_TYPES = [
  'Distributor',
  'Factory',
  'Manufacturer',
  'Reseller',
  'Retailer',
  'Services',
  'Wholesaler',
  'Outlet',
  'Other',
] as const;

// Business Size / Stage (Multi-Select)
export const BUSINESS_SIZES = [
  'Startups',
  'Small & Medium Businesses',
  'Enterprises',
  'Global',
  'Other',
] as const;

/**
 * STEP 6 — Engagement Model
 * Multi-Select
 */
export const ENGAGEMENT_MODELS = [
  'One-Time Projects',
  'Ongoing Engagements',
  'Outsourcing',
  'Specialized Support',
  'To Be Discussed',
] as const;

/**
 * STEP 7 — How They Work (Operational Model)
 * Multi-Select
 */
export const OPERATIONAL_MODELS = [
  'Remote',
  'On-site',
  'Hybrid',
  'To be discussed',
] as const;

/**
 * STEP 8 — Pricing Style
 * Multi-Select
 */
export const PRICING_STYLES = [
  'Fixed',
  'Hourly',
  'Subscription',
  'Tiered',
  'To Be Discussed',
] as const;

/**
 * STEP 9 — Turnaround Time Expectation
 * Single or Multi-Select (Platform Decision)
 */
export const TURNAROUND_TIMES = [
  'Standard (7+ days)',
  'Fast-track (3–6 days)',
  'Urgent (1–2 days)',
  'To Be Discussed',
] as const;

// ============================================================================
// BACKWARD COMPATIBILITY & LEGACY SUPPORT
// ============================================================================

/**
 * Legacy: Core service categories (for backward compatibility)
 * Maps to Service Heads
 */
export const CORE_SERVICE_CATEGORIES = SERVICE_HEADS as readonly string[];

/**
 * Legacy: Sub-services mapping (for backward compatibility)
 * This is now handled by PRIMARY_TO_SUB_FILTERS
 */
export const SUB_SERVICES: Record<string, string[]> = {
  'Branding Services': [...BRANDING_PRIMARY_FILTERS] as string[],
  'Strategic Marketing Services': [...STRATEGIC_MARKETING_PRIMARY_FILTERS] as string[],
  'Advertising Services': [...ADVERTISING_PRIMARY_FILTERS] as string[],
  'Marketing Collateral Services': [...COLLATERAL_PRIMARY_FILTERS] as string[],
};

/**
 * Legacy: Sub-industries mapping (for backward compatibility)
 */
export const SUB_INDUSTRIES: Record<string, string[]> = {
  'Primary': [...PRIMARY_SUB_SECTORS] as string[],
  'Secondary': [...SECONDARY_SUB_SECTORS] as string[],
  'Tertiary': [...TERTIARY_SUB_SECTORS] as string[],
  'Quaternary': [...QUATERNARY_SUB_SECTORS] as string[],
};

/**
 * Legacy: Business types served (for backward compatibility)
 */
export const BUSINESS_TYPES_SERVED = BUSINESS_TYPES as readonly string[];

/**
 * Legacy: Client engagement types (for backward compatibility)
 */
export const CLIENT_ENGAGEMENT_TYPES = BUSINESS_RELATIONSHIP_TYPES as readonly string[];

/**
 * Legacy: Client scales (for backward compatibility)
 */
export const CLIENT_SCALES = BUSINESS_SIZES as readonly string[];

/**
 * Legacy: Delivery channels (for backward compatibility)
 */
export const DELIVERY_CHANNELS = OPERATIONAL_MODELS as readonly string[];

/**
 * Legacy: Preferred delivery speed (for backward compatibility)
 */
export const PREFERRED_DELIVERY_SPEED = TURNAROUND_TIMES as readonly string[];

// ============================================================================
// ADDITIONAL CONSTANTS (Not in taxonomy but used in system)
// ============================================================================

// Languages
export const LANGUAGES = [
  'Hindi',
  'English',
  'Marathi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Punjabi',
  'Urdu',
] as const;

// Indian states
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export const MUMBAI_REGIONS = [
  'Mumbai',
  'Navi Mumbai',
  'Thane',
  'Raigad',
] as const;

// Sub-entity types
export const SUB_ENTITY_TYPES = [
  'Independent Consultant',
  'Small Team / Boutique Agency',
  'Growth Agency / Specialist Firm',
] as const;

// Experience ranges
export const EXPERIENCE_RANGES = [
  { label: 'Early-stage professionals (0–3 years)', min: 0, max: 3 },
  { label: 'Experienced professionals (3–7 years)', min: 3, max: 7 },
  { label: 'Senior professionals (7+ years)', min: 7, max: 100 },
] as const;
