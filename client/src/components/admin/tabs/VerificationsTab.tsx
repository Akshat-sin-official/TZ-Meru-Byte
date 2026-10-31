import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { adminService } from "@/services/adminService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function VerificationsTab() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const { data: queue, isLoading } = useQuery({
        queryKey: ['verificationQueue'],
        queryFn: () => adminService.getVerificationQueue(),
    });

    const approveMutation = useMutation({
        mutationFn: (userId: string) => adminService.approveExpertProfile(userId),
        onSuccess: () => {
            toast.success('Expert profile approved successfully');
            queryClient.invalidateQueries({ queryKey: ['verificationQueue'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        },
        onError: (error: Error) => {
            toast.error(error?.message || 'Failed to approve expert profile');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason: string }) => 
            adminService.rejectExpertProfile(userId, reason),
        onSuccess: () => {
            toast.success('Expert profile rejected with feedback');
            queryClient.invalidateQueries({ queryKey: ['verificationQueue'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
            setRejectDialogOpen(false);
            setRejectionReason("");
            setSelectedUserId(null);
        },
        onError: (error: Error) => {
            toast.error(error?.message || 'Failed to reject expert profile');
        },
    });

    const handleView = (userId: string) => {
        navigate(`/admin/users/experts/${userId}`);
    };

    const handleApprove = (userId: string) => {
        approveMutation.mutate(userId);
    };

    const handleReject = (userId: string) => {
        setSelectedUserId(userId);
        setRejectDialogOpen(true);
    };

    const handleRejectSubmit = () => {
        if (!selectedUserId) return;
        if (rejectionReason.trim().length < 10) {
            toast.error('Rejection reason must be at least 10 characters');
            return;
        }
        rejectMutation.mutate({ userId: selectedUserId, reason: rejectionReason.trim() });
    };

    const getCompletenessColor = (percentage: number) => {
        if (percentage >= 80) return "text-green-600";
        if (percentage >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    if (isLoading) {
        return <div className="p-4 text-center">Loading verifications...</div>;
    }

    const items = queue?.data || [];

    return (
        <>
            <Card className="border-none shadow-none bg-transparent w-full">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl font-bold text-[#111926]">Verification Queue</CardTitle>
                </CardHeader>
                <CardContent className="p-0 w-full">
                    {items.length === 0 ? (
                        <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm p-12 text-center">
                            <p className="text-muted-foreground">No pending verifications.</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {items.map((item) => (
                                    <Card key={item.userId} className="bg-white border border-[#E5E7EB] shadow-sm">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[#111926] text-sm">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                                                </div>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                                                    Expert
                                                </Badge>
                                            </div>
                                            <div className="space-y-2 pt-2 border-t">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground">Submitted</p>
                                                    <p className="text-sm text-[#111926]">
                                                        {format(new Date(item.submittedAt), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground">Completeness</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold text-sm ${getCompletenessColor(item.profileCompletion)}`}>
                                                            {item.profileCompletion}%
                                                        </span>
                                                        {item.missingFields.length > 0 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                ({item.missingFields.length} missing)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground">Location</p>
                                                    <p className="text-sm text-[#111926]">
                                                        {item.location?.city ? `${item.location.city}, ${item.location.country}` : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2 border-t">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="flex-1 h-9"
                                                    onClick={() => handleView(item.userId)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="flex-1 h-9 border-green-200 hover:bg-green-50 text-green-700"
                                                    onClick={() => handleApprove(item.userId)}
                                                    disabled={approveMutation.isPending}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="flex-1 h-9 border-red-200 hover:bg-red-50 text-red-700"
                                                    onClick={() => handleReject(item.userId)}
                                                    disabled={rejectMutation.isPending}
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm overflow-hidden">
                                <Table className="w-full">
                                    <TableHeader>
                                        <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                                            <TableHead className="w-[200px]">User</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Submitted</TableHead>
                                            <TableHead>Profile Completeness</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => (
                                            <TableRow key={item.userId}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-[#111926]">{item.name}</span>
                                                        <span className="text-xs text-muted-foreground">{item.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        Expert
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {format(new Date(item.submittedAt), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold ${getCompletenessColor(item.profileCompletion)}`}>
                                                            {item.profileCompletion}%
                                                        </span>
                                                        {item.missingFields.length > 0 && (
                                                            <span className="text-xs text-muted-foreground" title={item.missingFields.join(', ')}>
                                                                ({item.missingFields.length} missing)
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {item.location?.city ? `${item.location.city}, ${item.location.country}` : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => handleView(item.userId)}
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-8 w-8 p-0 border-green-200 hover:bg-green-50"
                                                            onClick={() => handleApprove(item.userId)}
                                                            title="Approve"
                                                            disabled={approveMutation.isPending}
                                                        >
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-8 w-8 p-0 border-red-200 hover:bg-red-50"
                                                            onClick={() => handleReject(item.userId)}
                                                            title="Reject"
                                                            disabled={rejectMutation.isPending}
                                                        >
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Expert Profile</DialogTitle>
                        <DialogDescription>
                            Please provide a clear reason for rejection. This feedback will be shared with the expert.
                            Minimum 10 characters required.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejectionReason">Rejection Reason</Label>
                            <Textarea
                                id="rejectionReason"
                                placeholder="e.g., Missing required KYC documents, Incomplete profile information, Compliance issues..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                minLength={10}
                            />
                            <p className="text-xs text-muted-foreground">
                                {rejectionReason.length}/10 characters minimum
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectDialogOpen(false);
                                setRejectionReason("");
                                setSelectedUserId(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectSubmit}
                            disabled={rejectionReason.trim().length < 10 || rejectMutation.isPending}
                        >
                            {rejectMutation.isPending ? 'Rejecting...' : 'Reject Profile'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
