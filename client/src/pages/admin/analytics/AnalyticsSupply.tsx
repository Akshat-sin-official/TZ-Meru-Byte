import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { adminService } from '@/services/adminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SupplyItem {
    category: string;
    count: number;
}

interface GeoDataItem {
    location: string;
    supply: number;
}

const AnalyticsSupply = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [supplyData, setSupplyData] = useState<SupplyItem[]>([]);
    const [geoData, setGeoData] = useState<GeoDataItem[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const supplyRes = await adminService.getSupplySummary();
            const geoRes = await adminService.getGeoIntelligence();

            if (supplyRes.success && Array.isArray(supplyRes.data)) {
                setSupplyData(supplyRes.data as SupplyItem[]);
            }
            if (geoRes.success && Array.isArray(geoRes.data)) {
                setGeoData(geoRes.data as GeoDataItem[]);
            }
        } catch (error) {
            console.error("Failed to fetch supply analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border border-[#E5E7EB] shadow-sm">
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-16 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card className="border border-[#E5E7EB] shadow-sm h-[400px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-48 mb-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-full w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Core Services Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {supplyData.length > 0 ? (
                    supplyData.map((item) => (
                        <Card key={item.category} className="border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        {item.category}
                                    </p>
                                    <p className="text-3xl font-bold text-[#111926] tracking-tight">{item.count}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-[#6B7280]">Verified Experts</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="col-span-full p-6 text-center text-muted-foreground border-dashed">
                        No supply data available
                    </Card>
                )}
            </div>

            {/* Experts by Location Chart */}
            <Card className="border border-[#E5E7EB] shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-[#111926] flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-[#3B82F6]" />
                        Experts by MMR Zone
                    </CardTitle>
                    <CardDescription>Top locations by active expert concentration</CardDescription>
                </CardHeader>
                <CardContent className="pl-0">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={geoData.slice(0, 10)}
                                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                                layout="vertical"
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis
                                    dataKey="location"
                                    type="category"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="supply"
                                    name="Active Experts"
                                    fill="#3B82F6"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AnalyticsSupply;
