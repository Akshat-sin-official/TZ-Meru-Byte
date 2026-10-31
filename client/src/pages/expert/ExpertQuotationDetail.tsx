import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { expertService } from '@/services/expertService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Loader2, 
    ArrowLeft, 
    Calendar, 
    FileText, 
    CheckCircle, 
    XCircle, 
    MessageSquare, 
    AlertCircle,
    MapPin,
    ShieldCheck,
    History,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';

const ExpertQuotationDetail = () => {
    const { quotationId } = useParams<{ quotationId: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const sidebarSections = useAppSidebar();

    const { data: quotation, isLoading, error } = useQuery({
        queryKey: ['quotation', quotationId],
        queryFn: () => expertService.getQuotation(quotationId!),
        enabled: !!quotationId
    });

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
                    <Button onClick={() => navigate('/expert/dashboard')} className="rounded-xl px-8">Back to Dashboard</Button>
                </div>
            </AppDashboardLayout>
        );
    }

    return (
        <AppDashboardLayout
            user={userForLayout}
            sections={sidebarSections}
            onSignOut={() => { logout(); navigate('/login'); }}
            headerTitle="Quotation Details"
        >
            <div className="container mx-auto max-w-5xl px-4 py-8 pb-24">
                <Button 
                    variant="ghost" 
                    className="mb-8 pl-0 text-muted-foreground hover:text-foreground" 
                    onClick={() => navigate('/expert/dashboard')}
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
                            Proposal for {quotation.businessName || "Business"}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2 text-sm sm:text-base">
                            <Calendar className="h-4 w-4" /> Sent on {formatDateSafe(quotation.createdAt, 'MMMM d, yyyy')}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 shrink-0 mt-4 lg:mt-0">
                        {(quotation.status === 'revision_requested' || quotation.status === 'draft') && (
                            <Button 
                                className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-100"
                                onClick={() => navigate(`/expert/quotations/${quotation._id}/edit`)}
                            >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                {quotation.status === 'draft' ? 'Continue Draft' : 'Edit & Resubmit'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Revision History Section */}
                        {(quotation.revisionHistory?.length > 0 || quotation.rejectionReason) && (
                            <Card className="border-orange-200 bg-orange-50/30 shadow-sm rounded-2xl overflow-hidden">
                                <CardHeader className="bg-orange-100/50 border-b border-orange-200">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-800">
                                        <History className="h-5 w-5" />
                                        Revision & Status History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    {quotation.rejectionReason && (
                                        <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Current Feedback</Badge>
                                                <span className="text-xs text-muted-foreground">From seeker</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-800 leading-relaxed italic">
                                                "{quotation.rejectionReason}"
                                            </p>
                                        </div>
                                    )}

                                    {quotation.revisionHistory?.map((rev: any, idx: number) => (
                                        <div key={idx} className="relative pl-6 border-l-2 border-orange-200 pb-4 last:pb-0">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-300 border-4 border-white shadow-sm" />
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold uppercase text-orange-600">Revision Requested</span>
                                                <span className="text-xs text-muted-foreground">{formatDateSafe(rev.requestedAt, 'MMM d, yyyy HH:mm')}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 italic">"{rev.reason}"</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

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

                        {/* Engagement Alignment */}
                        {quotation.engagementAlignment && (
                            <Card className="border-[#E5E7EB] shadow-sm rounded-2xl overflow-hidden">
                                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-[#0EA5E9]" />
                                        Engagement & Delivery Alignment
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Business Context</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="bg-white border-gray-200">{quotation.engagementAlignment.businessStage || 'N/A'}</Badge>
                                                <Badge variant="secondary" className="bg-white border-gray-200">{quotation.engagementAlignment.businessType || 'N/A'}</Badge>
                                                <Badge variant="secondary" className="bg-white border-gray-200">{quotation.engagementAlignment.customerType || 'N/A'}</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Model \u0026 Pricing</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="bg-white border-gray-200">{quotation.engagementAlignment.engagementModel || 'N/A'}</Badge>
                                                <Badge variant="secondary" className="bg-white border-gray-200">{quotation.engagementAlignment.pricingModel || 'N/A'}</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Delivery \u0026 TAT</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="bg-white border-gray-200">{quotation.engagementAlignment.deliveryMode || 'N/A'}</Badge>
                                                <Badge variant="secondary" className="bg-white border-gray-200">{quotation.engagementAlignment.turnaroundTime || 'N/A'}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

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
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-sm text-[#6B7280] font-medium">Validity</span>
                                        <span className="text-sm font-bold text-[#111926]">
                                            {formatDateSafe(quotation.validUntil, 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-sm text-[#6B7280] font-medium flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" /> Supply Place
                                        </span>
                                        <span className="text-sm font-bold text-[#111926]">
                                          {[quotation.placeOfSupply?.city, quotation.placeOfSupply?.state, quotation.placeOfSupply?.country]
                                            .filter(Boolean)
                                            .join(', ') || quotation.placeOfSupply?.state}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-[#6B7280] font-medium flex items-center gap-1.5">
                                            <ShieldCheck className="h-3.5 w-3.5" /> GST Status
                                        </span>
                                        <Badge variant="secondary" className="capitalize text-[10px]">
                                            {quotation.gstContext?.expertGSTStatus?.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                {quotation.status === 'sent' && (
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-2">
                                        <div className="flex items-center gap-2 text-blue-800">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-sm font-bold">Awaiting Business Action</span>
                                        </div>
                                        <p className="text-xs text-blue-600 leading-relaxed">
                                            The seeker has received your proposal and is currently reviewing it. You'll be notified when they accept or request changes.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppDashboardLayout>
    );
};

export default ExpertQuotationDetail;
