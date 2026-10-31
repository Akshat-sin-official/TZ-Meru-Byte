/**
 * Admin Engagement Detail View
 * 
 * Single source of truth view for engagement details
 * Read-only view for admin operations
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/apiClient';
import { useAdminSidebar } from '@/hooks/useAdminSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

const AdminEngagementDetail = () => {
  const { id, engagementId } = useParams<{ id?: string; engagementId?: string }>();
  const resolvedId = id || engagementId;
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const sidebarSections = useAdminSidebar();

  const { data: engagementData, isLoading, error } = useQuery({
    queryKey: ['adminEngagementDetail', resolvedId],
    queryFn: () =>
      apiClient.get(`/v1/admin/engagements/${resolvedId}`).then((res) => res.data),
    enabled: !!resolvedId,
  });

  const engagement = (engagementData as any)?.success ? (engagementData as any)?.data : null;

  const getSidebarSections = () => {
    return sidebarSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        isActive: item.href === '/admin/operations',
      })),
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      completed: { variant: 'secondary', label: 'Completed' },
      disputed: { variant: 'destructive', label: 'Disputed' },
      cancelled: { variant: 'outline', label: 'Cancelled' },
      closed: { variant: 'outline', label: 'Closed' },
    };
    const config = statusMap[status.toLowerCase()] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'revision_requested':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
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
        headerTitle="Engagement Details"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppDashboardLayout>
    );
  }

  if (error || !engagement) {
    const errorMessage = (error as any)?.response?.data?.error?.message || 'Engagement not found';

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
        headerTitle="Engagement Details"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold text-destructive mb-2">Error Loading Engagement</p>
              <p className="text-sm sm:text-base text-muted-foreground">{errorMessage}</p>
              <Button variant="outline" onClick={() => navigate('/admin/operations')} className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Operations
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppDashboardLayout>
    );
  }

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
      headerTitle="Engagement Details"
    >
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin/operations')} className="mb-3 sm:mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Operations
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{engagement.engagementReference}</h1>
              <p className="text-muted-foreground mt-1">
                Created: {new Date(engagement.createdAt).toLocaleDateString()}
              </p>
            </div>
            {getStatusBadge(engagement.status)}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Engagement Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Service Category</p>
                  <p className="font-medium">{engagement.quotation?.milestones?.[0]?.description || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Engagement Value</p>
                  <p className="font-medium">{formatCurrency(engagement.quotation?.totalAmount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {engagement.startedAt ? new Date(engagement.startedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {engagement.completedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed Date</p>
                    <p className="font-medium">{new Date(engagement.completedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seeker Information */}
          <Card>
            <CardHeader>
              <CardTitle>Seeker Information</CardTitle>
              <CardDescription>Identity & Authorization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{engagement.seeker?.fullName || engagement.seeker?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{engagement.seeker?.email || 'N/A'}</p>
                </div>
                {engagement.seeker?.businessName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Business Name</p>
                    <p className="font-medium">{engagement.seeker.businessName}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Identity Verified</p>
                  {engagement.seeker?.identityVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Authorization Verified</p>
                  {engagement.seeker?.authorizationVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expert Information */}
          <Card>
            <CardHeader>
              <CardTitle>Expert Information</CardTitle>
              <CardDescription>Profile & KYC</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {engagement.expert?.displayName || engagement.expert?.fullName || engagement.expert?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{engagement.expert?.email || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">KYC Verified</p>
                  {engagement.expert?.kycVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                {engagement.expert?.certifications && engagement.expert.certifications.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Certifications</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {engagement.expert.certifications.map((cert: any, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {cert.name}
                          {cert.verified && <CheckCircle className="h-3 w-3 ml-1 text-green-600" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quotation Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Quotation Reference</CardTitle>
              <CardDescription>Read-only quotation details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Total Engagement Value</p>
                <p className="text-2xl font-bold">{formatCurrency(engagement.quotation?.totalAmount || 0)}</p>
              </div>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium mb-3">Milestones</p>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {engagement.quotation?.milestones?.map((milestone: any) => (
                    <Card key={milestone.milestoneNumber} className="border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-[#111926]">M{milestone.milestoneNumber}</p>
                          <p className="text-sm font-bold">{formatCurrency(milestone.amount)}</p>
                        </div>
                        <p className="text-sm text-[#111926]">{milestone.description}</p>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <p className="text-xs text-muted-foreground">Deposit %</p>
                          <p className="text-sm font-medium">{milestone.depositPercentage}%</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Milestone</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Deposit %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {engagement.quotation?.milestones?.map((milestone: any) => (
                        <TableRow key={milestone.milestoneNumber}>
                          <TableCell className="font-medium">M{milestone.milestoneNumber}</TableCell>
                          <TableCell>{milestone.description}</TableCell>
                          <TableCell>{formatCurrency(milestone.amount)}</TableCell>
                          <TableCell>{milestone.depositPercentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestone Approval & Deposit Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Milestone Approval & Deposit Tracking</CardTitle>
              <CardDescription>Expert submission, client decision, and admin action</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {engagement.milestones?.map((milestone: any) => (
                  <Card key={milestone.milestoneNumber} className="border">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#111926]">M{milestone.milestoneNumber}</p>
                        <p className="text-sm font-bold">{formatCurrency(milestone.amount)}</p>
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Expert Submission</p>
                          {milestone.submittedAt ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                {new Date(milestone.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not submitted</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Client Decision</p>
                          <div className="flex items-center gap-2">
                            {getMilestoneStatusIcon(milestone.status)}
                            <span className="text-sm capitalize">{milestone.status.replace(/_/g, ' ')}</span>
                          </div>
                          {milestone.seekerResponse && (
                            <p className="text-xs text-muted-foreground mt-1">{milestone.seekerResponse}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <Badge variant="outline" className="capitalize">
                            {milestone.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Expert Submission</TableHead>
                      <TableHead>Client Decision</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engagement.milestones?.map((milestone: any) => (
                      <TableRow key={milestone.milestoneNumber}>
                        <TableCell className="font-medium">M{milestone.milestoneNumber}</TableCell>
                        <TableCell>{formatCurrency(milestone.amount)}</TableCell>
                        <TableCell>
                          {milestone.submittedAt ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                {new Date(milestone.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not submitted</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMilestoneStatusIcon(milestone.status)}
                            <span className="text-sm capitalize">{milestone.status.replace(/_/g, ' ')}</span>
                          </div>
                          {milestone.seekerResponse && (
                            <p className="text-xs text-muted-foreground mt-1">{milestone.seekerResponse}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {milestone.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Approval History */}
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
              <CardDescription>Immutable timeline of all actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {engagement.approvalHistory?.length > 0 ? (
                  engagement.approvalHistory.map((entry: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="mt-1">
                        {entry.action === 'approved' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : entry.action === 'rejected' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : entry.action === 'revision_requested' ? (
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{entry.action.replace(/_/g, ' ')}</p>
                          <Badge variant="outline">M{entry.milestoneNumber}</Badge>
                          <span className="text-sm text-muted-foreground">
                            by {entry.actor === 'expert' ? 'Expert' : 'Seeker'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                        {entry.notes && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No approval history yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deposit Ledger */}
          <Card>
            <CardHeader>
              <CardTitle>Deposit Ledger</CardTitle>
              <CardDescription className="text-amber-800 dark:text-amber-300 font-medium">Funds received and held for this engagement</CardDescription>
            </CardHeader>
            <CardContent>
              {engagement.depositLedger?.length > 0 ? (
                <>
                  {/* PDF Page 2 Summary Counters Header */}
                  {(() => {
                    let totalReceived = 0;
                    let platformFeeEarned = 0;
                    let releasedToProvider = 0;

                    engagement.depositLedger.forEach((entry: any) => {
                      if (entry.entryType === 'deposit') {
                        totalReceived += Math.abs(entry.amount);
                      } else if (entry.entryType === 'release') {
                        releasedToProvider += Math.abs(entry.amount);
                      } else if (entry.entryType === 'commission') {
                        platformFeeEarned += Math.abs(entry.amount);
                      }
                    });
                    const currentlyHeld = Math.max(0, totalReceived - releasedToProvider - platformFeeEarned);

                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/40 rounded-lg border">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Total Received</p>
                          <p className="text-lg font-bold text-foreground">{formatCurrency(totalReceived)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Currently Held</p>
                          <p className="text-lg font-bold text-amber-600">{formatCurrency(currentlyHeld)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Platform Fee Earned</p>
                          <p className="text-lg font-bold text-purple-600">{formatCurrency(platformFeeEarned)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Released to Provider</p>
                          <p className="text-lg font-bold text-emerald-600">{formatCurrency(releasedToProvider)}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Transaction</TableHead>
                          <TableHead className="font-semibold">Amount</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {engagement.depositLedger.map((entry: any, idx: number) => {
                          const transactionName = entry.transaction || (
                            entry.entryType === 'deposit'
                              ? 'Deposit Received'
                              : entry.entryType === 'milestone_completed'
                                ? 'Milestone Completed'
                                : entry.entryType === 'release'
                                  ? 'Provider Release'
                                  : entry.entryType === 'commission'
                                    ? 'Platform Fee (10%)'
                                    : entry.description || 'Transaction'
                          );

                          const getStatusBadge = (status: string, type: string) => {
                            const normStatus = (status || '').toLowerCase();
                            if (normStatus === 'held' || type === 'deposit') {
                              return <Badge className="bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-100">Held</Badge>;
                            }
                            if (normStatus === 'approved' || type === 'milestone_completed') {
                              return <Badge className="bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-100">Approved</Badge>;
                            }
                            if (normStatus === 'deducted' || type === 'commission') {
                              return <Badge className="bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-100">Deducted</Badge>;
                            }
                            if (normStatus === 'released' || type === 'release') {
                              return <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-100">Released</Badge>;
                            }
                            return <Badge variant="outline">{status || 'Recorded'}</Badge>;
                          };

                          const renderAmount = () => {
                            if (entry.entryType === 'deposit') {
                              return <span className="text-emerald-600 font-bold">+{formatCurrency(Math.abs(entry.amount))}</span>;
                            }
                            if (entry.entryType === 'milestone_completed') {
                              return <span className="text-foreground font-bold">{formatCurrency(Math.abs(entry.amount))}</span>;
                            }
                            return <span className="text-foreground font-bold">−{formatCurrency(Math.abs(entry.amount))}</span>;
                          };

                          return (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">{new Date(entry.timestamp || entry.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                              <TableCell className="font-medium text-sm">{transactionName}</TableCell>
                              <TableCell className="text-sm">{renderAmount()}</TableCell>
                              <TableCell>{getStatusBadge(entry.status, entry.entryType)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{entry.description || 'N/A'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    {engagement.depositLedger.map((entry: any, idx: number) => {
                      const transactionName = entry.transaction || (
                        entry.entryType === 'deposit'
                          ? 'Deposit Received'
                          : entry.entryType === 'milestone_completed'
                            ? 'Milestone Completed'
                            : entry.entryType === 'release'
                              ? 'Provider Release'
                              : entry.entryType === 'commission'
                                ? 'Platform Fee (10%)'
                                : entry.description || 'Transaction'
                      );

                      return (
                        <div key={idx} className="p-3 border rounded-lg bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{transactionName}</span>
                            {entry.entryType === 'deposit' ? (
                              <span className="text-emerald-600 font-bold text-sm">+{formatCurrency(Math.abs(entry.amount))}</span>
                            ) : entry.entryType === 'milestone_completed' ? (
                              <span className="text-foreground font-bold text-sm">{formatCurrency(Math.abs(entry.amount))}</span>
                            ) : (
                              <span className="text-foreground font-bold text-sm">−{formatCurrency(Math.abs(entry.amount))}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{new Date(entry.timestamp || entry.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">{entry.status || entry.entryType}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground pt-1 border-t">{entry.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">No deposit transactions yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppDashboardLayout>
  );
};

export default AdminEngagementDetail;

