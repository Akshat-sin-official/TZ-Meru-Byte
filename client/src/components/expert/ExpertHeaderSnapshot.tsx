/**
 * Expert Header Snapshot — "At A Glance"
 * 
 * Purpose: Instant clarity, motivation, and trust
 * 
 * Displays 4 metric cards (Read Only):
 * - Active Engagements
 * - Pending Actions
 * - Deposits Released
 * - Upcoming Discussions
 */

import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Clock, Banknote, Calendar } from 'lucide-react';
import { ExpertStats } from '@/services/expertService';

interface ExpertHeaderSnapshotProps {
  stats: ExpertStats | undefined;
  isLoading?: boolean;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNextDiscussion = (scheduledDate?: string, scheduledTime?: string): string => {
  if (!scheduledDate) return 'No upcoming calls';
  
  const date = new Date(scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateStr = date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
  
  if (date >= today && date < tomorrow) {
    const timeStr = scheduledTime || date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Today, ${timeStr}`;
  }
  
  if (date >= tomorrow && date < new Date(tomorrow.getTime() + 86400000)) {
    const timeStr = scheduledTime || date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Tomorrow, ${timeStr}`;
  }
  
  const timeStr = scheduledTime || date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr}, ${timeStr}`;
};

export function ExpertHeaderSnapshot({ stats, isLoading }: ExpertHeaderSnapshotProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-[#E5E7EB] bg-white rounded-xl">
            <CardContent className="p-6">
              <div className="h-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Active Engagements',
      value: stats?.activeEngagements || 0,
      displayValue: `${stats?.activeEngagements || 0} Active`,
      icon: Briefcase,
      iconColor: 'text-[#3B82F6]',
      iconBg: 'bg-[#F0F9FF]',
    },
    {
      label: 'Pending Actions',
      value: stats?.pendingActions || 0,
      displayValue:
        stats?.pendingActions && stats.pendingActions > 0
          ? `${stats.pendingActions} milestone${stats.pendingActions > 1 ? 's' : ''} waiting for client review`
          : 'No milestones waiting for review',
      icon: Clock,
      iconColor: 'text-[#F59E0B]',
      iconBg: 'bg-[#FEF3C7]',
    },
    {
      label: 'Deposits Released',
      value: stats?.totalEarned || 0,
      displayValue: formatCurrency(stats?.totalEarned || 0),
      subtext: 'released till date',
      icon: Banknote,
      iconColor: 'text-[#22C55E]',
      iconBg: 'bg-[#F0FDF4]',
    },
    {
      label: 'Upcoming Discussions',
      value: stats?.nextDiscussion ? 1 : 0,
      displayValue: formatNextDiscussion(
        stats?.nextDiscussion?.scheduledDate,
        stats?.nextDiscussion?.scheduledTime
      ),
      icon: Calendar,
      iconColor: 'text-[#A855F7]',
      iconBg: 'bg-[#FAF5FF]',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card
            key={index}
            className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#6B7280] mb-2">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-[#111926] mb-1">
                    {metric.displayValue}
                  </p>
                  {metric.subtext && (
                    <p className="text-xs text-[#6B7280]">
                      {metric.subtext}
                    </p>
                  )}
                </div>
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${metric.iconBg}`}>
                  <Icon className={`h-6 w-6 ${metric.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

