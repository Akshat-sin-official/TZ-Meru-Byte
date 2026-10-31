/**
 * Primary Action Panel — "What Needs My Attention?"
 * 
 * CRITICAL RULES:
 * - Shows exactly ONE action at any time
 * - Priority order is locked (milestone → quotation → deposit → discussion → none)
 * - Financial actions must include amount, ownership language, irreversibility clarity
 * - No urgency, no countdowns, no pressure
 * - Calm, neutral, professional UI
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  FileText,
  CreditCard,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { SeekerEngagement, SeekerQuotation, SeekerDiscussion } from '@/services/seekerService';

interface PrimaryAction {
  type: 'milestone_approval' | 'quotation_review' | 'deposit_payment' | 'discussion_upcoming' | 'none';
  title: string;
  description: string;
  amount?: number;
  engagementId?: string;
  milestoneSubmissionId?: string;
  quotationId?: string;
  discussionId?: string;
  expertName?: string;
  actionLabel: string;
  actionHref: string;
}

interface PrimaryActionPanelProps {
  engagements: SeekerEngagement[];
  quotations: SeekerQuotation[];
  discussions: SeekerDiscussion[];
  isLoading?: boolean;
}

/**
 * Decision Logic — Evaluates in strict priority order
 * 
 * Priority 1: Milestone pending approval
 * Priority 2: Quotation pending acceptance
 * Priority 3: Deposit pending payment
 * Priority 4: Upcoming discussion
 * Priority 5: No action required
 */
const determinePrimaryAction = (
  engagements: SeekerEngagement[],
  quotations: SeekerQuotation[],
  discussions: SeekerDiscussion[]
): PrimaryAction => {
  // PRIORITY 1: Milestone pending approval
  // Check all engagements for milestones with status 'submitted' (i.e. expert has submitted work)
  for (const engagement of engagements) {
    const engagementStatus = engagement.status?.toLowerCase();
    if (engagementStatus !== 'active') continue;

    const pendingMilestone = engagement.milestones?.find(m => m.status?.toLowerCase() === 'submitted');

    if (pendingMilestone) {
      // If multiple pending milestones, select most recent (highest milestone number)
      // or highest value — for simplicity, we'll use the first found
      // In production, you might want to sort by submittedAt or amount
      const allPending = engagement.milestones.filter(m => m.status?.toLowerCase() === 'submitted');

      // Select by: highest milestone number (most recent), then highest amount
      const selectedMilestone = allPending.reduce((prev, current) => {
        if (current.milestoneNumber > prev.milestoneNumber) return current;
        if (current.milestoneNumber === prev.milestoneNumber && current.amount > prev.amount) return current;
        return prev;
      }, allPending[0]);

      return {
        type: 'milestone_approval',
        title: 'Milestone Approval Required',
        description: `${engagement.expertName} submitted milestone "${selectedMilestone.title}". Funds will be released only after your approval.`,
        amount: selectedMilestone.amount,
        engagementId: engagement.id,
        milestoneSubmissionId: selectedMilestone.submissionId,
        expertName: engagement.expertName,
        actionLabel: 'Review Milestone',
        actionHref: `/seeker/engagements/${engagement.id}?tab=milestones`,
      };
    }
  }

  // PRIORITY 2: Quotation pending acceptance
  const pendingQuotation = quotations?.find(q => {
    const status = q.status?.toLowerCase();
    return status === 'sent';
  });
  if (pendingQuotation) {
    return {
      type: 'quotation_review',
      title: 'Quotation Received',
      description: `Review quotation from ${pendingQuotation.expertName} for ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(pendingQuotation.totalAmount)}.`,
      amount: pendingQuotation.totalAmount,
      quotationId: pendingQuotation.id,
      expertName: pendingQuotation.expertName,
      actionLabel: 'View Quotation',
      actionHref: `/seeker/quotations/${pendingQuotation.id}`,
    };
  }

  // PRIORITY 3: Deposit pending payment
  // Check if there's an engagement that requires deposit payment
  // Use remainingBalance as the source of truth (amount still owed)
  const pendingDepositEngagement = engagements?.find(e => {
    const status = e.status?.toLowerCase();
    // Only show deposit payment if:
    // 1. Status allows deposit payment
    // 2. There's actually a remaining balance to pay (remainingBalance > 0)
    return (status === 'quotation_accepted' || 
            status === 'pending_deposit' ||
            status === 'pending_compliance') &&
           e.remainingBalance > 0; // Use remainingBalance as source of truth
  });
  
  if (pendingDepositEngagement && pendingDepositEngagement.remainingBalance > 0) {
    // Find the associated quotation
    const quotation = quotations?.find(q => q.id === pendingDepositEngagement.quotationId);
    const isExpired = quotation && quotation.validUntil && new Date(quotation.validUntil) < new Date();

    if (!isExpired) {
      // remainingBalance is the amount still to be paid
      const depositAmount = pendingDepositEngagement.remainingBalance;
      
      // Format expert name - if it looks like an email, extract the name part or use a fallback
      const expertName = pendingDepositEngagement.expertName &&
        pendingDepositEngagement.expertName.includes('@')
        ? pendingDepositEngagement.expertName.split('@')[0]
        : pendingDepositEngagement.expertName || 'the expert';
      
      return {
        type: 'deposit_payment',
        title: 'Deposit Payment Required',
        description: `Complete deposit payment of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(depositAmount)} to activate engagement with ${expertName}. Funds will be released only after your approval.`,
        amount: depositAmount,
        engagementId: pendingDepositEngagement.id,
        expertName: expertName,
        actionLabel: 'Pay Deposit',
        actionHref: `/payment/deposit?engagementId=${pendingDepositEngagement.id}`,
      };
    }
  }

  // PRIORITY 4: Upcoming discussion
  const now = new Date();
  const upcomingDiscussion = discussions?.find(d => {
    const status = d.status?.toLowerCase();
    if (status !== 'open') return false;
    if (!d.scheduledDate) return false;
    const scheduledDate = new Date(d.scheduledDate);
    return scheduledDate > now;
  });

  if (upcomingDiscussion && upcomingDiscussion.scheduledDate) {
    const scheduledDate = new Date(upcomingDiscussion.scheduledDate);
    const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      type: 'discussion_upcoming',
      title: 'Discussion Scheduled',
      description: `Upcoming discussion with ${upcomingDiscussion.expertName} on ${formattedDate}.`,
      discussionId: upcomingDiscussion.id,
      expertName: upcomingDiscussion.expertName,
      actionLabel: 'View Details',
      actionHref: `/seeker/discussions/${upcomingDiscussion.id}`,
    };
  }

  // PRIORITY 5: No action required
  return {
    type: 'none',
    title: 'All Caught Up',
    description: 'No actions required at this time.',
    actionLabel: '',
    actionHref: '',
  };
};

