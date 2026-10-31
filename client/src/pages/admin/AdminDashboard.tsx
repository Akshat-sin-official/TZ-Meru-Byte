import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BentoStatCard } from '@/components/common/BentoStatCard';
import { AdminReleaseList } from '@/components/admin/AdminReleaseList';
import { PlatformHealth } from '@/components/admin/PlatformHealth';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAdminSidebar } from '@/hooks/useAdminSidebar';
import { VerificationsTab } from '@/components/admin/tabs/VerificationsTab';
import { AuditLogTab } from '@/components/admin/tabs/AuditLogTab';
import { ReleasesTab } from '@/components/admin/tabs/ReleasesTab';
import { ReportsTab } from '@/components/admin/tabs/ReportsTab';
import {
  Search,
  ArrowUpDown,
  ChevronDown,
  Users,
  FileText,
  DollarSign,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminService.getStats(),
  });

  // Fetch pending releases
  const { data: pendingReleases = [] } = useQuery({
    queryKey: ['pendingReleases'],
    queryFn: () => adminService.getPendingReleases(),
  });

  // Sidebar config
  const sidebarSections = useAdminSidebar();

  // Initial empty/loading state
  const dashboardStats = {
    visits: { value: 0, sublabel: '' as string | undefined },
    activeUsers: { value: '0 / 0' },
    pendingReleasesTop: { value: 0 },
    pendingAutoRelease: { value: 0 },
    platformEarnings: { value: 0 },
    pendingVerifications: { value: 0 },
  };

  // Map API data to stats
  if (stats) {
    dashboardStats.visits.value = stats.totalPlatformVisits ?? 0;
    const ex = stats.platformVisitsExperts ?? 0;
    const sk = stats.platformVisitsSeekers ?? 0;
    const ot = stats.platformVisitsOther ?? 0;
    dashboardStats.visits.sublabel = `Experts ${ex.toLocaleString('en-IN')} · Seekers ${sk.toLocaleString('en-IN')} · Other ${ot.toLocaleString('en-IN')}`;
    // Assuming we want to show separate counts or a combined metric. The UI shows "Seekers / Experts"
    dashboardStats.activeUsers.value = `${stats.activeSeekers ?? 0} / ${stats.activeExperts ?? 0}`;
    dashboardStats.pendingReleasesTop.value = stats.pendingReleases ?? 0;
    dashboardStats.pendingAutoRelease.value = stats.milestonesPendingAutoRelease ?? 0;
    dashboardStats.platformEarnings.value = stats.totalCommission ?? 0;
    dashboardStats.pendingVerifications.value = stats.pendingVerifications ?? 0;
  }


  // Filter and Sort Logic
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReleases = pendingReleases.filter((release: any) => {
    const matchesSearch = (release.expertName || '').toLowerCase().includes(searchQuery.toLowerCase());
    // In the default "all" view, only show items that are still awaiting approval (i.e. actually payable)
    const matchesStatus =
      statusFilter === 'all'
        ? release.status === 'awaiting_approval'
        : release.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a: any, b: any) => {
    switch (sortConfig) {
      case 'oldest': return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      case 'amount-high': return b.amount - a.amount;
      case 'amount-low': return a.amount - b.amount;
      case 'newest':
      default: return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    }
  });

  // Map filtered releases
  const releasesToDisplay = filteredReleases.map((r: any) => {
    // Backend milestone amounts are gross (100%); expert payout is 90% after 10% platform commission
    const netAmountToExpert = Math.round(r.amount * 0.9);
    return {
      id: r.id,
      name: r.expertName,
      email: r.expertEmail || 'Email not available', // Backend now returns expertEmail
      amount: netAmountToExpert,
      avatar: undefined, // Will trigger the UI avatar fallback
    };
  });

  // Mutation for releasing milestone
  const releaseMutation = useMutation({
    mutationFn: async ({ id, amount, milestoneSubmissionId }: { id: string; amount: number; milestoneSubmissionId: string }) => {
      const idempotencyKey = crypto.randomUUID();
      const timestamp = Date.now().toString();
      await adminService.releaseMilestone(
        milestoneSubmissionId,
        "Admin manual approval via Dashboard Overview",
        idempotencyKey,
        timestamp
      );
      return { id, amount };
    },
    onSuccess: ({ amount }) => {
      toast.success(`Successfully processed payment of ₹${amount.toLocaleString('en-IN')}`);
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReleases'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReleasesFull'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to process payment: ${error.message || 'Unknown error'}`);
    }
  });

  const handlePayNow = (id: string) => {
    // Find the release details
    const release = pendingReleases.find((r) => r.id === id);
    if (!release) {
      toast.error("Release details not found");
      return;
    }

    if (!release.milestoneSubmissionId) {
      toast.error("Milestone submission ID is missing");
      return;
    }

    toast.info(`Initiating payment for ${release.expertName}...`);
    // For admin UI we show and toast the net amount that will be paid to the expert (90%)
    const netAmountToExpert = Math.round(release.amount * 0.9);

    releaseMutation.mutate({
      id,
      amount: netAmountToExpert,
      milestoneSubmissionId: release.milestoneSubmissionId
    });
  };

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'User',
        role: user?.role === 'admin' ? 'Platform Administrator' : 'User',
      }}
      sections={sidebarSections}
      onSignOut={() => {
        logout();
        navigate('/login');
      }}
      headerTitle="Dashboard Overview"
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="bg-transparent p-0 h-auto gap-3 sm:gap-6 border-b border-[#E5E7EB] w-full justify-start rounded-none min-w-max sm:min-w-0">
              {['Overview', 'Verifications', 'Audit log', 'Releases', 'Reports'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase().replace(' ', '-')}
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#111926] rounded-none px-2 sm:px-0 py-3 text-sm sm:text-base font-medium text-muted-foreground data-[state=active]:text-[#111926] whitespace-nowrap"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <BentoStatCard
                label="Total Platform Visits"
                value={dashboardStats.visits.value}
                sublabel={dashboardStats.visits.sublabel}
              />
              <BentoStatCard
                label="Active Users (Seekers / Experts)"
                value={dashboardStats.activeUsers.value}
              />
              <BentoStatCard
                label="Pending Releases"
                value={dashboardStats.pendingReleasesTop.value}
              />
              <BentoStatCard
                label="Milestones Pending Auto-Release (T+2)"
                value={dashboardStats.pendingAutoRelease.value}
              />
              <BentoStatCard
                label="Platform Earnings (Commission)"
                value={`₹${dashboardStats.platformEarnings.value.toLocaleString('en-IN')}`}
              />
              <BentoStatCard
                label="Pending Verifications"
                value={dashboardStats.pendingVerifications.value}
              />
            </div>

            {/* Main Content Split */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column: Quick Actions & Pending Releases (2 cols width) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => navigate('/admin/users')}
                        className="h-auto py-4 px-4 gap-3 bg-white border-[#E5E7EB] rounded-xl hover:bg-gray-50 shadow-sm flex-col sm:flex-row"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg shrink-0">
                          <Users className="h-5 w-5 text-[#0EA5E9]" />
                        </div>
                        <div className="text-left sm:text-center">
                          <div className="font-semibold text-sm text-[#111926]">User Governance</div>
                          <div className="text-xs text-[#6B7280] hidden sm:block">Manage users</div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => navigate('/admin/operations')}
                        className="h-auto py-4 px-4 gap-3 bg-white border-[#E5E7EB] rounded-xl hover:bg-gray-50 shadow-sm flex-col sm:flex-row"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-[#FAF5FF] border border-[#F3E8FF] rounded-lg shrink-0">
                          <Briefcase className="h-5 w-5 text-[#A855F7]" />
                        </div>
                        <div className="text-left sm:text-center">
                          <div className="font-semibold text-sm text-[#111926]">Operations</div>
                          <div className="text-xs text-[#6B7280] hidden sm:block">View queue</div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('verifications')}
                        className="h-auto py-4 px-4 gap-3 bg-white border-[#E5E7EB] rounded-xl hover:bg-gray-50 shadow-sm flex-col sm:flex-row"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg shrink-0">
                          <Shield className="h-5 w-5 text-[#22C55E]" />
                        </div>
                        <div className="text-left sm:text-center">
                          <div className="font-semibold text-sm text-[#111926]">Verifications</div>
                          <div className="text-xs text-[#6B7280] hidden sm:block">Review profiles</div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Releases */}
                <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight">Pending Releases</h2>
                        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Milestones awaiting approval</p>
                      </div>
                      <Badge variant="secondary" className="bg-[#F3F4F6] text-[#111926] shrink-0">
                        {releasesToDisplay.length}
                      </Badge>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search releases..."
                          className="pl-9 bg-white rounded-lg"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 bg-white rounded-lg h-10">
                              <ArrowUpDown className="h-4 w-4" />
                              <span className="hidden sm:inline">Sort</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSortConfig('newest')}>Date: Newest</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig('oldest')}>Date: Oldest</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig('amount-high')}>Amount: High to Low</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig('amount-low')}>Amount: Low to High</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 bg-white min-w-[120px] justify-between rounded-lg h-10">
                              <span className="text-sm">Status: {statusFilter === 'all' ? 'All' : statusFilter === 'awaiting_approval' ? 'Pending' : 'Released'}</span>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('awaiting_approval')}>Pending</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('released')}>Released</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Releases List */}
                    {releasesToDisplay.length > 0 ? (
                      <div className="space-y-3">
                        {releasesToDisplay.map((release) => (
                          <div
                            key={release.id}
                            className="group p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#0EA5E9] hover:shadow-md transition-all"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] shrink-0">
                                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-[#0EA5E9]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-sm sm:text-base text-[#111926] mb-1 truncate">{release.name}</h3>
                                  <p className="text-xs sm:text-sm text-[#6B7280] truncate">{release.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
                                <Badge variant="secondary" className="bg-[#F3F4F6] text-[#111926] font-semibold text-xs sm:text-sm">
                                  ₹{release.amount.toLocaleString('en-IN')}
                                </Badge>
                                <Button
                                  onClick={() => handlePayNow(release.id)}
                                  variant="outline"
                                  className="border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E] hover:text-white text-xs sm:text-sm flex-1 sm:flex-initial"
                                  disabled={releaseMutation.isPending}
                                >
                                  {releaseMutation.isPending ? (
                                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                                  )}
                                  Pay Now
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No pending releases found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Platform Health & Priority Alerts (1 col width) */}
              <div className="space-y-6">
                {/* Platform Health */}
                <PlatformHealth isLoading={statsLoading} stats={stats} />

                {/* Priority Alerts */}
                <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-[#111926] flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-[#F59E0B]" />
                      Priority Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboardStats.pendingReleasesTop.value > 0 && (
                      <div className="p-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg">
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-[#F59E0B] mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#92400E]">
                              {dashboardStats.pendingReleasesTop.value} Pending Release{dashboardStats.pendingReleasesTop.value !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-[#78350F] mt-1">
                              Requires immediate attention
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {dashboardStats.pendingVerifications.value > 0 && (
                      <div className="p-3 bg-[#DBEAFE] border border-[#93C5FD] rounded-lg">
                        <div className="flex items-start gap-2">
                          <Shield className="h-4 w-4 text-[#3B82F6] mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1E40AF]">
                              {dashboardStats.pendingVerifications.value} Pending Verification{dashboardStats.pendingVerifications.value !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-[#1E3A8A] mt-1">
                              Profiles awaiting review
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {dashboardStats.pendingAutoRelease.value > 0 && (
                      <div className="p-3 bg-[#F3E8FF] border border-[#C4B5FD] rounded-lg">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-[#8B5CF6] mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#6B21A8]">
                              {dashboardStats.pendingAutoRelease.value} Auto-Release{dashboardStats.pendingAutoRelease.value !== 1 ? 's' : ''} (T+2)
                            </p>
                            <p className="text-xs text-[#581C87] mt-1">
                              Scheduled for automatic release
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {dashboardStats.pendingReleasesTop.value === 0 && 
                     dashboardStats.pendingVerifications.value === 0 && 
                     dashboardStats.pendingAutoRelease.value === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">All caught up! No priority alerts.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="verifications" className="mt-4 sm:mt-6">
            <VerificationsTab />
          </TabsContent>

          <TabsContent value="audit-log" className="mt-4 sm:mt-6">
            <AuditLogTab />
          </TabsContent>

          <TabsContent value="releases" className="mt-4 sm:mt-6">
            <ReleasesTab />
          </TabsContent>

          <TabsContent value="reports" className="mt-4 sm:mt-6">
            <ReportsTab />
          </TabsContent>
        </Tabs>

      </div>
    </AppDashboardLayout >
  );
};

export default AdminDashboard;
