import { BentoStatCard } from "@/components/common/BentoStatCard";

interface StatBase {
    label: string;
    value: string | number;
    change?: string;
    trend?: "up" | "down" | "neutral";
}

interface StatCardsProps {
    wrapperClass?: string;
    stats: StatBase[];
}

export function StatCards({ stats }: StatCardsProps) {
    return (
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <BentoStatCard
                    key={index}
                    label={stat.label}
                    value={stat.value}
                    change={stat.change}
                    trend={stat.trend}
                />
            ))}
        </div>
    );
}
