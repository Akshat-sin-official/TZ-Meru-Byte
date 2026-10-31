import { useNavigate } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Eye } from 'lucide-react';
import { OperationsEngagementItem } from '@/services/adminService';

interface EngagementTableProps {
    data: OperationsEngagementItem[];
}

export const EngagementTable = ({ data }: EngagementTableProps) => {
    const navigate = useNavigate();

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'pending_deposit': return 'warning';
            case 'disputed': return 'destructive';
            case 'quotation_accepted': return 'secondary';
            default: return 'outline';
        }
    };

    const getRiskLevel = (item: OperationsEngagementItem) => {
        if (item.status === 'disputed') return 'Critical';
        if (item.daysIdle > 14) return 'High';
        if (item.daysIdle > 7) return 'Medium';
        return 'Low';
    };

    if (!data?.length) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-gray-50/50 rounded-md border border-dashed">
                No active engagement records found matching your criteria.
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <Table className="min-w-[1000px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Entities</TableHead>
                            <TableHead className="hidden lg:table-cell">Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Deposit</TableHead>
                            <TableHead className="hidden xl:table-cell">Idle Time</TableHead>
                            <TableHead>Risk</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.id} className={item.riskFlag ? 'bg-red-50/50 hover:bg-red-50/60' : 'hover:bg-muted/50'}>
                                <TableCell className="font-mono text-xs whitespace-nowrap">
                                    <div className="font-medium text-foreground">{item.engagementReference}</div>
                                    <div className="text-xs text-muted-foreground font-sans mt-0.5">{formatMoney(item.amount)}</div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    <div className="flex flex-col text-xs sm:text-sm">
                                        <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground w-4">S:</span>
                                            <span className="font-medium truncate max-w-[120px]" title={item.seekerName}>{item.seekerName}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground w-4">E:</span>
                                            <span className="truncate max-w-[120px]" title={item.expertName}>{item.expertName}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell whitespace-nowrap text-sm text-muted-foreground">
                                    {item.category}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    <Badge variant={getStatusBadgeVariant(item.status) as any} className="mb-1 capitalize shadow-sm">
                                        {item.status.replace(/_/g, ' ')}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground max-w-[180px] truncate" title={item.currentMilestone}>
                                        {item.currentMilestone}
                                    </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${item.depositStatus === 'Funded' ? 'bg-green-50 text-green-700 border-green-200' :
                                        item.depositStatus === 'Pending Deposit' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                        {item.depositStatus}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden xl:table-cell whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-sm">
                                        {item.daysIdle > 7 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                        <span className={item.daysIdle > 7 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                                            {item.daysIdle} days
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {item.riskFlag ? (
                                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 shadow-sm">
                                            {getRiskLevel(item)} Risk
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Normal</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => navigate(`/admin/engagements/${item.id}`)}>
                                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        <span className="sr-only">View</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
                {data.map((item) => (
                    <div key={item.id} className={`p-4 space-y-3 ${item.riskFlag ? 'bg-red-50/30' : 'bg-card'}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="font-mono font-medium text-sm">{item.engagementReference}</div>
                                <div className="text-sm font-semibold text-muted-foreground mt-0.5">
                                    {formatMoney(item.amount)}
                                </div>
                            </div>
                            <Badge variant={getStatusBadgeVariant(item.status) as any} className="capitalize shadow-sm">
                                {item.status.replace(/_/g, ' ')}
                            </Badge>
                        </div>

                        <div className="text-sm border-l-2 border-muted pl-3 py-1 space-y-1">
                            <div className="grid grid-cols-[20px_1fr] gap-1">
                                <span className="font-medium text-muted-foreground text-xs">S:</span>
                                <span className="truncate text-sm">{item.seekerName}</span>
                            </div>
                            <div className="grid grid-cols-[20px_1fr] gap-1">
                                <span className="font-medium text-muted-foreground text-xs">E:</span>
                                <span className="truncate text-sm">{item.expertName}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 p-2 rounded">
                            <div>
                                <span className="text-muted-foreground block mb-1 text-[10px] uppercase tracking-wider">Milestone</span>
                                <span className="font-medium truncate block" title={item.currentMilestone}>{item.currentMilestone}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1 text-[10px] uppercase tracking-wider">Idle</span>
                                <div className="flex items-center gap-1.5 font-medium">
                                    {item.daysIdle > 7 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                                    {item.daysIdle} days
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <div className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${item.depositStatus === 'Funded' ? 'bg-green-50 text-green-700 border-green-200' :
                                item.depositStatus === 'Pending Deposit' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                {item.depositStatus}
                            </div>

                            {item.riskFlag && (
                                <Badge variant="destructive" className="h-5 text-[10px] px-1.5 bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                                    {getRiskLevel(item)} Risk
                                </Badge>
                            )}
                        </div>

                        <Button size="sm" variant="outline" className="w-full mt-2 h-9" onClick={() => navigate(`/admin/engagements/${item.id}`)}>
                            <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};
