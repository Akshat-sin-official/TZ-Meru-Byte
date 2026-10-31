import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning';
}

export const StatCard = ({ value, label, icon: Icon, variant = 'default' }: StatCardProps) => {
  const valueClass = variant === 'success' 
    ? 'text-primary' 
    : variant === 'warning' 
      ? 'text-accent' 
      : 'text-foreground';

  return (
    <div className="border-2 border-foreground p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </div>
    </div>
  );
};
