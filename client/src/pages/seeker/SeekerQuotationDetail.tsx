import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { seekerService } from '@/services/seekerService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Loader2, 
    ArrowLeft, 
    Calendar, 
    Clock, 
    FileText, 
    CheckCircle, 
    XCircle, 
    MessageSquare, 
    AlertCircle,
    Info,
    ChevronRight,
    MapPin,
    ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SeekerQuotationDetail = () => {
    const { quotationId } = useParams<{ quotationId: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const sidebarSections = useAppSidebar();
    const queryClient = useQueryClient();

    const [showRespondDialog, setShowRespondDialog] = useState<{ open: boolean; action: 'reject' | 'revise' }>({ open: false, action: 'reject' });
    const [respondNote, setRespondNote] = useState('');

    const formatDateSafe = (dateVal: any, formatStr: string = 'MMM d, yyyy') => {
        if (!dateVal) return 'N/A';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return 'N/A';
        try {
            return format(d, formatStr);
        } catch {
            return 'N/A';
        }
    };

    const { data: quotation, isLoading, error } = useQuery({
        queryKey: ['quotation', quotationId],
        queryFn: () => seekerService.getQuotation(quotationId!),
        enabled: !!quotationId
    });

    const respondMutation = useMutation({
        mutationFn: ({ action, note }: { action: 'reject' | 'revise', note: string }) => 
            action === 'reject' 
                ? seekerService.rejectQuotation(quotationId!, note)
                : seekerService.requestQuotationRevision(quotationId!, note),
        onSuccess: (_, variables) => {
            toast.success(`Quotation ${variables.action === 'reject' ? 'rejected' : 'revision requested'} successfully`);
            queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] });
            queryClient.invalidateQueries({ queryKey: ['seekerQuotations'] });
            setShowRespondDialog({ open: false, action: 'reject' });
            setRespondNote('');
            navigate('/seeker/dashboard');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to process request');
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: quotation?.currency || 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const userForLayout = {
        name: user?.name || 'User',
        role: user?.role === 'expert' ? 'Marketing Expert' : user?.role === 'admin' ? 'Platform Administrator' : 'Business Owner',
    };

    if (isLoading) {
        return (
            <AppDashboardLayout user={userForLayout} sections={sidebarSections} onSignOut={() => { logout(); navigate('/login'); }}>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-[#0EA5E9]" />
                        <p className="text-muted-foreground animate-pulse">Loading quotation details...</p>
                    </div>
                </div>
            </AppDashboardLayout>
        );
    }

    if (error || !quotation) {
        return (
            <AppDashboardLayout user={userForLayout} sections={sidebarSections} onSignOut={() => { logout(); navigate('/login'); }}>
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Quotation Not Found</h2>
                    <p className="text-muted-foreground max-w-md mb-8">This quotation may have been deleted or you don't have permission to view it.</p>
                    <Button onClick={() => navigate('/seeker/dashboard')} className="rounded-xl px-8">Back to Dashboard</Button>
                </div>
            </AppDashboardLayout>
        );
    }

    const isPending = ['sent', 'pending', 'revision_requested'].includes(quotation.status.toLowerCase());

    return (
        <AppDashboardLayout
            user={userForLayout}
            sections={sidebarSections}
            onSignOut={() => { logout(); navigate('/login'); }}
            headerTitle="Review Proposal"
        >
            <div className="container mx-auto max-w-5xl px-4 py-8 pb-24">
                <Button 
                    variant="ghost" 
                    className="mb-8 pl-0 text-muted-foreground hover:text-foreground" 
                    onClick={() => navigate('/seeker/dashboard')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-bold text-[#0EA5E9] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                                {quotation.referenceId || `QT-${quotation._id.substring(18).toUpperCase()}`}
                            </span>
                            <Badge 
                                className="capitalize px-3 py-0.5 rounded-full text-xs font-semibold"
                                variant={quotation.status === 'accepted' ? 'default' : quotation.status === 'rejected' ? 'destructive' : 'secondary'}
                            >
                                {quotation.status}
                            </Badge>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111926]">
                            Proposal from {quotation.expertId?.fullName || "Expert"}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2 text-sm sm:text-base">
                            <Calendar className="h-4 w-4" /> Received on {formatDateSafe(quotation.createdAt, 'MMMM d, yyyy')}
                        </p>
                    </div>

                    {isPending && (
                        <div className="flex flex-wrap gap-3 shrink-0 mt-4 lg:mt-0">
                            <Button 
                                variant="outline" 
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold h-11 px-6 rounded-xl"
                                onClick={() => setShowRespondDialog({ open: true, action: 'reject' })}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                            </Button>
                            <Button 
                                variant="outline" 
                                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-semibold h-11 px-6 rounded-xl"
                                onClick={() => setShowRespondDialog({ open: true, action: 'revise' })}
                            >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Request Revision
                            </Button>
                            <Button 
                                className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-100"
                                onClick={() => navigate(`/payment/consent/${quotation._id}`)}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Accept & Proceed
                            </Button>
                        </div>
                    )}
                </div>

                {quotation.status === 'accepted' && (
                    <div className="mb-8 p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-emerald-800 text-base">Proposal Accepted</h3>
                            <p className="text-sm text-emerald-750">This quotation has been approved and funded. You can now manage project milestones or schedule alignment calls from the active project page.</p>
                        </div>
                        <Button 
                            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold h-10 px-5 rounded-xl shrink-0 shadow-sm"
                            onClick={async () => {
                                try {
                                    const engagements = await seekerService.getEngagements();
                                    const associatedEng = engagements.find(e => e.quotationId === quotation._id || e.quotationId === quotation.id);
                                    if (associatedEng) {
                                        navigate(`/seeker/engagements/${associatedEng.id}`);
                                    } else {
                                        navigate('/seeker/dashboard');
                                    }
                                } catch {
                                    navigate('/seeker/dashboard');
                                }
                            }}
                        >
                            Go to Project Page
                        </Button>
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Project Context */}
                        <Card className="border-[#E5E7EB] shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-[#0EA5E9]" />
                                    Project Scope & Deliverables
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-3">Project Title</h3>
                                    <p className="text-xl font-bold text-[#111926]">{quotation.projectTitle || "Marketing Engagement"}</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-3">Service Category</h3>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-semibold">
                                            {quotation.serviceCategory || "Marketing"}
                                        </Badge>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-3">Discussion Reference</h3>
                                        <p className="font-mono text-sm font-medium text-[#111926]">{quotation.discussionId?.referenceId || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-3">Objective & Scope</h3>
                                    <p className="text-[#374151] leading-relaxed whitespace-pre-wrap">{quotation.scope}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-3">Key Deliverables</h3>
                                    <div className="bg-[#F9FAFB] p-5 rounded-xl border border-[#E5E7EB]">
                                        <p className="text-[#374151] leading-relaxed whitespace-pre-wrap">{quotation.deliverables || "See milestones for details"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Milestones */}
                        <Card className="border-[#E5E7EB] shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-[#0EA5E9]" />
                                    Project Milestones
                                </CardTitle>
                                <CardDescription>Structured delivery and deposit release schedule</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="p-4 text-left font-bold text-[#6B7280] uppercase tracking-wider">#</th>
                                                <th className="p-4 text-left font-bold text-[#6B7280] uppercase tracking-wider">Deliverable / Milestone</th>
                                                <th className="p-4 text-left font-bold text-[#6B7280] uppercase tracking-wider">Timeline</th>
                                                <th className="p-4 text-left font-bold text-[#6B7280] uppercase tracking-wider">No. of Revisions</th>
                                                <th className="p-4 text-right font-bold text-[#6B7280] uppercase tracking-wider">Deposit</th>
                                                <th className="p-4 text-right font-bold text-[#6B7280] uppercase tracking-wider">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {quotation.milestones.map((milestone: any) => (
                                                <tr key={milestone._id} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="p-4 font-bold text-[#111926]">{milestone.milestoneNumber}</td>
                                                    <td className="p-4 max-w-xs">
                                                        <p className="font-bold text-[#111926] mb-1">{milestone.name || `Milestone ${milestone.milestoneNumber}`}</p>
                                                        <p className="text-xs text-[#6B7280] line-clamp-2">{milestone.scope}</p>
                                                    </td>
                                                    <td className="p-4 text-[#4B5563] font-medium">{milestone.timeline}</td>
                                                    <td className="p-4 text-[#4B5563] font-medium">{milestone.numberOfRevisions || '—'}</td>
                                                    <td className="p-4 text-right">
                                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">
                                                            {milestone.depositPercentage}%
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-right font-bold text-[#111926]">
                                                        {formatCurrency(milestone.depositAmount || milestone.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-[#F0F9FF]/30 font-bold">
                                                <td colSpan={5} className="p-4 text-right text-[#0369A1]">Total Engagement Value</td>
                                                <td className="p-4 text-right text-lg text-[#0369A1]">{formatCurrency(quotation.totalEngagementValue)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Terms & Conditions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-[#E5E7EB] shadow-sm rounded-2xl overflow-hidden">
                                <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                                    <CardTitle className="text-base font-bold">Terms & Validity</CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-sm text-[#6B7280] font-medium">Proposal Validity</span>
                                        <span className="text-sm font-bold text-[#111926]">
                                            {formatDateSafe(quotation.validUntil, 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-sm text-[#6B7280] font-medium">Engagement Start</span>
                                        <span className="text-sm font-bold text-[#111926]">
                                            {quotation.engagementStartDate ? formatDateSafe(quotation.engagementStartDate, 'MMM d, yyyy') : 'As agreed'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-sm text-[#6B7280] font-medium">Estimated End Date</span>
                                        <span className="text-sm font-bold text-[#111926]">
                                            {quotation.estimatedEndDate ? formatDateSafe(quotation.estimatedEndDate, 'MMM d, yyyy') : 'Based on timeline'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-[#6B7280] font-medium">Deposit Model</span>
                                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 uppercase font-bold">Milestone Based</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-[#E5E7EB] shadow-sm rounded-2xl overflow-hidden">
                                <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                                    <CardTitle className="text-base font-bold">Compliance & Tax</CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-sm text-[#6B7280] font-medium flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" /> Place of Supply
                                        </span>
                                        <span className="text-sm font-bold text-[#111926]">
                                          {[quotation.placeOfSupply?.city, quotation.placeOfSupply?.state, quotation.placeOfSupply?.country]
                                            .filter(Boolean)
                                            .join(', ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-sm text-[#6B7280] font-medium flex items-center gap-1.5">
                                            <ShieldCheck className="h-3.5 w-3.5" /> Expert GST
                                        </span>
                                        <Badge variant="secondary" className="capitalize text-[10px]">
                                            {quotation.gstContext?.expertGSTStatus?.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-[#6B7280] font-medium flex items-center gap-1.5">
                                            <ShieldCheck className="h-3.5 w-3.5" /> Seeker GST
                                        </span>
                                        <Badge variant="secondary" className="capitalize text-[10px]">
                                            {quotation.gstContext?.clientGSTStatus?.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Exclusions & Assumptions */}
                        <div className="space-y-6">
                            {quotation.exclusions && (
                                <Card className="border-[#E5E7EB] shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="py-4 border-b border-gray-50">
                                        <CardTitle className="text-base font-bold">Out of Scope & Exclusions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-4">
                                        {quotation.exclusions.outOfScopeItems && quotation.exclusions.outOfScopeItems.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold text-[#6B7280] uppercase mb-2">Excluded Items</p>
                                                <ul className="list-disc list-inside text-sm text-[#4B5563] space-y-1">
                                                    {quotation.exclusions.outOfScopeItems.map((item: string, i: number) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {quotation.exclusions.thirdPartyCosts && (
                                            <div>
                                                <p className="text-xs font-bold text-[#6B7280] uppercase mb-1">Third-Party Costs</p>
                                                <p className="text-sm text-[#4B5563]">{quotation.exclusions.thirdPartyCosts}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {quotation.engagementAlignment && (
                                <Card className="border-[#E5E7EB] shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="py-4 border-b border-gray-50 bg-gray-50/50">
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-[#0EA5E9]" />
                                            Engagement & Delivery Alignment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <Label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-tighter mb-1 block">Business Context</Label>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100">{quotation.engagementAlignment.businessStage || 'Stage N/A'}</Badge>
                                                    <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100">{quotation.engagementAlignment.businessType || 'Type N/A'}</Badge>
                                                    <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100">{quotation.engagementAlignment.customerType || 'Customer N/A'}</Badge>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-tighter mb-1 block">Engagement Model</Label>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <Badge variant="outline" className="bg-purple-50/50 text-purple-700 border-purple-100">{quotation.engagementAlignment.engagementModel || 'Model N/A'}</Badge>
                                                    <Badge variant="outline" className="bg-purple-50/50 text-purple-700 border-purple-100">{quotation.engagementAlignment.pricingModel || 'Pricing N/A'}</Badge>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-tighter mb-1 block">Delivery & Turnaround</Label>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <Badge variant="outline" className="bg-green-50/50 text-green-700 border-green-100">{quotation.engagementAlignment.deliveryMode || 'Mode N/A'}</Badge>
                                                    <Badge variant="outline" className="bg-green-50/50 text-green-700 border-green-100">{quotation.engagementAlignment.turnaroundTime || 'TAT N/A'}</Badge>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-tighter mb-1 block">Service Category</Label>
                                                <div className="mt-1">
                                                    <p className="text-sm font-semibold text-[#111926]">{quotation.serviceCategory || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {quotation.dependenciesAndAssumptions && (
                                <Card className="border-[#E5E7EB] shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="py-4 border-b border-gray-50">
                                        <CardTitle className="text-base font-bold">Assumptions & Dependencies</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5">
                                        <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap">{quotation.dependenciesAndAssumptions}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Summary Sidebar */}
                        <Card className="border-[#E5E7EB] shadow-lg rounded-2xl overflow-hidden sticky top-24">
                            <CardHeader className="bg-[#111926] text-white py-6">
                                <CardTitle className="text-lg">Commercial Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Total Engagement Value</p>
                                    <p className="text-4xl font-black text-[#111926] tracking-tight">{formatCurrency(quotation.totalEngagementValue)}</p>
                                    <p className="text-[10px] text-[#6B7280] font-medium">Excluding taxes, payable via platform deposit</p>
                                </div>

                                <div className="h-px bg-gray-100" />

                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                                            <span className="text-sm font-bold text-[#111926]">100% Deposit Rule</span>
                                        </div>
                                        <Info className="h-4 w-4 text-[#6B7280]" />
                                    </div>
                                    <p className="text-xs text-[#6B7280] leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        Full amount is held in MarTechAdda's safe custody and released to the expert only when you approve the milestones.
                                    </p>
                                </div>

                                {isPending && (
                                    <div className="pt-4 space-y-3">
                                        <Button 
                                            className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold h-12 rounded-xl text-base shadow-lg shadow-blue-100"
                                            onClick={() => navigate(`/payment/consent/${quotation._id}`)}
                                        >
                                            Accept Proposal
                                        </Button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button 
                                                variant="outline" 
                                                className="font-bold text-xs h-10 border-gray-200"
                                                onClick={() => setShowRespondDialog({ open: true, action: 'revise' })}
                                            >
                                                Request Changes
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="font-bold text-xs h-10 border-gray-200 text-red-600 hover:bg-red-50"
                                                onClick={() => setShowRespondDialog({ open: true, action: 'reject' })}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                
                                {!isPending && (
                                    <Alert className={quotation.status === 'accepted' ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}>
                                        {quotation.status === 'accepted' ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                        <AlertDescription className={quotation.status === 'accepted' ? "text-green-800" : "text-red-800"}>
                                            This quotation has been <strong>{quotation.status}</strong>.
                                            {quotation.status === 'accepted' && (
                                                <div className="mt-2">
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full font-bold h-8" onClick={() => navigate('/seeker/engagements')}>View Engagement</Button>
                                                </div>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Respond Dialog */}
            <Dialog open={showRespondDialog.open} onOpenChange={(open) => setShowRespondDialog({ ...showRespondDialog, open })}>
                <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className={showRespondDialog.action === 'reject' ? "bg-red-50 p-6" : "bg-blue-50 p-6"}>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {showRespondDialog.action === 'reject' ? (
                                <><XCircle className="h-6 w-6 text-red-600" /> Reject Quotation</>
                            ) : (
                                <><MessageSquare className="h-6 w-6 text-blue-600" /> Request Revision</>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-gray-700 font-medium">
                            {showRespondDialog.action === 'reject' 
                                ? "Please provide a reason for rejecting this proposal. This feedback helps the expert understand your decision." 
                                : "Describe the changes you'd like to see in the quotation (scope, timeline, or commercials)."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="respondNote" className="font-bold text-[#111926]">Your Feedback *</Label>
                            <Textarea
                                id="respondNote"
                                value={respondNote}
                                onChange={(e) => setRespondNote(e.target.value)}
                                placeholder={showRespondDialog.action === 'reject' ? "e.g., The project value is higher than our current budget..." : "e.g., We'd like to break milestone 2 into two separate parts..."}
                                rows={5}
                                className="rounded-xl border-gray-200 focus:ring-[#0EA5E9]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="bg-gray-50 p-4 gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setShowRespondDialog({ ...showRespondDialog, open: false })} className="rounded-xl font-bold">Cancel</Button>
                        <Button
                            onClick={() => respondMutation.mutate({ action: showRespondDialog.action, note: respondNote })}
                            disabled={respondMutation.isPending || !respondNote.trim()}
                            className={showRespondDialog.action === 'reject' ? "bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold px-6" : "bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6"}
                        >
                            {respondMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {showRespondDialog.action === 'reject' ? 'Confirm Rejection' : 'Submit Revision Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppDashboardLayout>
    );
};

export default SeekerQuotationDetail;
