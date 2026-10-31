import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/services/adminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp } from 'lucide-react';

interface GeoDataItem {
    location: string;
    demand: number;
    supply: number;
}

const AnalyticsGeo = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [geoData, setGeoData] = useState<GeoDataItem[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await adminService.getGeoIntelligence();
            if (res.success && Array.isArray(res.data)) {
                setGeoData(res.data as GeoDataItem[]);
            }
        } catch (error) {
            console.error("Failed to fetch geo intelligence", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="border border-[#E5E7EB] shadow-sm h-[500px]">
                <CardHeader>
                    <Skeleton className="h-6 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 h-full">
                        <Skeleton className="flex-1 h-[400px]" />
                        <Skeleton className="flex-1 h-[400px]" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-[#E5E7EB] shadow-sm">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-semibold text-[#111926] flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-[#EF4444]" />
                            Geo Intelligence (MMR)
                        </CardTitle>
                        <CardDescription>Comparing Seeker Demand vs Expert Supply by region</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-normal">
                        Last 30 Days
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Chart Section */}
                    <div className="lg:col-span-3 h-[400px]">
                        {geoData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={geoData.slice(0, 15)}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="location"
                                        angle={-45}
                                        textAnchor="end"
                                        height={70}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                    />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number, name: string, entry: any) => [
                                            value,
                                            entry.dataKey === 'demand' ? 'Seeker Demand' : 'Active Experts'
                                        ]}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Bar dataKey="demand" name="Seeker Demand" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="supply" name="Active Experts" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                                No geo data available
                            </div>
                        )}
                    </div>

                    {/* Table Section */}
                    <div className="lg:col-span-2 overflow-hidden flex flex-col">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-gray-500" />
                            Regional Insights
                        </h4>
                        <div className="border rounded-md overflow-hidden flex-1">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="w-[120px]">Location</TableHead>
                                        <TableHead className="text-center">Gap</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {geoData.slice(0, 8).map((item, idx) => {
                                        const ratio = item.supply > 0 ? (item.demand / item.supply) : item.demand;
                                        let status = 'Balanced';
                                        let statusColor = 'bg-green-100 text-green-700 hover:bg-green-100';

                                        if (item.supply === 0 && item.demand > 0) {
                                            status = 'Shortage';
                                            statusColor = 'bg-red-100 text-red-700 hover:bg-red-100';
                                        } else if (ratio > 5) {
                                            status = 'High Demand';
                                            statusColor = 'bg-orange-100 text-orange-700 hover:bg-orange-100';
                                        } else if (ratio < 0.2 && item.supply > 5) {
                                            status = 'Oversupply';
                                            statusColor = 'bg-blue-100 text-blue-700 hover:bg-blue-100';
                                        }

                                        return (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium text-xs">{item.location}</TableCell>
                                                <TableCell className="text-center text-xs text-muted-foreground">
                                                    {item.demand} : {item.supply}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0.5 pointer-events-none ${statusColor}`}>
                                                        {status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {geoData.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                No data
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default AnalyticsGeo;
