interface StatusBadgeProps {
  status: string;
  variant?: 'filled' | 'outline' | 'muted';
}

export const StatusBadge = ({ status, variant = 'outline' }: StatusBadgeProps) => {
  const baseClasses = 'px-2 py-0.5 text-xs uppercase';
  
  const variantClasses = {
    filled: 'border border-foreground bg-foreground text-background',
    outline: 'border border-foreground text-foreground',
    muted: 'border border-foreground/30 text-muted-foreground',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {status}
    </span>
  );
};
