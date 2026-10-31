import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { seekerService } from '@/services/seekerService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Calendar, User, CheckCircle, FileText, RefreshCw, Video } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { EnhancedStatusBadge } from '@/components/common/EnhancedStatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getFileNameFromUrl, downloadOrOpenFile } from '@/lib/fileUtils';

const SeekerEngagementDetail = () => {
    const { engagementId } = useParams<{ engagementId: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const sidebarSections = useAppSidebar();

    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'revision' | null>(null);
    const [feedback, setFeedback] = useState('');

    const { data: engagement, isLoading } = useQuery({
        queryKey: ['engagement', engagementId],
        queryFn: async () => {
            const engagements = await seekerService.getEngagements();
            const found = engagements.find(e => e.id === engagementId);
            if (!found) throw new Error('Engagement not found');
            return found;
        },
        enabled: !!engagementId
    });

    const { data: discussions, isLoading: discussionsLoading } = useQuery({
        queryKey: ['seekerDiscussions'],
        queryFn: () => seekerService.getDiscussions(),
    });

    const relatedDiscussions = useMemo(() => {
        if (!discussions || !engagement) return [];
        return discussions.filter(d => 
            d.engagementId === engagement.id || 
            (engagement.quotationId && d.quotationId === engagement.quotationId) ||
            (d.purpose === 'requirement_discussion' && d.expertId === engagement.expertId)
        );
    }, [discussions, engagement]);

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'scheduled':
            case 'accepted':
            case 'open':
                return 'default';
            case 'completed':
                return 'secondary';
            case 'cancelled':
            case 'declined':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const { data: submissionDetails, isLoading: submissionLoading } = useQuery({
        queryKey: ['milestoneSubmission', selectedSubmissionId],
        queryFn: () => seekerService.getMilestoneSubmission(selectedSubmissionId!),
        enabled: !!selectedSubmissionId,
    });

    const userForLayout = {
        name: user?.name || 'User',
        role: user?.role === 'expert' ? 'Marketing Expert' : user?.role === 'admin' ? 'Platform Administrator' : 'Business Owner',
    };

    if (isLoading) {
        return (
            <AppDashboardLayout
                user={userForLayout}
                sections={sidebarSections}
                onSignOut={() => { logout(); navigate('/login'); }}
            >
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppDashboardLayout>
        );
    }

    if (!engagement) {
        return (
            <AppDashboardLayout
                user={userForLayout}
                sections={sidebarSections}
                onSignOut={() => { logout(); navigate('/login'); }}
            >
                <div className="flex flex-col items-center justify-center py-20">
                    <h2 className="text-2xl font-bold mb-4">Engagement Not Found</h2>
                    <Button onClick={() => navigate('/seeker/engagements')}>Back to Engagements</Button>
                </div>
            </AppDashboardLayout>
        );
    }

    const openSubmissionDialog = (submissionId: string, type: 'approve' | 'revision') => {
        setSelectedSubmissionId(submissionId);
        setActionType(type);
        setFeedback('');
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setSelectedSubmissionId(null);
        setActionType(null);
        setFeedback('');
    };

    const handleConfirmAction = async () => {
        if (!selectedSubmissionId || !actionType) return;

        try {
            if (actionType === 'approve') {
                await seekerService.approveMilestone(selectedSubmissionId);
            } else if (actionType === 'revision') {
                if (!feedback.trim()) {
                    alert('Please provide feedback for revision.');
                    return;
                }
                await seekerService.requestRevision(selectedSubmissionId, { feedback: feedback.trim() });
            }
            handleDialogClose();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Failed to perform action');
        }
    };

    return (
        <AppDashboardLayout
            user={userForLayout}
            sections={sidebarSections}
            onSignOut={() => { logout(); navigate('/login'); }}
            headerTitle="Engagement Details"
        >
            <div className="mb-8">
                <Button variant="ghost" className="mb-4 pl-0" onClick={() => navigate('/seeker/engagements')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Engagements
                </Button>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Project with {engagement.expertName}</h1>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="flex items-center"><User className="mr-1 h-4 w-4" /> {engagement.expertName}</span>
                            <span className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> Started {engagement.startedAt ? format(new Date(engagement.startedAt), 'MMM d, yyyy') : 'Pending start'}</span>
                        </div>
                    </div>
                    <EnhancedStatusBadge status={engagement.status} type="engagement" className="text-sm px-3 py-1" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{engagement.progressPercentage}%</span>
                            </div>
                            <Progress value={engagement.progressPercentage} className="h-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-4 bg-muted/40 rounded-lg">
                                <p className="text-sm text-muted-foreground">Total Budget</p>
                                <p className="text-2xl font-bold">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(engagement.totalProjectAmount)}
                                </p>
                            </div>
                            <div className="p-4 bg-muted/40 rounded-lg">
                                <p className="text-sm text-muted-foreground">Remaining Balance</p>
                                <p className="text-2xl font-bold text-muted-foreground">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(engagement.remainingBalance)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Milestones</CardTitle>
                        <CardDescription>Track project milestones and payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {engagement.milestones && engagement.milestones.map((milestone) => (
                                <div key={milestone.id} className="flex flex-col gap-2 p-3 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {milestone.status === 'approved' ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <div className="h-5 w-5 rounded-full border-2 border-muted" />
                                            )}
                                            <div>
                                                <p className="font-medium">{milestone.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(milestone.amount)}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={milestone.status === 'approved' ? 'default' : 'outline'}>
                                            {milestone.status}
                                        </Badge>
                                    </div>

                                    {milestone.status === 'submitted' && milestone.submissionId && (
                                        <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                                            <Button
                                                size="sm"
                                                onClick={() => openSubmissionDialog(milestone.submissionId!, 'approve')}
                                                className="text-xs gap-1.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white border-0 font-semibold"
                                            >
                                                <CheckCircle className="h-3 w-3" />
                                                Approve & Release
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => openSubmissionDialog(milestone.submissionId!, 'revision')}
                                                className="text-xs gap-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white border-0 font-semibold"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                Request Revision
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {!engagement.milestones?.length && <p className="text-muted-foreground text-sm">No milestones defined.</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50 p-6">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-[#0EA5E9]" />
                                Discussions & Alignment
                            </CardTitle>
                            <CardDescription>Schedule or view meetings related to this project</CardDescription>
                        </div>
                        <Button 
                            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold h-10 px-6 rounded-xl shrink-0"
                            onClick={() => navigate(`/discussions/schedule/${engagement.expertId}?purpose=alignment&engagementId=${engagement.id}`)}
                            disabled={engagement.status?.toLowerCase() !== 'active'}
                        >
                            Schedule Alignment Session
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="p-4 bg-muted/30 rounded-xl border border-dashed text-sm text-muted-foreground">
                            Need to align on timelines, milestone deliverables, or onboarding? Schedule a dedicated Alignment Discussion with the expert for this engagement.
                        </div>

                        {discussionsLoading ? (
                            <div className="flex h-32 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : relatedDiscussions.length > 0 ? (
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead>Topic / Purpose</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {relatedDiscussions.map((discussion) => (
                                            <TableRow key={discussion.id} className="hover:bg-muted/10 transition-colors">
                                                <TableCell className="font-semibold capitalize text-[#111926]">
                                                    {discussion.purpose.replace('_', ' ')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{discussion.scheduledDate ? format(new Date(discussion.scheduledDate), 'MMM d, yyyy') : 'N/A'}</span>
                                                        <span className="text-xs text-muted-foreground">{discussion.scheduledTime}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(discussion.status)} className="capitalize">
                                                        {discussion.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {discussion.status.toLowerCase() === 'accepted' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/meeting/${discussion.id}`)}
                                                                className="h-8 px-3 rounded-lg border-emerald-250 text-emerald-600 hover:bg-emerald-50 text-xs"
                                                            >
                                                                <Video className="h-3.5 w-3.5 mr-1.5" />
                                                                {discussion.meetingJoinedAt || discussion.attendanceStatus === 'in_progress' ? 'Rejoin Discussion' : 'Join Call'}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/seeker/discussions/${discussion.id}`)}
                                                            className="h-8 px-3 rounded-lg text-xs"
                                                        >
                                                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                                            Details
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground text-sm border rounded-xl bg-slate-50/50">
                                No discussions scheduled yet for this project.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'approve'
                                ? 'Approve Milestone & Release Funds'
                                : 'Request Milestone Revision'}
                        </DialogTitle>
                        <DialogDescription>
                            Review the expert's submission before you decide. Funds move only on your explicit approval.
                        </DialogDescription>
                    </DialogHeader>

                            {submissionLoading || !submissionDetails ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4 mt-2">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Milestone</p>
                                <p className="text-base font-semibold">
                                    #{submissionDetails.milestoneNumber} · {submissionDetails.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Submitted by {submissionDetails.expertName} on{' '}
                                    {new Date(submissionDetails.submittedAt).toLocaleString('en-IN')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Submission Details</p>
                                <p className="whitespace-pre-wrap text-sm border rounded-md p-3 bg-muted/30">
                                    {submissionDetails.submissionContent || 'No description provided.'}
                                </p>
                            </div>

                            {submissionDetails.submissionFiles && submissionDetails.submissionFiles.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Attached Files</p>
                                    <div className="space-y-1">
                                        {submissionDetails.submissionFiles.map((file, idx) => {
                                            const fileName = getFileNameFromUrl(file, idx + 1);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => downloadOrOpenFile(file, fileName)}
                                                    className="flex items-center gap-2 text-sm text-primary hover:underline text-left cursor-pointer truncate max-w-full"
                                                >
                                                    <FileText className="h-4 w-4 shrink-0" />
                                                    <span className="truncate">{fileName}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {actionType === 'revision' && (
                                <div className="space-y-2 pt-2 border-t">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {'Revision Feedback'}
                                    </p>
                                    <Textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        rows={4}
                                        placeholder="Explain what changes you need before this milestone can be approved."
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={handleDialogClose}>
                                    Cancel
                                </Button>
                                <Button onClick={handleConfirmAction}>
                                    {actionType === 'approve'
                                        ? 'Approve & Release Funds'
                                        : 'Send Revision Request'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppDashboardLayout>
    );
};

export default SeekerEngagementDetail;
