import { useQuery } from '@tanstack/react-query';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { seekerService, SeekerEngagement } from '@/services/seekerService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { EnhancedStatusBadge } from '@/components/common/EnhancedStatusBadge';

const SeekerEngagements = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const sidebarSections = useAppSidebar();

    const { data: engagements, isLoading } = useQuery({
        queryKey: ['seekerEngagements'],
        queryFn: () => seekerService.getEngagements(),
    });

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'in_progress':
                return 'default';
            case 'completed':
                return 'secondary'; // green-ish usually but secondary works for now
            case 'pending':
                return 'outline';
            case 'cancelled':
            case 'terminated':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const activeEngagements = engagements ? engagements.filter(e => {
        const s = e.status.toLowerCase();
        return s === 'active' || s === 'completed' || s === 'closed';
    }) : [];

    return (
        <AppDashboardLayout
            user={{
                name: user?.name || 'User',
                role: user?.role === 'expert' ? 'Marketing Expert' : user?.role === 'admin' ? 'Platform Administrator' : 'Business Owner',
            }}
            sections={sidebarSections}
            onSignOut={() => {
                logout();
                navigate('/login');
            }}
            headerTitle="Engagements"
        >
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Engagements</h1>
                <p className="text-muted-foreground">Manage your active and past engagements with experts.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Engagements</CardTitle>
                    <CardDescription>A list of all your active project engagements.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : activeEngagements && activeEngagements.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Expert</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeEngagements.map((engagement: SeekerEngagement) => (
                                    <TableRow key={engagement.id}>
                                        <TableCell className="font-medium">{engagement.expertName}</TableCell>
                                        <TableCell>
                                            <EnhancedStatusBadge status={engagement.status} type="engagement" />
                                        </TableCell>
                                        <TableCell>{engagement.progressPercentage}%</TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('en-IN', {
                                                style: 'currency',
                                                currency: 'INR',
                                                maximumFractionDigits: 0,
                                            }).format(engagement.totalProjectAmount)}
                                        </TableCell>
                                        <TableCell>
                                            {engagement.startedAt ? format(new Date(engagement.startedAt), 'MMM d, yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/seeker/engagements/${engagement.id}`)}
                                            >
                                                Details
                                                <ExternalLink className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            <p className="font-medium text-base mb-1 text-slate-800">No Active Engagements Yet</p>
                            <p className="text-sm">Engagement activates after successful payment deposit.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppDashboardLayout>
    );
};

export default SeekerEngagements;
