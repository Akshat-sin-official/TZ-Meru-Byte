import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Mic } from "lucide-react";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";

export interface ActivityItem {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    date: Date | string;
}

export interface LatestUpdatesProps {
    activities: ActivityItem[];
    financials: {
        held: number;
        released: number;
    };
}

export function LatestUpdates({ activities = [], financials = { held: 0, released: 0 } }: LatestUpdatesProps) {
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
    const [searchQuery, setSearchQuery] = useState('');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate percentage for progress bars
    const totalFunds = financials.held + financials.released;
    const heldPercentage = totalFunds > 0 ? (financials.held / totalFunds) * 100 : 0;
    const releasedPercentage = totalFunds > 0 ? (financials.released / totalFunds) * 100 : 0;

    const filteredActivities = activities.filter(activity => {
        const itemDate = new Date(activity.date);
        let matchesDate = false;

        if (timeRange === 'today') matchesDate = isToday(itemDate);
        else if (timeRange === 'week') matchesDate = isThisWeek(itemDate);
        else if (timeRange === 'month') matchesDate = isThisMonth(itemDate);

        const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesDate && matchesSearch;
    });

    return (
        <div className="space-y-4">
            {/* Header Card: Title, Tabs, Search */}
            <Card className="border border-none shadow-none bg-white rounded-[20px] p-6">
                <h2 className="text-2xl font-bold text-[#111926] tracking-tight mb-5">Latest Updates</h2>
                <div className="space-y-4">
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={() => setTimeRange('today')}
                            variant="ghost"
                            className={`flex-1 min-w-[80px] rounded-xl h-10 border text-sm font-semibold ${timeRange === 'today'
                                ? "bg-[#111926] text-white border-[#111926] hover:bg-[#111926]/90 hover:text-white"
                                : "bg-white text-muted-foreground border-[#E5E7EB] hover:bg-gray-50"
                                }`}
                        >
                            Today
                        </Button>
                        <Button
                            onClick={() => setTimeRange('week')}
                            variant="ghost"
                            className={`flex-1 min-w-[100px] rounded-xl h-10 border text-sm font-semibold ${timeRange === 'week'
                                ? "bg-[#111926] text-white border-[#111926] hover:bg-[#111926]/90 hover:text-white"
                                : "bg-white text-muted-foreground border-[#E5E7EB] hover:bg-gray-50"
                                }`}
                        >
                            This Week
                        </Button>
                        <Button
                            onClick={() => setTimeRange('month')}
                            variant="ghost"
                            className={`flex-1 min-w-[100px] rounded-xl h-10 border text-sm font-semibold ${timeRange === 'month'
                                ? "bg-[#111926] text-white border-[#111926] hover:bg-[#111926]/90 hover:text-white"
                                : "bg-white text-muted-foreground border-[#E5E7EB] hover:bg-gray-50"
                                }`}
                        >
                            This Month
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                        <Input
                            placeholder="Search activities"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 rounded-xl border-[#E5E7EB] text-sm bg-white"
                        />
                    </div>

                    <div className="text-sm font-medium text-muted-foreground mt-2">
                        <span className="text-[#111926] font-bold text-lg mr-1">{filteredActivities.length}</span> New activities {timeRange === 'today' ? 'today' : (timeRange === 'week' ? 'this week' : 'this month')}
                    </div>
                </div>
            </Card>

            {/* Activity List - Separate Cards */}
            <div className="space-y-2">
                {filteredActivities.length === 0 ? (
                    <Card className="border border-none shadow-none bg-white rounded-[20px] p-8 text-center text-muted-foreground text-sm">
                        No recent activities found
                    </Card>
                ) : (
                    filteredActivities.map((item) => (
                        <Card key={item.id} className="border border-none shadow-none bg-white rounded-[20px] p-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-all hover:shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] text-muted-foreground bg-white">
                                {item.type === 'discussion' ? (
                                    <Mic className="h-5 w-5" />
                                ) : (
                                    <MessageSquare className="h-5 w-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[#111926] text-sm tracking-tight mb-0.5">{item.title}</h4>
                                <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                            </div>
                            <div className="self-start sm:self-center px-3 py-1 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                                {format(new Date(item.date), 'MMMM d, yyyy')}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Deposit Summary Card */}
            <Card className="border border-none shadow-none bg-white rounded-[20px] p-6 mt-4">
                <h3 className="mb-6 text-xl font-bold text-[#111926] tracking-tight">Deposit Summary</h3>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <div>
                                <span className="text-muted-foreground block text-xs mb-1">Funds Held</span>
                                <span className="text-[#111926] font-extrabold text-lg tracking-tight">{formatCurrency(financials.held)}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-muted-foreground block text-xs mb-1">Funds Released</span>
                                <span className="text-[#111926] font-extrabold text-lg tracking-tight">{formatCurrency(financials.released)}</span>
                            </div>
                        </div>

                        <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                            {/* Held Segment */}
                            <div
                                className="h-full bg-[#9333EA]"
                                style={{ width: `${heldPercentage}%` }}
                                title={`Held: ${heldPercentage.toFixed(1)}%`}
                            />
                            {/* Released Segment */}
                            <div
                                className="h-full relative"
                                style={{
                                    width: `${releasedPercentage}%`,
                                    backgroundColor: '#D8B4FE',
                                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.4) 6px, rgba(255,255,255,0.4) 12px)`
                                }}
                                title={`Released: ${releasedPercentage.toFixed(1)}%`}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                            <span>{heldPercentage.toFixed(0)}% Held</span>
                            <span>{releasedPercentage.toFixed(0)}% Released</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

