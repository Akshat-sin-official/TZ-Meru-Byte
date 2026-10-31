/**
 * Enhanced Status Badge Component
 * 
 * Displays engagement/milestone status with dispute awareness
 * Shows warning badges and disabled state indicators
 */

import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import {
  getEngagementStatus,
  getMilestoneStatus,
  type EngagementStatus,
  type MilestoneStatus,
} from '@/lib/statusUtils';
import { cn } from '@/lib/utils';

interface EnhancedStatusBadgeProps {
  status: EngagementStatus | MilestoneStatus | string;
  type: 'engagement' | 'milestone';
  showDisputeWarning?: boolean;
  className?: string;
}

/**
 * Map status variant to badge variant
 */
const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  default: 'default',
  secondary: 'secondary',
  destructive: 'destructive',
  outline: 'outline',
  warning: 'outline',
  success: 'default',
};

export const EnhancedStatusBadge = ({
  status,
  type,
  showDisputeWarning = true,
  className,
}: EnhancedStatusBadgeProps) => {
  const config =
    type === 'engagement'
      ? getEngagementStatus(status)
      : getMilestoneStatus(status);

  const badgeVariant = variantMap[config.variant] || 'outline';
  const isDisputed = config.showDisputeBadge && showDisputeWarning;

  // Custom class based on variant
  const customClass = cn(
    {
      'bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400':
        config.variant === 'warning',
      'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400':
        config.variant === 'success',
      'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400':
        isDisputed,
    },
    className
  );

  return (
    <div className="flex items-center gap-2">
      <Badge variant={badgeVariant} className={customClass}>
        {isDisputed && <AlertCircle className="mr-1 h-3 w-3" />}
        {config.label}
      </Badge>
      {isDisputed && (
        <span className="text-xs text-muted-foreground italic">
          Actions disabled
        </span>
      )}
    </div>
  );
};
