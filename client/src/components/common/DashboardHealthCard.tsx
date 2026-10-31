import { cn } from '@/lib/utils';

interface HealthItem {
  label: string;
  value: string;
  progress: number;
  color?: 'success' | 'warning' | 'danger' | 'default';
}

interface DashboardHealthCardProps {
  title: string;
  items: HealthItem[];
  className?: string;
}

export const DashboardHealthCard = ({
  title,
  items,
  className,
}: DashboardHealthCardProps) => {
  const getColorClass = (color: HealthItem['color']) => {
    switch (color) {
      case 'success':
        return 'bg-primary';
      case 'warning':
        return 'bg-muted-foreground';
      case 'danger':
        return 'bg-foreground';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm',
        className
      )}
    >
      <h3 className="mb-4 font-semibold">{title}</h3>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  getColorClass(item.color)
                )}
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
