import { Skeleton } from "@/components/ui/skeleton";

interface PlatformHealthProps {
    isLoading?: boolean;
    stats?: any;
}

export function PlatformHealth({ isLoading, stats }: PlatformHealthProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-3 bg-[#F3F4F6] p-4 sm:p-5 rounded-[24px] border border-transparent">
                <h2 className="font-sans text-xl sm:text-2xl lg:text-[30px] font-bold leading-tight sm:leading-[36px] tracking-normal text-[#111926] ml-1">Platform Health</h2>
                <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div className="space-y-6 sm:space-y-8">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full rounded-[10px]" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full rounded-[10px]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const totalHeld = stats?.totalHeld || 0;
    const totalReleased = stats?.totalReleased || 0;
    const totalVolume = totalHeld + totalReleased;
    const releaseRate = totalVolume > 0 ? Math.round((totalReleased / totalVolume) * 100) : 0;
    
    // Calculate dispute rate from disputed engagements
    const disputedEngagements = stats?.disputedEngagements || 0;
    const activeEngagements = stats?.activeEngagements || 0;
    const totalEngagements = activeEngagements + (stats?.successfulEngagements || 0);
    const disputeRate = totalEngagements > 0 ? Math.round((disputedEngagements / totalEngagements) * 100) : 0;

    return (
        <div className="flex flex-col gap-3 bg-[#F3F4F6] p-4 sm:p-5 rounded-[24px] border border-transparent">
            <h2 className="font-sans text-xl sm:text-2xl lg:text-[30px] font-bold leading-tight sm:leading-[36px] tracking-normal text-[#111926] ml-1">Platform Health</h2>
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="space-y-6 sm:space-y-8">
                    {/* Release Rate */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">Release Rate ({releaseRate}%)</span>
                            <span className="text-sm font-bold text-[#111926]">{releaseRate >= 70 ? 'Good' : releaseRate >= 40 ? 'Fair' : 'Low'}</span>
                        </div>

                        <div className="flex h-10 w-full gap-2">
                            {/* Filled Part - Purple Striped */}
                            <div className="h-full rounded-[10px] bg-[#A855F7] relative overflow-hidden transition-all duration-500" style={{ width: `${releaseRate}%` }}>
                                <div className="absolute inset-0" style={{
                                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.2) 6px, rgba(255,255,255,0.2) 12px)"
                                }}></div>
                            </div>

                            {/* Remaining Part - Gray Striped */}
                            <div className="flex-1 h-full rounded-[10px] bg-[#F3F4F6] relative overflow-hidden">
                                <div className="absolute inset-0 opacity-50" style={{
                                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, #E5E7EB 6px, #E5E7EB 12px)"
                                }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Dispute Rate */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">Dispute Rate ({disputeRate}%)</span>
                            <span className="text-sm font-bold text-[#111926]">{disputeRate < 5 ? 'Low' : 'High'}</span>
                        </div>

                        <div className="flex h-10 w-full gap-2">
                            {/* Filled Part - Purple Striped - Smaller */}
                            <div className="h-full rounded-[10px] bg-[#A855F7] relative overflow-hidden transition-all duration-500" style={{ width: `${disputeRate}%` }}>
                                <div className="absolute inset-0" style={{
                                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.2) 6px, rgba(255,255,255,0.2) 12px)"
                                }}></div>
                            </div>

                            {/* Remaining Part - Gray Striped */}
                            <div className="flex-1 h-full rounded-[10px] bg-[#F3F4F6] relative overflow-hidden">
                                <div className="absolute inset-0 opacity-50" style={{
                                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, #E5E7EB 6px, #E5E7EB 12px)"
                                }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
