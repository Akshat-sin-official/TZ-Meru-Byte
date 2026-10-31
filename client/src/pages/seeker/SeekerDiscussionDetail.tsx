import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { seekerService } from '@/services/seekerService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Clock, User, Video, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { RescheduleDiscussionDialog } from '@/components/discussion/RescheduleDiscussionDialog';
// Legacy checklist is for old discussion threads; scheduled-discussions focus on scheduling + context.

const SeekerDiscussionDetail = () => {
    const { discussionId } = useParams<{ discussionId: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const sidebarSections = useAppSidebar();
    const [showRescheduleConfirm, setShowRescheduleConfirm] = useState(false);
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const cancelDiscussionMutation = useMutation({
        mutationFn: () => seekerService.cancelDiscussion(discussionId!, cancelReason),
        onSuccess: () => {
            toast.success('Discussion cancelled successfully');
            setShowCancelModal(false);
            setCancelReason('');
            refetch();
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to cancel discussion');
        }
    });

    const { data: discussion, isLoading, refetch } = useQuery({
        queryKey: ['discussion', discussionId],
        queryFn: () => seekerService.getDiscussion(discussionId!),
        enabled: !!discussionId
    });



    const confirmRescheduleMutation = useMutation({
        mutationFn: () => seekerService.confirmScheduledReschedule(discussionId!),
        onSuccess: () => {
            toast.success('Reschedule confirmed');
            setShowRescheduleConfirm(false);
            refetch();
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : 'Failed to confirm reschedule');
        },
    });

    const acceptDiscussionMutation = useMutation({
        mutationFn: () => seekerService.acceptScheduledDiscussion(discussionId!),
        onSuccess: () => {
            toast.success('Discussion accepted successfully');
            refetch();
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : 'Failed to accept discussion');
        },
    });



    // Request quotation mutation
    const requestQuotationMutation = useMutation({
        mutationFn: () => seekerService.requestQuotation(discussionId!),
        onSuccess: () => {
            toast.success('Quotation requested successfully');
            refetch();
        },
        onError: (error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : 'Failed to request quotation';
            toast.error(errorMessage);
        },
    });



    const userForLayout = {
        name: user?.name || 'User',
        role: user?.role === 'expert' ? 'Marketing Expert' : user?.role === 'admin' ? 'Platform Administrator' : 'Business Owner',
    };

    const chaseDiscussionMutation = useMutation({
        mutationFn: () => seekerService.chaseDiscussion(discussionId!),
        onSuccess: () => {
            toast.success('Expert has been notified that you are waiting.');
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.error || error.message || 'Failed to send chase';
            toast.error(errorMessage);
        },
    });



    // Loading state
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

    if (!discussion) {
        return (
            <AppDashboardLayout
                user={userForLayout}
                sections={sidebarSections}
                onSignOut={() => { logout(); navigate('/login'); }}
            >
                <div className="flex flex-col items-center justify-center py-20">
                    <h2 className="text-2xl font-bold mb-4">Discussion Not Found</h2>
                    <Button onClick={() => navigate('/seeker/discussions')}>Back to Discussions</Button>
                </div>
            </AppDashboardLayout>
        );
    }

    return (
        <AppDashboardLayout
            user={userForLayout}
            sections={sidebarSections}
            onSignOut={() => { logout(); navigate('/login'); }}
            headerTitle="Discussion Details"
        >
            <div className="mb-8">
                <Button variant="ghost" className="mb-4 pl-0" onClick={() => navigate('/seeker/discussions')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Discussions
                </Button>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{discussion.purpose}</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            with {discussion.expertName}
                        </p>
                    </div>
                    <Badge className="text-sm px-3 py-1 capitalize" variant={discussion.status === 'scheduled' ? 'default' : 'secondary'}>
                        {discussion.status}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Agenda & Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Subject</h3>
                                <p className="text-muted-foreground">{discussion.purpose}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Agenda</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{discussion.agenda}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Saved Discussion Points (private seeker notes) */}
                    {(discussion.status === 'completed' || discussion.checklist) && (
                        <Card className="border-2 border-foreground/5 bg-slate-50/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#111926]">
                                    <span className="p-1.5 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg text-[#FF6B35]">✓</span>
                                    Saved Discussion Points
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    These notes are private and only visible to you. They were automatically shared with both parties via email after meeting completion.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Checklist items */}
                                {discussion.checklist?.items && discussion.checklist.items.length > 0 ? (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-[#111926]">Discussed Topics</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {discussion.checklist.items.map((item: any) => (
                                                <div key={item.id} className="flex items-center space-x-2 text-sm text-slate-600 bg-white p-2 rounded-lg border border-slate-100 shadow-sm animate-in fade-in duration-200">
                                                    <span className={`text-sm shrink-0 flex items-center justify-center w-5 h-5 rounded-full ${item.checked ? 'bg-emerald-50 text-emerald-600 font-bold' : 'bg-slate-100 text-slate-300'}`}>
                                                        {item.checked ? '✓' : '○'}
                                                    </span>
                                                    <span className={item.checked ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 italic bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                        No checked discussion topics.
                                    </div>
                                )}

                                {/* Additional Notes */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="font-semibold text-sm text-[#111926] mb-2">Additional Notes / Key Takeaways</h4>
                                    <div className="text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-100 shadow-sm whitespace-pre-wrap leading-relaxed">
                                        {discussion.checklist?.notes || (
                                            <span className="text-slate-400 italic">No additional notes were recorded.</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Meeting Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center p-3 bg-muted/30 rounded-lg">
                            <Calendar className="h-5 w-5 text-primary mr-3" />
                            <div>
                                <p className="text-sm font-medium">Date</p>
                                <p className="text-sm text-muted-foreground">{discussion.scheduledDate ? format(new Date(discussion.scheduledDate), 'EEEE, MMM d, yyyy') : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-muted/30 rounded-lg">
                            <Clock className="h-5 w-5 text-primary mr-3" />
                            <div>
                                <p className="text-sm font-medium">Time</p>
                                <p className="text-sm text-muted-foreground">{discussion.scheduledTime}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-muted/30 rounded-lg">
                            <User className="h-5 w-5 text-primary mr-3" />
                            <div>
                                <p className="text-sm font-medium">Expert</p>
                                <p className="text-sm text-muted-foreground">{discussion.expertName}</p>
                            </div>
                        </div>

                        {discussion.status === 'accepted' && (
                            <Button className="w-full mt-4" onClick={() => navigate(`/meeting/${discussion.id}`)}>
                                <Video className="mr-2 h-4 w-4" />
                                {discussion.meetingJoinedAt || discussion.attendanceStatus === 'in_progress' ? 'Rejoin Discussion' : 'Join Meeting'}
                            </Button>
                        )}

                        {/* Post-Call Actions */}
                        <div className="mt-4 space-y-2">

                            
                            {['pending', 'accepted', 'rescheduled'].includes(discussion.status) && (
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold flex items-center justify-center gap-2"
                                    onClick={() => setShowCancelModal(true)}
                                >
                                    <XCircle className="h-4 w-4" />
                                    Cancel Call
                                </Button>
                            )}

                            {discussion.status === 'pending' && (
                                <Button
                                    variant="outline"
                                    className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold flex items-center justify-center gap-2"
                                    onClick={() => chaseDiscussionMutation.mutate()}
                                    disabled={chaseDiscussionMutation.isPending}
                                >
                                    {chaseDiscussionMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Clock className="h-4 w-4" />
                                    )}
                                    Send Reminder to Expert
                                </Button>
                            )}

                            {discussion.status === 'completed' && discussion.quotationUnlockedForBusiness && (
                                <Button
                                    variant="default"
                                    className="w-full"
                                    onClick={() => {
                                        requestQuotationMutation.mutate();
                                    }}
                                    disabled={!!discussion.quotationRequestedAt || requestQuotationMutation.isPending}
                                >
                                    {requestQuotationMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : discussion.quotationRequestedAt ? (
                                        <Clock className="mr-2 h-4 w-4" />
                                    ) : (
                                        <FileText className="mr-2 h-4 w-4" />
                                    )}
                                    {discussion.quotationRequestedAt ? 'Quotation Requested' : 'Request Quotation'}
                                </Button>
                            )}

                            {discussion.status === 'completed' && 
                             discussion.purpose === 'requirement_discussion' && 
                             discussion.expertId && 
                             discussion.quotationStatus && 
                             ['sent', 'revision_requested', 'revised'].includes(discussion.quotationStatus.toLowerCase()) && (
                                <Button
                                    variant="default"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 h-11 rounded-lg transition-colors"
                                    onClick={() => navigate(`/discussions/schedule/${discussion.expertId}?purpose=clarification&discussionId=${discussion.id}&quotationId=${discussion.quotationId}`)}
                                >
                                    <Calendar className="h-4 w-4" />
                                    Schedule Clarification Discussion
                                </Button>
                            )}

                            {discussion.status === 'pending' && (discussion.scheduledBy ? discussion.scheduledBy !== user?.id : false) && (
                                <Button
                                    variant="default"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
                                    onClick={() => acceptDiscussionMutation.mutate()}
                                    disabled={acceptDiscussionMutation.isPending}
                                >
                                    {acceptDiscussionMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                    )}
                                    Accept Discussion Request
                                </Button>
                            )}

                            {discussion.status === 'rescheduled' && discussion.expertResponse?.action === 'rescheduled' && (
                                <Button
                                    variant="default"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    onClick={() => setShowRescheduleConfirm(true)}
                                >
                                    Confirm New Time (Proposed by Expert)
                                </Button>
                            )}

                            {discussion.status === 'rescheduled' && discussion.businessCounterResponse?.action === 'rescheduled' && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                                    <p className="font-semibold mb-1">Awaiting Expert Confirmation</p>
                                    <p className="text-xs text-amber-700">
                                        You proposed a new meeting time. Waiting for the expert to accept.
                                    </p>
                                </div>
                            )}

                            {['pending', 'accepted', 'rescheduled'].includes(discussion.status) &&
                                (discussion.rescheduleAttempts ?? 0) < 3 &&
                                discussion.expertId && (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowRescheduleDialog(true)}
                                >
                                    Propose New Time
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        ({3 - (discussion.rescheduleAttempts ?? 0)} left)
                                    </span>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reschedule confirmation (business side) */}
            <Dialog open={showRescheduleConfirm} onOpenChange={setShowRescheduleConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm new time?</DialogTitle>
                        <DialogDescription>
                            The expert proposed a new time. Confirm to finalize and generate the meeting link.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRescheduleConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => confirmRescheduleMutation.mutate()}
                            disabled={confirmRescheduleMutation.isPending}
                        >
                            {confirmRescheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>



            {discussion.expertId && (
                <RescheduleDiscussionDialog
                    open={showRescheduleDialog}
                    onOpenChange={setShowRescheduleDialog}
                    discussionId={discussion.id}
                    expertId={discussion.expertId}
                    duration={discussion.duration || 30}
                    rescheduleAttempts={discussion.rescheduleAttempts ?? 0}
                    role="seeker"
                    onSuccess={() => refetch()}
                />
            )}


            {/* Cancel Discussion Modal */}
            <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            Cancel Discussion Request
                        </DialogTitle>
                        <DialogDescription className="mt-2 text-sm">
                            Please provide a reason for cancelling this discussion call. A notification will be sent to the expert.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="seeker-cancel-reason" className="text-sm font-semibold">
                                Reason for Cancellation / Rejection *
                            </Label>
                            <Textarea
                                id="seeker-cancel-reason"
                                placeholder="e.g. Schedule conflict, no longer required..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="min-h-[100px]"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                            Back
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!cancelReason.trim() || cancelDiscussionMutation.isPending}
                            onClick={() => cancelDiscussionMutation.mutate()}
                        >
                            {cancelDiscussionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Cancellation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppDashboardLayout>
    );
};

export default SeekerDiscussionDetail;
