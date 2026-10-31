import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { expertService } from '@/services/expertService';
import { EmailChangeSection } from '@/components/settings/EmailChangeSection';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Loader2, ShieldAlert, Lock, AlertTriangle, CheckCircle2,
  Building, Clock, Globe, Briefcase, User, Mail, Smartphone, Award, FileText,
  Plus, X, ExternalLink, Target, Pencil,
  Clock3, Languages, Wrench, ArrowRight
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { ComplianceUpdateModal } from '@/components/expert/ComplianceUpdateModal';
import { LegalNameChangeModal } from '@/components/expert/LegalNameChangeModal';
import { MobileChangeModal } from '@/components/expert/MobileChangeModal';
import { WorkspaceTrustTab } from '@/components/expert/WorkspaceTrustTab';
import { ContextualPayoutBanner } from '@/components/expert/ContextualPayoutBanner';
import {
  SERVICE_HEADS,
  ServiceHead,
  INDUSTRY_SECTORS,
  BUSINESS_RELATIONSHIP_TYPES,
  BUSINESS_TYPES,
  BUSINESS_SIZES,
  ENGAGEMENT_MODELS,
  OPERATIONAL_MODELS,
  PRICING_STYLES,
  TURNAROUND_TIMES,
  LANGUAGES,
  SERVICE_HEAD_TO_PRIMARY_FILTERS,
  PRIMARY_TO_SUB_FILTERS
} from '@/data/taxonomy';

const EditProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const sidebarSections = useAppSidebar();
  const [activeTab, setActiveTab] = useState('basic');
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [legalNameModalOpen, setLegalNameModalOpen] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [selectedComplianceField, setSelectedComplianceField] = useState({ field: '', label: '' });

  // Fetch expert profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['expertProfile'],
    queryFn: () => expertService.getProfile(),
  });

  const [formData, setFormData] = useState({
    // Basic Profile (Stage 1)
    displayName: '',
    bio: '',
    businessName: '',
    brandAlias: '',
    businessRole: 'Independent Consultant',
    businessBackground: '',
    website: '',
    location: { city: '', country: 'India' },
    timezone: 'Asia/Kolkata',
    hourlyRate: 0,
    availabilityStatus: 'available' as 'available' | 'busy' | 'unavailable',
    profileImageUrl: '',
    yearsExperience: 0,
    mobileNumber: '',

    // Expertise (Stage 2)
    categories: [] as string[],
    services: [] as Array<{
      serviceHead: string;
      primaryFilters: string[];
      subFilters: string[];
    }>,
    industrySectors: [] as string[],
    subIndustries: [] as string[],
    serviceDeliveryStates: [] as string[],
    panIndiaAvailable: false,
    clientEngagementTypes: [] as string[],
    businessTypesServed: [] as string[],
    clientScales: [] as string[],
    engagementModels: [] as string[],
    deliveryChannels: [] as string[],
    preferredDeliverySpeed: [] as string[],
    languages: [] as string[],
    tools: [] as string[],
    pricingStyle: [] as string[],

    // Availability
    weeklyWorkingHours: 40,
    daysOff: ['Saturday', 'Sunday'],
    availability: {} as Record<string, { available: boolean; from: string; to: string }>,
    availableForInstantBooking: false,

    // Portfolio & Credibility (Stage 3)
    portfolioUrls: [] as string[],
    portfolioItems: [] as Array<{
      title: string;
      type: 'image' | 'video' | 'pdf' | 'url';
      url: string;
      description?: string;
    }>,
    certifications: [] as Array<{
      name: string;
      issuer: string;
      year: number;
      verified?: boolean;
      fileUrl?: string;
      verificationUrl?: string;
    }>,
    teamMembers: [] as Array<{
      name: string;
      role: string;
      expertise: string[];
      experience: number;
      photoUrl?: string;
    }>,
    testimonials: [] as Array<{
      type: 'screenshot' | 'link';
      source?: string;
      url?: string;
      content?: string;
    }>,

    // Legal & Compliance (Stage 4)
    entityType: 'proprietorship',
    registeredAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    panNumber: '',
    gstNumber: '',
    gstStatus: 'gst_not_registered',
    cinNumber: '',
    llpinNumber: '',
    documents: [] as Array<{
      documentType: string;
      fileUrl: string;
      uploadedAt: string;
      verified: boolean;
    }>,
  });

  const [newPortfolioUrl, setNewPortfolioUrl] = useState('');
  const [newCert, setNewCert] = useState({ name: '', issuer: '', year: new Date().getFullYear() });

  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '',
    type: 'url' as const,
    url: '',
    description: ''
  });

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({
    name: '',
    role: '',
    expertise: [] as string[],
    experience: 0
  });

  const [showAddTestimonial, setShowAddTestimonial] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    type: 'screenshot' as const,
    source: '',
    url: '',
    content: ''
  });

  // Service Management State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [currentServiceHead, setCurrentServiceHead] = useState<ServiceHead | ''>('');
  const [selectedPrimaryFilters, setSelectedPrimaryFilters] = useState<string[]>([]);
  const [selectedSubFilters, setSelectedSubFilters] = useState<string[]>([]);

  // Account Management State
  const [isEditingMobile, setIsEditingMobile] = useState(false);
  const [tempMobile, setTempMobile] = useState('');

  const complianceRequested = (profile as any)?.documentsRequested;



  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      // Merge active profile with pending data to show what's currently \"in flight\"
      const p = {
        ...profile,
        ...(profile.pendingData || {})
      } as any;

      setFormData({
        // Basic Profile
        displayName: p.displayName || '',
        bio: p.bio || '',
        businessName: p.businessName || '',
        brandAlias: p.brandAlias || '',
        businessRole: p.businessRole || 'Independent Consultant',
        businessBackground: p.businessBackground || '',
        website: p.website || '',
        location: typeof p.location === 'object' ? p.location : { city: p.location || '', country: 'India' },
        timezone: p.timezone || 'Asia/Kolkata',
        hourlyRate: p.hourlyRate || 0,
        availabilityStatus: p.availabilityStatus || 'available',
        profileImageUrl: p.profileImageUrl || '',
        yearsExperience: p.yearsExperience || 0,
        mobileNumber: p.mobileNumber || '',

        // Expertise
        categories: p.categories || [],
        services: p.services || [],
        industrySectors: p.industrySectors || [],
        subIndustries: p.subIndustries || [],
        serviceDeliveryStates: p.serviceDeliveryStates || [],
        panIndiaAvailable: !!p.panIndiaAvailable,
        clientEngagementTypes: p.clientEngagementTypes || [],
        businessTypesServed: p.businessTypesServed || [],
        clientScales: p.clientScales || [],
        engagementModels: p.engagementModels || [],
        deliveryChannels: p.deliveryChannels || [],
        preferredDeliverySpeed: p.preferredDeliverySpeed || [],
        languages: p.languages || [],
        tools: p.tools || [],
        pricingStyle: p.pricingStyle || [],

        // Availability
        weeklyWorkingHours: p.weeklyWorkingHours || 40,
        daysOff: p.daysOff || ['Saturday', 'Sunday'],
        availability: p.availability || {},
        availableForInstantBooking: !!p.availableForInstantBooking,

        // Portfolio & Credibility
        portfolioUrls: p.portfolioUrls || [],
        portfolioItems: p.portfolioItems || [],
        certifications: p.certifications || [],
        teamMembers: p.teamMembers || [],
        testimonials: p.testimonials || [],

        // Legal & Compliance
        entityType: p.entityType || 'proprietorship',
        registeredAddress: p.registeredAddress || {
          line1: '',
          line2: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
        },
        panNumber: p.panNumber || '',
        gstNumber: p.gstNumber || '',
        gstStatus: p.gstStatus || 'gst_not_registered',
        cinNumber: p.cinNumber || '',
        llpinNumber: p.llpinNumber || '',
        documents: p.documents || [],
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => expertService.updateProfile(data),
    onSuccess: (data) => {
      if (data.changeRequestStatus === 'pending') {
        toast.message('Update Request Submitted', {
          description: 'Some changes require admin approval and will be visible once verified.',
        });
      } else {
        toast.success('Profile updated successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['expertProfile'] });
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const openComplianceModal = (field: string, label: string) => {
    setSelectedComplianceField({ field, label });
    setComplianceModalOpen(true);
  };

  const ensureAbsoluteUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();

    // Explicitly handle data and blob URIs to prevent modification
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
      return trimmed;
    }

    // Determine Server Base URL
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6001/api';
    const serverBase = apiBase.replace(/\/api\/?$/, '');

    // Handle local file paths
    // If it starts with / or uploads/, or looks like a file extension
    if (trimmed.startsWith('/') || trimmed.startsWith('uploads/') || trimmed.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i)) {
      const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return `${serverBase}${cleanPath}`;
    }

    // If it contains a dot and doesn't have spaces, treat as external domain (e.g. "google.com")
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return `https://${trimmed}`;
    }

    return trimmed;
  };

  const handleViewDocument = (url: string) => {
    if (!url || url.trim() === '') {
      toast.error('Document file is not available. It may not have been uploaded correctly.');
      return;
    }

    const finalUrl = ensureAbsoluteUrl(url);

    if (!finalUrl) {
      toast.error('Unable to open document. The file URL is invalid.');
      return;
    }

    if (finalUrl.startsWith('data:')) {
      // Convert base64 to blob to bypass browser security restriction on top-frame data: navigation
      try {
        const parts = finalUrl.split(',');
        if (parts.length < 2 || !parts[1]) {
          toast.error('Document data is corrupted. Please re-upload the file.');
          return;
        }
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(':')[1]?.split(';')[0] || 'application/octet-stream';
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
        toast.error('Failed to open document. The file may be corrupted — please re-upload it.');
      }
    } else {
      window.open(finalUrl, '_blank');
    }
  };

  const addPortfolioUrl = () => {
    if (newPortfolioUrl.trim() && !formData.portfolioUrls.includes(newPortfolioUrl.trim())) {
      setFormData({ ...formData, portfolioUrls: [...formData.portfolioUrls, newPortfolioUrl.trim()] });
      setNewPortfolioUrl('');
    }
  };


  const addCertification = () => {
    if (newCert.name.trim() && newCert.issuer.trim()) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, { ...newCert, verified: false }],
      });
      setNewCert({ name: '', issuer: '', year: new Date().getFullYear() });
    }
  };

  const removeCertification = (index: number) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index),
    });
  };

  const addPortfolioItemLocal = () => {
    if (newPortfolioItem.title.trim() && newPortfolioItem.url.trim()) {
      setFormData({
        ...formData,
        portfolioItems: [...formData.portfolioItems, { ...newPortfolioItem }],
      });
      setNewPortfolioItem({ title: '', type: 'url', url: '', description: '' });
      setShowAddPortfolio(false);
    }
  };

  const addTeamMemberLocal = () => {
    if (newTeamMember.name.trim() && newTeamMember.role.trim()) {
      setFormData({
        ...formData,
        teamMembers: [...formData.teamMembers, { ...newTeamMember }],
      });
      setNewTeamMember({ name: '', role: '', expertise: [], experience: 0 });
      setShowAddTeam(false);
    }
  };

  const addTestimonialLocal = () => {
    if (newTestimonial.content.trim() && newTestimonial.source.trim()) {
      setFormData({
        ...formData,
        testimonials: [...formData.testimonials, { ...newTestimonial }],
      });
      setNewTestimonial({ type: 'screenshot', source: '', url: '', content: '' });
      setShowAddTestimonial(false);
    }
  };

  // Service Management Logic
  const openServiceModal = (index: number | null = null) => {
    if (index !== null) {
      const service = formData.services[index];
      setEditingServiceIndex(index);
      setCurrentServiceHead(service.serviceHead as ServiceHead);
      setSelectedPrimaryFilters(service.primaryFilters);
      setSelectedSubFilters(service.subFilters);
    } else {
      setEditingServiceIndex(null);
      setCurrentServiceHead('');
      setSelectedPrimaryFilters([]);
      setSelectedSubFilters([]);
    }
    setServiceModalOpen(true);
  };

  const handleSaveService = () => {
    if (!currentServiceHead) {
      toast.error('Please select a service category');
      return;
    }
    if (selectedPrimaryFilters.length === 0) {
      toast.error('Please select at least one primary filter');
      return;
    }

    const newService = {
      serviceHead: currentServiceHead,
      primaryFilters: selectedPrimaryFilters,
      subFilters: selectedSubFilters
    };

    const updatedServices = [...formData.services];
    if (editingServiceIndex !== null) {
      updatedServices[editingServiceIndex] = newService;
    } else {
      // Check if service head already exists
      if (updatedServices.find(s => s.serviceHead === currentServiceHead)) {
        toast.error('This service category is already added. Edit the existing one instead.');
        return;
      }
      updatedServices.push(newService);
    }

    setFormData({ ...formData, services: updatedServices });
    setServiceModalOpen(false);
  };

  const togglePrimaryFilter = (filter: string) => {
    setSelectedPrimaryFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const toggleSubFilter = (filter: string) => {
    setSelectedSubFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  // Account Management Logic
  const handleUpdateMobile = () => {
    if (!tempMobile) {
      toast.error('Please enter a mobile number');
      return;
    }
    // Simple validation for 10 digits
    if (!/^\d{10}$/.test(tempMobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    // In a real app, this might trigger an OTP. For now, we update local state
    // and it will be saved when handleSave is called.
    // However, mobileNumber is on the profile but not in formData by default based on my previous reading?
    // Let me check formData initialization.
    setFormData(prev => ({ ...prev, mobileNumber: tempMobile }));
    setIsEditingMobile(false);
    toast.success('Mobile number updated in form. Remember to save changes.');
  };

  const isPendingField = (field: string) => {
    return profile?.pendingData && field in (profile.pendingData as any);
  };

  // Array keys of formData for multi-select
  type ArrayKeys = { [K in keyof typeof formData]: typeof formData[K] extends any[] ? K : never }[keyof typeof formData];

  const handleMultiSelect = (field: ArrayKeys, value: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const MultiSelectField = ({
    label,
    options,
    field,
    icon: Icon
  }: {
    label: string;
    options: readonly string[] | string[];
    field: ArrayKeys;
    icon?: any
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          <Label className="text-sm font-semibold">{label}</Label>
        </div>
        {isPendingField(field) && (
          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
            Pending Approval
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = (formData[field] as any[]).includes(option);
          return (
            <Badge
              key={option}
              variant={isSelected ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1.5 transition-all ${isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-accent text-muted-foreground"
                }`}
              onClick={() => handleMultiSelect(field, option)}
            >
              {option}
            </Badge>
          );
        })}
      </div>
    </div>
  );


  if (profileLoading) {
    return (
      <AppDashboardLayout
        user={{ name: user?.name || 'User', role: 'Marketing Expert' }}
        sections={sidebarSections}
        headerTitle="Edit Profile"
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppDashboardLayout>
    );
  }

  const hasPendingUpdates = profile?.changeRequestStatus === 'pending';

  return (
    <AppDashboardLayout
      user={{ name: user?.name || 'User', role: 'Marketing Expert' }}
      sections={sidebarSections}
      headerTitle="Edit Profile"
      onSignOut={() => {
        logout();
        navigate('/login');
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header Area */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Expertise & Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your public profile, service offerings, and compliance details.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/expert/dashboard')} className="h-9">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <Button onClick={handleSave} disabled={updateProfileMutation.isPending} className="h-9">
              {updateProfileMutation.isPending ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving... </>
              ) : (
                <> <Save className="mr-2 h-4 w-4" /> Save Changes </>
              )}
            </Button>
          </div>
        </div>

        {/* Pending Updates Banner */}
        {hasPendingUpdates && (
          <Alert className="border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Update Pending Verification</AlertTitle>
            <AlertDescription className="text-amber-700">
              You have submitted changes to your profile (Services/Market Fit) that are currently under review.
              Your public profile will show the old information until these changes are approved.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto md:h-10">
            <TabsTrigger value="basic">Basic Profile</TabsTrigger>
            <TabsTrigger value="expertise">Expertise</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="compliance">Legal &amp; Compliance</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* SECTION 1: BASIC PROFILE (Green/Red Mix) */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Identity</CardTitle>
                <CardDescription>Your main profile information visible to clients.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Expert ID <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200">System Assigned</Badge>
                  </Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-mono text-muted-foreground select-all">
                    {profile?.expertId || 'Assigned after verification'}
                  </div>
                </div>
                <div className="hidden md:block"></div> {/* Spacer for grid alignment */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    Professional Display Name <Badge variant="secondary" className="text-[10px] h-5 bg-green-100 text-green-700">Instant Update</Badge>
                  </Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g. John Doe / Creative Solutions"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandAlias" className="flex items-center gap-2">
                    Brand Alias
                  </Label>
                  <Input
                    id="brandAlias"
                    value={formData.brandAlias}
                    onChange={e => setFormData({ ...formData, brandAlias: e.target.value })}
                    placeholder="e.g. @creativesolutions"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    City <Badge variant="secondary" className="text-[10px] h-5 bg-green-100 text-green-700">Instant Update</Badge>
                  </Label>
                  <Input
                    id="city"
                    value={formData.location.city}
                    onChange={e => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={formData.location.country}
                    onChange={e => setFormData({ ...formData, location: { ...formData.location, country: e.target.value } })}
                    placeholder="e.g. India"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Professional Bio / Summary</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Detailed professional summary..."
                    maxLength={2000}
                  />
                  <div className="text-[10px] text-muted-foreground text-right">
                    {formData.bio?.length || 0}/2000
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="businessBackground">Business Background / History</Label>
                  <Textarea
                    id="businessBackground"
                    rows={3}
                    value={formData.businessBackground}
                    onChange={e => setFormData({ ...formData, businessBackground: e.target.value })}
                    placeholder="Brief history of your agency or consultancy..."
                    maxLength={1500}
                  />
                  <div className="text-[10px] text-muted-foreground text-right">
                    {formData.businessBackground?.length || 0}/1500
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website / Portfolio URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                    {formData.website && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={formData.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Professional Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    value={formData.yearsExperience}
                    onChange={e => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (INR) <Badge variant="secondary" className="text-[10px] h-5 bg-green-100 text-green-700 ml-2">Instant Update</Badge></Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={e => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileImageUrl">Profile Image URL <Badge variant="secondary" className="text-[10px] h-5 bg-green-100 text-green-700 ml-2">Instant Update</Badge></Label>
                  <Input
                    id="profileImageUrl"
                    value={formData.profileImageUrl}
                    onChange={e => setFormData({ ...formData, profileImageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availabilityStatus">Availability</Label>
                  <select
                    id="availabilityStatus"
                    value={formData.availabilityStatus}
                    onChange={e => setFormData({ ...formData, availabilityStatus: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base text-amber-900">Locked Identity Fields</CardTitle>
                </div>
                <CardDescription>To change these details, you must request a compliance review.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 opacity-75">
                <div className="space-y-2">
                  <Label>Legal Registered Name</Label>
                  <div className="flex gap-2">
                    <Input value={profile?.legalName || profile?.businessName || ''} disabled className="bg-gray-100 font-medium" />
                    <Button variant="outline" size="sm" onClick={() => setLegalNameModalOpen(true)}>
                      Request Name Change
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number (Frozen)</Label>
                  <div className="flex gap-2">
                    <Input value={user?.mobile || profile?.mobileNumber || ''} disabled className="bg-gray-100 font-medium" />
                    <Button variant="outline" size="sm" onClick={() => setMobileModalOpen(true)}>
                      Request Mobile Change
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION 2: EXPERTISE (Yellow Review Required) */}
          <TabsContent value="expertise" className="space-y-6">
            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Review Required</AlertTitle>
              <AlertDescription>Changes to Service Categories, Industry Focus, and Market Fit require admin approval before becoming public.</AlertDescription>
            </Alert>

            <Card className={hasPendingUpdates ? "opacity-80" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <CardTitle>What You Do</CardTitle>
                </div>
                <CardDescription>Define your service categories and specializations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <MultiSelectField
                  label="Core Service Categories"
                  options={SERVICE_HEADS}
                  field="categories"
                  icon={Target}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold">Detailed Service Scope</Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openServiceModal()}>
                      <Plus className="h-4 w-4 mr-2" /> Add/Edit Detailed Services
                    </Button>
                  </div>
                  {formData.services && formData.services.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {formData.services.map((s, idx) => (
                        <div key={idx} className="p-4 border rounded-lg bg-accent/10 relative group">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openServiceModal(idx)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <p className="font-bold text-sm mb-2">{s.serviceHead}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {s.primaryFilters.map(p => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
                          </div>
                          {s.subFilters.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {s.subFilters.map(sf => <Badge key={sf} variant="outline" className="text-[10px] bg-white">{sf}</Badge>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground bg-accent/5">
                      No detailed services configured yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className={hasPendingUpdates ? "opacity-80" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle>Who You Serve</CardTitle>
                </div>
                <CardDescription>Define your target industries and market fit.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <MultiSelectField
                  label="Industry Sectors"
                  options={INDUSTRY_SECTORS}
                  field="industrySectors"
                  icon={Building}
                />

                <MultiSelectField
                  label="Relationship Types"
                  options={BUSINESS_RELATIONSHIP_TYPES}
                  field="clientEngagementTypes"
                />

                <MultiSelectField
                  label="Business Types"
                  options={BUSINESS_TYPES}
                  field="businessTypesServed"
                />

                <MultiSelectField
                  label="Client Scales"
                  options={BUSINESS_SIZES}
                  field="clientScales"
                />
              </CardContent>
            </Card>

            <Card className={hasPendingUpdates ? "opacity-80" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-primary" />
                  <CardTitle>How You Work</CardTitle>
                </div>
                <CardDescription>Specify your engagement models and delivery preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <MultiSelectField
                  label="Engagement Models"
                  options={ENGAGEMENT_MODELS}
                  field="engagementModels"
                />

                <MultiSelectField
                  label="Delivery Channels"
                  options={OPERATIONAL_MODELS}
                  field="deliveryChannels"
                />

                <MultiSelectField
                  label="Pricing Styles"
                  options={PRICING_STYLES}
                  field="pricingStyle"
                />

                <MultiSelectField
                  label="Delivery Speed"
                  options={TURNAROUND_TIMES}
                  field="preferredDeliverySpeed"
                />
              </CardContent>
            </Card>

            <Card className={hasPendingUpdates ? "opacity-90 border-blue-100" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  <CardTitle>Communication & Tools</CardTitle>
                </div>
                <CardDescription>Your language proficiency and technology stack.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <MultiSelectField
                  label="Languages"
                  options={LANGUAGES}
                  field="languages"
                />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold">Toolkit & Software</Label>
                  </div>
                  <Input
                    placeholder="e.g. Adobe Creative Suite, HubSpot, Semrush (Comma separated)"
                    value={formData.tools.join(', ')}
                    onChange={e => setFormData({ ...formData, tools: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION 3: PORTFOLIO & CREDIBILITY */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Work Portfolio</CardTitle>
                </div>
                <CardDescription>Showcase your best projects and case studies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Project Links (External)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://behance.net/project"
                      value={newPortfolioUrl}
                      onChange={e => setNewPortfolioUrl(e.target.value)}
                    />
                    <Button variant="outline" onClick={addPortfolioUrl}>Add Link</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.portfolioUrls.map(url => (
                      <Badge key={url} variant="secondary" className="px-3 py-1 flex gap-2">
                        {url.replace('https://', '')}
                        <button onClick={() => setFormData({ ...formData, portfolioUrls: formData.portfolioUrls.filter(u => u !== url) })} className="hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Portfolio Items (Images/Videos/PDFs)</Label>
                    <Button variant="outline" size="sm" onClick={() => setShowAddPortfolio(!showAddPortfolio)}>
                      <Plus className="h-4 w-4 mr-2" /> {showAddPortfolio ? 'Cancel' : 'Add Item'}
                    </Button>
                  </div>

                  {showAddPortfolio && (
                    <div className="p-4 border rounded-lg bg-accent/5 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Item Title</Label>
                          <Input
                            placeholder="e.g. Website Redesign"
                            value={newPortfolioItem.title}
                            onChange={e => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Media URL / Link</Label>
                          <Input
                            placeholder="https://..."
                            value={newPortfolioItem.url}
                            onChange={e => setNewPortfolioItem({ ...newPortfolioItem, url: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={addPortfolioItemLocal}>Add to Portfolio</Button>
                      </div>
                    </div>
                  )}

                  {formData.portfolioItems && formData.portfolioItems.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {formData.portfolioItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="h-12 w-12 bg-accent/20 rounded flex items-center justify-center">
                            {item.type === 'image' ? <Globe className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setFormData({ ...formData, portfolioItems: formData.portfolioItems.filter((_, i) => i !== idx) })}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground bg-accent/5 italic text-sm">
                      No visual portfolio items added yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <CardTitle>Certifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Certification Name</Label>
                    <Input
                      placeholder="e.g. Google Ads Certified"
                      value={newCert.name}
                      onChange={e => setNewCert({ ...newCert, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issuer</Label>
                    <Input
                      placeholder="e.g. Google"
                      value={newCert.issuer}
                      onChange={e => setNewCert({ ...newCert, issuer: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Year</Label>
                      <Input
                        type="number"
                        placeholder="2024"
                        value={newCert.year}
                        onChange={e => setNewCert({ ...newCert, year: parseInt(e.target.value) || 2024 })}
                      />
                    </div>
                    <Button variant="outline" onClick={addCertification}>Add</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-accent/5">
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{cert.name}</p>
                          <p className="text-xs text-muted-foreground">{cert.issuer} • {cert.year}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeCertification(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Team & Testimonials</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Core Team Members</Label>
                    <Button variant="outline" size="sm" onClick={() => setShowAddTeam(!showAddTeam)}>
                      <Plus className="h-4 w-4 mr-2" /> {showAddTeam ? 'Cancel' : 'Add Member'}
                    </Button>
                  </div>

                  {showAddTeam && (
                    <div className="p-4 border rounded-lg bg-accent/5 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          placeholder="Member Name"
                          value={newTeamMember.name}
                          onChange={e => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                        />
                        <Input
                          placeholder="Role / Designation"
                          value={newTeamMember.role}
                          onChange={e => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={addTeamMemberLocal}>Add Member</Button>
                      </div>
                    </div>
                  )}

                  {formData.teamMembers && formData.teamMembers.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {formData.teamMembers.map((m, idx) => (
                        <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{m.name}</p>
                              <p className="text-xs text-muted-foreground">{m.role}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setFormData({ ...formData, teamMembers: formData.teamMembers.filter((_, i) => i !== idx) })}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No team members listed.</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Testimonials & Social Proof</Label>
                    <Button variant="outline" size="sm" onClick={() => setShowAddTestimonial(!showAddTestimonial)}>
                      <Plus className="h-4 w-4 mr-2" /> {showAddTestimonial ? 'Cancel' : 'Add Testimonial'}
                    </Button>
                  </div>

                  {showAddTestimonial && (
                    <div className="p-4 border rounded-lg bg-accent/5 space-y-4">
                      <Input
                        placeholder="Source (e.g. CEO, XYZ Corp)"
                        value={newTestimonial.source}
                        onChange={e => setNewTestimonial({ ...newTestimonial, source: e.target.value })}
                      />
                      <Textarea
                        placeholder="Testimonial content..."
                        value={newTestimonial.content}
                        onChange={e => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                      />
                      <div className="flex justify-end">
                        <Button size="sm" onClick={addTestimonialLocal}>Add Testimonial</Button>
                      </div>
                    </div>
                  )}

                  {formData.testimonials && formData.testimonials.length > 0 ? (
                    <div className="grid gap-4">
                      {formData.testimonials.map((t, idx) => (
                        <div key={idx} className="p-3 border rounded-lg bg-muted/30 flex justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xs italic mb-2">"{t.content}"</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">— {t.source}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setFormData({ ...formData, testimonials: formData.testimonials.filter((_, i) => i !== idx) })}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No testimonials added yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION 4: LEGAL & COMPLIANCE */}
          <TabsContent value="compliance" className="space-y-6">
            <WorkspaceTrustTab
              initialData={profile}
              onSaved={() => queryClient.invalidateQueries({ queryKey: ['expertProfile'] })}
            />
          </TabsContent>

          {/* SECTION 5: ACCOUNT */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Account Governance</CardTitle>
                </div>
                <CardDescription>Manage your identifiers and access credentials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <EmailChangeSection
                    currentEmail={user?.email || ''}
                    onEmailChanged={() => {
                      queryClient.invalidateQueries({ queryKey: ['session'] });
                      queryClient.invalidateQueries({ queryKey: ['expertProfile'] });
                    }}
                  />

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/5">
                    <div className="flex items-center gap-3 flex-1">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Mobile Number</p>
                        {isEditingMobile ? (
                          <div className="flex gap-2 mt-2">
                            <Input
                              size={10}
                              className="h-8 max-w-[150px]"
                              value={tempMobile}
                              onChange={e => setTempMobile(e.target.value)}
                              placeholder="10-digit number"
                            />
                            <Button size="sm" className="h-8" onClick={handleUpdateMobile}>Save</Button>
                            <Button size="sm" className="h-8" variant="ghost" onClick={() => setIsEditingMobile(false)}>Cancel</Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">{(formData as any).mobileNumber || profile?.mobileNumber || 'Not Linked'}</p>
                        )}
                      </div>
                    </div>
                    {!isEditingMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => {
                          setTempMobile((formData as any).mobileNumber || profile?.mobileNumber || '');
                          setIsEditingMobile(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
 
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/5">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">Account Security</p>
                      <p className="text-xs text-muted-foreground">Update your password in account settings</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/expert/settings')}>Manage</Button>
                </div>

                <div className="pt-4 space-y-4">
                  <Button variant="destructive" className="w-fit">Deactivate Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ComplianceUpdateModal
        open={complianceModalOpen}
        onOpenChange={setComplianceModalOpen}
        field={selectedComplianceField.field}
        fieldLabel={selectedComplianceField.label}
        currentValues={{
          entityType: formData.entityType,
          bankDetails: (formData as any).bankDetails || profile?.bankDetails,
          businessName: formData.businessName || profile?.businessName,
        }}
        pendingValues={profile?.pendingData ? {
          entityType: profile.pendingData.entityType,
          bankDetails: profile.pendingData.bankDetails,
          businessName: profile.pendingData.businessName,
        } : undefined}
        changeRequestStatus={profile?.changeRequestStatus}
      />

      <LegalNameChangeModal
        open={legalNameModalOpen}
        onOpenChange={setLegalNameModalOpen}
        currentLegalName={profile?.legalName || profile?.businessName || ''}
      />

      <MobileChangeModal
        open={mobileModalOpen}
        onOpenChange={setMobileModalOpen}
        currentMobile={user?.mobile || profile?.mobileNumber || ''}
      />

      {/* Service Management Dialog */}
      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingServiceIndex !== null ? 'Edit Detailed Service' : 'Add Detailed Service'}</DialogTitle>
            <DialogDescription>
              Configure specific outcomes and granular needs for your selected service head.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Service Category</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={currentServiceHead}
                onChange={(e) => {
                  setCurrentServiceHead(e.target.value as ServiceHead);
                  setSelectedPrimaryFilters([]);
                  setSelectedSubFilters([]);
                }}
              >
                <option value="">Select a Category</option>
                {SERVICE_HEADS.map(sh => (
                  <option key={sh} value={sh}>{sh}</option>
                ))}
              </select>
            </div>

            {currentServiceHead && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Filters (Outcome Buckets)</Label>
                  <p className="text-xs text-muted-foreground mb-3">Which core outcomes do you specialize in?</p>
                  <div className="flex flex-wrap gap-2">
                    {currentServiceHead && (SERVICE_HEAD_TO_PRIMARY_FILTERS[currentServiceHead] as readonly string[])?.map((f: string) => (
                      <Badge
                        key={f}
                        variant={selectedPrimaryFilters.includes(f) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1.5"
                        onClick={() => togglePrimaryFilter(f)}
                      >
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedPrimaryFilters.length > 0 && (
                  <div className="space-y-2">
                    <Label>Sub-Filters (Granular Needs)</Label>
                    <p className="text-xs text-muted-foreground mb-3">Specific capabilities within your selected outcomes.</p>
                    <div className="grid gap-6">
                      {selectedPrimaryFilters.map(pf => (
                        <div key={pf} className="space-y-2">
                          <p className="text-xs font-bold text-primary flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {pf}
                          </p>
                          <div className="flex flex-wrap gap-2 pl-3">
                            {PRIMARY_TO_SUB_FILTERS[pf]?.map(sf => (
                              <Badge
                                key={sf}
                                variant={selectedSubFilters.includes(sf) ? "secondary" : "outline"}
                                className={`cursor-pointer text-[10px] ${selectedSubFilters.includes(sf) ? "bg-primary/10 text-primary border-primary/20" : ""}`}
                                onClick={() => toggleSubFilter(sf)}
                              >
                                {sf}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveService}>
              {editingServiceIndex !== null ? 'Update Service' : 'Add Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppDashboardLayout>
  );
};

export default EditProfile;
