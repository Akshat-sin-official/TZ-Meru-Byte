import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { seekerService, SeekerDiscussion } from '@/services/seekerService';
import { searchService } from '@/services/searchService';
import { getAvailableTimeSlots, format12Hour, TIME_SLOTS } from '@/utils/schedulingSlots';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Video, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SeekerDiscussions = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const sidebarSections = useAppSidebar();
    const queryClient = useQueryClient();

    const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
    const [declineReason, setDeclineReason] = useState('');

    // Schedule Call Dialog States for Seeker
    const [scheduleTarget, setScheduleTarget] = useState<SeekerDiscussion | null>(null);
    const [schedulePurpose, setSchedulePurpose] = useState<'clarification' | 'alignment'>('clarification');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [scheduleAgenda, setScheduleAgenda] = useState('');

    const targetExpertId = scheduleTarget ? (typeof scheduleTarget.expertId === 'string' ? scheduleTarget.expertId : (scheduleTarget.expertId as any)?._id || (scheduleTarget.expertId as any)?.id || (scheduleTarget as any).expertProfileId) : null;

    const { data: targetExpertProfile } = useQuery({
        queryKey: ['expertProfileForSchedule', targetExpertId],
        queryFn: () => searchService.getExpertProfileByUserId(targetExpertId!),
        enabled: !!targetExpertId,
    });

    const activeSlots = useMemo(() => {
        if (!scheduleDate) return [];
        const expertSched = targetExpertProfile ? {
            bookingsAvailability: targetExpertProfile.bookingsAvailability,
            availability: targetExpertProfile.availability,
            daysOff: targetExpertProfile.daysOff
        } : null;

        const duration = schedulePurpose === 'alignment' ? 45 : 30;
        const slots = expertSched ? getAvailableTimeSlots(expertSched, scheduleDate, duration) : TIME_SLOTS;

        if (slots.length === 0) {
            return [];
        }

        return slots.map(slot => {
            const slotVal = typeof slot === 'string' ? slot : slot.value;
            const slotLbl = typeof slot === 'string' ? format12Hour(slot) : slot.label;
            return {
                value: slotVal,
                label: slotLbl
            };
        });
    }, [targetExpertProfile, scheduleDate, schedulePurpose]);

    const scheduleMutation = useMutation({
        mutationFn: (data: {
            expertId: string;
            purpose: 'clarification' | 'alignment';
            agenda: string;
            scheduledAt: string;
            quotationId?: string;
            engagementId?: string;
        }) => seekerService.requestScheduledDiscussion({
            ...data,
            purpose: data.purpose === 'clarification' ? 'clarification' : 'alignment',
        }),
        onSuccess: () => {
            toast.success('Discussion scheduled successfully.');
            queryClient.invalidateQueries({ queryKey: ['seekerDiscussions'] });
            setScheduleTarget(null);
            refetch();
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to schedule discussion');
        }
    });

    const handleScheduleSubmit = () => {
        if (!scheduleTarget) return;
        if (!scheduleDate || !scheduleTime || !scheduleAgenda.trim()) {
            toast.error('Date, time, and agenda are required');
            return;
        }

        const dateParts = scheduleDate.split('-').map(Number);
        const [y, m, d] = dateParts[0] > 1000 ? [dateParts[0], dateParts[1], dateParts[2]] : [dateParts[2], dateParts[1], dateParts[0]];
        const [hh, mm] = scheduleTime.split(':').map(Number);
        const targetUTC = new Date(Date.UTC(y, m - 1, d, hh, mm));
        const tzDateStr = targetUTC.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const utcDateStr = targetUTC.toLocaleString('en-US', { timeZone: 'UTC' });
        const offsetMs = new Date(tzDateStr).getTime() - new Date(utcDateStr).getTime();
        const finalScheduledAt = new Date(targetUTC.getTime() - offsetMs);

        if (finalScheduledAt <= new Date()) {
            toast.error('Scheduled time must be in the future');
            return;
        }

        const expId = typeof scheduleTarget.expertId === 'string'
            ? scheduleTarget.expertId
            : (scheduleTarget.expertId as any)?._id || (scheduleTarget.expertId as any)?.id || (scheduleTarget as any).expertProfileId;

        if (!expId) {
            toast.error('Expert ID not found');
            return;
        }

        scheduleMutation.mutate({
            expertId: expId,
            purpose: schedulePurpose,
            agenda: scheduleAgenda.trim(),
            scheduledAt: finalScheduledAt.toISOString(),
            quotationId: scheduleTarget.quotationId,
            engagementId: (scheduleTarget as any).engagementId,
        });
    };

    const { data: discussions, isLoading, refetch } = useQuery({
        queryKey: ['seekerDiscussions'],
        queryFn: () => seekerService.getDiscussions(),
    });

    const acceptMutation = useMutation({
        mutationFn: (id: string) => seekerService.acceptScheduledDiscussion(id),
        onSuccess: () => {
            toast.success('Discussion accepted successfully');
            queryClient.invalidateQueries({ queryKey: ['seekerDiscussions'] });
            refetch();
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to accept discussion');
        }
    });

    const declineMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => seekerService.cancelDiscussion(id, reason),
        onSuccess: () => {
            toast.success('Discussion declined/cancelled successfully');
            setDeclineTargetId(null);
            setDeclineReason('');
            queryClient.invalidateQueries({ queryKey: ['seekerDiscussions'] });
            refetch();
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to decline discussion');
        }
    });

    const handleDeclineSubmit = () => {
        if (!declineTargetId) return;
        if (!declineReason.trim()) {
            toast.error('Please provide a reason for declining');
            return;
        }
        declineMutation.mutate({ id: declineTargetId, reason: declineReason.trim() });
    };

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'accepted':
            case 'scheduled':
                return 'default';
            case 'completed':
                return 'secondary';
            case 'cancelled':
            case 'declined':
                return 'destructive';
            case 'pending':
            case 'rescheduled':
                return 'outline';
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
            headerTitle="Discussions"
        >
            <Card>
                <CardHeader>
                    <CardTitle>Discussions</CardTitle>
                    <CardDescription>Upcoming and past meetings with experts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : discussions && discussions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Topic</TableHead>
                                    <TableHead>Expert</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {discussions.map((discussion: SeekerDiscussion) => {
                                    const statusLower = discussion.status.toLowerCase();
                                    const isCurrentUsersRequest = discussion.scheduledBy ? discussion.scheduledBy === user?.id : true;
                                    const canAcceptOrDecline = (
                                        (statusLower === 'pending' && !isCurrentUsersRequest) ||
                                        (statusLower === 'rescheduled' && discussion.expertResponse?.action === 'rescheduled')
                                    );
                                    const isPendingSentByMe = statusLower === 'pending' && isCurrentUsersRequest;

                                    return (
                                        <TableRow key={discussion.id}>
                                            <TableCell className="font-medium">{discussion.purpose}</TableCell>
                                            <TableCell>{discussion.expertName}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{discussion.scheduledDate ? format(new Date(discussion.scheduledDate), 'MMM d, yyyy') : 'N/A'}</span>
                                                    <span className="text-xs text-muted-foreground">{discussion.scheduledTime}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(discussion.status)} className="capitalize">
                                                    {statusLower === 'pending' && isCurrentUsersRequest ? 'Awaiting Expert Response' : discussion.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2 items-center">
                                                    {canAcceptOrDecline && (
                                                        <>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                onClick={() => acceptMutation.mutate(discussion.id)}
                                                                disabled={acceptMutation.isPending}
                                                            >
                                                                {acceptMutation.isPending ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                                ) : (
                                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                                )}
                                                                Accept
                                                            </Button>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                onClick={() => {
                                                                    setDeclineTargetId(discussion.id);
                                                                    setDeclineReason('');
                                                                }}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Decline
                                                            </Button>
                                                        </>
                                                    )}

                                                    {isPendingSentByMe && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                            onClick={() => {
                                                                setDeclineTargetId(discussion.id);
                                                                setDeclineReason('');
                                                            }}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Cancel Request
                                                        </Button>
                                                    )}

                                                    {statusLower === 'accepted' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/meeting/${discussion.id}`)}
                                                        >
                                                            <Video className="h-4 w-4 mr-2" />
                                                            {discussion.meetingJoinedAt || discussion.attendanceStatus === 'in_progress' ? 'Rejoin Discussion' : 'Join Call'}
                                                        </Button>
                                                    )}

                                                    {statusLower === 'completed' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-primary/40 text-primary hover:bg-primary/10 font-medium"
                                                            onClick={() => {
                                                                setScheduleTarget(discussion);
                                                                setSchedulePurpose('clarification');
                                                                setScheduleDate('');
                                                                setScheduleTime('');
                                                                setScheduleAgenda('');
                                                            }}
                                                        >
                                                            <Calendar className="h-4 w-4 mr-1.5" />
                                                            Schedule Call
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/seeker/discussions/${discussion.id}`)}
                                                    >
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            No discussions scheduled.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Schedule Call Modal Dialog for Seeker */}
            <Dialog open={!!scheduleTarget} onOpenChange={(open) => { if (!open) setScheduleTarget(null); }}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 border-[#E5E7EB] bg-white shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#111926] flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-[#0EA5E9]" />
                            Schedule a Call
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#6B7280]">
                            Schedule a discussion directly with {scheduleTarget?.expertName || 'the expert'} for quotation discussion or project alignment.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Purpose */}
                        <div className="space-y-2">
                            <Label className="font-semibold text-slate-800 text-sm">Purpose of Call</Label>
                            <Select value={schedulePurpose} onValueChange={(val: 'clarification' | 'alignment') => setSchedulePurpose(val)}>
                                <SelectTrigger className="w-full rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm">
                                    <SelectValue placeholder="Select purpose" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="clarification">DISCUSS QUOTATION</SelectItem>
                                    <SelectItem
                                        value="alignment"
                                        disabled={!scheduleTarget?.engagementId}
                                    >
                                        Active-Engagement discussion {!scheduleTarget?.engagementId ? '(Locked - Deposit Required)' : ''}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="seeker-schedule-date" className="font-semibold text-slate-800 text-sm">Scheduled Date</Label>
                            <Input
                                id="seeker-schedule-date"
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                onClick={(e) => {
                                    try {
                                        e.currentTarget.showPicker();
                                    } catch {
                                        // showPicker not supported in all browsers
                                    }
                                }}
                                min={new Date().toISOString().split('T')[0]}
                                max={(() => {
                                    const maxDate = new Date();
                                    maxDate.setDate(maxDate.getDate() + 30);
                                    return maxDate.toISOString().split('T')[0];
                                })()}
                                className="rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm cursor-pointer"
                            />
                        </div>

                        {/* Time */}
                        <div className="space-y-2">
                            <Label className="font-semibold text-slate-800 text-sm">Scheduled Time (IST)</Label>
                            <Select
                                value={scheduleTime}
                                onValueChange={setScheduleTime}
                                disabled={!scheduleDate || activeSlots.length === 0}
                            >
                                <SelectTrigger className="w-full rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm">
                                    <SelectValue placeholder={!scheduleDate ? 'Select a date first' : activeSlots.length === 0 ? '❌ No slots available today. Please select tomorrow.' : 'Select a time slot'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[220px]">
                                    {activeSlots.map((slot) => (
                                        <SelectItem key={slot.value} value={slot.value}>
                                            {slot.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {scheduleDate && activeSlots.length === 0 && (
                                <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                                    ❌ No slots available today. Please select tomorrow.
                                </p>
                            )}
                        </div>

                        {/* Agenda */}
                        <div className="space-y-2">
                            <Label htmlFor="seeker-schedule-agenda" className="font-semibold text-slate-800 text-sm">Agenda (Max 300 characters)</Label>
                            <Textarea
                                id="seeker-schedule-agenda"
                                placeholder="Describe what needs to be discussed (e.g., clarify quotation terms, scope questions...)"
                                value={scheduleAgenda}
                                onChange={(e) => setScheduleAgenda(e.target.value)}
                                maxLength={300}
                                rows={4}
                                className="rounded-xl border-[#E5E7EB] bg-white shadow-sm focus:border-blue-300 focus:ring-blue-100 transition-all text-sm placeholder:text-muted-foreground"
                            />
                            <p className="text-right text-xs text-muted-foreground">
                                {scheduleAgenda.length}/300 characters
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2.5 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setScheduleTarget(null)}
                            className="rounded-xl font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-800 h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleScheduleSubmit}
                            disabled={scheduleMutation.isPending || !scheduleDate || !scheduleTime || !scheduleAgenda.trim()}
                            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold h-10 px-5 rounded-xl shadow-sm"
                        >
                            {scheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Schedule Discussion
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Decline/Cancel Modal */}
            <Dialog open={!!declineTargetId} onOpenChange={(open) => !open && setDeclineTargetId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Decline Discussion Request</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for declining this discussion. The expert will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Textarea
                            placeholder="Enter reason for declining..."
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeclineTargetId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeclineSubmit}
                            disabled={declineMutation.isPending}
                        >
                            {declineMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Decline Discussion
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppDashboardLayout>
    );
};

export default SeekerDiscussions;
