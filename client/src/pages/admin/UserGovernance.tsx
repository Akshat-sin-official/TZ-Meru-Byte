/**
 * User Governance
 * 
 * Admin-only user and profile management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  CheckCircle,
  MoreVertical,
  Eye,
  Check,
  X,
  Shield,
  RotateCcw,
  Trash2,
  FileText,
  XCircle,
  Edit2,
} from 'lucide-react';
import { AdminEditProfileModal } from '@/components/admin/AdminEditProfileModal';
import { useAdminSidebar } from '@/hooks/useAdminSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { adminService, ExpertListItem, SeekerListItem } from '@/services/adminService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

const UserGovernance = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const sidebarSections = useAdminSidebar();
  const [activeTab, setActiveTab] = useState('experts');
  const [expertPage, setExpertPage] = useState(1);
  const [seekerPage, setSeekerPage] = useState(1);
  const [expertFilters, setExpertFilters] = useState({
    status: '',
    search: '',
    kycVerified: '',
  });
  const [seekerFilters, setSeekerFilters] = useState({
    status: '',
    search: '',
    identityVerified: '',
    authorizationVerified: '',
  });
  const [selectedUser, setSelectedUser] = useState<{ id: string; type: 'expert' | 'seeker' } | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: string;
    title: string;
    description: string;
    requiresReason: boolean;
  }>({
    open: false,
    action: '',
    title: '',
    description: '',
    requiresReason: false,
  });
  const [actionReason, setActionReason] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // Admin Edit Profile Modal State
  const [editModalUser, setEditModalUser] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalType, setEditModalType] = useState<'experts' | 'seekers'>('experts');

  const handleEditProfile = (targetUser: any, type: 'experts' | 'seekers') => {
    setEditModalUser(targetUser);
    setEditModalType(type);
    setEditModalOpen(true);
  };

  const DOCUMENT_OPTIONS = [
    { id: 'businessLogo', label: 'Business Logo' },
    { id: 'profileImage', label: 'Profile Image' },
    { id: 'portfolioItems', label: 'Portfolio Items' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'registeredAddressProof', label: 'Address Proof' },
    { id: 'bankDetailsProof', label: 'Bank Details Proof' },
    { id: 'panCard', label: 'PAN Card' },
    { id: 'gstCertificate', label: 'GST Certificate' },
    { id: 'cinCertificate', label: 'CIN Certificate' },
    { id: 'llpinCertificate', label: 'LLPIN Certificate' },
    { id: 'msmeCertificate', label: 'MSME Certificate' },
    { id: 'isoCertificate', label: 'ISO Certificate' },
  ];

  // Fetch experts list
  const {
    data: expertsData,
    isLoading: expertsLoading,
  } = useQuery({
    queryKey: ['adminExperts', expertPage, expertFilters],
    queryFn: () =>
      adminService.getExpertsList({
        page: expertPage,
        limit: 10,
        status: expertFilters.status as any,
        search: expertFilters.search || undefined,
        kycVerified: expertFilters.kycVerified === 'true' ? true : expertFilters.kycVerified === 'false' ? false : expertFilters.kycVerified === 'rejected' ? 'rejected' : undefined,
      }),
    enabled: activeTab === 'experts',
  });

  // Fetch seekers list
  const {
    data: seekersData,
    isLoading: seekersLoading,
  } = useQuery({
    queryKey: ['adminSeekers', seekerPage, seekerFilters],
    queryFn: () =>
      adminService.getSeekersList({
        page: seekerPage,
        limit: 10,
        status: seekerFilters.status as any,
        search: seekerFilters.search || undefined,
        identityVerified:
          seekerFilters.identityVerified === 'true'
            ? true
            : seekerFilters.identityVerified === 'false'
              ? false
              : undefined,
        authorizationVerified:
          seekerFilters.authorizationVerified === 'true'
            ? true
            : seekerFilters.authorizationVerified === 'false'
              ? false
              : undefined,
      }),
    enabled: activeTab === 'seekers',
  });

  // Approve expert mutation
  const approveExpertMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminService.approveExpertProfile(userId, reason),
    onSuccess: () => {
      toast.success('Expert profile approved');
      queryClient.invalidateQueries({ queryKey: ['adminExperts'] });
      setActionDialog({ ...actionDialog, open: false });
      setActionReason('');
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to approve expert profile');
    },
  });

  // Reject expert mutation
  const rejectExpertMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.rejectExpertProfile(userId, reason),
    onSuccess: () => {
      toast.success('Expert profile rejected');
      queryClient.invalidateQueries({ queryKey: ['adminExperts'] });
      setActionDialog({ ...actionDialog, open: false });
      setActionReason('');
      setSelectedDocs([]);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reject expert profile');
    },
  });

  // Request documents mutation
  const requestDocumentsMutation = useMutation({
    mutationFn: ({ userId, requirements, requestedDocs }: { userId: string; requirements: string; requestedDocs?: string[] }) =>
      adminService.requestExpertDocuments(userId, requirements, requestedDocs),
    onSuccess: () => {
      toast.success('Documents requested successfully');
      queryClient.invalidateQueries({ queryKey: ['adminExperts'] });
      setActionDialog({ ...actionDialog, open: false });
      setActionReason('');
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to request documents');
    },
  });

  // Suspend expert mutation
  const suspendExpertMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.suspendExpertProfile(userId, reason),
    onSuccess: () => {
      toast.success('Expert profile suspended');
      queryClient.invalidateQueries({ queryKey: ['adminExperts'] });
      setActionDialog({ ...actionDialog, open: false });
      setActionReason('');
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to suspend expert profile');
    },
  });

  // Reactivate expert mutation
  const reactivateExpertMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminService.reactivateExpertProfile(userId, reason),
    onSuccess: () => {
      toast.success('Expert profile reactivated');
      queryClient.invalidateQueries({ queryKey: ['adminExperts'] });
      setActionDialog({ ...actionDialog, open: false });
      setActionReason('');
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reactivate expert profile');
    },
  });

  // Verify KYC mutation
  const verifyKYCMutation = useMutation({
    mutationFn: (userId: string) => adminService.verifyExpertKYC(userId),
    onSuccess: () => {
      toast.success('KYC verified');
      queryClient.invalidateQueries({ queryKey: ['adminExperts'] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to verify KYC');
    },
  });

  // Verify seeker identity mutation
  const verifySeekerIdentityMutation = useMutation({
    mutationFn: (userId: string) => adminService.verifySeekerIdentity(userId),
    onSuccess: () => {
      toast.success('Seeker identity verified');
      queryClient.invalidateQueries({ queryKey: ['adminSeekers'] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to verify seeker identity');
    },
  });

  // Verify seeker compliance mutation
  const verifySeekerAuthorizationMutation = useMutation({
    mutationFn: (userId: string) => adminService.verifySeekerAuthorization(userId),
    onSuccess: () => {
      toast.success('Seeker compliance verified');
      queryClient.invalidateQueries({ queryKey: ['adminSeekers'] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to verify seeker compliance');
    },
  });

  // Delete expert mutation
  const deleteExpertMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.deleteExpert(userId, reason),
    onSuccess: () => {
      toast.success('Expert deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['adminExperts'] });
      setSelectedUser(null);
      setActionDialog({ ...actionDialog, open: false });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete expert');
    },
  });

  // Delete seeker mutation
  const deleteSeekerMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.deleteSeeker(userId, reason),
    onSuccess: () => {
      toast.success('Seeker deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['adminSeekers'] });
      setSelectedUser(null);
      setActionDialog({ ...actionDialog, open: false });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete seeker');
    },
  });

  const getSidebarSections = () => {
    return sidebarSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        isActive: item.href === '/admin/users',
      })),
    }));
  };

  const handleExpertAction = (action: string, expert: ExpertListItem) => {
    if (!expert.userId) {
      toast.error('User ID is missing. Cannot perform action.');
      return;
    }

    setSelectedUser({ id: expert.userId, type: 'expert' });

    switch (action) {
      case 'approve':
        setActionDialog({
          open: true,
          action: 'approve',
          title: 'Approve Expert Profile',
          description: `Approve the profile for ${expert.name}?`,
          requiresReason: false,
        });
        break;
      case 'reject':
        setActionDialog({
          open: true,
          action: 'reject',
          title: 'Reject Expert Profile',
          description: `Reject the profile for ${expert.name}? This will mark it as rejected.`,
          requiresReason: true,
        });
        break;
      case 'request-documents':
        setActionDialog({
          open: true,
          action: 'request-documents',
          title: 'Request Additional Documents',
          description: `What documents are missing from ${expert.name}'s profile?`,
          requiresReason: true,
        });
        break;
      case 'suspend':
        setActionDialog({
          open: true,
          action: 'suspend',
          title: 'Suspend Expert Profile',
          description: `Suspend the profile for ${expert.name}? This will make the profile inactive.`,
          requiresReason: true,
        });
        break;
      case 'reactivate':
        setActionDialog({
          open: true,
          action: 'reactivate',
          title: 'Reactivate Expert Profile',
          description: `Reactivate the profile for ${expert.name}? This will allow them to log in again.`,
          requiresReason: false,
        });
        break;
      case 'verify-kyc':
        verifyKYCMutation.mutate(expert.userId);
        break;
      case 'delete':
        setActionDialog({
          open: true,
          action: 'delete',
          title: 'Delete Expert Profile',
          description: `Are you sure you want to permanently delete the profile for ${expert.name}? This action cannot be undone.`,
          requiresReason: true,
        });
        break;
      case 'view':
        // Navigate to expert detail or open detail modal
        navigate(`/admin/users/experts/${expert.userId}`);
        break;
    }
  };

  const handleSeekerAction = (action: string, seeker: SeekerListItem) => {
    if (!seeker.userId) {
      toast.error('User ID is missing. Cannot perform action.');
      return;
    }

    setSelectedUser({ id: seeker.userId, type: 'seeker' });

    switch (action) {
      case 'verify-identity':
        verifySeekerIdentityMutation.mutate(seeker.userId);
        break;
      case 'verify-authorization':
        verifySeekerAuthorizationMutation.mutate(seeker.userId);
        break;
      case 'delete':
        setActionDialog({
          open: true,
          action: 'delete',
          title: 'Delete Seeker Profile',
          description: `Are you sure you want to permanently delete the profile for ${seeker.name}? This action cannot be undone.`,
          requiresReason: true,
        });
        break;
      case 'view':
        navigate(`/admin/users/seekers/${seeker.userId}`);
        break;
    }
  };

  const executeAction = () => {
    if (!selectedUser) {
      toast.error('No user selected');
      return;
    }

    if (!selectedUser.id) {
      toast.error('User ID is missing. Cannot perform action.');
      return;
    }

    if (actionDialog.action === 'approve') {
      approveExpertMutation.mutate({ userId: selectedUser.id, reason: actionReason });
    } else if (actionDialog.action === 'reject') {
      if (!actionReason.trim()) {
        toast.error('Reason is required');
        return;
      }
      rejectExpertMutation.mutate({ userId: selectedUser.id, reason: actionReason });
    } else if (actionDialog.action === 'request-documents') {
      if (!actionReason.trim()) {
        toast.error('Requirements are required');
        return;
      }
      requestDocumentsMutation.mutate({
        userId: selectedUser.id,
        requirements: actionReason,
        requestedDocs: selectedDocs
      });
    } else if (actionDialog.action === 'suspend') {
      if (!actionReason.trim() || actionReason.trim().length < 10) {
        toast.error('Reason must be at least 10 characters');
        return;
      }
      suspendExpertMutation.mutate({ userId: selectedUser.id, reason: actionReason });
    } else if (actionDialog.action === 'reactivate') {
      reactivateExpertMutation.mutate({ userId: selectedUser.id, reason: actionReason || undefined });
    } else if (actionDialog.action === 'delete') {
      if (!actionReason.trim() || actionReason.trim().length < 10) {
        toast.error('Reason must be at least 10 characters');
        return;
      }
      if (selectedUser.type === 'expert') {
        deleteExpertMutation.mutate({ userId: selectedUser.id, reason: actionReason });
      } else if (selectedUser.type === 'seeker') {
        deleteSeekerMutation.mutate({ userId: selectedUser.id, reason: actionReason });
      }
    }
  };

  const getStatusBadge = (isActive: boolean, isProfileComplete: boolean, profileStatus?: string) => {
    if (profileStatus === 'submitted_for_verification' || profileStatus === 'under_review') {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Under Review</Badge>;
    }
    if (profileStatus === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (!isProfileComplete) {
      return <Badge variant="secondary">Incomplete</Badge>;
    }
    if (isActive) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="destructive">Inactive</Badge>;
  };

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'Admin User',
        role: 'Platform Administrator',
      }}
      sections={getSidebarSections()}
      onSignOut={() => {
        logout();
        navigate('/login');
      }}
      headerTitle="Users & Profiles Governance"
    >
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold">Users & Profiles Governance</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">Manage expert and seeker profiles, verify KYC, and handle account actions</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="experts">Experts</TabsTrigger>
            <TabsTrigger value="seekers">Seekers</TabsTrigger>
          </TabsList>

          <TabsContent value="experts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Expert Profiles</CardTitle>
                <CardDescription>Manage expert profiles, verify KYC, and handle approvals</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                  <div className="flex-1 min-w-full sm:min-w-[200px]">
                    <Input
                      placeholder="Search by name or email..."
                      value={expertFilters.search}
                      onChange={(e) => setExpertFilters({ ...expertFilters, search: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={expertFilters.status || 'all'}
                    onValueChange={(value) => setExpertFilters({ ...expertFilters, status: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={expertFilters.kycVerified || 'all'}
                    onValueChange={(value) => setExpertFilters({ ...expertFilters, kycVerified: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="KYC Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Verified</SelectItem>
                      <SelectItem value="false">Not Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {expertsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : expertsData && expertsData.data.length > 0 ? (
                  <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {expertsData.data.map((expert: ExpertListItem, index: number) => (
                        <Card key={expert.userId || `expert-mobile-${index}`} className="border">
                          <CardContent className="p-4 space-y-3">
                            <div>
                              <div className="flex justify-between items-start">
                                <p className="font-semibold text-[#111926]">{expert.name || 'N/A'}</p>
                                {expert.expertId && (
                                  <Badge variant="outline" className="text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border-blue-200">
                                    {expert.expertId}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{expert.email || 'N/A'}</p>
                            </div>
                            <div className="space-y-2 pt-2 border-t">
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">Status</p>
                                {getStatusBadge(expert.isActive, expert.isProfileComplete, expert.profileStatus)}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">KYC</p>
                                {expert.kycVerified ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not Verified</Badge>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Categories</p>
                                {expert.coreServiceCategories && expert.coreServiceCategories.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {expert.coreServiceCategories.slice(0, 3).map((cat, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {cat}
                                      </Badge>
                                    ))}
                                    {expert.coreServiceCategories.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{expert.coreServiceCategories.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No categories</span>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full">
                                  <MoreVertical className="h-4 w-4 mr-2" />
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {/* 1. View Details (Always) */}
                                <DropdownMenuItem onClick={() => handleExpertAction('view', expert)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>

                                {/* Edit Profile (Admin master edit) */}
                                <DropdownMenuItem onClick={() => handleEditProfile(expert, 'experts')}>
                                  <Edit2 className="mr-2 h-4 w-4 text-blue-600" />
                                  Edit Profile
                                </DropdownMenuItem>

                                {/* Actions for Inactive / Under Review */}
                                {!expert.isActive && (
                                  <>
                                    {/* 2. Request Documents */}
                                    <DropdownMenuItem onClick={() => handleExpertAction('request-documents', expert)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Request Documents
                                    </DropdownMenuItem>

                                    {/* 3. Reject */}
                                    <DropdownMenuItem onClick={() => handleExpertAction('reject', expert)} className="text-orange-600">
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>

                                    {/* 4. Approve */}
                                    <DropdownMenuItem onClick={() => handleExpertAction('approve', expert)} className="text-green-600">
                                      <Check className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>

                                    {/* 6. Reactivate */}
                                    <DropdownMenuItem onClick={() => handleExpertAction('reactivate', expert)}>
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {/* Actions for Active */}
                                {expert.isActive && (
                                  <>
                                    {/* 5. Verify KYC */}
                                    {!expert.kycVerified && (
                                      <DropdownMenuItem onClick={() => handleExpertAction('verify-kyc', expert)} className="text-blue-600">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Verify KYC
                                      </DropdownMenuItem>
                                    )}

                                    {/* Deactivate (Suspend) */}
                                    <DropdownMenuItem
                                      onClick={() => handleExpertAction('suspend', expert)}
                                      className="text-orange-600"
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Suspend
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {/* 7. Delete (Always/Conditional) */}
                                <DropdownMenuItem
                                  onClick={() => handleExpertAction('delete', expert)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Expert ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>KYC</TableHead>
                            <TableHead>Categories</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expertsData?.data && expertsData.data.length > 0 ? expertsData.data.map((expert: ExpertListItem, index: number) => (
                            <TableRow key={expert.userId || `expert-${index}`}>
                              <TableCell className="font-mono text-xs font-medium text-blue-700">{expert.expertId || '—'}</TableCell>
                              <TableCell className="font-medium">{expert.name || 'N/A'}</TableCell>
                              <TableCell>{expert.email || 'N/A'}</TableCell>
                              <TableCell>{getStatusBadge(expert.isActive, expert.isProfileComplete, expert.profileStatus)}</TableCell>
                              <TableCell>
                                {expert.kycVerified ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not Verified</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {expert.coreServiceCategories && expert.coreServiceCategories.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {expert.coreServiceCategories.slice(0, 2).map((cat, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {cat}
                                      </Badge>
                                    ))}
                                    {expert.coreServiceCategories.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{expert.coreServiceCategories.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No categories</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {/* 1. View Details (Always) */}
                                    <DropdownMenuItem onClick={() => handleExpertAction('view', expert)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>

                                    {/* Edit Profile (Admin master edit) */}
                                    <DropdownMenuItem onClick={() => handleEditProfile(expert, 'experts')}>
                                      <Edit2 className="mr-2 h-4 w-4 text-blue-600" />
                                      Edit Profile
                                    </DropdownMenuItem>

                                    {/* Actions for Inactive / Under Review */}
                                    {!expert.isActive && (
                                      <>
                                        {/* 2. Request Documents */}
                                        <DropdownMenuItem onClick={() => handleExpertAction('request-documents', expert)}>
                                          <FileText className="mr-2 h-4 w-4" />
                                          Request Documents
                                        </DropdownMenuItem>

                                        {/* 3. Reject */}
                                        <DropdownMenuItem onClick={() => handleExpertAction('reject', expert)} className="text-orange-600">
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Reject
                                        </DropdownMenuItem>

                                        {/* 4. Approve */}
                                        <DropdownMenuItem onClick={() => handleExpertAction('approve', expert)} className="text-green-600">
                                          <Check className="mr-2 h-4 w-4" />
                                          Approve
                                        </DropdownMenuItem>

                                        {/* 6. Reactivate */}
                                        <DropdownMenuItem onClick={() => handleExpertAction('reactivate', expert)}>
                                          <RotateCcw className="mr-2 h-4 w-4" />
                                          Reactivate
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {/* Actions for Active */}
                                    {expert.isActive && (
                                      <>
                                        {/* 5. Verify KYC */}
                                        {!expert.kycVerified && (
                                          <DropdownMenuItem onClick={() => handleExpertAction('verify-kyc', expert)} className="text-blue-600">
                                            <Shield className="mr-2 h-4 w-4" />
                                            Verify KYC
                                          </DropdownMenuItem>
                                        )}

                                        {/* Deactivate (Suspend) */}
                                        <DropdownMenuItem
                                          onClick={() => handleExpertAction('suspend', expert)}
                                          className="text-orange-600"
                                        >
                                          <X className="mr-2 h-4 w-4" />
                                          Suspend
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {/* 7. Delete (Always/Conditional) */}
                                    <DropdownMenuItem
                                      onClick={() => handleExpertAction('delete', expert)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow key="expert-empty">
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                No experts found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {expertsData.pagination.totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Showing {expertsData.data.length} of {expertsData.pagination.total} experts
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpertPage((p) => Math.max(1, p - 1))}
                            disabled={!expertsData.pagination.hasPrev}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpertPage((p) => p + 1)}
                            disabled={!expertsData.pagination.hasNext}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No experts found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seekers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Seeker Profiles</CardTitle>
                <CardDescription>Manage seeker profiles, verify identity, and handle account actions</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                  <div className="flex-1 min-w-full sm:min-w-[200px]">
                    <Input
                      placeholder="Search by name or email..."
                      value={seekerFilters.search}
                      onChange={(e) => setSeekerFilters({ ...seekerFilters, search: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={seekerFilters.status || 'all'}
                    onValueChange={(value) => setSeekerFilters({ ...seekerFilters, status: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={seekerFilters.identityVerified || 'all'}
                    onValueChange={(value) => setSeekerFilters({ ...seekerFilters, identityVerified: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Identity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Verified</SelectItem>
                      <SelectItem value="false">Not Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {seekersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : seekersData && seekersData.data.length > 0 ? (
                  <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {seekersData.data.map((seeker: SeekerListItem, index: number) => (
                        <Card key={seeker.userId || `seeker-mobile-${index}`} className="border">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-[#111926]">{seeker.name || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">{seeker.email || 'N/A'}</p>
                              </div>
                              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 uppercase">
                                {seeker.seekerId || '—'}
                              </span>
                            </div>
                            <div className="space-y-2 pt-2 border-t">
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">Status</p>
                                {seeker.isActive ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="destructive">Inactive</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">Identity</p>
                                {seeker.identityVerified ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not Verified</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">Authorization</p>
                                {seeker.authorizationVerified ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not Verified</Badge>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full">
                                  <MoreVertical className="h-4 w-4 mr-2" />
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleSeekerAction('view', seeker)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditProfile(seeker, 'seekers')}>
                                  <Edit2 className="mr-2 h-4 w-4 text-blue-600" />
                                  Edit Profile
                                </DropdownMenuItem>
                                {!seeker.identityVerified && (
                                  <DropdownMenuItem onClick={() => handleSeekerAction('verify-identity', seeker)}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Verify Identity
                                  </DropdownMenuItem>
                                )}
                                {!seeker.authorizationVerified && (
                                  <DropdownMenuItem onClick={() => handleSeekerAction('verify-authorization', seeker)}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Verify Compliance
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleSeekerAction('delete', seeker)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Seeker ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Identity</TableHead>
                            <TableHead>Authorization</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {seekersData?.data && seekersData.data.length > 0 ? seekersData.data.map((seeker: SeekerListItem, index: number) => (
                            <TableRow key={seeker.userId || `seeker-${index}`}>
                              <TableCell className="font-mono text-xs font-medium text-blue-700">{seeker.seekerId || '—'}</TableCell>
                              <TableCell className="font-medium">{seeker.name || 'N/A'}</TableCell>
                              <TableCell>{seeker.email || 'N/A'}</TableCell>
                              <TableCell>
                                {seeker.isActive ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="destructive">Inactive</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {seeker.identityVerified ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not Verified</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {seeker.authorizationVerified ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not Verified</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleSeekerAction('view', seeker)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditProfile(seeker, 'seekers')}>
                                      <Edit2 className="mr-2 h-4 w-4 text-blue-600" />
                                      Edit Profile
                                    </DropdownMenuItem>
                                    {!seeker.identityVerified && (
                                      <DropdownMenuItem onClick={() => handleSeekerAction('verify-identity', seeker)}>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Verify Identity
                                      </DropdownMenuItem>
                                    )}
                                    {!seeker.authorizationVerified && (
                                      <DropdownMenuItem onClick={() => handleSeekerAction('verify-authorization', seeker)}>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Verify Compliance
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => handleSeekerAction('delete', seeker)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow key="seeker-empty">
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                No seekers found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {seekersData.pagination.totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Showing {seekersData.data.length} of {seekersData.pagination.total} seekers
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSeekerPage((p) => Math.max(1, p - 1))}
                            disabled={!seekersData.pagination.hasPrev}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSeekerPage((p) => p + 1)}
                            disabled={!seekersData.pagination.hasNext}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No seekers found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionDialog.title}</DialogTitle>
              <DialogDescription>{actionDialog.description}</DialogDescription>
            </DialogHeader>
            {actionDialog.action === 'request-documents' && (
              <div className="py-4 space-y-4">
                <Label>Select Documents to Request</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {DOCUMENT_OPTIONS.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={doc.id}
                        checked={selectedDocs.includes(doc.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDocs([...selectedDocs, doc.id]);
                          } else {
                            setSelectedDocs(selectedDocs.filter((id) => id !== doc.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={doc.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {doc.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {actionDialog.requiresReason && (
              <div className="py-4">
                <Label htmlFor="reason">
                  {actionDialog.action === 'request-documents' ? 'Additional Instructions' : 'Reason (Required)'}
                </Label>
                <Textarea
                  id="reason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={actionDialog.action === 'request-documents' ? "Describe why these documents are needed..." : "Enter reason for this action..."}
                  rows={4}
                  className="mt-2"
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog({ ...actionDialog, open: false })}>
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                variant={actionDialog.action === 'delete' ? 'destructive' : 'default'}
                disabled={
                  (actionDialog.requiresReason && actionDialog.action !== 'request-documents' && actionReason.trim().length < 10) ||
                  (actionDialog.action === 'request-documents' && selectedDocs.length === 0 && actionReason.trim().length < 5) ||
                  approveExpertMutation.isPending ||
                  suspendExpertMutation.isPending ||
                  reactivateExpertMutation.isPending ||
                  deleteExpertMutation.isPending ||
                  deleteSeekerMutation.isPending
                }
              >
                {approveExpertMutation.isPending || suspendExpertMutation.isPending || reactivateExpertMutation.isPending || deleteExpertMutation.isPending || deleteSeekerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  actionDialog.action === 'delete' ? 'Delete' : 'Confirm'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Edit Profile Modal */}
      <AdminEditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        userData={editModalUser}
        type={editModalType}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['adminExperts'] });
          queryClient.invalidateQueries({ queryKey: ['adminSeekers'] });
        }}
      />
    </AppDashboardLayout >
  );
};

export default UserGovernance;
