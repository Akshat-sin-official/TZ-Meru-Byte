import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { adminService } from '@/services/adminService';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, MessageSquare, CheckCircle, Wallet, TrendingUp } from 'lucide-react';

interface PerformanceMetrics {
    avgTimeToHire: number;
    avgQuoteToDeposit: number;
    avgDiscussionsPerHire: number;
    totalHires: number;
}

const AnalyticsPerformance = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await adminService.getMarketplacePerformance();
            if (res.success && res.data) {
                setMetrics(res.data as PerformanceMetrics);
            }
        } catch (error) {
            console.error("Failed to fetch performance metrics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border border-[#E5E7EB] shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
                Marketplace Performance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Avg Time to Hire */}
                <Card className="border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Clock className="w-24 h-24 text-indigo-600" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Avg Time to Hire</p>
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Clock className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-3xl font-bold text-[#111926]">{metrics?.avgTimeToHire}</h3>
                            <span className="text-sm font-medium text-gray-500">days</span>
                        </div>
                        <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                            Discussion Start → Deposit Paid
                        </p>
                    </CardContent>
                </Card>

                {/* Avg Quote to Deposit */}
                <Card className="border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Wallet className="w-24 h-24 text-emerald-600" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quote → Deposit</p>
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <Wallet className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-3xl font-bold text-[#111926]">{metrics?.avgQuoteToDeposit}</h3>
                            <span className="text-sm font-medium text-gray-500">days</span>
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            Decision speed after quote received
                        </p>
                    </CardContent>
                </Card>

                {/* Avg Discussions per Hire */}
                <Card className="border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <MessageSquare className="w-24 h-24 text-amber-600" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Discussions / Hire</p>
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-3xl font-bold text-[#111926]">{metrics?.avgDiscussionsPerHire}</h3>
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            Average conversations before hiring
                        </p>
                    </CardContent>
                </Card>

                {/* Total Hires */}
                <Card className="border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <CheckCircle className="w-24 h-24 text-blue-600" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Hires</p>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-3xl font-bold text-[#111926]">{metrics?.totalHires}</h3>
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            Successfully matched engagements
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AnalyticsPerformance;
