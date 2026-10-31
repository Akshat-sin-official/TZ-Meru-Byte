import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, BarChart3, Users, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { adminService } from "@/services/adminService";

export function ReportsTab() {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [ledgerPage, setLedgerPage] = useState(1);
    const [isDownloading, setIsDownloading] = useState(false);

    // Fetch financial ledger when Financial Report is selected
    const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
        queryKey: ['financialLedger', ledgerPage],
        queryFn: () => adminService.getFinancialLedger({ page: ledgerPage, limit: 50 }),
        enabled: selectedReport === 'financial',
    });

    const escapeCsv = (value: unknown) => {
        const s = value === null || value === undefined ? '' : String(value);
        if (/[",\n\r]/.test(s)) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    const downloadCsv = (filename: string, csv: string) => {
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const downloadFinancialLedgerCsv = async () => {
        try {
            setIsDownloading(true);
            // Fetch all pages (capped) so CSV is complete.
            const first = await adminService.getFinancialLedger({ page: 1, limit: 200 });
            const all: any[] = [...(first.data || [])];

            const totalPages = Math.min(first.pagination?.totalPages || 1, 50); // hard cap safety
            for (let p = 2; p <= totalPages; p++) {
                const next = await adminService.getFinancialLedger({ page: p, limit: 200 });
                all.push(...(next.data || []));
            }

            const header = [
                'createdAt',
                'entryType',
                'engagementId',
                'quotationId',
                'amount',
                'currency',
                'triggerSource',
                'description',
                'milestoneSubmissionId',
            ];

            const rows = all.map((e) => ([
                e.createdAt,
                e.entryType,
                e.engagementId,
                e.quotationId,
                e.amount,
                e.currency,
                e.triggerSource,
                e.description,
                e.milestoneSubmissionId,
            ]));

            const csv = [header, ...rows]
                .map((r) => r.map(escapeCsv).join(','))
                .join('\n');

            downloadCsv(`financial-ledger-${new Date().toISOString().slice(0, 10)}.csv`, csv);
            toast.success('Financial ledger CSV downloaded');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to download CSV';
            toast.error(msg);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownload = (reportName: string) => {
        if (reportName === 'Financial Report') {
            void downloadFinancialLedgerCsv();
        } else {
            toast.info(`Downloading ${reportName}...`);
            // Mock download for other reports
            setTimeout(() => toast.success(`${reportName} downloaded successfully`), 1500);
        }
    };

    const reports = [
        {
            id: 'financial',
            title: 'Financial Report',
            description: 'Monthly overview of platform revenue, payouts, and held funds.',
            icon: BarChart3,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            id: 'users',
            title: 'User Activity Log',
            description: 'Detailed log of new registrations, verifications, and active users.',
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            id: 'disputes',
            title: 'Dispute Resolution',
            description: 'Summary of raised disputes, resolutions, and refund metrics.',
            icon: FileText,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            id: 'platform',
            title: 'Platform Health',
            description: 'Technical metrics, server uptime logs, and error rate reports.',
            icon: BarChart3,
            color: 'text-green-600',
            bg: 'bg-green-50'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-[#111926]">System Reports</h2>
                <p className="text-muted-foreground">Download detailed CSV/PDF reports for administrative analysis.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {reports.map((report) => (
                    <Card key={report.id} className="border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow bg-white rounded-[20px]">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${report.bg}`}>
                                    <report.icon className={`h-6 w-6 ${report.color}`} />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold text-[#111926]">{report.title}</CardTitle>
                                    <CardDescription className="text-sm">{report.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex justify-end gap-2">
                            {report.id === 'financial' && (
                                <Button variant="outline" className="gap-2" onClick={() => handleDownload(report.title)}>
                                    <Eye className="h-4 w-4" />
                                    View Ledger
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleDownload(report.title)}
                                disabled={isDownloading && report.id === 'financial'}
                            >
                                <Download className="h-4 w-4" />
                                {isDownloading && report.id === 'financial' ? 'Downloading…' : 'Download CSV'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Financial Ledger Dialog */}
            <Dialog open={selectedReport === 'financial'} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Financial Ledger</DialogTitle>
                        <DialogDescription>
                            Complete transaction history of all deposits and releases
                        </DialogDescription>
                    </DialogHeader>
                    {ledgerLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {ledgerData?.data.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No ledger entries found.</p>
                            ) : (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="md:hidden space-y-3">
                                        {ledgerData?.data.map((entry) => (
                                            <Card key={entry.id} className="border">
                                                <CardContent className="p-4 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(entry.createdAt), 'MMM d, yyyy HH:mm')}
                                                        </p>
                                                        <Badge
                                                            variant={entry.entryType === 'deposit' ? 'default' : 'secondary'}
                                                            className={
                                                                entry.entryType === 'deposit'
                                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                                            }
                                                        >
                                                            {entry.entryType === 'deposit' ? 'Deposit' : 'Release'}
                                                        </Badge>
                                                    </div>
                                                    <p className="font-mono text-xs text-muted-foreground">
                                                        ID: {String(entry.engagementId || entry.quotationId || entry.id || '—').substring(0, 8)}
                                                        {entry.engagementId || entry.quotationId || entry.id ? '…' : ''}
                                                    </p>
                                                    <p className="text-lg font-bold">
                                                        {new Intl.NumberFormat('en-IN', {
                                                            style: 'currency',
                                                            currency: entry.currency || 'INR',
                                                        }).format(entry.amount)}
                                                    </p>
                                                    <div className="pt-2 border-t space-y-1">
                                                        <p className="text-xs text-muted-foreground">Description</p>
                                                        <p className="text-sm text-[#111926] break-words">
                                                            {entry.description || '—'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-2">Source</p>
                                                        <p className="text-sm text-[#111926]">
                                                            {entry.triggerSource || '—'}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block w-full max-w-full bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
                                        <Table className="w-full">
                                            <TableHeader>
                                                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Engagement ID</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Source</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {ledgerData?.data.map((entry) => (
                                                    <TableRow key={entry.id}>
                                                        <TableCell className="text-muted-foreground">
                                                            {format(new Date(entry.createdAt), 'MMM d, yyyy HH:mm')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={entry.entryType === 'deposit' ? 'default' : 'secondary'}
                                                                className={
                                                                    entry.entryType === 'deposit'
                                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                                }
                                                            >
                                                                {entry.entryType === 'deposit' ? 'Deposit' : 'Release'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">
                                                            {String(entry.engagementId || entry.quotationId || entry.id || '—').substring(0, 8)}
                                                            {entry.engagementId || entry.quotationId || entry.id ? '…' : ''}
                                                        </TableCell>
                                                        <TableCell className="font-bold">
                                                            {new Intl.NumberFormat('en-IN', {
                                                                style: 'currency',
                                                                currency: entry.currency || 'INR',
                                                            }).format(entry.amount)}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground max-w-[200px] truncate" title={entry.description}>
                                                            {entry.description || '—'}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-xs">
                                                            {entry.triggerSource || '—'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                            {ledgerData?.pagination && (
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Page {ledgerData.pagination.page} of {ledgerData.pagination.totalPages} ({ledgerData.pagination.total} total entries)
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                                            disabled={!ledgerData.pagination.hasPrev}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLedgerPage((p) => p + 1)}
                                            disabled={!ledgerData.pagination.hasNext}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
