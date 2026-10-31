import { cn } from '@/lib/utils';

interface InfoItem {
  label: string;
  value: string;
  valueClassName?: string;
}

interface DashboardInfoCardProps {
  title: string;
  icon?: React.ReactNode;
  items: InfoItem[];
  className?: string;
}

export const DashboardInfoCard = ({
  title,
  icon,
  items,
  className,
}: DashboardInfoCardProps) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm',
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
            </div>
            <p className={cn('font-semibold', item.valueClassName)}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
