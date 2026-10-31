/**
 * Deposit Release History — Audit & Trust
 * 
 * Purpose: Trust & audit trail
 * 
 * Read-Only Table showing:
 * - Engagement ID
 * - Client name
 * - Milestone
 * - Deposit %
 * - Amount released
 * - Release Date
 * 
 * ❌ No withdrawal button
 * ❌ No invoice upload
 * ❌ No tax display
 * 
 * MarTechAdda executes release. Expert only tracks.
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { expertService } from '@/services/expertService';
import { Loader2, Banknote, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DepositRelease {
  engagementId: string;
  engagementRef: string;
  clientName: string;
  milestoneNumber: number;
  milestoneTitle: string;
  depositPercentage: number;
  amountReleased: number;
  releaseDate: string;
  status: 'released' | 'pending';
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function DepositReleaseHistory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sidebarSections = useAppSidebar();

  // Fetch all engagements to get release history
  const { data: engagements = [], isLoading } = useQuery({
    queryKey: ['expertEngagements'],
    queryFn: () => expertService.getEngagements(),
  });

  // Process engagements to extract release history
  const releaseHistory: DepositRelease[] = engagements.flatMap((engagement) => {
    const rawId = String(engagement?.id || '');
    const tail = rawId ? rawId.substring(Math.max(0, rawId.length - 8)).toUpperCase() : '—';
    const engagementRef = `ENG-${tail}`;

    // Get all approved milestones (these are the ones that have been or will be released)
    const approvedMilestones = engagement.milestones.filter(
      (m) => m.status === 'approved'
    );

    return approvedMilestones.map((milestone) => ({
      engagementId: engagement.id,
      engagementRef,
      clientName: engagement.seekerName,
      milestoneNumber: milestone.milestoneNumber,
      milestoneTitle: milestone.title,
      depositPercentage: milestone.percentage,
      amountReleased: milestone.amount,
      releaseDate: milestone.submittedAt || engagement.startedAt, // Use submission date or engagement start date
      status: engagement.releasedAmount >= milestone.amount ? 'released' : 'pending',
    }));
  });

  // Sort by release date (newest first)
  releaseHistory.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'Expert User',
        role: 'Marketing Expert',
      }}
      sections={sidebarSections}
      onSignOut={() => {
        logout();
        navigate('/login');
      }}
      headerTitle="Deposit Release History"
    >
      <div className="p-6 lg:p-8">
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#111926]">
              Deposit Release History
            </CardTitle>
            <CardDescription className="text-[#6B7280]">
              Complete audit trail of all deposit releases across your engagements. MarTechAdda executes all releases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : releaseHistory.length === 0 ? (
              <div className="py-12 text-center">
                <Banknote className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-[#111926]">No releases yet</h3>
                <p className="text-sm text-muted-foreground">
                  Deposit releases will appear here after milestones are approved and released.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#E5E7EB]">
                      <TableHead className="font-semibold text-[#111926]">Engagement ID</TableHead>
                      <TableHead className="font-semibold text-[#111926]">Client Name</TableHead>
                      <TableHead className="font-semibold text-[#111926]">Milestone</TableHead>
                      <TableHead className="font-semibold text-[#111926] text-right">Deposit %</TableHead>
                      <TableHead className="font-semibold text-[#111926] text-right">Amount Released</TableHead>
                      <TableHead className="font-semibold text-[#111926]">Release Date</TableHead>
                      <TableHead className="font-semibold text-[#111926] text-center">Status</TableHead>
                      <TableHead className="font-semibold text-[#111926] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {releaseHistory.map((release, index) => (
                      <TableRow key={`${release.engagementId}-${release.milestoneNumber}-${index}`} className="border-b border-[#E5E7EB]">
                        <TableCell className="font-mono text-sm text-[#6B7280]">
                          {release.engagementRef}
                        </TableCell>
                        <TableCell className="font-medium text-[#111926]">
                          {release.clientName}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium text-[#111926]">
                              M{release.milestoneNumber}
                            </span>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {release.milestoneTitle}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-[#111926]">
                          {release.depositPercentage}%
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-[#111926]">
                            {formatCurrency(release.amountReleased)}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#6B7280]">
                          {formatDate(release.releaseDate)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={release.status === 'released' ? 'default' : 'secondary'}
                            className={
                              release.status === 'released'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-orange-100 text-orange-700 border-orange-200'
                            }
                          >
                            {release.status === 'released' ? 'Released' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/engagement/${release.engagementId}`)}
                            className="gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Footer Note */}
            <div className="mt-6 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
              <p className="text-xs text-[#6B7280] text-center">
                <strong>Note:</strong> MarTechAdda executes all deposit releases. This is a read-only audit trail.
                No withdrawal actions or invoice uploads are available here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppDashboardLayout>
  );
}

