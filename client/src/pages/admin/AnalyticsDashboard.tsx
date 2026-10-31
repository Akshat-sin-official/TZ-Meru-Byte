/**
 * Analytics Dashboard
 * 
 * Admin-only analytics dashboard with traffic, conversion, user, and engagement analytics
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, X, Filter, ChevronDown, TrendingUp, Users, DollarSign, Target, BarChart3, Activity, Briefcase, AlertCircle } from 'lucide-react';
import { BentoStatCard } from '@/components/common/BentoStatCard';
import { apiClient } from '@/services/apiClient';
import { useAdminSidebar } from '@/hooks/useAdminSidebar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { serviceCategories } from '@/data/mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AnalyticsSupply from './analytics/AnalyticsSupply';
import AnalyticsGeo from './analytics/AnalyticsGeo';
import AnalyticsDiscovery from './analytics/AnalyticsDiscovery';
import AnalyticsPerformance from './analytics/AnalyticsPerformance';

interface EngagementFilters {
  serviceCategory: string[];
  location: string[];
  expertType: string[];
  engagementStage: string[];
  minValue?: number;
  maxValue?: number;
}

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [filters, setFilters] = useState<EngagementFilters>({
    serviceCategory: [],
    location: [],
    expertType: [],
    engagementStage: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSuccessfulTable, setShowSuccessfulTable] = useState(false);

  // Fetch traffic metrics
  const { data: trafficMetrics, isLoading: trafficLoading } = useQuery({
    queryKey: ['adminTrafficMetrics', dateRange],
    queryFn: () =>
      apiClient.get(
        `/v1/admin/analytics/traffic?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      ).then((res) => res.data),
  });

  // Fetch conversion funnel
  const { data: conversionFunnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['adminConversionFunnel', dateRange],
    queryFn: () =>
      apiClient.get(
        `/v1/admin/analytics/conversion?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      ).then((res) => res.data),
  });

  // Fetch user stats
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['adminUserStats'],
    queryFn: () => apiClient.get('/v1/admin/analytics/users').then((res) => res.data),
  });

  // Fetch engagement analytics
  const { data: engagementAnalytics, isLoading: engagementLoading } = useQuery({
    queryKey: ['adminEngagementAnalytics', dateRange],
    queryFn: () =>
      apiClient.get(
        `/v1/admin/analytics/engagements?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      ).then((res) => res.data),
  });

  // Fetch successful engagements with filters
  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append('startDate', dateRange.startDate);
    params.append('endDate', dateRange.endDate);
    if (filters.serviceCategory.length > 0) {
      filters.serviceCategory.forEach((cat) => params.append('serviceCategory', cat));
    }
    if (filters.location.length > 0) {
      filters.location.forEach((loc) => params.append('location', loc));
    }
    if (filters.expertType.length > 0) {
      filters.expertType.forEach((type) => params.append('expertType', type));
    }
    if (filters.engagementStage.length > 0) {
      filters.engagementStage.forEach((stage) => params.append('engagementStage', stage));
    }
    if (filters.minValue !== undefined) {
      params.append('minValue', filters.minValue.toString());
    }
    if (filters.maxValue !== undefined) {
      params.append('maxValue', filters.maxValue.toString());
    }
    return params.toString();
  }, [dateRange, filters]);

  const { data: successfulEngagements, isLoading: successfulLoading } = useQuery({
    queryKey: ['adminSuccessfulEngagements', filterParams],
    queryFn: () =>
      apiClient.get(`/v1/admin/analytics/engagements/successful?${filterParams}`).then((res) => res.data),
    enabled: showSuccessfulTable,
  });

  const activeFiltersCount = useMemo(() => {
    return (
      filters.serviceCategory.length +
      filters.location.length +
      filters.expertType.length +
      filters.engagementStage.length +
      (filters.minValue !== undefined ? 1 : 0) +
      (filters.maxValue !== undefined ? 1 : 0)
    );
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      serviceCategory: [],
      location: [],
      expertType: [],
      engagementStage: [],
    });
  };

  const toggleServiceCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      serviceCategory: prev.serviceCategory.includes(category)
        ? prev.serviceCategory.filter((c) => c !== category)
        : [...prev.serviceCategory, category],
    }));
  };

  const toggleLocation = (location: string) => {
    setFilters((prev) => ({
      ...prev,
      location: prev.location.includes(location)
        ? prev.location.filter((l) => l !== location)
        : [...prev.location, location],
    }));
  };

  const toggleExpertType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      expertType: prev.expertType.includes(type)
        ? prev.expertType.filter((t) => t !== type)
        : [...prev.expertType, type],
    }));
  };

  const toggleEngagementStage = (stage: string) => {
    setFilters((prev) => ({
      ...prev,
      engagementStage: prev.engagementStage.includes(stage)
        ? prev.engagementStage.filter((s) => s !== stage)
        : [...prev.engagementStage, stage],
    }));
  };

  // Use reusable sidebar hook
  const sidebarSections = useAdminSidebar();

  const getSidebarSections = () => {
    // Admin layout - simplified compared to Settings as this is Admin specific
    // Assuming this page is ONLY accessible by admin
    return sidebarSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        isActive: item.href === '/admin/analytics', // Adjust functionality as needed
      })),
    }));
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
      headerTitle="Platform Analytics"
    >
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#111926]">Platform Analytics & Intelligence</h1>
            <p className="mt-1 text-xs sm:text-sm md:text-base text-muted-foreground">Admin-only analytics (non-influential)</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')} className="shrink-0 w-full sm:w-auto text-xs sm:text-sm">
            <ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Date Range & Advanced Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <CardTitle className="text-lg sm:text-xl">Date Range & Filters</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">{activeFiltersCount} active</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-initial text-xs sm:text-sm"
                >
                  <Filter className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
              </div>

              {/* Active Filter Chips */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {filters.serviceCategory.map((cat) => (
                    <Badge key={cat} variant="secondary" className="gap-1">
                      Category: {cat}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleServiceCategory(cat)}
                      />
                    </Badge>
                  ))}
                  {filters.location.map((loc) => (
                    <Badge key={loc} variant="secondary" className="gap-1">
                      Location: {loc}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleLocation(loc)}
                      />
                    </Badge>
                  ))}
                  {filters.expertType.map((type) => (
                    <Badge key={type} variant="secondary" className="gap-1">
                      Expert: {type}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleExpertType(type)}
                      />
                    </Badge>
                  ))}
                  {filters.engagementStage.map((stage) => (
                    <Badge key={stage} variant="secondary" className="gap-1">
                      Stage: {stage}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleEngagementStage(stage)}
                      />
                    </Badge>
                  ))}
                  {(filters.minValue !== undefined || filters.maxValue !== undefined) && (
                    <Badge variant="secondary" className="gap-1">
                      Value: ₹{filters.minValue || 0} - ₹{filters.maxValue || '∞'}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, minValue: undefined, maxValue: undefined }))
                        }
                      />
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              )}

              {/* Advanced Filters Panel */}
              {showFilters && (
                <div className="mt-4 rounded-lg border p-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Service Category Filter */}
                    <div>
                      <Label className="mb-2 block">Service Category</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            Categories
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
                          <DropdownMenuLabel>Select Categories</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {serviceCategories.map((category) => (
                            <div key={category.name} className="px-2 py-1.5">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`cat-${category.name}`}
                                  checked={filters.serviceCategory.includes(category.name)}
                                  onCheckedChange={() => toggleServiceCategory(category.name)}
                                />
                                <Label
                                  htmlFor={`cat-${category.name}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {category.name}
                                </Label>
                              </div>
                            </div>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <Label className="mb-2 block">Location</Label>
                      <Input
                        placeholder="Enter location..."
                        value={filters.location.join(', ')}
                        onChange={(e) => {
                          const locations = e.target.value
                            .split(',')
                            .map((l) => l.trim())
                            .filter((l) => l.length > 0);
                          setFilters((prev) => ({ ...prev, location: locations }));
                        }}
                      />
                    </div>

                    {/* Expert Type Filter */}
                    <div>
                      <Label className="mb-2 block">Expert Type</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            Expert Types
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Select Types</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {['Freelancer', 'Consultant', 'Agency', 'Company'].map((type) => (
                            <div key={type} className="px-2 py-1.5">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`type-${type}`}
                                  checked={filters.expertType.includes(type)}
                                  onCheckedChange={() => toggleExpertType(type)}
                                />
                                <Label
                                  htmlFor={`type-${type}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {type}
                                </Label>
                              </div>
                            </div>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Engagement Stage Filter */}
                    <div>
                      <Label className="mb-2 block">Engagement Stage</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            Stages
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Select Stages</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {['active', 'completed', 'disputed', 'cancelled'].map((stage) => (
                            <div key={stage} className="px-2 py-1.5">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`stage-${stage}`}
                                  checked={filters.engagementStage.includes(stage)}
                                  onCheckedChange={() => toggleEngagementStage(stage)}
                                />
                                <Label
                                  htmlFor={`stage-${stage}`}
                                  className="text-sm font-normal cursor-pointer capitalize"
                                >
                                  {stage}
                                </Label>
                              </div>
                            </div>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Value Range Filter */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Min Value (₹)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.minValue || ''}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            minValue: e.target.value ? parseFloat(e.target.value) : undefined,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Max Value (₹)</Label>
                      <Input
                        type="number"
                        placeholder="No limit"
                        value={filters.maxValue || ''}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            maxValue: e.target.value ? parseFloat(e.target.value) : undefined,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <BentoStatCard
            label="Total Visits"
            value={trafficLoading ? '...' : ((trafficMetrics as any)?.data?.totalVisits?.toLocaleString() || 0)}
          />
          <BentoStatCard
            label="Unique Visitors"
            value={trafficLoading ? '...' : ((trafficMetrics as any)?.data?.uniqueVisitors?.toLocaleString() || 0)}
          />
          <BentoStatCard
            label="Active Users"
            value={userStatsLoading ? '...' : (((userStats as any)?.success && (userStats as any)?.data?.totalUsers) || 0)}
          />
          <BentoStatCard
            label="Successful Engagements"
            value={engagementLoading ? '...' : (((engagementAnalytics as any)?.success && (engagementAnalytics as any)?.data?.successfulEngagements) || 0)}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Left Column: Conversion Funnel & User Analytics (2 cols) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Conversion Funnel */}
            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#0EA5E9]" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription>Visitor → Registered → Seeker/Expert → Discussion → Quotation → Deposit → Successful</CardDescription>
              </CardHeader>
              <CardContent>
                {funnelLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: 'Visitors', value: ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.visitors) || 0 },
                      { label: 'Registered', value: ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.registered) || 0 },
                      { label: 'Role Selected', value: ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.roleSelected) || 0 },
                      { label: 'Discussions Created', value: ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.discussionsCreated) || 0 },
                      { label: 'Quotations Created', value: ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.quotationsCreated) || 0 },
                      { label: 'Deposits Paid', value: ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.depositsPaid) || 0 },
                      { label: 'Successful Engagements', value: ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.successfulEngagements) || 0 },
                    ].map((step, index) => {
                      const prevValue = index > 0 ? [
                        ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.visitors) || 0,
                        ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.registered) || 0,
                        ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.roleSelected) || 0,
                        ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.discussionsCreated) || 0,
                        ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.quotationsCreated) || 0,
                        ((conversionFunnel as any)?.success && (conversionFunnel as any)?.data?.depositsPaid) || 0,
                      ][index - 1] : 0;
                      const conversionRate = prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : '0.0';

                      return (
                        <div key={step.label} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                          <div className="flex-1">
                            <span className="font-medium text-sm text-[#111926]">{step.label}</span>
                            {index > 0 && (
                              <span className="ml-2 text-xs text-[#6B7280]">({conversionRate}% conversion)</span>
                            )}
                          </div>
                          <span className="text-xl font-bold text-[#111926]">{step.value.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User & Supply Analytics */}
            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#A855F7]" />
                  User & Supply Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userStatsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    {[
                      { label: 'Total Users', value: ((userStats as any)?.success && (userStats as any)?.data?.totalUsers) || 0, icon: Users },
                      { label: 'Active Seekers', value: ((userStats as any)?.success && (userStats as any)?.data?.activeSeekers) || 0, icon: Users },
                      { label: 'Active Experts', value: ((userStats as any)?.success && (userStats as any)?.data?.activeExperts) || 0, icon: Users },
                      { label: 'Paused Experts', value: ((userStats as any)?.success && (userStats as any)?.data?.pausedExperts) || 0, icon: Activity },
                    ].map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#FAF5FF] border border-[#F3E8FF]">
                              <Icon className="h-5 w-5 text-[#A855F7]" />
                            </div>
                            <p className="text-sm font-medium text-[#6B7280]">{stat.label}</p>
                          </div>
                          <p className="text-2xl font-bold text-[#111926]">{stat.value.toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Traffic Metrics (1 col) */}
          <div className="space-y-6">
            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#22C55E]" />
                  Traffic Metrics
                </CardTitle>
                <CardDescription>Platform traffic and visitor statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {trafficLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#F0F9FF] rounded-lg border border-[#BAE6FD]">
                      <p className="text-sm font-medium text-[#6B7280] mb-1">Total Visits</p>
                      <p className="text-2xl font-bold text-[#111926]">
                        {(trafficMetrics as any)?.data?.totalVisits?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F0F9FF] rounded-lg border border-[#BAE6FD]">
                      <p className="text-sm font-medium text-[#6B7280] mb-1">Unique Visitors</p>
                      <p className="text-2xl font-bold text-[#111926]">
                        {(trafficMetrics as any)?.data?.uniqueVisitors?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                      <p className="text-sm font-medium text-[#6B7280] mb-3">Traffic Sources</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">Direct:</span>
                          <span className="font-semibold text-[#111926]">{(trafficMetrics as any)?.data?.trafficSources?.direct || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">Organic:</span>
                          <span className="font-semibold text-[#111926]">{(trafficMetrics as any)?.data?.trafficSources?.organic || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">Referral:</span>
                          <span className="font-semibold text-[#111926]">{(trafficMetrics as any)?.data?.trafficSources?.referral || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">Campaign:</span>
                          <span className="font-semibold text-[#111926]">{(trafficMetrics as any)?.data?.trafficSources?.campaign || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analytics & Intelligence Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#111926] flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Marketplace Intelligence
          </h2>
          <div className="space-y-6">
            <AnalyticsSupply />
            <AnalyticsGeo />
          </div>
          <AnalyticsDiscovery />
          <AnalyticsPerformance />
        </div>


        {/* Engagement Analytics - KPI Snapshot */}
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#F59E0B]" />
                  Successful Engagement Analytics
                </CardTitle>
                <CardDescription>
                  A Successful Engagement: Deposit paid + At least one milestone approved + Funds released
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuccessfulTable(!showSuccessfulTable)}
                className="shrink-0"
              >
                {showSuccessfulTable ? 'Hide' : 'Show'} Drill-Down Table
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {engagementLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* KPI Snapshot */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4 sm:mb-6">
                  {[
                    { label: 'Total Engagements Created', value: ((engagementAnalytics as any)?.success && (engagementAnalytics as any)?.data?.totalEngagementsCreated) || 0, icon: Briefcase },
                    { label: 'Deposits Paid', value: ((engagementAnalytics as any)?.success && (engagementAnalytics as any)?.data?.depositsPaid) || 0, icon: DollarSign },
                    { label: 'Successful Engagements', value: ((engagementAnalytics as any)?.success && (engagementAnalytics as any)?.data?.successfulEngagements) || 0, icon: Target },
                    { label: 'Success Rate', value: `${((engagementAnalytics as any)?.success && (engagementAnalytics as any)?.data?.successRate?.toFixed(1)) || 0}%`, icon: TrendingUp },
                    { label: 'Cancelled/Declined', value: ((engagementAnalytics as any)?.success && (engagementAnalytics as any)?.data?.cancelledDeclined) || 0, icon: X },
                    { label: 'Disputed (Open/Closed)', value: `${((engagementAnalytics as any)?.success && (engagementAnalytics as any)?.data?.disputed?.open) || 0} / ${((engagementAnalytics as any)?.success && (engagementAnalytics as any)?.data?.disputed?.closed) || 0}`, icon: AlertCircle },
                  ].map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                      <div key={kpi.label} className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#FEF3C7] border border-[#FCD34D]">
                            <Icon className="h-5 w-5 text-[#F59E0B]" />
                          </div>
                          <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
                        </div>
                        <p className="text-2xl font-bold text-[#111926]">{typeof kpi.value === 'string' ? kpi.value : kpi.value.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Drill-Down Table */}
                {showSuccessfulTable && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Successful Engagements Detail</h3>
                    {successfulLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                          {((successfulEngagements as any)?.success && (successfulEngagements as any)?.data?.length > 0) ? (
                            ((successfulEngagements as any)?.data || []).map((engagement: any) => (
                              <Card key={engagement.engagementId} className="border">
                                <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="font-mono text-xs font-semibold">
                                      {engagement.engagementId.slice(-8)}
                                    </p>
                                    <Badge variant="outline" className="capitalize">
                                      {engagement.status}
                                    </Badge>
                                  </div>
                                  <div className="space-y-2 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-muted-foreground">Seeker</p>
                                      <p className="text-sm font-medium">{engagement.seekerName}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-muted-foreground">Expert</p>
                                      <p className="text-sm font-medium">{engagement.expertName}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-muted-foreground">Category</p>
                                      <p className="text-sm">{engagement.category}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-muted-foreground">Deposit</p>
                                      <p className="text-sm font-bold">
                                        ₹{new Intl.NumberFormat('en-IN').format(engagement.deposit)}
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-muted-foreground">First Release</p>
                                      <p className="text-sm">
                                        {new Date(engagement.firstReleaseDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => navigate(`/admin/engagements/${engagement.engagementId}`)}
                                  >
                                    View Details
                                  </Button>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <p className="text-center text-muted-foreground py-8">
                              No successful engagements found for the selected filters.
                            </p>
                          )}
                        </div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block rounded-md border overflow-x-auto -mx-4 md:mx-0">
                          <div className="min-w-full inline-block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs sm:text-sm">Engagement ID</TableHead>
                                  <TableHead className="text-xs sm:text-sm">Seeker</TableHead>
                                  <TableHead className="text-xs sm:text-sm">Expert</TableHead>
                                  <TableHead className="text-xs sm:text-sm">Category</TableHead>
                                  <TableHead className="text-xs sm:text-sm">Deposit</TableHead>
                                  <TableHead className="text-xs sm:text-sm">First Release Date</TableHead>
                                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                                  <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {((successfulEngagements as any)?.success && (successfulEngagements as any)?.data?.length > 0) ? (
                                  ((successfulEngagements as any)?.data || []).map((engagement: any) => (
                                    <TableRow key={engagement.engagementId}>
                                      <TableCell className="font-mono text-xs">
                                        {engagement.engagementId.slice(-8)}
                                      </TableCell>
                                      <TableCell>{engagement.seekerName}</TableCell>
                                      <TableCell>{engagement.expertName}</TableCell>
                                      <TableCell>{engagement.category}</TableCell>
                                      <TableCell>
                                        ₹{new Intl.NumberFormat('en-IN').format(engagement.deposit)}
                                      </TableCell>
                                      <TableCell>
                                        {new Date(engagement.firstReleaseDate).toLocaleDateString()}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                          {engagement.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => navigate(`/admin/engagements/${engagement.engagementId}`)}
                                        >
                                          View Details
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                      No successful engagements found for the selected filters.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="rounded-lg border-2 border-foreground bg-secondary p-4">
          <p className="text-sm font-medium">
            ⚠️ Filters are analytical only and never affect marketplace visibility.
          </p>
        </div>
      </div>
    </AppDashboardLayout>
  );
};

export default AnalyticsDashboard;

