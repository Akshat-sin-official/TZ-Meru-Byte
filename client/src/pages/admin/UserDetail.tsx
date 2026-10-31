/**
 * User Detail Page
 * 
 * Shows detailed information about an expert or seeker
 */

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, CheckCircle, Image as ImageIcon, FileText, Video, Link as LinkIcon, Shield, ArrowRight, Activity, Edit2, ExternalLink, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { adminService } from '@/services/adminService';
import { AdminEditProfileModal } from '@/components/admin/AdminEditProfileModal';
import { useAdminSidebar } from '@/hooks/useAdminSidebar';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Label } from '@/components/ui/label';
import {
  businessPanPillLabel,
  getExpertBusinessPanUrl,
  getExpertIncorporationDocUrl,
  incorporationDocOptionalForEntity,
  incorporationPillShortLabel,
  isListedComplianceDoc,
} from '@/lib/expertComplianceAdmin';
import {
  INDUSTRY_SECTORS,
  INDUSTRY_SECTOR_TO_SUB_SECTORS,
  IndustrySector,
} from '@/data/taxonomy';

const UserActivityLog = ({ userId }: { userId: string }) => {
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['userActivity', userId],
    queryFn: () => adminService.getUserActivity(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activities = (activityData as any)?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Marketplace Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity: any, index: number) => (
              <div key={index} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex-shrink-0 mt-1">
                  <div className={`p-2 rounded-full ${activity.eventType === 'search_performed' ? 'bg-blue-50 text-blue-600' :
                    activity.eventType === 'profile_viewed' ? 'bg-purple-50 text-purple-600' :
                      activity.eventType === 'filter_used' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-50 text-gray-600'
                    }`}>
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold capitalize">
                      {activity.eventType.replace(/_/g, ' ')}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {activity.metadata && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {activity.metadata.term && <span>Term: <strong>{activity.metadata.term}</strong></span>}
                        {activity.metadata.resultsCount !== undefined && <span>Results: {activity.metadata.resultsCount}</span>}
                        {activity.metadata.expertId && <span>Expert ID: {activity.metadata.expertId}</span>}
                      </div>
                    )}
                    {activity.trafficSource && (
                      <div className="mt-1 opacity-70">
                        Source: {activity.trafficSource.source} | {activity.trafficSource.medium}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent activity found for this user.</p>
        )}
      </CardContent>
    </Card>
  );
};


const DocumentPill = ({ label, url, isOptional = false, handleView }: { label: string, url?: string, isOptional?: boolean, handleView: (url: string) => void }) => {
  if (!url) {
    if (isOptional) return <Badge variant="outline" className="text-muted-foreground bg-gray-50 border-dashed font-normal">{label} ⚪ (Optional)</Badge>;
    return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 font-medium">{label} ⚠️ Missing</Badge>;
  }
  return (
    <Badge
      variant="outline"
      className="cursor-pointer bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1.5 pr-3 py-1 transition-colors font-medium"
      onClick={(e) => { e.preventDefault(); handleView(url); }}
    >
      <CheckCircle className="h-3.5 w-3.5" /> {label}
    </Badge>
  );
};

