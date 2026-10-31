import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAdminSidebar } from '@/hooks/useAdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

// New Modular Components
import { EngagementMetrics } from '@/components/admin/engagements/EngagementMetrics';
import { EngagementFilters } from '@/components/admin/engagements/EngagementFilters';
import { EngagementTable } from '@/components/admin/engagements/EngagementTable';

const Engagements = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const sidebarSections = useAdminSidebar();
    const [page, setPage] = useState(1);

    // Filter States
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [risk, setRisk] = useState('all');

    const limit = 20;

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['operationsEngagements', page, search, status, risk],
        queryFn: () => adminService.getOperationsEngagements({
            page,
            limit,
            search,
            engagementStatus: status === 'all' ? undefined : status
        }),
    });

    // Client-side filtering for Risk (Temporary until backend support)
    // We only filter the CURRENT page, which is not ideal but better than broken UI.
    const filteredData = data?.data?.filter(item => {
        if (risk === 'all') return true;

        let itemRisk = 'low';
        if (item.status === 'disputed') itemRisk = 'high'; // UI maps critical/high similar
        if (item.daysIdle > 14) itemRisk = 'high';
        else if (item.daysIdle > 7) itemRisk = 'medium';

        // Simplify risk categories for filter
        // High = High or Critical (Disputed)
        if (risk === 'high' && (itemRisk === 'high' || item.status === 'disputed')) return true;
        if (risk === 'medium' && itemRisk === 'medium') return true;
        if (risk === 'low' && itemRisk === 'low') return true;

        return false;
    }) || [];

    const getSidebarSections = () => {
        return sidebarSections.map((section) => ({
            ...section,
            items: section.items.map((item) => ({
                ...item,
                isActive: item.href === '/admin/operations/engagements',
            })),
        }));
    };

    const dashboardProps = {
        user: {
            name: user?.name || 'Admin User',
            role: 'Platform Administrator',
        },
        sections: getSidebarSections(),
        headerContent: (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/operations')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">Active Engagements</h1>
                    <p className="text-xs text-muted-foreground">Operations Dashboard</p>
                </div>
            </div>
        ),
        onSignOut: () => {
            logout();
            navigate('/login');
        },
    };

    return (
        <AppDashboardLayout {...dashboardProps}>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Live Operations</h2>
                        <p className="text-muted-foreground mt-1">
                            Real-time oversight of all seeker-expert engagements.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </Button>
                </div>

                {/* Metrics Cards */}
                <EngagementMetrics data={data} />

                {/* Main Content Area */}
                <div className="space-y-4">
                    {/* Filters & Controls */}
                    <EngagementFilters
                        search={search}
                        setSearch={(val) => { setSearch(val); setPage(1); }}
                        status={status}
                        setStatus={(val) => { setStatus(val); setPage(1); }}
                        risk={risk}
                        setRisk={(val) => { setRisk(val); setPage(1); }}
                    />

                    {/* Data Table */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 rounded-lg border bg-card/50">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground font-medium">Loading live operations data...</p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-24 rounded-lg border bg-destructive/5 text-destructive">
                            <AlertCircle className="h-10 w-10 mb-4" />
                            <h3 className="text-lg font-semibold">Error Loading Data</h3>
                            <p className="text-sm text-muted-foreground mb-4">We couldn't fetch the latest engagements.</p>
                            <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
                        </div>
                    ) : (
                        <>
                            <EngagementTable data={filteredData} />

                            {/* Pagination */}
                            {data?.pagination && data.pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-border pt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{data.pagination.totalPages}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={!data.pagination.hasPrev}
                                            className="h-8 gap-1"
                                        >
                                            <ChevronLeft className="h-4 w-4" /> Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                                            disabled={!data.pagination.hasNext}
                                            className="h-8 gap-1"
                                        >
                                            Next <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppDashboardLayout>
    );
};

export default Engagements;
