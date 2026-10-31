import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BentoStatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'purple';
  onClick?: () => void;
}

export const BentoStatCard: React.FC<BentoStatCardProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  badge,
  badgeType = 'success',
  onClick,
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 ${
        onClick ? 'hover:border-primary/40 hover:shadow-sm cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#71717A] font-poppins">
          {label}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] text-[#111926]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-[#111926] font-poppins">
          {value}
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-poppins border ${getBadgeStyle()}`}>
            {badge}
          </span>
        )}
      </div>

      {sublabel && (
        <p className="mt-1.5 text-xs text-[#71717A] font-medium leading-relaxed">
          {sublabel}
        </p>
      )}
    </div>
  );
};
