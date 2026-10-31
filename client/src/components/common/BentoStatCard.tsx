interface BentoStatCardProps {
    label: string;
    value: string | number;
    /** Secondary line below the main value (e.g. KPI breakdown). */
    sublabel?: string;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export function BentoStatCard({ label, value, sublabel, change, trend = 'neutral' }: BentoStatCardProps) {
    return (
        <div className="flex flex-col gap-2 sm:gap-3 bg-[#F3F4F6] p-3 sm:p-4 rounded-[20px] border border-transparent">
            <span className="text-xs sm:text-[13px] font-semibold text-[#4B5563] ml-1">
                {label}
            </span>
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="text-xl sm:text-2xl font-bold text-[#111926] tracking-tight mb-2 break-words">
                    {value}
                </div>
                {sublabel && (
                    <p className="text-xs text-[#6B7280] font-medium mb-2 leading-snug">{sublabel}</p>
                )}
                {change && (
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                        <span className={`${trend === 'up' ? 'text-[#10B981]' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                            {change}
                        </span>
                        <span className="text-[#9CA3AF] text-xs font-normal">• vs last month</span>
                    </div>
                )}
            </div>
        </div>
    );
}
