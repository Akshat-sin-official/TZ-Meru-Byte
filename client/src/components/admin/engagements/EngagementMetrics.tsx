import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';

interface EngagementMetricsProps {
    data: any;
}

export const EngagementMetrics = ({ data }: EngagementMetricsProps) => {
    // In a real app, these would be calculated from the full dataset or separate API
    // For now, we'll derive some basic stats from the current view or props
    const totalActive = data?.total || 0;
    const totalValue = data?.data?.reduce((acc: number, item: any) => acc + item.amount, 0) || 0;
    const highRisk = data?.data?.filter((item: any) => item.riskFlag).length || 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Active</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalActive}</div>
                    <p className="text-xs text-muted-foreground">Engagements currently open</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Page Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                        }).format(totalValue)}
                    </div>
                    <p className="text-xs text-muted-foreground">Volume in current view</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On Track</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{Math.max(0, (data?.data?.length || 0) - highRisk)}</div>
                    <p className="text-xs text-muted-foreground">Proceeding without issues</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">At Risk</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{highRisk}</div>
                    <p className="text-xs text-muted-foreground">Requires attention</p>
                </CardContent>
            </Card>
        </div>
    );
};
