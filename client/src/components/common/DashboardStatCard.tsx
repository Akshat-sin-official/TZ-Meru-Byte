import { cn } from '@/lib/utils';

interface DashboardStatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  className?: string;
}

export const DashboardStatCard = ({
  icon: Icon,
  value,
  label,
  className,
}: DashboardStatCardProps) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm transition-all hover:shadow-md',
        className
      )}
    >
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-secondary/50" />
      <div className="absolute -right-2 -top-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-secondary" />

      <div className="relative">
        <div className="mb-3 sm:mb-4 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-border bg-secondary">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
        <p className="text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};
