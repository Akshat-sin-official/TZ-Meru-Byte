import { useQuery } from '@tanstack/react-query';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { seekerService, SeekerQuotation } from '@/services/seekerService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const SeekerQuotations = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const sidebarSections = useAppSidebar();

    const { data: quotations, isLoading } = useQuery({
        queryKey: ['seekerQuotations'],
        queryFn: () => seekerService.getQuotations(),
    });

    const getStatusVariant = (status: string) => {
        const s = status.toLowerCase();
        switch (s) {
            case 'accepted':
                return 'default'; // Used default (primary) for accepted
            case 'rejected':
            case 'declined':
            case 'expired':
                return 'destructive';
            case 'pending':
            case 'sent':
            case 'draft':
                return 'secondary';
            default:
                return 'outline';
        }
    };

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
            headerTitle="Quotations"
        >
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
                <p className="text-muted-foreground">Review and manage quotations received from experts.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Received Quotations</CardTitle>
                    <CardDescription>Quotations pending your review or approval.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : quotations && quotations.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference ID</TableHead>
                                    <TableHead>Expert</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Valid Until</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotations.map((quotation: SeekerQuotation) => (
                                    <TableRow key={quotation.id}>
                                        <TableCell>
                                            <span className="font-mono text-xs font-bold text-[#0EA5E9] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                                                {quotation.referenceId || `QT-${quotation.id.substring(18).toUpperCase()}`}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium">{quotation.expertName}</TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('en-IN', {
                                                style: 'currency',
                                                currency: quotation.currency || 'INR',
                                                maximumFractionDigits: 0,
                                            }).format(quotation.totalAmount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(quotation.status)}>
                                                {quotation.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {quotation.validUntil ? format(new Date(quotation.validUntil), 'MMM d, yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(quotation.createdAt), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/seeker/quotations/${quotation.id}`)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                                {['pending', 'sent'].includes(quotation.status.toLowerCase()) && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => navigate(`/payment/consent/${quotation.id}`)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Accept
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            No quotations found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppDashboardLayout>
    );
};

export default SeekerQuotations;
