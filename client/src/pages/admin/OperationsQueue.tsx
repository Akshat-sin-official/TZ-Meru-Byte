/**
 * Operations Queue
 * 
 * Admin-only operations queue showing pending releases, milestones awaiting response, etc.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Clock, CheckCircle, XCircle, Filter, X } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useAdminSidebar } from '@/hooks/useAdminSidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const OperationsQueue = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const sidebarSections = useAdminSidebar();
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    engagementStatus: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.engagementStatus) params.append('engagementStatus', filters.engagementStatus);
    return params.toString();
  }, [filters]);

  // Fetch operations queue
  const { data: operationsData, isLoading } = useQuery({
    queryKey: ['adminOperationsQueue', queryParams],
    queryFn: () =>
      apiClient
        .get(`/v1/admin/operations/queue${queryParams ? `?${queryParams}` : ''}`)
        .then((res) => res.data),
  });

  const operations = (operationsData as any)?.success ? (operationsData as any)?.data || [] : [];

  const activeFiltersCount = useMemo(() => {
    return (
      (filters.type ? 1 : 0) +
      (filters.startDate ? 1 : 0) +
      (filters.endDate ? 1 : 0) +
      (filters.engagementStatus ? 1 : 0)
    );
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
      engagementStatus: '',
    });
  };

  const getSidebarSections = () => {
    return sidebarSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        isActive: item.href === '/admin/operations',
      })),
    }));
  };

  const getUrgencyBadge = (urgency: number) => {
    if (urgency === 1) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (urgency === 2) {
      return <Badge variant="default">High</Badge>;
    } else if (urgency === 3) {
      return <Badge variant="secondary">Medium</Badge>;
    }
    return <Badge variant="outline">Low</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pending_release':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'awaiting_response_t1':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'auto_release_scheduled_t2':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'revision_requested':
        return <XCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
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
      headerTitle="Operations Queue"
    >
      <div className="p-3 sm:p-4 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Operations Queue</h1>
              <p className="mt-1 text-sm sm:text-base text-muted-foreground">Global operations queue sorted by urgency</p>
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} active</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        <SelectItem value="pending_release">Pending Release</SelectItem>
                        <SelectItem value="awaiting_response_t1">Awaiting Response (T+1)</SelectItem>
                        <SelectItem value="auto_release_scheduled_t2">Auto-Release Scheduled (T+2)</SelectItem>
                        <SelectItem value="revision_requested">Revision Requested</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Engagement Status</Label>
                    <Select
                      value={filters.engagementStatus}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, engagementStatus: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {activeFiltersCount > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.type && (
                <Badge variant="secondary" className="gap-1">
                  Type: {filters.type.replace(/_/g, ' ')}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, type: '' }))}
                  />
                </Badge>
              )}
              {filters.startDate && (
                <Badge variant="secondary" className="gap-1">
                  From: {filters.startDate}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, startDate: '' }))}
                  />
                </Badge>
              )}
              {filters.endDate && (
                <Badge variant="secondary" className="gap-1">
                  To: {filters.endDate}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, endDate: '' }))}
                  />
                </Badge>
              )}
              {filters.engagementStatus && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.engagementStatus}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, engagementStatus: '' }))}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : operations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No operations in queue</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {operations.map((operation: any) => (
              <Card key={operation.id || Math.random()}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(operation.type)}
                      <div>
                        <CardTitle className="text-lg">{operation.milestoneTitle}</CardTitle>
                        <CardDescription>
                          {operation.engagementReference} • {operation.seekerName} → {operation.expertName}
                        </CardDescription>
                      </div>
                    </div>
                    {getUrgencyBadge(operation.urgency)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-lg font-semibold">{formatCurrency(operation.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Days Since Submission</p>
                      <p className="text-lg font-semibold">{operation.daysSinceSubmission} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="text-lg font-semibold capitalize">{operation.type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  {operation.autoReleaseDate && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Auto-Release Date</p>
                      <p className="font-medium">
                        {new Date(operation.autoReleaseDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/engagements/${operation.engagementId}`)}
                    >
                      View Engagement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppDashboardLayout>
  );
};

export default OperationsQueue;

