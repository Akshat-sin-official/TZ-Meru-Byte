import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { adminService } from '@/services/adminService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter } from 'lucide-react';

interface SearchTerm {
    term: string;
    count: number;
    zeroResults: number;
}

interface DiscoveryMetrics {
    topSearches: SearchTerm[];
}

const AnalyticsDiscovery = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [discoveryData, setDiscoveryData] = useState<DiscoveryMetrics>({ topSearches: [] });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await adminService.getDiscoveryAnalytics();
            if (res.success && res.data) {
                setDiscoveryData(res.data as DiscoveryMetrics);
            }
        } catch (error) {
            console.error("Failed to fetch discovery analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-[400px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="h-[400px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-48 mb-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-full w-full rounded-lg" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Search className="h-6 w-6 text-indigo-600" />
                Discovery & Search Analytics
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Searches Table */}
                <Card className="lg:col-span-2 border border-[#E5E7EB] shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold text-[#111926]">Top Search Terms</CardTitle>
                            <CardDescription>Most frequent search queries by users</CardDescription>
                        </div>
                        <Badge variant="secondary" className="font-normal text-xs">
                            Last 30 Days
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        <TableHead className="w-[50%]">Term</TableHead>
                                        <TableHead className="text-right">Volume</TableHead>
                                        <TableHead className="text-right">Zero Results</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {discoveryData.topSearches.length > 0 ? (
                                        discoveryData.topSearches.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{item.term}</TableCell>
                                                <TableCell className="text-right">{item.count}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.zeroResults > 0 ? (
                                                        <Badge variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200">
                                                            {item.zeroResults}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search className="h-8 w-8 text-gray-300" />
                                                    <p>No search data recorded yet.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Filter Analytics Placeholder */}
                <Card className="border border-[#E5E7EB] shadow-sm flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <Filter className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Filter Analytics</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs">
                        Advanced filter usage statistics will be displayed here once sufficient data is available.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default AnalyticsDiscovery;