const DecisionSummary = ({
  userData,
  type,
  kycVerified,
  identityVerified,
  authorizationVerified,
  handleViewDocument,
  onBack,
  onEditProfile,
}: any) => {
  if (!userData) return null;
  const isExpert = type === 'experts';
  const data = userData; // Alias for cleaner access

  // Determine critical status
  const statusColor = !data.isActive ? 'bg-red-100 text-red-800 border-red-200' :
    !data.isProfileComplete ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200';
  const statusText = !data.isActive ? 'Inactive' :
    !data.isProfileComplete ? 'Under Review' : 'Active';

  // Joining info - prioritize original User account creation date
  const rawJoinedDate = data.userCreatedAt || data.userId?.createdAt || data.createdAt;
  const joinedDate = rawJoinedDate ? new Date(rawJoinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  // Document Checks for Summary
  const docs = data.documents || [];
  const getDocUrl = (type: string) => docs.find((d: any) => d.documentType === type || d.type === type)?.fileUrl;

  /* PAN uploads use entity-specific labels in the wizard (LLP PAN, Firm PAN, …); incorporation proof varies similarly. */
  const entityTypeNorm = data.entityType;
  const hasGstCert = getDocUrl('GST Certificate');
  const hasIncorp = getExpertIncorporationDocUrl(entityTypeNorm, docs);
  const hasBusinessPan = getExpertBusinessPanUrl(entityTypeNorm, docs);
  const incorpOptional = incorporationDocOptionalForEntity(entityTypeNorm);

  // Calculate Portfolio Health Summary
  const portfolioCount = (data.portfolioItems?.length || 0) + (data.portfolioUrls?.length || 0);

  return (
    <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b sticky top-0 z-30 shadow-sm transition-all duration-200 -mx-6 lg:-mx-8 px-6 lg:px-8 py-5 mb-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center max-w-[1600px] mx-auto">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} title="Back to Users" className="h-8 w-8 -ml-2 text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isExpert ? (data.displayName || data.businessName) : data.fullName}
            </h2>
            <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-semibold border ${statusColor}`}>
              {statusText.toUpperCase()}
            </Badge>
            {isExpert && (
              <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-mono font-semibold border ${data.expertId || data.userId?.expertId ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                {data.expertId || data.userId?.expertId || 'MTA-EXP-PENDING'}
              </Badge>
            )}
            {onEditProfile && (
              <Button
                size="sm"
                onClick={onEditProfile}
                className="h-8 px-3 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer ml-auto sm:ml-2"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2 pr-4 border-r border-gray-200 last:border-0 last:pr-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</span>
              <span className="font-medium text-gray-900 bg-gray-100/50 px-2 py-0.5 rounded">
                {(data.entityType || 'Individual').replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center gap-2 pr-4 border-r border-gray-200 last:border-0 last:pr-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</span>
              <span className="font-medium text-gray-900">{joinedDate}</span>
            </div>

            {isExpert && (
              <div className="flex items-center gap-2 pr-4 border-r border-gray-200 last:border-0 last:pr-0">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Experience</span>
                <span className="font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                  {(() => {
                    let years = (userData as any)?.yearsExperience ?? (userData as any)?.yearsOfExperience ?? (userData as any)?.experienceYears;
                    const startDate = (userData as any)?.experienceStartDate || (userData as any)?.inceptionDate;
                    if ((years === undefined || years === null || Number(years) === 0) && startDate) {
                      const d = new Date(startDate).getTime();
                      if (!isNaN(d)) {
                        years = Math.max(0, Math.round(((Date.now() - d) / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10);
                      }
                    }
                    if (years !== undefined && years !== null && Number(years) > 0) {
                      const startYear = startDate ? new Date(startDate).getFullYear() : null;
                      return `${years} Yrs${startYear && !isNaN(startYear) ? ` (Since ${startYear})` : ''}`;
                    }
                    if (startDate) {
                      const yr = new Date(startDate).getFullYear();
                      if (!isNaN(yr)) return `Since ${yr}`;
                    }
                    return '—';
                  })()}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification</span>
              {isExpert ? (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${kycVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                  <span className="text-xs font-bold">KYC</span>
                  {kycVerified ? <CheckCircle className="h-3 w-3" /> : <span className="text-[10px] uppercase font-bold ml-1">Pending</span>}
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${identityVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    <span className="text-xs font-medium">Identity</span>
                    {identityVerified && <CheckCircle className="h-3 w-3" />}
                  </div>
                   <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${authorizationVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    <span className="text-xs font-medium">Compliance</span>
                    {authorizationVerified && <CheckCircle className="h-3 w-3" />}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pl-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</span>
              <span className="text-emerald-600 flex items-center gap-1 font-medium text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                <Shield className="h-3 w-3" /> Low
              </span>
            </div>
          </div>
        </div>

        {/* Quick Doc Snapshot for Experts */}
        {isExpert && (
          <div className="flex flex-col items-end gap-3 min-w-[200px]">
            <div className="flex flex-wrap justify-end gap-2">
              <DocumentPill
                label={incorporationPillShortLabel(entityTypeNorm)}
                url={hasIncorp}
                isOptional={incorpOptional}
                handleView={handleViewDocument}
              />
              <DocumentPill label="PAN" url={hasBusinessPan} handleView={handleViewDocument} />
              <DocumentPill label="GST" url={hasGstCert} isOptional={!data.gstRegistered || data.gstRegistered === 'no'} handleView={handleViewDocument} />
            </div>
            <div className="text-xs font-medium text-gray-500 flex items-center gap-2 bg-gray-50 px-2 py-1 rounded border border-gray-100">
              <ImageIcon className="h-3 w-3" />
              Portfolio:
              <span className={portfolioCount > 0 ? "text-blue-600 font-semibold" : "text-red-600 font-semibold"}>
                {portfolioCount} items
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const sidebarSections = useAdminSidebar();

  // Determine type from current path
  const pathType = location.pathname.includes('/expert')
    ? 'experts'
    : location.pathname.includes('/seeker')
    ? 'seekers'
    : null;
  const [resolvedType, setResolvedType] = useState<'experts' | 'seekers' | null>(pathType);
  const type = resolvedType || pathType;
  const isExpert = type === 'experts';

  const ensureAbsoluteUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

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
      // Convert base64 to blob to bypass browser security restriction on top-frame data: navigation
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

  const { data: userData, isLoading, isError, error } = useQuery({
    queryKey: ['userDetail', type, userId],
    queryFn: async () => {
      if (type === 'experts') {
        try {
          return await adminService.getExpertDetail(userId!);
        } catch (err) {
          try {
            const seekerData = await adminService.getSeekerDetail(userId!);
            if (seekerData) {
              setResolvedType('seekers');
              return seekerData;
            }
          } catch {}
          throw err;
        }
      } else if (type === 'seekers') {
        try {
          return await adminService.getSeekerDetail(userId!);
        } catch (err) {
          try {
            const expertData = await adminService.getExpertDetail(userId!);
            if (expertData) {
              setResolvedType('experts');
              return expertData;
            }
          } catch {}
          throw err;
        }
      }
      // Auto-detect when URL does not specify role (/admin/users/:userId)
      try {
        const expertData = await adminService.getExpertDetail(userId!);
        if (expertData) {
          setResolvedType('experts');
          return expertData;
        }
      } catch {
        // Fall back to seeker check
      }
      try {
        const seekerData = await adminService.getSeekerDetail(userId!);
        if (seekerData) {
          setResolvedType('seekers');
          return seekerData;
        }
      } catch {
        // Continue to error
      }
      throw new Error('User not found');
    },
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data
  });

  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState('');
  const [kycVerified, setKycVerified] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [authorizationVerified, setAuthorizationVerified] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: 'approve' | 'reject' | 'request_docs' | 'suspend' | 'reactivate' | 'delete' | null;
    requiresReason?: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    action: null,
  });
  const [actionReason, setActionReason] = useState('');
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Admin Industry Taxonomy Editing State
  const [taxonomyModalOpen, setTaxonomyModalOpen] = useState(false);
  const [adminSectors, setAdminSectors] = useState<string[]>([]);
  const [adminSubSectors, setAdminSubSectors] = useState<string[]>([]);
  const [isSavingTaxonomy, setIsSavingTaxonomy] = useState(false);

  // Sync state with userData
  useEffect(() => {
    if (userData) {
      if (type === 'experts') {
        const expert = userData as any;
        setAdminNotes(expert.adminNotes || '');
        setKycVerified(expert.kycVerified || false);
        const existingSectors = (expert.industrySectors && expert.industrySectors.length > 0)
          ? expert.industrySectors
          : (expert.industrySector ? [expert.industrySector] : []);
        setAdminSectors(existingSectors);
        setAdminSubSectors(expert.industrySubSectors || expert.subIndustries || []);
      } else if (type === 'seekers') {
        const seeker = userData as any;
        setAdminNotes(seeker.adminNotes || '');
        setIdentityVerified(seeker.identityVerified || false);
        setAuthorizationVerified(seeker.authorizationVerified || false);
      }
    }
  }, [userData, type]);

  const handleSaveAdminTaxonomy = async () => {
    if (!userId) return;
    setIsSavingTaxonomy(true);
    try {
      await adminService.updateExpertTaxonomy(userId, {
        industrySector: adminSectors[0] || undefined,
        industrySectors: adminSectors,
        industrySubSectors: adminSubSectors,
      });
      toast.success('Expert Industry & Sub-Sectors updated successfully!');
      setTaxonomyModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['userDetail', type, userId] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update industry taxonomy');
    } finally {
      setIsSavingTaxonomy(false);
    }
  };

  // Mutations
  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) =>
      isExpert
        ? adminService.updateExpertNotes(userId!, notes)
        : adminService.updateSeekerNotes(userId!, notes),
    onSuccess: () => {
      toast.success('Admin notes updated');
      queryClient.invalidateQueries({ queryKey: ['userDetail', userId] });
    },
    onError: (error) => toast.error(`Failed to update notes: ${error.message}`),
  });

  const updateKYCMutation = useMutation({
    mutationFn: (checked: boolean) => adminService.updateExpertKYCStatus(userId!, checked),
    onSuccess: (_, checked) => {
      toast.success(`KYC status updated to ${checked ? 'Verified' : 'Not Verified'}`);
      setKycVerified(checked);
      queryClient.invalidateQueries({ queryKey: ['userDetail', userId] });
    },
    onError: (error) => {
      toast.error(`Failed to update KYC status: ${error.message}`);
      // Revert state on error
      if (userData) setKycVerified((userData as any).kycVerified);
    },
  });

  const updateIdentityMutation = useMutation({
    mutationFn: (checked: boolean) => adminService.verifySeekerIdentity(userId!, checked),
    onSuccess: (_, checked) => {
      toast.success(`Identity status updated to ${checked ? 'Verified' : 'Not Verified'}`);
      setIdentityVerified(checked);
      queryClient.invalidateQueries({ queryKey: ['userDetail', userId] });
    },
    onError: (error) => {
      toast.error(`Failed to update identity status: ${error.message}`);
      if (userData) setIdentityVerified((userData as any).identityVerified);
    },
  });

  const updateAuthorizationMutation = useMutation({
    mutationFn: (checked: boolean) => adminService.verifySeekerAuthorization(userId!, checked),
    onSuccess: (_, checked) => {
      toast.success(`Authorization status updated to ${checked ? 'Verified' : 'Not Verified'}`);
      setAuthorizationVerified(checked);
      queryClient.invalidateQueries({ queryKey: ['userDetail', userId] });
    },
    onError: (error) => {
      toast.error(`Failed to update authorization status: ${error.message}`);
      if (userData) setAuthorizationVerified((userData as any).authorizationVerified);
    },
  });

  const approveExpertMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.approveExpertProfile(userId, reason),
    onSuccess: () => {
      toast.success('Expert profile approved');
      queryClient.invalidateQueries({ queryKey: ['userDetail', userId] });
      setActionDialog({ ...actionDialog, open: false });
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  const rejectExpertMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.rejectExpertProfile(userId, reason),
    onSuccess: () => {
      toast.success('Expert profile rejected');
      queryClient.invalidateQueries({ queryKey: ['userDetail', type, userId] });
      setActionDialog({ ...actionDialog, open: false });
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  const suspendExpertMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.suspendExpertProfile(userId, reason),
    onSuccess: () => {
      toast.success('Expert profile suspended');
      queryClient.invalidateQueries({ queryKey: ['userDetail', type, userId] });
      setActionDialog({ ...actionDialog, open: false });
      setActionReason('');
    },
    onError: (error) => {
      toast.error(`Failed to suspend: ${error.message}`);
    },
  });

  const reactivateExpertMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminService.reactivateExpertProfile(userId, reason),
    onSuccess: () => {
      toast.success('Expert profile reactivated');
      queryClient.invalidateQueries({ queryKey: ['userDetail', type, userId] });
      setActionDialog({ ...actionDialog, open: false });
      setActionReason('');
    },
    onError: (error) => {
      toast.error(`Failed to reactivate: ${error.message}`);
    },
  });

  const requestDocsMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.requestExpertDocuments(userId, reason),
    onSuccess: () => {
      toast.success('Document request sent to expert');
      queryClient.invalidateQueries({ queryKey: ['userDetail', userId] });
      setActionDialog({ ...actionDialog, open: false });
      setActionReason('');
    },
    onError: (error) => {
      toast.error(`Failed to request documents: ${error.message}`);
    },
  });

  // Profile Update States & Mutations
  const [profileUpdateDialog, setProfileUpdateDialog] = useState<{
    open: boolean;
    action: 'approve_update' | 'reject_update' | 'request_update_changes' | null;
    title: string;
    description: string;
    requiresReason?: boolean;
  }>({
    open: false,
    action: null,
    title: '',
    description: '',
  });
  const [profileUpdateReason, setProfileUpdateReason] = useState('');

  const approveProfileUpdateMutation = useMutation({
    mutationFn: () => adminService.approveProfileUpdate(userId!),
    onSuccess: () => {
      toast.success('Profile updates successfully approved and applied');
      queryClient.invalidateQueries({ queryKey: ['userDetail', type, userId] });
    },
    onError: (err: any) => {
      toast.error(`Failed to approve profile updates: ${err.message}`);
    }
  });

  const rejectProfileUpdateMutation = useMutation({
    mutationFn: (reason: string) => adminService.rejectProfileUpdate(userId!, reason),
    onSuccess: () => {
      toast.success('Profile updates rejected and cleared');
      queryClient.invalidateQueries({ queryKey: ['userDetail', type, userId] });
    },
    onError: (err: any) => {
      toast.error(`Failed to reject profile updates: ${err.message}`);
    }
  });

  const requestProfileUpdateChangesMutation = useMutation({
    mutationFn: (reason: string) => adminService.requestProfileUpdateChanges(userId!, reason),
    onSuccess: () => {
      toast.success('Changes requested for profile updates');
      queryClient.invalidateQueries({ queryKey: ['userDetail', type, userId] });
    },
    onError: (err: any) => {
      toast.error(`Failed to request changes: ${err.message}`);
    }
  });

  const executeProfileUpdateAction = () => {
    if (profileUpdateDialog.action === 'approve_update') {
      approveProfileUpdateMutation.mutate();
    } else if (profileUpdateDialog.action === 'reject_update') {
      if (!profileUpdateReason.trim() || profileUpdateReason.trim().length < 5) {
        toast.error('Rejection reason is required (min 5 chars)');
        return;
      }
      rejectProfileUpdateMutation.mutate(profileUpdateReason);
    } else if (profileUpdateDialog.action === 'request_update_changes') {
      if (!profileUpdateReason.trim() || profileUpdateReason.trim().length < 5) {
        toast.error('Reason for requested changes is required (min 5 chars)');
        return;
      }
      requestProfileUpdateChangesMutation.mutate(profileUpdateReason);
    }
    setProfileUpdateDialog({ open: false, action: null, title: '', description: '' });
    setProfileUpdateReason('');
  };

  // Legal Name Change Review State & Mutation
  const [legalNameReviewDialog, setLegalNameReviewDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
  }>({ open: false, action: null });
  const [legalNameRejectReason, setLegalNameRejectReason] = useState('');

  const reviewLegalNameMutation = useMutation({
    mutationFn: ({ action, rejectionReason }: { action: 'approve' | 'reject'; rejectionReason?: string }) => {
      const targetId = expertData?._id || userId!;
      return adminService.reviewLegalNameChange(targetId, action, rejectionReason);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.action === 'approve' ? 'Legal name change approved!' : 'Legal name change request rejected');
      queryClient.invalidateQueries({ queryKey: ['userDetail', type, userId] });
      setLegalNameReviewDialog({ open: false, action: null });
      setLegalNameRejectReason('');
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : 'Failed to review legal name change';
      toast.error(errorMsg);
    }
  });

  // Mobile Change Review State & Mutation
  const [mobileReviewDialog, setMobileReviewDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
  }>({ open: false, action: null });
  const [mobileRejectReason, setMobileRejectReason] = useState('');

  const reviewMobileMutation = useMutation({
    mutationFn: ({ action, rejectionReason }: { action: 'approve' | 'reject'; rejectionReason?: string }) => {
      const targetId = expertData?._id || userId!;
      return adminService.reviewMobileChange(targetId, action, rejectionReason);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.action === 'approve' ? 'Mobile number change approved!' : 'Mobile number change request rejected');
      queryClient.invalidateQueries({ queryKey: ['userDetail', type, userId] });
      setMobileReviewDialog({ open: false, action: null });
      setMobileRejectReason('');
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : 'Failed to review mobile change';
      toast.error(errorMsg);
    }
  });

  // Fetch Verification Queue for "Next" logic
  const { data: verificationQueue } = useQuery({
    queryKey: ['verificationQueue'],
    queryFn: () => adminService.getVerificationQueue({ limit: 100 }), // Fetch enough to find next
    enabled: isExpert && !userData?.isProfileComplete, // Only useful for verifying pending profiles
  });

  const handleSaveAndNext = async () => {
    // 1. Save Notes
    try {
      await updateNotesMutation.mutateAsync(adminNotes);
    } catch {
      return; // Stop if saving notes fails
    }

    // 2. Find next item in queue
    if (verificationQueue?.data && verificationQueue.data.length > 0) {
      const currentIndex = verificationQueue.data.findIndex((item: any) => item.userId === userId);
      // If current not found (maybe just approved?) or is last, loop to first that isn't current, or just Next
      let nextId = null;

      if (currentIndex !== -1 && currentIndex < verificationQueue.data.length - 1) {
        nextId = verificationQueue.data[currentIndex + 1].userId;
      } else if (verificationQueue.data.length > 0 && verificationQueue.data[0].userId !== userId) {
        // If current is last or not in list, pick first
        nextId = verificationQueue.data[0].userId;
      }

      if (nextId) {
        navigate(`/admin/users/experts/${nextId}`);
        toast.info('Navigated to next pending profile');
      } else {
        toast.info('No more pending profiles in queue');
        navigate('/admin/users');
      }
    } else {
      toast.info('Verification queue is empty');
      navigate('/admin/users');
    }
  };

  const executeAction = () => {
    if (!userId) return;

    if (actionDialog.action === 'approve') {
      approveExpertMutation.mutate({ userId, reason: actionReason });
    } else if (actionDialog.action === 'reject') {
      if (!actionReason.trim() || actionReason.trim().length < 10) {
        toast.error('Reason is required (min 10 chars)');
        return;
      }
      rejectExpertMutation.mutate({ userId, reason: actionReason });
    } else if (actionDialog.action === 'request_docs') {
      if (!actionReason.trim()) {
        toast.error('Please specify which documents are required');
        return;
      }
      requestDocsMutation.mutate({ userId, reason: actionReason });
    } else if (actionDialog.action === 'suspend') {
      if (!actionReason.trim() || actionReason.trim().length < 10) {
        toast.error('Reason is required (min 10 chars)');
        return;
      }
      suspendExpertMutation.mutate({ userId, reason: actionReason });
    } else if (actionDialog.action === 'reactivate') {
      reactivateExpertMutation.mutate({ userId, reason: actionReason });
    }
  };


  const getSidebarSections = () => {
    return sidebarSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        isActive: item.href === '/admin/users',
      })),
    }));
  };

  const dashboardProps = {
    user: {
      name: user?.name || 'Admin User',
      role: 'Platform Administrator',
    },
    sections: getSidebarSections(),
    onSignOut: () => {
      logout();
      navigate('/login');
    },
    headerTitle: type === 'experts' ? 'Expert Profile Details' : 'Seeker Profile Details',
  };

  if (isLoading) {
    return (
      <AppDashboardLayout {...dashboardProps}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppDashboardLayout>
    );
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load user details';
    return (
      <AppDashboardLayout {...dashboardProps}>
        <div className="p-6 lg:p-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => navigate('/admin/users')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppDashboardLayout>
    );
  }

  if (!userData) {
    return (
      <AppDashboardLayout {...dashboardProps}>
        <div className="p-6 lg:p-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">User not found</p>
              <Button onClick={() => navigate('/admin/users')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppDashboardLayout>
    );
  }

  const populatedUser = (userData as any)?.userId || {};
  const expertData = userData as any;

  return (
    <AppDashboardLayout {...dashboardProps}>
      {/* Sticky Decision Summary */}
      <DecisionSummary
        userData={userData}
        type={type}
        kycVerified={kycVerified}
        identityVerified={identityVerified}
        authorizationVerified={authorizationVerified}
        handleViewDocument={handleViewDocument}
        onBack={() => navigate('/admin/users')}
        onEditProfile={() => setIsEditProfileModalOpen(true)}
      />

      <div className="px-6 lg:px-8 pb-32 max-w-[1600px] mx-auto">
        {/* Legal Name Change Review Panel */}
        {isExpert && expertData?.legalNameChangeRequest && expertData.legalNameChangeRequest.status === 'pending' && (
          <Card className="mb-6 border-blue-200 bg-blue-50/25 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader className="bg-blue-500/10 border-b border-blue-200/60 py-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-blue-950 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Legal Name Change Requested
                  </CardTitle>
                  <p className="text-xs text-blue-700/80 mt-0.5">
                    Requested on {expertData.legalNameChangeRequest.requestedAt ? new Date(expertData.legalNameChangeRequest.requestedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                    onClick={() => setLegalNameReviewDialog({ open: true, action: 'reject' })}
                  >
                    Reject Request
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    onClick={() => setLegalNameReviewDialog({ open: true, action: 'approve' })}
                  >
                    Approve Name Change
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Current Legal Name</p>
                  <p className="text-base font-bold text-gray-900">{expertData.legalNameChangeRequest.currentLegalName || expertData.legalName || 'N/A'}</p>
                </div>
                <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-200 shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">Requested Legal Name</p>
                  <p className="text-base font-bold text-blue-950">{expertData.legalNameChangeRequest.requestedLegalName}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-xs flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Supporting Document</p>
                  {expertData.legalNameChangeRequest.supportingDocumentUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5 w-fit"
                      onClick={() => handleViewDocument(expertData.legalNameChangeRequest.supportingDocumentUrl)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Uploaded Proof
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No document attached</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Number Change Review Panel */}
        {isExpert && expertData?.mobileChangeRequest && expertData.mobileChangeRequest.status === 'pending' && (
          <Card className="mb-6 border-purple-200 bg-purple-50/25 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader className="bg-purple-500/10 border-b border-purple-200/60 py-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-purple-950 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-purple-600" />
                    Mobile Number Change Requested
                  </CardTitle>
                  <p className="text-xs text-purple-700/80 mt-0.5">
                    Requested on {expertData.mobileChangeRequest.requestedAt ? new Date(expertData.mobileChangeRequest.requestedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                    onClick={() => setMobileReviewDialog({ open: true, action: 'reject' })}
                  >
                    Reject Request
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    onClick={() => setMobileReviewDialog({ open: true, action: 'approve' })}
                  >
                    Approve Mobile Change
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Current Mobile</p>
                  <p className="text-base font-bold text-gray-900">{expertData.mobileChangeRequest.currentMobile || populatedUser.phone || 'N/A'}</p>
                </div>
                <div className="bg-purple-50/70 p-4 rounded-lg border border-purple-200 shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 mb-1">Requested Mobile</p>
                  <p className="text-base font-bold text-purple-950">{expertData.mobileChangeRequest.requestedMobile}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Changes Comparison Panel */}
        {isExpert && expertData?.changeRequestStatus === 'pending' && expertData?.pendingData && (
          <Card className="mb-6 border-amber-200 bg-amber-50/20 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader className="bg-amber-500/10 border-b border-amber-200/50 py-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-amber-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-600 animate-pulse" />
                    Pending Profile Update Review
                  </CardTitle>
                  <p className="text-xs text-amber-700/80 mt-0.5">
                    Submitted for compliance verification on {expertData.changeRequestDate ? new Date(expertData.changeRequestDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                    onClick={() => setProfileUpdateDialog({
                      open: true,
                      action: 'reject_update',
                      title: 'Reject Profile Updates',
                      description: 'This will completely discard the pending changes and notify the expert.',
                      requiresReason: true
                    })}
                  >
                    Reject Update
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 text-xs h-8"
                    onClick={() => setProfileUpdateDialog({
                      open: true,
                      action: 'request_update_changes',
                      title: 'Request Corrections',
                      description: 'This will send feedback to the expert asking for revisions, but keeps their pending values.',
                      requiresReason: true
                    })}
                  >
                    Request Changes
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    onClick={() => setProfileUpdateDialog({
                      open: true,
                      action: 'approve_update',
                      title: 'Approve & Apply Updates',
                      description: 'This will merge the pending changes into the live profile and synchronize their display name.'
                    })}
                  >
                    Approve Update
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {expertData.changeRequestReason && (
                <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-md text-sm">
                  <p className="font-semibold text-amber-800 text-xs uppercase tracking-wide">Expert Reason for Change:</p>
                  <p className="text-amber-900 mt-1 italic font-medium">"{expertData.changeRequestReason}"</p>
                </div>
              )}

              <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700 w-1/4">Profile Field</th>
                      <th className="px-4 py-3 font-semibold text-red-700 w-3/8 bg-red-50/30">Current Live Value</th>
                      <th className="px-4 py-3 font-semibold text-emerald-700 w-3/8 bg-emerald-50/30">Proposed Pending Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Business Name Change */}
                    {expertData.pendingData.businessName !== undefined && (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">Legal Business Name</td>
                        <td className="px-4 py-3 text-red-600 font-mono bg-red-50/10">{expertData.businessName || '— (Not Set)'}</td>
                        <td className="px-4 py-3 text-emerald-700 font-mono font-semibold bg-emerald-50/10">{expertData.pendingData.businessName}</td>
                      </tr>
                    )}

                    {/* Entity Type Change */}
                    {expertData.pendingData.entityType !== undefined && (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">Legal Entity Type</td>
                        <td className="px-4 py-3 text-red-600 bg-red-50/10 capitalize">{expertData.entityType?.replace('_', ' ') || '— (Not Set)'}</td>
                        <td className="px-4 py-3 text-emerald-700 font-semibold bg-emerald-50/10 capitalize">{expertData.pendingData.entityType?.replace('_', ' ')}</td>
                      </tr>
                    )}

                    {/* Years Experience / Inception Date Change */}
                    {(expertData.pendingData.yearsExperience !== undefined || expertData.pendingData.experienceStartDate !== undefined) && (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">Experience / Inception</td>
                        <td className="px-4 py-3 text-red-600 bg-red-50/10">
                          {expertData.yearsExperience ? `${expertData.yearsExperience} Yrs Exp.` : (expertData.experienceStartDate ? `Since ${new Date(expertData.experienceStartDate).getFullYear()}` : '— (Not Set)')}
                        </td>
                        <td className="px-4 py-3 text-emerald-700 font-semibold bg-emerald-50/10">
                          {expertData.pendingData.yearsExperience ? `${expertData.pendingData.yearsExperience} Yrs Exp.` : (expertData.pendingData.experienceStartDate ? `Since ${new Date(expertData.pendingData.experienceStartDate).getFullYear()}` : '—')}
                        </td>
                      </tr>
                    )}

                    {/* Bank Account Details Changes */}
                    {expertData.pendingData.bankDetails !== undefined && (
                      <>
                        {/* Bank Details Header Row */}
                        <tr className="bg-slate-100/50">
                          <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase text-gray-500 tracking-wider">
                            Proposed Payout Bank Details
                          </td>
                        </tr>

                        {/* Bank Account Holder Name */}
                        {expertData.pendingData.bankDetails.accountHolderName !== undefined && (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 pl-8 text-gray-600">Account Holder Name</td>
                            <td className="px-4 py-3 text-red-600 bg-red-50/10">{expertData.bankDetails?.accountHolderName || '— (Not Set)'}</td>
                            <td className="px-4 py-3 text-emerald-700 font-semibold bg-emerald-50/10">{expertData.pendingData.bankDetails.accountHolderName}</td>
                          </tr>
                        )}

                        {/* Bank Name */}
                        {expertData.pendingData.bankDetails.bankName !== undefined && (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 pl-8 text-gray-600">Bank Name</td>
                            <td className="px-4 py-3 text-red-600 bg-red-50/10">{expertData.bankDetails?.bankName || '— (Not Set)'}</td>
                            <td className="px-4 py-3 text-emerald-700 font-semibold bg-emerald-50/10">{expertData.pendingData.bankDetails.bankName}</td>
                          </tr>
                        )}

                        {/* Branch Name */}
                        {expertData.pendingData.bankDetails.branchName !== undefined && (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 pl-8 text-gray-600">Branch Name</td>
                            <td className="px-4 py-3 text-red-600 bg-red-50/10">{expertData.bankDetails?.branchName || '— (Not Set)'}</td>
                            <td className="px-4 py-3 text-emerald-700 font-semibold bg-emerald-50/10">{expertData.pendingData.bankDetails.branchName}</td>
                          </tr>
                        )}

                        {/* Account Number */}
                        {expertData.pendingData.bankDetails.accountNumber !== undefined && (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 pl-8 text-gray-600">Account Number</td>
                            <td className="px-4 py-3 text-red-600 font-mono bg-red-50/10">{expertData.bankDetails?.accountNumber || '— (Not Set)'}</td>
                            <td className="px-4 py-3 text-emerald-700 font-mono font-semibold bg-emerald-50/10">{expertData.pendingData.bankDetails.accountNumber}</td>
                          </tr>
                        )}

                        {/* Account Type */}
                        {expertData.pendingData.bankDetails.accountType !== undefined && (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 pl-8 text-gray-600">Account Type</td>
                            <td className="px-4 py-3 text-red-600 bg-red-50/10 capitalize">{expertData.bankDetails?.accountType || '— (Not Set)'}</td>
                            <td className="px-4 py-3 text-emerald-700 font-semibold bg-emerald-50/10 capitalize">{expertData.pendingData.bankDetails.accountType}</td>
                          </tr>
                        )}

                        {/* IFSC Code */}
                        {expertData.pendingData.bankDetails.ifscCode !== undefined && (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 pl-8 text-gray-600">IFSC Code</td>
                            <td className="px-4 py-3 text-red-600 font-mono bg-red-50/10">{expertData.bankDetails?.ifscCode || '— (Not Set)'}</td>
                            <td className="px-4 py-3 text-emerald-700 font-mono font-semibold bg-emerald-50/10">{expertData.pendingData.bankDetails.ifscCode}</td>
                          </tr>
                        )}

                        {/* UPI ID */}
                        {expertData.pendingData.bankDetails.upiId !== undefined && (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 pl-8 text-gray-600">UPI ID</td>
                            <td className="px-4 py-3 text-red-600 font-mono bg-red-50/10">{expertData.bankDetails?.upiId || '— (Not Set)'}</td>
                            <td className="px-4 py-3 text-emerald-700 font-mono font-semibold bg-emerald-50/10">{expertData.pendingData.bankDetails.upiId || '— (None)'}</td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        <Accordion type="multiple" defaultValue={['basic', 'legal', 'portfolio', 'notes']} className="space-y-4">

          {/* 1. Basic Profile Information */}
          <AccordionItem value="basic" className="border rounded-lg bg-card px-4 shadow-sm">
            <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
              <div className="flex items-center gap-2">
                <span>1. Basic Profile Information</span>
                {(expertData?.location?.city || expertData?.registeredAddress?.city) && (
                  <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                    {expertData?.location?.city || expertData?.registeredAddress?.city}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6 px-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact</label>
                  <div className="mt-2 space-y-1">
                    <p className="font-medium">{populatedUser.fullName || expertData?.businessName || 'N/A'}</p>
                    <p className="text-muted-foreground">{populatedUser.email}</p>
                    <p className="text-muted-foreground">{populatedUser.phone || expertData?.mobileNumber || expertData?.whatsappNumber || populatedUser.mobile || expertData?.mobile || 'No mobile provided'}</p>
                    <div className="pt-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {isExpert ? 'Expert ID' : 'Seeker ID'}
                      </label>
                      <p className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 inline-block">
                        {isExpert 
                          ? (expertData.expertId || populatedUser.referenceId || 'PENDING')
                          : (populatedUser.referenceId || expertData.seekerId || 'PENDING')
                        }
                      </p>
                    </div>
                  </div>
                </div>
                {isExpert && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Web & Social</label>
                    <div className="mt-2 space-y-1">
                      {expertData?.website ? (
                        <a href={expertData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block truncate">
                          {expertData.website}
                        </a>
                      ) : <p className="text-muted-foreground">-</p>}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Location</label>
                  <div className="mt-2 text-muted-foreground">
                    {(() => {
                      const loc = expertData?.location;
                      const ra = expertData?.registeredAddress;
                      const city = (loc?.city || ra?.city || '').trim();
                      const state = (ra?.state || '').trim();
                      const country = (loc?.country || ra?.country || '').trim() || 'India';
                      if (!city && !state) return <p>—</p>;
                      const parts = [city || null, state || null, country].filter(Boolean);
                      return <p>{parts.join(', ')}</p>;
                    })()}
                  </div>
                </div>
              </div>
              {expertData?.registeredAddress && (
                <div className="mt-6 pt-4 border-t">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registered Office Address</label>
                  <div className="mt-2 text-sm">
                    <p>{expertData.registeredAddress.line1}</p>
                    {expertData.registeredAddress.line2 && <p>{expertData.registeredAddress.line2}</p>}
                    <p>{expertData.registeredAddress.city}, {expertData.registeredAddress.state} - {expertData.registeredAddress.pincode}</p>
                    <p>{expertData.registeredAddress.country}</p>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 2. Professional & Business Details */}
          {isExpert && (
            <AccordionItem value="professional" className="border rounded-lg bg-card px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
                2. Professional & Business Details
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Entity</label>
                    <p className="mt-1 font-medium">{expertData?.businessName || '-'}</p>
                    <p className="text-xs text-muted-foreground">{expertData?.brandAlias ? `(${expertData.brandAlias})` : ''}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role & Experience</label>
                    <p className="mt-1 font-semibold text-gray-900">{expertData?.businessRole || '-'}</p>
                    {(() => {
                      let years = expertData?.yearsExperience ?? expertData?.yearsOfExperience ?? expertData?.experienceYears;
                      const startDate = expertData?.experienceStartDate || expertData?.inceptionDate;
                      if ((years === undefined || years === null || Number(years) === 0) && startDate) {
                        const d = new Date(startDate).getTime();
                        if (!isNaN(d)) {
                          years = Math.max(0, Math.round(((Date.now() - d) / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10);
                        }
                      }
                      const formattedDate = startDate ? (() => {
                        const d = new Date(startDate);
                        return !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null;
                      })() : null;
                      const isoDate = startDate ? (() => {
                        const d = new Date(startDate);
                        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(startDate).split('T')[0];
                      })() : null;

                      if (!years && !startDate) {
                        return <p className="text-xs text-muted-foreground mt-1">Experience not specified</p>;
                      }

                      return (
                        <div className="mt-1.5 space-y-1">
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {years ? `${years} ${Number(years) === 1 ? 'Year' : 'Years'} Exp.` : 'Experience Verified'}
                            {formattedDate ? ` (Since ${formattedDate})` : ''}
                          </div>
                          {isoDate && (
                            <p className="text-[11px] text-muted-foreground font-mono">
                              Inception: <span className="font-semibold text-gray-700">{isoDate}</span>
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bio</label>
                    <p className="mt-1 text-muted-foreground leading-relaxed max-w-2xl">{expertData?.bio || '-'}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 3. Expertise & Services */}
          {isExpert && (
            <AccordionItem value="expertise" className="border rounded-lg bg-card px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
                3. Expertise & Market Fit
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 px-1">
                <div className="space-y-6">
                  <div className="md:grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Core Services</label>
                        {(() => {
                          const displayCategories = (userData.categories && userData.categories.length > 0)
                            ? userData.categories
                            : (Array.isArray(userData.services)
                                ? Array.from(new Set(userData.services.map((s: any) => s?.serviceHead || s?.category).filter(Boolean)))
                                : (Array.isArray(userData.servicesOffered) ? userData.servicesOffered : []));

                          const displaySubServices = (userData.subServices && userData.subServices.length > 0)
                            ? userData.subServices
                            : (Array.isArray(userData.services)
                                ? Array.from(new Set(userData.services.flatMap((s: any) => [...(s?.primaryFilters || []), ...(s?.subFilters || [])]).filter(Boolean)))
                                : []);

                          return (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {displayCategories.map((c: string, i: number) => <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700">{c}</Badge>)}
                              {displaySubServices.map((c: string, i: number) => <Badge key={`sub-${i}`} variant="outline" className="text-xs">{c}</Badge>)}
                              {displayCategories.length === 0 && displaySubServices.length === 0 && (
                                <span className="text-xs text-muted-foreground italic">No core services listed</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Industries & Market Fit</label>
                          {type === 'experts' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[11px] font-bold gap-1 text-primary border-primary/30 hover:bg-primary/5 px-2 rounded-full"
                              onClick={() => {
                                const existingSectors = (userData.industrySectors && userData.industrySectors.length > 0)
                                  ? userData.industrySectors
                                  : (userData.industrySector ? [userData.industrySector] : []);
                                setAdminSectors(existingSectors);
                                setAdminSubSectors(userData.industrySubSectors || userData.subIndustries || []);
                                setTaxonomyModalOpen(true);
                              }}
                            >
                              <Edit2 className="w-3 h-3" /> Edit Industry
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {userData.industrySector && (
                            <Badge variant="default" className="bg-emerald-600 text-white font-bold">
                              Sector: {userData.industrySector}
                            </Badge>
                          )}
                          {userData.industrySectors?.filter((c: string) => c !== userData.industrySector).map((c: string, i: number) => (
                            <Badge key={i} variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/50">{c}</Badge>
                          ))}
                          {(userData.industrySubSectors || userData.subIndustries)?.map((c: string, i: number) => (
                            <Badge key={`subind-${i}`} variant="outline" className="text-[10px]">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 mt-4 md:mt-0">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client Scales Served</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {userData.clientScales?.map((c: string, i: number) => <Badge key={i} variant="secondary" className="bg-purple-50 text-purple-700">{c}</Badge>)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Types Served</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {userData.businessTypesServed?.map((c: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Commercial & Delivery Models</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Budget Value / Min Engagement</p>
                        <p className="text-sm font-bold text-gray-900">
                          {userData.minEngagementValue
                            ? `₹${Number(userData.minEngagementValue).toLocaleString('en-IN')} ${userData.minEngagementUnit || 'Per Project'}`
                            : (userData.hourlyRate ? `₹${userData.hourlyRate}/hr` : '-')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Engagement Models</p>
                        <div className="flex flex-wrap gap-1">
                          {userData.engagementModels?.map((m: string, i: number) => <Badge key={i} variant="outline" className="text-[10px]">{m}</Badge>)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Pricing Models</p>
                        <div className="flex flex-wrap gap-1">
                          {userData.pricingStyle?.map((p: string, i: number) => <Badge key={i} variant="outline" className="text-[10px]">{p}</Badge>)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Delivery Channels</p>
                        <div className="flex flex-wrap gap-1">
                          {userData.deliveryChannels?.map((d: string, i: number) => <Badge key={i} variant="outline" className="text-[10px]">{d}</Badge>)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Technical Proficiency</label>
                    <div className="md:grid md:grid-cols-2 gap-8 mt-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Tools & Technologies</p>
                        <div className="flex flex-wrap gap-2">
                          {userData.tools?.map((c: string, i: number) => <Badge key={i} variant="outline" className="font-mono text-[10px]">{c}</Badge>)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Languages</p>
                        <p className="font-medium text-gray-900">{userData.languages?.join(', ') || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 4. Service Coverage */}
          {isExpert && (
            <AccordionItem value="coverage" className="border rounded-lg bg-card px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
                4. Service Coverage
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 px-1">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    {userData.panIndiaAvailable && (!userData.serviceDeliveryStates || userData.serviceDeliveryStates.length === 0) ? (
                      <div className="px-4 py-2 rounded-lg border flex items-center gap-2 bg-emerald-50 border-emerald-200 text-emerald-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold">Pan-India Availability</span>
                      </div>
                    ) : (
                      <div className="px-4 py-2 rounded-lg border flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold">Specific City / Regional Coverage</span>
                      </div>
                    )}
                  </div>
                  {(() => {
                    const regions = (userData.serviceDeliveryStates && userData.serviceDeliveryStates.length > 0)
                      ? userData.serviceDeliveryStates
                      : (Array.isArray(userData.serviceArea) && userData.serviceArea.filter((r: string) => r !== 'Pan India').length > 0
                          ? userData.serviceArea.filter((r: string) => r !== 'Pan India')
                          : []);
                    return regions.length > 0 ? (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                          Selected Delivery Regions / Cities ({regions.length})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {regions.map((state: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-800 font-medium px-2.5 py-1">{state}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 4. Portfolio & Work Samples */}
          {isExpert && (
            <AccordionItem value="portfolio" className="border rounded-lg bg-card px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
                <div className="flex items-center gap-2">
                  <span>5. Portfolio & Work Samples</span>
                  {(!userData.portfolioItems || userData.portfolioItems.length === 0) && <Badge variant="destructive" className="ml-2 text-[10px] h-5">Missing</Badge>}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 px-1">
                {userData.portfolioItems && userData.portfolioItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userData.portfolioItems.map((item: any, idx: number) => (
                      <div key={idx} className="border rounded-md p-3 flex gap-3 items-start bg-gray-50/50">
                        <div className="bg-white p-2 border rounded shadow-sm">
                          {item.type === 'pdf' ? <FileText className="h-6 w-6 text-red-500" /> :
                            item.type === 'video' ? <Video className="h-6 w-6 text-blue-500" /> :
                              <ImageIcon className="h-6 w-6 text-purple-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.title || `Portfolio Item ${idx + 1}`}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{item.description || item.type}</p>
                          <div className="flex gap-2 mt-2">
                            {item.url && String(item.url).trim() ? (
                              <Button size="sm" variant="ghost" className="h-6 text-xs px-0 hover:bg-transparent hover:text-blue-600 text-blue-600"
                                onClick={() => handleViewDocument(item.url)}>
                                View
                              </Button>
                            ) : (
                              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                No document attached
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-muted-foreground text-sm">No portfolio items uploaded.</p>
                  </div>
                )}
                {/* Portfolio URLs fallback */}
                {userData.portfolioUrls?.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">External Links</label>
                    <div className="space-y-1 mt-2">
                      {userData.portfolioUrls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                          <LinkIcon className="h-3 w-3" /> {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 5. Certifications */}
          {isExpert && (
            <AccordionItem value="certifications" className="border rounded-lg bg-card px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
                6. Certifications & Credentials
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 px-1">
                {userData.certifications?.length > 0 ? (
                  <div className="space-y-3">
                    {userData.certifications.map((cert: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-sm">{cert.name}</p>
                          <p className="text-xs text-muted-foreground">{cert.issuer} • {cert.year}</p>
                        </div>
                        {cert.fileUrl && (
                          <DocumentPill label="Certificate" url={cert.fileUrl} handleView={handleViewDocument} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No certifications listed.</p>}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 6. Key Team Members */}
          {isExpert && (
            <AccordionItem value="team" className="border rounded-lg bg-card px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
                7. Key Team Members
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 px-1">
                {userData.teamMembers?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userData.teamMembers.map((member: any, idx: number) => (
                      <div key={idx} className="border rounded-md p-4 flex flex-col items-center text-center bg-gray-50/50">
                        <div className="mb-3">
                          {member.photoUrl ? (
                            <img src={ensureAbsoluteUrl(member.photoUrl)} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                              <span className="text-slate-400 text-xl font-bold">{member.name?.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <p className="font-semibold text-sm">{member.name}</p>
                        <p className="text-xs text-blue-600 font-medium mb-2">{member.role}</p>
                        <div className="flex flex-wrap justify-center gap-1 mb-2">
                          {member.expertise?.map((exp: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5">{exp}</Badge>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{member.experience} Years Exp.</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No team members listed.</p>}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 7. Client Testimonials */}
          {isExpert && (
            <AccordionItem value="testimonials" className="border rounded-lg bg-card px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
                8. Client Testimonials
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 px-1">
                {userData.testimonials?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userData.testimonials.map((testi: any, idx: number) => (
                      <div key={idx} className="border rounded-md p-4 bg-gray-50/50">
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="outline" className="capitalize text-[10px]">{testi.type}</Badge>
                          {testi.source && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 capitalize text-[10px]">{testi.source}</Badge>
                          )}
                        </div>
                        {testi.type === 'screenshot' && testi.url ? (
                          <div className="relative group cursor-pointer" onClick={() => handleViewDocument(testi.url)}>
                            <img src={ensureAbsoluteUrl(testi.url)} alt="Testimonial" className="w-full h-40 object-cover rounded border shadow-sm" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                              <LinkIcon className="text-white h-6 w-6" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {testi.content && <p className="text-sm italic text-gray-700">"{testi.content}"</p>}
                            {testi.url && (
                              <a href={testi.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" /> View Original Review
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No testimonials listed.</p>}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 8. Legal & Compliance */}
          <AccordionItem value="legal" className="border rounded-lg bg-card px-4 shadow-sm border-l-4 border-l-blue-100">
            <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
              <div className="flex items-center gap-2">
                <span>{isExpert ? '9. Legal & Compliance' : '2. Legal & Compliance'}</span>
                {/* Check if all mandatory docs present */}
                {(isExpert && !userData.documents?.length) && <Badge variant="destructive" className="ml-2 text-[10px]">Action Required</Badge>}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6 px-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Legal Entity</label>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      <div className="p-3 bg-gray-50 rounded border flex-1 min-w-[120px]">
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-semibold text-sm">{userData.entityType?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border flex-1 min-w-[120px]">
                        <p className="text-xs text-muted-foreground">GST</p>
                        <p className="font-semibold text-sm">
                          {userData.gstNumber
                            ? 'Yes'
                            : (userData.isGstRegistered === true || userData.gstRegistered === 'yes' || userData.gstStatus === 'registered'
                                ? 'Yes'
                                : (userData.isGstRegistered === false || userData.gstRegistered === 'no' || userData.gstStatus === 'not_registered' ? 'No' : 'N/A'))}
                        </p>
                        {userData.gstNumber && <p className="text-[10px] font-mono mt-1 text-slate-600">{userData.gstNumber}</p>}
                      </div>
                      <div className="p-3 bg-gray-50 rounded border flex-1 min-w-[120px]">
                        <p className="text-xs text-muted-foreground">PAN</p>
                        <p className="font-mono text-sm">
                          {userData.panNumber
                            ? userData.panNumber
                            : (userData.isPanRegistered === true || userData.panRegistered === 'yes'
                                ? 'Yes'
                                : (userData.isPanRegistered === false || userData.panRegistered === 'no' ? 'No' : 'N/A'))}
                        </p>
                      </div>
                      {userData.cinNumber && (
                        <div className="p-3 bg-gray-50 rounded border flex-1 min-w-[120px]">
                          <p className="text-xs text-muted-foreground">CIN</p>
                          <p className="font-mono text-sm">{userData.cinNumber}</p>
                        </div>
                      )}
                      {userData.llpinNumber && (
                        <div className="p-3 bg-gray-50 rounded border flex-1 min-w-[120px]">
                          <p className="text-xs text-muted-foreground">LLPIN</p>
                          <p className="font-mono text-sm">{userData.llpinNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {userData.bankDetails && (
                    <div className="pt-4 border-t mt-4">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-3">Bank Payout Details</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/30 p-4 rounded-lg border border-emerald-100">
                        <div>
                          <p className="text-xs text-muted-foreground">Account Holder</p>
                          <p className="font-semibold text-sm">{userData.bankDetails.accountHolderName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Bank & Branch</p>
                          <p className="font-medium text-sm">{userData.bankDetails.bankName || 'N/A'} - {userData.bankDetails.branchName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Account Info</p>
                          <p className="font-mono text-sm">{userData.bankDetails.accountNumber || 'N/A'} ({userData.bankDetails.accountType || 'current'})</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">IFSC & UPI</p>
                          <p className="font-mono text-sm">{userData.bankDetails.ifscCode || 'N/A'} | {userData.bankDetails.upiId || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {userData.complianceBadges && (
                    <div className="pt-4 border-t mt-4">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-3">Special Certifications</label>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {userData.complianceBadges.startupIndia && <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Startup India</Badge>}
                        {userData.complianceBadges.msme && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">MSME</Badge>}
                        {userData.complianceBadges.iso && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">ISO Certified</Badge>}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                      <Shield className="h-3 w-3" /> Verification Status (For Admin)
                    </label>
                    <div className="space-y-3">
                      {isExpert ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">KYC Verified</span>
                          <Switch checked={kycVerified} onCheckedChange={(c) => updateKYCMutation.mutate(c)} disabled={updateKYCMutation.isPending} />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Identity Verified</span>
                            <Switch checked={identityVerified} onCheckedChange={(c) => updateIdentityMutation.mutate(c)} disabled={updateIdentityMutation.isPending} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Compliance Verified</span>
                            <Switch checked={authorizationVerified} onCheckedChange={(c) => updateAuthorizationMutation.mutate(c)} disabled={updateAuthorizationMutation.isPending} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 block">Compliance Documents</label>
                    <div className="flex flex-wrap gap-2">
                      {/* Expert Specific Docs */}
                      {isExpert && (
                        <>
                          {['Certificate of Incorporation', 'CIN', 'LLPIN', 'Partnership Deed'].map((type) => {
                            const doc = userData.documents?.find((d: any) => d.documentType === type || d.type === type);
                            // Simplified logic: If doc exists, show it.
                            // For key business docs, we check entity type to know if missing. But let's show what we have + standard missing ones if needed.
                            // For now, just listing uploaded docs as pills is a huge improvement.
                            return doc ? <DocumentPill key={type} label={type} url={doc.fileUrl} handleView={handleViewDocument} /> : null;
                          })}
                          <DocumentPill
                            label={businessPanPillLabel(userData.entityType)}
                            url={getExpertBusinessPanUrl(userData.entityType, userData.documents)}
                            handleView={handleViewDocument}
                          />
                          <DocumentPill label="Auth. Signatory PAN" url={userData.documents?.find((d: any) => d.documentType === 'Authorized Signatory PAN' || d.type === 'Authorized Signatory PAN')?.fileUrl} isOptional={true} handleView={handleViewDocument} />
                          <DocumentPill label="GST Certificate" url={userData.documents?.find((d: any) => d.documentType === 'GST Certificate' || d.type === 'GST Certificate')?.fileUrl} isOptional={!userData.gstRegistered || userData.gstRegistered === 'no'} handleView={handleViewDocument} />
                        </>
                      )}

                      {/* Common Docs */}
                      <DocumentPill label="Address Proof" url={userData.registeredAddress?.proofUrl} handleView={handleViewDocument} />
                      <DocumentPill label="Bank Proof" url={userData.bankDetails?.proofUrl} handleView={handleViewDocument} />

                      {/* Listing other random docs */}
                      {userData.documents?.filter((d: any) => !isListedComplianceDoc(d)).map((doc: any, i: number) => (
                        <DocumentPill key={i} label={doc.documentType} url={doc.fileUrl} handleView={handleViewDocument} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 7. Admin Internal Notes */}
          <AccordionItem value="notes" className="border rounded-lg bg-card px-4 shadow-sm border-l-4 border-l-amber-100">
            <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
              {isExpert ? '10. Admin Internal Notes' : '3. Admin Internal Notes'}
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6 px-1">
              <Textarea
                placeholder="Add internal notes, audit comments, or review feedback here..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full resize-y text-sm"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" variant="outline" onClick={() => updateNotesMutation.mutate(adminNotes)}>Save Note Only</Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 8. Marketplace Activity Log */}
          <AccordionItem value="audit" className="border rounded-lg bg-card px-4 shadow-sm">
            <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold text-muted-foreground">
              {isExpert ? '11. Marketplace Activity Log' : '4. Marketplace Activity Log'}
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6 px-1">
              <UserActivityLog userId={userId!} />
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>

      {/* Sticky Bottom Actions */}
      {isExpert ? (
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 z-40 flex items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/admin/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {expertData?.profileStatus === 'verified' && (
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setActionDialog({
                  open: true,
                  title: 'Suspend Expert Profile',
                  description: 'This will temporarily restrict the expert’s workspace access and platform activities. They will see the suspension page upon login.',
                  action: 'suspend',
                  requiresReason: true
                })}
              >
                Suspend
              </Button>
            )}
            {expertData?.profileStatus === 'suspended' && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setActionDialog({
                  open: true,
                  title: 'Reactivate Expert Profile',
                  description: 'This will restore full workspace access and dashboard capabilities for this expert.',
                  action: 'reactivate',
                  requiresReason: false
                })}
              >
                Reactivate
              </Button>
            )}
            {expertData?.profileStatus !== 'verified' && expertData?.profileStatus !== 'suspended' && (
              <>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setActionDialog({ open: true, title: 'Reject Profile', description: 'This will notify the expert and require them to make changes.', action: 'reject', requiresReason: true })}>
                  Reject
                </Button>
                {expertData?.documentsRequested ? (
                  <Button variant="outline" disabled className="bg-orange-50 text-orange-600 border-orange-200">Docs Requested</Button>
                ) : (
                  <Button variant="outline" onClick={() => setActionDialog({ open: true, title: 'Request Documents', description: 'Specify what documents are missing or need updating.', action: 'request_docs', requiresReason: true })}>
                    Request Docs
                  </Button>
                )}
                <Button className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setActionDialog({ open: true, title: 'Approve Profile', description: 'This expert will be live on the marketplace immediately.', action: 'approve' })}>
                  Approve
                </Button>
              </>
            )}
            <Separator orientation="vertical" className="h-8 mx-2" />
            <Button
              className="bg-slate-800 text-white"
              onClick={() => handleSaveAndNext()}
            >
              Save & Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 z-40 flex items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/admin/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <span className="text-xs text-muted-foreground ml-2">Verification and compliance actions are available within respective sections.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-green-600 text-white"
              onClick={() => handleSaveAndNext()}
            >
              Save Changes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Action Dialog (Keep Existing) */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.title}</DialogTitle>
            <DialogDescription>{actionDialog.description}</DialogDescription>
          </DialogHeader>

          {actionDialog.requiresReason && (
            <div className="py-2">
              <Label htmlFor="reason" className="text-right mb-2 block font-medium text-sm">
                {actionDialog.action === 'suspend' ? 'Suspension Reason *' : actionDialog.action === 'reject' ? 'Rejection Reason *' : 'Reason / Requirements'}
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter details..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className={(actionDialog.action === 'reject' || actionDialog.action === 'suspend') && actionReason.length > 0 && actionReason.trim().length < 10 ? "border-red-500" : ""}
              />
              {(actionDialog.action === 'reject' || actionDialog.action === 'suspend') && (
                <p className="text-[10px] text-muted-foreground mt-1">Minimum 10 characters required.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ ...actionDialog, open: false })}>
              Cancel
            </Button>
            <Button
              onClick={executeAction}
              variant={actionDialog.action === 'reject' || actionDialog.action === 'suspend' ? "destructive" : "default"}
              disabled={
                suspendExpertMutation.isPending ||
                reactivateExpertMutation.isPending ||
                (actionDialog.requiresReason && ((actionDialog.action === 'reject' || actionDialog.action === 'suspend') ? actionReason.trim().length < 10 : !actionReason.trim()))
              }
            >
              {(suspendExpertMutation.isPending || reactivateExpertMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Update Action Dialog */}
      <Dialog open={profileUpdateDialog.open} onOpenChange={(open) => setProfileUpdateDialog({ ...profileUpdateDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              {profileUpdateDialog.title}
            </DialogTitle>
            <DialogDescription>{profileUpdateDialog.description}</DialogDescription>
          </DialogHeader>

          {profileUpdateDialog.requiresReason && (
            <div className="py-2 space-y-2">
              <Label htmlFor="updateReason" className="text-right block">
                Reason / Actionable Feedback *
              </Label>
              <Textarea
                id="updateReason"
                placeholder="Enter feedback for the expert explaining what needs to be changed or why this is being rejected..."
                value={profileUpdateReason}
                onChange={(e) => setProfileUpdateReason(e.target.value)}
                className={profileUpdateReason.length > 0 && profileUpdateReason.trim().length < 5 ? "border-red-500" : ""}
                rows={4}
              />
              <p className="text-[10px] text-muted-foreground">Minimum 5 characters required.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileUpdateDialog({ ...profileUpdateDialog, open: false })}>
              Cancel
            </Button>
            <Button
              onClick={executeProfileUpdateAction}
              variant={profileUpdateDialog.action === 'reject_update' ? "destructive" : "default"}
              disabled={
                approveProfileUpdateMutation.isPending || 
                rejectProfileUpdateMutation.isPending || 
                requestProfileUpdateChangesMutation.isPending ||
                (profileUpdateDialog.requiresReason && profileUpdateReason.trim().length < 5)
              }
            >
              {approveProfileUpdateMutation.isPending || rejectProfileUpdateMutation.isPending || requestProfileUpdateChangesMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LEGAL NAME CHANGE REVIEW DIALOG */}
      <Dialog open={legalNameReviewDialog.open} onOpenChange={(open) => setLegalNameReviewDialog({ ...legalNameReviewDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {legalNameReviewDialog.action === 'approve' ? 'Approve Legal Name Change' : 'Reject Legal Name Change'}
            </DialogTitle>
            <DialogDescription>
              {legalNameReviewDialog.action === 'approve'
                ? `Are you sure you want to approve updating this expert's legal name to "${expertData?.legalNameChangeRequest?.requestedLegalName}"?`
                : 'Please specify the reason for rejecting this legal name change request:'}
            </DialogDescription>
          </DialogHeader>

          {legalNameReviewDialog.action === 'reject' && (
            <div className="py-2 space-y-2">
              <Label htmlFor="legalNameRejectReason" className="text-xs font-bold text-gray-700">
                Rejection Reason *
              </Label>
              <Textarea
                id="legalNameRejectReason"
                placeholder="Explain why the proof is invalid or what document is required..."
                value={legalNameRejectReason}
                onChange={(e) => setLegalNameRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLegalNameReviewDialog({ open: false, action: null })}>
              Cancel
            </Button>
            <Button
              variant={legalNameReviewDialog.action === 'reject' ? "destructive" : "default"}
              disabled={
                reviewLegalNameMutation.isPending ||
                (legalNameReviewDialog.action === 'reject' && !legalNameRejectReason.trim())
              }
              onClick={() => {
                if (legalNameReviewDialog.action) {
                  reviewLegalNameMutation.mutate({
                    action: legalNameReviewDialog.action,
                    rejectionReason: legalNameReviewDialog.action === 'reject' ? legalNameRejectReason.trim() : undefined,
                  });
                }
              }}
            >
              {reviewLegalNameMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {legalNameReviewDialog.action === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MOBILE NUMBER CHANGE REVIEW DIALOG */}
      <Dialog open={mobileReviewDialog.open} onOpenChange={(open) => setMobileReviewDialog({ ...mobileReviewDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {mobileReviewDialog.action === 'approve' ? 'Approve Mobile Change' : 'Reject Mobile Change'}
            </DialogTitle>
            <DialogDescription>
              {mobileReviewDialog.action === 'approve'
                ? `Are you sure you want to approve updating this expert's mobile number to "${expertData?.mobileChangeRequest?.requestedMobile}"?`
                : 'Please specify the reason for rejecting this mobile number change request:'}
            </DialogDescription>
          </DialogHeader>

          {mobileReviewDialog.action === 'reject' && (
            <div className="py-2 space-y-2">
              <Label htmlFor="mobileRejectReason" className="text-xs font-bold text-gray-700">
                Rejection Reason *
              </Label>
              <Textarea
                id="mobileRejectReason"
                placeholder="Explain why this mobile change cannot be processed..."
                value={mobileRejectReason}
                onChange={(e) => setMobileRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMobileReviewDialog({ open: false, action: null })}>
              Cancel
            </Button>
            <Button
              variant={mobileReviewDialog.action === 'reject' ? "destructive" : "default"}
              disabled={
                reviewMobileMutation.isPending ||
                (mobileReviewDialog.action === 'reject' && !mobileRejectReason.trim())
              }
              onClick={() => {
                if (mobileReviewDialog.action) {
                  reviewMobileMutation.mutate({
                    action: mobileReviewDialog.action,
                    rejectionReason: mobileReviewDialog.action === 'reject' ? mobileRejectReason.trim() : undefined,
                  });
                }
              }}
            >
              {reviewMobileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {mobileReviewDialog.action === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADMIN INDUSTRY TAXONOMY EDIT MODAL */}
      <Dialog open={taxonomyModalOpen} onOpenChange={setTaxonomyModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-poppins text-gray-900">
              Edit Expert Industry Taxonomy
            </DialogTitle>
            <DialogDescription>
              Manually classify or reassign the Industry Sector and Sub-Sectors for this Expert profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Multi-Sector Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Industry Sectors (Multi-Select) *
                </Label>
                <span className="text-xs font-medium text-muted-foreground">
                  {adminSectors.length} sector{adminSectors.length === 1 ? '' : 's'} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                {INDUSTRY_SECTORS.map((sec) => {
                  const isSelected = adminSectors.includes(sec);
                  return (
                    <label
                      key={sec}
                      className={`flex items-center space-x-2 text-xs font-medium cursor-pointer p-2 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary font-bold'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setAdminSectors(adminSectors.filter((s) => s !== sec));
                          } else {
                            setAdminSectors([...adminSectors, sec]);
                          }
                        }}
                        className="rounded-xs border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="truncate">{sec}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Sub-Sectors grouped under each selected sector */}
            {adminSectors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Sub-Sectors for Selected Industries
                  </Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {adminSubSectors.length} selected
                  </span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {adminSectors.map((sec) => {
                    const sectorSubs = INDUSTRY_SECTOR_TO_SUB_SECTORS[sec as IndustrySector] || [];
                    if (sectorSubs.length === 0) return null;
                    const selectedInSector = sectorSubs.filter((s) => adminSubSectors.includes(s));
                    const allInSectorSelected = selectedInSector.length === sectorSubs.length;

                    return (
                      <div key={sec} className="border border-gray-200 rounded-xl p-3 bg-white shadow-xs space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-xs font-bold text-gray-800">{sec}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[10px] font-bold text-primary hover:bg-primary/10 px-2 rounded-full"
                            onClick={() => {
                              if (allInSectorSelected) {
                                setAdminSubSectors(adminSubSectors.filter((s) => !sectorSubs.includes(s)));
                              } else {
                                const newSubs = Array.from(new Set([...adminSubSectors, ...sectorSubs]));
                                setAdminSubSectors(newSubs);
                              }
                            }}
                          >
                            {allInSectorSelected ? 'Deselect Sector' : 'Select All'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {sectorSubs.map((sub) => {
                            const isChecked = adminSubSectors.includes(sub);
                            return (
                              <label
                                key={sub}
                                className="flex items-center space-x-2 text-xs font-medium text-gray-800 cursor-pointer p-1 rounded-md hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setAdminSubSectors(adminSubSectors.filter((s) => s !== sub));
                                    } else {
                                      setAdminSubSectors([...adminSubSectors, sub]);
                                    }
                                  }}
                                  className="rounded-xs border-gray-300 text-primary focus:ring-primary"
                                />
                                <span>{sub}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaxonomyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAdminTaxonomy}
              disabled={isSavingTaxonomy}
              className="bg-primary hover:bg-primary/95 text-white font-bold"
            >
              {isSavingTaxonomy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Taxonomy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Edit Profile Modal */}
      <AdminEditProfileModal
        open={isEditProfileModalOpen}
        onOpenChange={setIsEditProfileModalOpen}
        userData={userData}
        type={type || 'expert'}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['userDetail', type, userId] });
        }}
      />
    </AppDashboardLayout>
  );
};

export default UserDetail;
