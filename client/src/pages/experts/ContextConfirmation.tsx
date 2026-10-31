/**
 * Context Confirmation Screen
 * 
 * Shows before connecting with an expert to confirm context and role
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { searchService } from '@/services/searchService';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Edit2, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  MUMBAI_REGIONS, 
  SERVICE_HEADS, 
  SERVICE_HEAD_TO_PRIMARY_FILTERS, 
  PRIMARY_TO_SUB_FILTERS,
  BUSINESS_SIZES,
  INDUSTRY_SECTORS,
  ENGAGEMENT_MODELS,
  ServiceHead
} from '@/data/taxonomy';

const ROLES = [
  { value: 'founder', label: 'Founder' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'marketing_head', label: 'Marketing Head' },
  { value: 'team_member', label: 'Team Member' },
  { value: 'other', label: 'Other' },
];

const ContextConfirmation = () => {
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [activeTab, setActiveTab] = useState('service');
  
  // Re-structured state for better management
  const [discussionContext, setDiscussionContext] = useState({
    serviceCategory: '',
    focusArea: '',
    specificNeeds: '',
    industrySector: '',
    location: '',
    businessStage: 'Startup',
    engagementModel: '',
  });

  // Get service category from URL params or sessionStorage
  const categoryFromUrl = searchParams.get('category') || '';

  // Load discussion context from sessionStorage or URL
  useEffect(() => {
    const savedContext = sessionStorage.getItem('searchContext');
    if (savedContext) {
      try {
        const parsed = JSON.parse(savedContext);
        setDiscussionContext({
          serviceCategory: parsed.serviceCategory || categoryFromUrl || '',
          focusArea: parsed.primaryFilter || parsed.focusArea || '',
          specificNeeds: parsed.subFilter || parsed.specificNeeds || '',
          industrySector: parsed.industrySector || parsed.industry || '',
          location: parsed.location || '',
          businessStage: parsed.businessStage || 'Startup',
          engagementModel: parsed.engagementModel || '',
        });
      } catch {
        // Fallback
        setDiscussionContext(prev => ({
          ...prev,
          serviceCategory: categoryFromUrl || '',
        }));
      }
    } else {
      setDiscussionContext(prev => ({
        ...prev,
        serviceCategory: categoryFromUrl || '',
      }));
    }
  }, [categoryFromUrl]);

  // Fetch expert profile
  const { data: expert, isLoading, error } = useQuery({
    queryKey: ['expertProfile', expertId],
    queryFn: () => searchService.getExpertProfileByUserId(expertId!),
    enabled: !!expertId,
  });

  // Fill in gaps from expert profile once loaded (for direct links/no-context entries)
  useEffect(() => {
    if (expert) {
      setDiscussionContext(prev => ({
        ...prev,
        serviceCategory: prev.serviceCategory || (expert.categories && expert.categories[0]) || '',
        location: prev.location || (typeof expert.location === 'object' ? expert.location?.city : expert.location) || '',
        industrySector: prev.industrySector || (expert.industrySectors && expert.industrySectors[0]) || '',
      }));
    }
  }, [expert]);

  const handleContinue = () => {
    if (!selectedRole) {
      return;
    }
    // Store role and context in sessionStorage for use in discussion
    sessionStorage.setItem('seekerRole', selectedRole);
    sessionStorage.setItem('serviceCategory', discussionContext.serviceCategory || categoryFromUrl || expert?.categories[0] || '');
    
    // Also update searchContext in sessionStorage
    const updatedContext = {
      ...JSON.parse(sessionStorage.getItem('searchContext') || '{}'),
      serviceCategory: discussionContext.serviceCategory,
      primaryFilter: discussionContext.focusArea,
      subFilter: discussionContext.specificNeeds,
      location: discussionContext.location,
      businessStage: discussionContext.businessStage,
      industrySector: discussionContext.industrySector,
      engagementModel: discussionContext.engagementModel
    };
    sessionStorage.setItem('searchContext', JSON.stringify(updatedContext));

    // Navigate to schedule discussion
    navigate(`/discussions/schedule/${expertId}?category=${encodeURIComponent(discussionContext.serviceCategory || categoryFromUrl || expert?.categories[0] || '')}`);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (error || !expert) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">Expert Not Found</h1>
          <Button onClick={() => navigate('/experts')}>Back to Discovery</Button>
        </div>
      </MainLayout>
    );
  }

  const defaultCategory = discussionContext.serviceCategory || categoryFromUrl || expert.categories[0] || '';

  // Helper to safely render location
  const locationString = typeof expert.location === 'object' && expert.location?.city
    ? `${expert.location.city}, ${expert.location.country}`
    : (typeof expert.location === 'string' ? expert.location : 'Remote');

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-3xl mx-auto border-2 border-foreground shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-6">
            <CardTitle className="text-2xl font-bold text-center sm:text-left">Connect with {expert.displayName}</CardTitle>
            <p className="text-muted-foreground mt-2 text-center sm:text-left">Review and confirm the details before connecting.</p>
          </CardHeader>
          <CardContent className="space-y-8 p-6 sm:p-8">

            {/* 1️⃣ Your Discussion Context */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                    Your Discussion Context
                  </h3>
                  <p className="text-sm text-muted-foreground ml-8">Confirm what you want to discuss.</p>
                </div>
                {!isEditingContext && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary font-semibold gap-1.5 px-0"
                    onClick={() => setIsEditingContext(true)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit content
                  </Button>
                )}
              </div>

              <div className="ml-0 sm:ml-8">
                {isEditingContext ? (
                  <Card className="border-primary/20 shadow-md">
                    <CardHeader className="py-4 px-6 bg-primary/5 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Refine Your Requirements</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-primary font-bold"
                          onClick={() => setIsEditingContext(false)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Done
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Tabs defaultValue="service" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-11 p-0">
                          <TabsTrigger value="service" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full px-6">Service Fit</TabsTrigger>
                          <TabsTrigger value="business" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full px-6">Business Fit</TabsTrigger>
                          <TabsTrigger value="model" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full px-6">Location & Model</TabsTrigger>
                        </TabsList>
                        
                        <div className="p-6">
                        <TabsContent value="service" className="mt-0 space-y-4">
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-sm font-semibold">Service Category</Label>
                              <Select
                                value={discussionContext.serviceCategory}
                                onValueChange={(val) => setDiscussionContext({ 
                                  ...discussionContext, 
                                  serviceCategory: val,
                                  focusArea: '', 
                                  specificNeeds: ''
                                })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SERVICE_HEADS.map((head) => (
                                    <SelectItem key={head} value={head}>{head}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Focus Area</Label>
                                <Select
                                  value={discussionContext.focusArea}
                                  onValueChange={(val) => setDiscussionContext({ 
                                    ...discussionContext, 
                                    focusArea: val,
                                    specificNeeds: '' 
                                  })}
                                  disabled={!discussionContext.serviceCategory}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Focus Area" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(SERVICE_HEAD_TO_PRIMARY_FILTERS[discussionContext.serviceCategory as ServiceHead] || []).map((filter: string) => (
                                      <SelectItem key={filter} value={filter}>{filter}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Specific Needs</Label>
                                <Select
                                  value={discussionContext.specificNeeds}
                                  onValueChange={(val) => setDiscussionContext({ ...discussionContext, specificNeeds: val })}
                                  disabled={!discussionContext.focusArea}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Specific Need" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(PRIMARY_TO_SUB_FILTERS[discussionContext.focusArea] || []).map((subFilter: string) => (
                                      <SelectItem key={subFilter} value={subFilter}>{subFilter}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="business" className="mt-0 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-sm font-semibold">Industry Sector</Label>
                              <Select
                                value={discussionContext.industrySector}
                                onValueChange={(val) => setDiscussionContext({ ...discussionContext, industrySector: val })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select Sector" />
                                </SelectTrigger>
                                <SelectContent>
                                  {INDUSTRY_SECTORS.map((sector) => (
                                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-sm font-semibold">Business Stage</Label>
                              <Select
                                value={discussionContext.businessStage}
                                onValueChange={(val) => setDiscussionContext({ ...discussionContext, businessStage: val })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select Stage" />
                                </SelectTrigger>
                                <SelectContent>
                                  {BUSINESS_SIZES.map((size) => (
                                    <SelectItem key={size} value={size}>{size}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="model" className="mt-0 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-sm font-semibold">Business Location</Label>
                              <Select
                                value={discussionContext.location}
                                onValueChange={(val) => setDiscussionContext({ ...discussionContext, location: val === 'all' ? '' : val })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="City / Region" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Any Location</SelectItem>
                                  {MUMBAI_REGIONS.map((region) => (
                                    <SelectItem key={region} value={region}>{region}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-sm font-semibold">Engagement Preference</Label>
                              <Select
                                value={discussionContext.engagementModel}
                                onValueChange={(val) => setDiscussionContext({ ...discussionContext, engagementModel: val })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select Model" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ENGAGEMENT_MODELS.map((model) => (
                                    <SelectItem key={model} value={model}>{model}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </TabsContent>
                        </div>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-muted/30 rounded-xl border border-border/50">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Service Category</span>
                      <p className="text-sm font-semibold">{discussionContext.serviceCategory || defaultCategory}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Focus Area</span>
                      <p className="text-sm font-semibold">{discussionContext.focusArea || 'Strategy'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Specific Need</span>
                      <p className="text-sm font-semibold">{discussionContext.specificNeeds || 'Custom Requirement'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Business Stage</span>
                      <p className="text-sm font-semibold">{discussionContext.businessStage}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Major Sector</span>
                      <p className="text-sm font-semibold">{discussionContext.industrySector || 'Not Specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Location Preference</span>
                      <p className="text-sm font-semibold">{discussionContext.location || 'Remote preferred'}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="h-px bg-border/60" />

            {/* 2️⃣ Expert Profile */}
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                  Expert Overview
                </h3>
              </div>

              <div className="ml-0 sm:ml-8 p-5 bg-primary/5 rounded-xl border border-primary/10 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-sm">
                  {expert.displayName.charAt(0)}
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <h4 className="font-bold text-lg">{expert.displayName}</h4>
                    <p className="text-sm text-muted-foreground">{locationString}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {expert.categories.map((cat: string) => (
                      <span key={cat} className="text-[10px] font-bold bg-white/10 px-2 py-0.5 border rounded uppercase tracking-wider">{cat}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px bg-border/60" />

            {/* 3️⃣ Your Role */}
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                  Your Role
                </h3>
                <p className="text-sm text-muted-foreground ml-8">Who will the expert be speaking with?</p>
              </div>

              <div className="ml-0 sm:ml-8">
                <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ROLES.map((role) => (
                    <div 
                      key={role.value} 
                      className={`flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        selectedRole === role.value 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedRole(role.value)}
                    >
                      <RadioGroupItem value={role.value} id={`role-${role.value}`} className="sr-only" />
                      <Label htmlFor={`role-${role.value}`} className="cursor-pointer font-semibold flex-1 text-sm">
                        {role.label}
                      </Label>
                      {selectedRole === role.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </section>

            {/* 4️⃣ Continue */}
            <section className="pt-4 flex flex-col items-center sm:items-start gap-4">
              <Button
                onClick={handleContinue}
                disabled={!selectedRole || isEditingContext}
                className="w-full sm:w-auto min-w-[240px] h-14 text-lg font-bold shadow-lg shadow-primary/20 rounded-xl"
                size="lg"
              >
                Proceed to Schedule
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Verified direct connection. No commission or middlemen.
              </div>
            </section>

          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ContextConfirmation;
