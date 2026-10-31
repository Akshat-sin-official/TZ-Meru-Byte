import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeekerEngagement, SeekerDiscussion } from "@/services/seekerService";
import { Lock } from "lucide-react";

interface DashboardHeaderProps {
  seekerName: string;
  seekerId?: string;
  engagements: SeekerEngagement[];
  discussions: SeekerDiscussion[];
  onFindExperts?: () => void;
}

/**
 * Determines the current engagement status for display in header
 * Priority order:
 * 1. Milestone pending approval
 * 2. Deposit paid (active engagement)
 * 3. Quotation accepted
 * 4. Discussion scheduled
 * 5. Browsing (no engagements)
 */
export function DashboardHeader({
  seekerName,
  seekerId,
  engagements,
  discussions,
  onFindExperts,
}: DashboardHeaderProps) {
  const handleFindExperts = onFindExperts || (() => {
    const token = localStorage.getItem('accessToken');
    const targetUrl = token
      ? `https://martechadda.com/experts?token=${encodeURIComponent(token)}&search=true`
      : 'https://martechadda.com/experts?search=true';
    window.location.href = targetUrl;
  });

  const getStatusChip = () => {
    // Check for milestone pending approval (only when expert has actually submitted work)
    const hasPendingMilestone = engagements.some((e) =>
      e.milestones?.some((m) => m.status === 'submitted')
    );
    if (hasPendingMilestone) {
      return {
        label: 'Milestone Pending Approval',
        variant: 'secondary' as const,
        color: 'bg-orange-50 border-orange-200 text-orange-700',
      };
    }

    // Check for active engagement (deposit paid)
    const hasActiveEngagement = engagements.some(
      (e) => e.status.toLowerCase() === 'active' && e.hasPaidDeposit
    );
    if (hasActiveEngagement) {
      return {
        label: 'Deposit Paid',
        variant: 'default' as const,
        color: 'bg-green-50 border-green-200 text-green-700',
      };
    }

    // Check for quotation accepted
    const hasQuotationAccepted = engagements.some(
      (e) => e.status.toLowerCase() === 'quotation_accepted'
    );
    if (hasQuotationAccepted) {
      return {
        label: 'Quotation Accepted',
        variant: 'outline' as const,
        color: 'bg-blue-50 border-blue-200 text-blue-700',
      };
    }

    // Check for discussion scheduled
    const hasScheduledDiscussion = discussions.some(
      (d) => d.status.toLowerCase() === 'open' && d.scheduledDate && new Date(d.scheduledDate) > new Date()
    );
    if (hasScheduledDiscussion) {
      return {
        label: 'Discussion Scheduled',
        variant: 'outline' as const,
        color: 'bg-purple-50 border-purple-200 text-purple-700',
      };
    }

    // Check for completed engagement
    const hasCompletedEngagement = engagements.some(
      (e) => e.status.toLowerCase() === 'completed'
    );
    if (hasCompletedEngagement) {
      return {
        label: 'Engagement Completed',
        variant: 'secondary' as const,
        color: 'bg-gray-50 border-gray-200 text-gray-700',
      };
    }

    // Default: Browsing
    return {
      label: 'Browsing',
      variant: 'outline' as const,
      color: 'bg-gray-50 border-gray-200 text-gray-600',
    };
  };

  const statusChip = getStatusChip();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 border-b border-border/50 pb-4 mb-4 sm:mb-6">
      {/* Left: Business/Seeker Name */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{seekerName}</h1>
        {seekerId && (
          <Badge
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700 font-mono text-[11px] font-bold px-2.5 py-0.5 uppercase shrink-0"
          >
            ID: {seekerId}
          </Badge>
        )}
      </div>

      {/* Center: Find Experts CTA (replacing Browsing badge) */}
      <div className="flex-1 flex justify-center sm:justify-center items-center gap-2">
        {statusChip.label === 'Browsing' ? (
          <Button
            onClick={handleFindExperts}
            className="bg-[#FF6B35] hover:bg-[#e55a26] text-white font-semibold text-xs sm:text-sm px-4 py-1.5 sm:py-2 rounded-xl shadow-sm cursor-pointer transition-all hover:shadow"
          >
            Find Experts
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge
              variant={statusChip.variant}
              className={`${statusChip.color} border px-3 sm:px-4 py-1 sm:py-1.5 font-semibold text-xs sm:text-sm whitespace-nowrap`}
            >
              {statusChip.label}
            </Badge>
            <Button
              onClick={handleFindExperts}
              className="bg-[#FF6B35] hover:bg-[#e55a26] text-white font-semibold text-xs px-3 py-1 rounded-xl shadow-sm cursor-pointer"
            >
              Find Experts
            </Button>
          </div>
        )}
      </div>

      {/* Right: Neutral Platform Indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <Lock className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Neutral Platform</span>
        <span className="sm:hidden">Neutral</span>
      </div>
    </div>
  );
}

