import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContextualPayoutBannerProps {
  trustStatus?: 'pending' | 'submitted' | 'under_verification' | 'action_required' | 'verified' | 'not_verified' | string;
  projectStage?: 'before_first_project' | 'during_first_project' | 'milestone_approved' | string;
  onNavigateToCompliance?: () => void;
  className?: string;
}

export const ContextualPayoutBanner: React.FC<ContextualPayoutBannerProps> = ({
  trustStatus = 'pending',
  projectStage = 'before_first_project',
  onNavigateToCompliance,
  className = '',
}) => {
  const status = trustStatus.toLowerCase();

  // Completed / Verified state
  if (status === 'verified' || status === 'submitted' || status === 'under_verification') {
    return (
      <div className={`rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950 font-poppins">Payout Ready</h4>
            <p className="text-xs text-emerald-800 font-medium">Your Trust &amp; Compliance has been completed.</p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900 self-start sm:self-center">
          Payout Ready
        </span>
      </div>
    );
  }

  if (status === 'action_required') {
    return (
      <div className={`rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 font-poppins">Action Required: Complete Trust &amp; Compliance</h4>
            <p className="text-xs text-amber-800 font-medium">Required to receive project payments.</p>
          </div>
        </div>
        {onNavigateToCompliance && (
          <Button
            onClick={onNavigateToCompliance}
            className="rounded-full px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-sm"
          >
            Complete Now <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
      </div>
    );
  }

  // Contextual messaging based on projectStage
  let bannerHeader = 'Trust & Compliance Pending';
  let bannerSubtext = 'Complete before your first payout.';
  let isDanger = false;

  if (projectStage === 'during_first_project') {
    bannerHeader = 'Complete Trust & Compliance';
    bannerSubtext = 'Required to receive project payments.';
  } else if (projectStage === 'milestone_approved') {
    bannerHeader = 'Payout On Hold';
    bannerSubtext = 'Complete Trust & Compliance to release your payment.';
    isDanger = true;
  }

  const borderBg = isDanger
    ? 'border-rose-300 bg-rose-50/95'
    : 'border-amber-300 bg-amber-50/90';
  const iconWrap = isDanger
    ? 'bg-rose-100 text-rose-700'
    : 'bg-amber-100 text-amber-700';
  const headerColor = isDanger ? 'text-rose-950' : 'text-amber-950';
  const subColor = isDanger ? 'text-rose-800' : 'text-amber-800';
  const buttonBg = isDanger
    ? 'bg-rose-600 hover:bg-rose-700'
    : 'bg-[#FF5722] hover:bg-[#E64A19]';

  return (
    <div className={`rounded-2xl border ${borderBg} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full ${iconWrap} flex items-center justify-center shrink-0`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`text-sm font-bold ${headerColor} font-poppins`}>{bannerHeader}</h4>
          <p className={`text-xs ${subColor} font-medium`}>{bannerSubtext}</p>
        </div>
      </div>
      {onNavigateToCompliance && (
        <Button
          onClick={onNavigateToCompliance}
          className={`rounded-full px-5 py-2 text-xs font-bold ${buttonBg} text-white shrink-0 shadow-sm`}
        >
          Complete Now <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      )}
    </div>
  );
};