/**
 * Format currency for display
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get icon for action type
 */
const getActionIcon = (type: PrimaryAction['type']) => {
  switch (type) {
    case 'milestone_approval':
      return CheckCircle2;
    case 'quotation_review':
      return FileText;
    case 'deposit_payment':
      return CreditCard;
    case 'discussion_upcoming':
      return Calendar;
    case 'none':
      return AlertCircle;
  }
};

/**
 * Get color variant for action type
 */
const getActionVariant = (type: PrimaryAction['type']): 'default' | 'outline' | 'secondary' => {
  switch (type) {
    case 'milestone_approval':
      return 'default';
    case 'quotation_review':
      return 'default';
    case 'deposit_payment':
      return 'default';
    case 'discussion_upcoming':
      return 'outline';
    case 'none':
      return 'secondary';
  }
};

export function PrimaryActionPanel({
  engagements = [],
  quotations = [],
  discussions = [],
  isLoading = false,
}: PrimaryActionPanelProps) {
  const navigate = useNavigate();

  const primaryAction = useMemo(() => {
    if (isLoading) return null;
    return determinePrimaryAction(engagements, quotations, discussions);
  }, [engagements, quotations, discussions, isLoading]);

  // Don't render if loading
  if (isLoading) {
    return null;
  }

  // Show "none" state if no action is required (per spec: "Engagement in progress")
  if (!primaryAction || primaryAction.type === 'none') {
    return (
      <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm mb-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-[#F9FAFB] text-[#6B7280]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-[#111926] mb-1">
                Engagement in progress
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                No action required from you right now.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ActionIcon = getActionIcon(primaryAction.type);
  const buttonVariant = getActionVariant(primaryAction.type);

  const handleAction = () => {
    if (primaryAction.actionHref) {
      navigate(primaryAction.actionHref);
    }
  };

  return (
    <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm mb-6 sm:mb-8">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${primaryAction.type === 'milestone_approval' ? 'bg-[#F0F9FF] text-[#3B82F6]' :
              primaryAction.type === 'quotation_review' ? 'bg-[#FAF5FF] text-[#A855F7]' :
                primaryAction.type === 'deposit_payment' ? 'bg-[#F0FDF4] text-[#22C55E]' :
                  'bg-[#F9FAFB] text-[#6B7280]'
            }`}>
            <ActionIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-[#111926] mb-1">
              {primaryAction.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7280] mb-3 sm:mb-4 leading-relaxed">
              {primaryAction.description}
            </p>

            {/* Financial amount display (only for financial actions) */}
            {(primaryAction.type === 'milestone_approval' ||
              primaryAction.type === 'quotation_review' ||
              primaryAction.type === 'deposit_payment') && primaryAction.amount && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                      Amount:
                    </span>
                    <span className="text-base sm:text-lg font-bold text-[#111926]">
                      {formatCurrency(primaryAction.amount)}
                    </span>
                  </div>
                  {primaryAction.type === 'milestone_approval' && (
                    <p className="text-xs text-[#6B7280] mt-2 italic">
                      Funds will be released only after your approval.
                    </p>
                  )}
                  {primaryAction.type === 'deposit_payment' && (
                    <p className="text-xs text-[#6B7280] mt-2 italic">
                      Funds will be released only after your approval.
                    </p>
                  )}
                </div>
              )}

            {/* Single CTA Button */}
            <Button
              onClick={handleAction}
              variant={buttonVariant}
              className="w-full sm:w-auto"
              size="lg"
            >
              {primaryAction.actionLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

