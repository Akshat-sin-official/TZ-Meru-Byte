import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeekerEngagement } from "@/services/seekerService";
import { FileText, CheckCircle2, ExternalLink, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FeedbackPrompt } from "@/components/feedback/FeedbackPrompt";
import { formatStatusLabel } from "@/lib/statusUtils";

interface ReleaseInfoProps {
    engagements: SeekerEngagement[];
}

export function ReleaseInfo({ engagements = [] }: ReleaseInfoProps) {
    const navigate = useNavigate();

    // Generate engagement reference number (short ID)
    const getEngagementRef = (id: string) => {
        return `ENG-${id.substring(id.length - 8).toUpperCase()}`;
    };

    // Only show engagements that have real financial activity (deposits / releases)
    // Hide engagements that are only at "quotation sent / accepted" stage with no money involved yet.
    const releaseEngagements = engagements.filter((engagement) => {
        // Any deposit paid or funds held/released qualifies
        const hasFinancialActivity =
            engagement.hasPaidDeposit ||
            (engagement.releasedAmount ?? 0) > 0 ||
            (engagement.heldAmount ?? 0) > 0;

        return hasFinancialActivity;
    });

    return (
        <div className="space-y-4">
            {releaseEngagements.length === 0 ? (
                <Card className="border border-transparent shadow-none bg-[#F3F4F6] rounded-[20px]">
                    <CardContent className="p-6 text-center text-muted-foreground text-sm">
                        No deposit or release activity found yet.
                    </CardContent>
                </Card>
            ) : (
                releaseEngagements.map((engagement) => {
                    const pendingMilestones = engagement.milestones?.filter((m) => m.status === 'pending' || m.status === 'submitted').length || 0;
                    const totalMilestones = engagement.milestones?.length || 0;

                    return (
                        <Card key={engagement.id} className="border-none shadow-none bg-[#F3F4F6] rounded-[20px] overflow-hidden">
                            <CardContent className="p-3">

                                {/* Inner White Card */}
                                <div className="bg-white rounded-xl p-4 flex flex-col gap-4 w-full border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">

                                    {/* Top Badges Row */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Status Badge */}
                                        <div className={`flex items-center px-3 py-1 gap-1.5 border rounded-full ${engagement.status.toLowerCase() === 'active'
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : 'bg-orange-50 border-orange-200 text-orange-700'
                                            }`}>
                                            <FileText className="w-3.5 h-3.5" />
                                            <span className="font-semibold text-[10px] uppercase">{formatStatusLabel(engagement.status)}</span>
                                        </div>

                                        {/* Milestone Badge */}
                                        <div className="flex items-center px-3 py-1 gap-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#6B7280]" />
                                            <span className="font-semibold text-[10px] text-[#6B7280]">{totalMilestones} Milestone{totalMilestones !== 1 ? 's' : ''}</span>
                                        </div>

                                        {/* Engagement Reference */}
                                        <div className="flex items-center px-3 py-1 gap-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm">
                                            <span className="font-semibold text-[10px] text-[#6B7280] font-mono">{getEngagementRef(engagement.id)}</span>
                                        </div>
                                    </div>

                                    {/* User Profile Row */}
                                    <div className="flex items-center gap-3 bg-[#F9FAFB] p-1.5 rounded-xl">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white shadow-sm">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(engagement.expertName)}&background=random`}
                                                alt={engagement.expertName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-bold text-sm text-[#374151] truncate">{engagement.expertName}</span>
                                            <span className="text-[11px] text-muted-foreground truncate">Marketing Expert</span>
                                        </div>
                                        {/* Deposit Amount */}
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Total Deposit</p>
                                            <p className="font-bold text-sm text-[#374151]">
                                                {new Intl.NumberFormat('en-IN', {
                                                    style: 'currency',
                                                    currency: 'INR',
                                                    maximumFractionDigits: 0,
                                                }).format(engagement.totalDeposit)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Title Section */}
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="font-bold text-base text-[#374151]">Project Progress</h3>
                                        <p className="font-medium text-xs text-[#6B7280]">
                                            {pendingMilestones > 0
                                                ? `${pendingMilestones} milestone${pendingMilestones !== 1 ? 's' : ''} pending approval`
                                                : 'All submitted milestones approved'}
                                        </p>
                                    </div>

                                    {/* Progress Section */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center text-xs font-medium text-[#4B5563]">
                                            <span>{engagement.progressPercentage}% Completion</span>
                                        </div>

                                        <div className="flex h-3 w-full gap-1">
                                            {/* Filled Part - Purple Striped */}
                                            <div className="h-full rounded-full bg-[#A855F7] relative overflow-hidden"
                                                style={{ width: `${engagement.progressPercentage}%` }}>
                                                <div className="absolute inset-0" style={{
                                                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)`
                                                }}></div>
                                            </div>

                                            {/* Remaining Part - Gray Striped */}
                                            <div className="flex-1 h-full rounded-full bg-[#F3F4F6] relative overflow-hidden">
                                                <div className="absolute inset-0 opacity-50" style={{
                                                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, #E5E7EB 4px, #E5E7EB 8px)`
                                                }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Badges */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center px-3 py-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full">
                                            <span className="font-medium text-[10px] text-[#6B7280]">
                                                Started {new Date(engagement.startedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Contextual Actions */}
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E5E7EB]">
                                        {engagement.quotationId && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/seeker/quotations/${engagement.quotationId}`)}
                                                className="text-xs h-8 gap-1.5"
                                            >
                                                <FileText className="h-3 w-3" />
                                                View Quotation
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/seeker/engagements/${engagement.id}?tab=milestones`)}
                                            className="text-xs h-8 gap-1.5"
                                        >
                                            <Eye className="h-3 w-3" />
                                            View Milestones
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/seeker/engagements/${engagement.id}?tab=activity`)}
                                            className="text-xs h-8 gap-1.5"
                                        >
                                            <FileText className="h-3 w-3" />
                                            View History
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/seeker/engagements/${engagement.id}`)}
                                            className="text-xs h-8 gap-1.5"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            View Details
                                        </Button>
                                    </div>

                                    {/* Feedback Prompt for Completed Engagements */}
                                    {engagement.status.toLowerCase() === 'completed' && (
                                        <div className="mt-4">
                                            <FeedbackPrompt engagementId={engagement.id} />
                                        </div>
                                    )}

                                </div>
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </div>
    );
}
