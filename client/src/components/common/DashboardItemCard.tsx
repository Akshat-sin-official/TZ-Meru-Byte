import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardItemCardProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badges?: Array<{ label: string; variant?: 'default' | 'outline' }>;
  details?: Array<{ label: string; value: string }>;
  progress?: {
    current: number;
    total: number;
    startLabel?: string;
    endLabel?: string;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const DashboardItemCard = ({
  icon,
  title,
  subtitle,
  badges,
  details,
  progress,
  action,
  className,
}: DashboardItemCardProps) => {
  const progressPercent = progress
    ? Math.min((progress.current / progress.total) * 100, 100)
    : 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        {icon && (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold leading-tight">{title}</h3>
              {subtitle && (
                <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
              )}

              {/* Badges */}
              {badges && badges.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        badge.variant === 'outline'
                          ? 'border border-border text-muted-foreground'
                          : 'bg-secondary text-foreground'
                      )}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            {details && details.length > 0 && (
              <div className="hidden flex-shrink-0 gap-6 text-right sm:flex">
                {details.map((detail, idx) => (
                  <div key={idx}>
                    <p className="text-xs text-muted-foreground">{detail.label}</p>
                    <p className="font-semibold">{detail.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action */}
            {action && (
              <Button
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="flex-shrink-0"
              >
                {action.label}
              </Button>
            )}
          </div>

          {/* Mobile Details */}
          {details && details.length > 0 && (
            <div className="mt-3 flex gap-4 sm:hidden">
              {details.map((detail, idx) => (
                <div key={idx}>
                  <p className="text-xs text-muted-foreground">{detail.label}</p>
                  <p className="font-semibold">{detail.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {progress && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress.startLabel}</span>
                <span>{progress.endLabel}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
