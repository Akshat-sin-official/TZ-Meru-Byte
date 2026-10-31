import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export function AuditLogTab() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['adminAuditLog'],
        queryFn: () => adminService.getAdminActions(1, 50),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const actions = logs?.actions || [];

    return (
        <Card className="border-none shadow-none bg-transparent w-full">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-bold text-[#111926]">System Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0 w-full">
                {actions.length === 0 ? (
                    <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm p-12 text-center">
                        <p className="text-muted-foreground">No recent audit logs found.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {actions.map((action) => (
                                <Card key={action.id} className="bg-white border border-[#E5E7EB] shadow-sm">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {format(new Date(action.timestamp), 'MMM d, yyyy HH:mm')}
                                                </p>
                                                <p className="text-sm font-semibold text-[#111926] mt-1 truncate">
                                                    {action.actor}
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="font-normal text-xs shrink-0">
                                                {action.action}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Target</p>
                                                <p className="text-sm text-[#111926]">
                                                    {action.targetUser || action.engagementId || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Reason/Details</p>
                                                <p className="text-sm text-[#111926] break-words">
                                                    {action.reason || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm overflow-hidden">
                            <Table className="w-full text-sm">
                                <TableHeader>
                                    <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Admin User</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Reason/Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {actions.map((action) => (
                                        <TableRow key={action.id}>
                                            <TableCell className="text-muted-foreground font-medium text-xs">
                                                {format(new Date(action.timestamp), 'MMM d, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="font-medium text-[#111926]">
                                                {action.actor}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {action.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {action.targetUser || action.engagementId || '-'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-[300px] truncate" title={action.reason}>
                                                {action.reason}
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
    );
}
