import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService, PendingRelease } from "@/services/adminService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2, IndianRupee } from "lucide-react";
import { toast } from "sonner";

export function ReleasesTab() {
    const queryClient = useQueryClient();
    const { data: releases = [], isLoading } = useQuery({
        queryKey: ['pendingReleasesFull'],
        queryFn: () => adminService.getPendingReleases(),
    });

    const releaseMutation = useMutation({
        mutationFn: async ({ id, amount, milestoneSubmissionId }: { id: string, amount: number, milestoneSubmissionId: string }) => {
            const idempotencyKey = crypto.randomUUID();
            const timestamp = Date.now().toString();
            await adminService.releaseMilestone(
                milestoneSubmissionId,
                "Admin manual approval via Dashboard",
                idempotencyKey,
                timestamp
            );
            return { id, amount };
        },
        onSuccess: ({ amount }) => {
            toast.success(`Successfully processed payment of ₹${amount.toLocaleString('en-IN')}`);
            queryClient.invalidateQueries({ queryKey: ['pendingReleasesFull'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
            queryClient.invalidateQueries({ queryKey: ['pendingReleases'] });
        },
        onError: (error: Error) => {
            toast.error(`Failed to process payment: ${error.message || 'Unknown error'}`);
        }
    });

    const handleDetailedPay = (id: string, amount: number, milestoneSubmissionId: string) => {
        const netAmountToExpert = Math.round(amount * 0.9);
        toast.info(`Initiating payment...`);
        releaseMutation.mutate({ id, amount: netAmountToExpert, milestoneSubmissionId });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent w-full">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-bold text-[#111926]">Pending Releases</CardTitle>
            </CardHeader>
            <CardContent className="p-0 w-full">
                {releases.length === 0 ? (
                    <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm p-12 text-center">
                        <p className="text-muted-foreground">No pending releases found.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {releases.map((release: PendingRelease) => {
                                const isReleased = release.status === 'released';
                                const grossAmount = release.amount ?? 0;
                                const netAmountToExpert = Math.round(grossAmount * 0.9);

                                return (
                                    <Card key={release.id} className="bg-white border border-[#E5E7EB] shadow-sm">
                                        <CardContent className="p-4 space-y-3">
                                            <div>
                                                <p className="font-semibold text-[#111926] text-sm">
                                                    Milestone {release.milestoneNumber}: {release.milestoneTitle || 'Development'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    ID: {release.milestoneSubmissionId || release.id}
                                                </p>
                                            </div>
                                            <div className="space-y-2 pt-2 border-t">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground">Expert</p>
                                                    <p className="text-sm text-[#111926] font-medium">{release.expertName}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground">Seeker</p>
                                                    <p className="text-sm text-[#111926] font-medium">{release.seekerName}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground">Amount</p>
                                                    <p className="text-sm font-bold text-[#374151]">
                                                        ₹{netAmountToExpert.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground">Auto-Release</p>
                                                    <p className="text-sm text-[#111926]">
                                                        {release.autoReleaseDate
                                                            ? format(new Date(release.autoReleaseDate), 'MMM d, yyyy HH:mm')
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground">Status</p>
                                                    <Badge
                                                        className={
                                                            isReleased
                                                                ? "bg-green-50 text-green-700 border-green-200"
                                                                : "bg-orange-50 text-orange-700 border-orange-200"
                                                        }
                                                    >
                                                        {isReleased ? 'Released' : 'Pending'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                                                onClick={() =>
                                                    handleDetailedPay(
                                                        release.id,
                                                        grossAmount,
                                                        release.milestoneSubmissionId
                                                    )
                                                }
                                                disabled={isReleased || releaseMutation.isPending}
                                            >
                                                {releaseMutation.isPending ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <IndianRupee className="h-3 w-3" />
                                                )}
                                                {isReleased ? 'Paid' : 'Approve & Pay'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm overflow-hidden">
                            <Table className="w-full text-sm">
                                <TableHeader>
                                    <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                                        <TableHead>Milestone</TableHead>
                                        <TableHead>Expert / Seeker</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Auto-Release Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {releases.map((release: PendingRelease) => {
                                        const isReleased = release.status === 'released';
                                        const grossAmount = release.amount ?? 0;
                                        const netAmountToExpert = Math.round(grossAmount * 0.9);

                                        return (
                                            <TableRow key={release.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-[#111926]">
                                                            Milestone {release.milestoneNumber}: {release.milestoneTitle || 'Development'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ID: {release.milestoneSubmissionId || release.id}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        <span className="text-[#111926]">Exp: {release.expertName}</span>
                                                        <span className="text-muted-foreground">Sek: {release.seekerName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 font-bold text-[#374151]">
                                                        ₹{netAmountToExpert.toLocaleString('en-IN')}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {release.autoReleaseDate
                                                        ? format(new Date(release.autoReleaseDate), 'MMM d, yyyy HH:mm')
                                                        : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            isReleased
                                                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                                : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                                                        }
                                                    >
                                                        {isReleased ? 'Released' : 'Pending'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        onClick={() =>
                                                            handleDetailedPay(
                                                                release.id,
                                                                grossAmount,
                                                                release.milestoneSubmissionId
                                                            )
                                                        }
                                                        disabled={isReleased || releaseMutation.isPending}
                                                    >
                                                        {releaseMutation.isPending ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <IndianRupee className="h-3 w-3" />
                                                        )}
                                                        {isReleased ? 'Paid' : 'Approve & Pay'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
