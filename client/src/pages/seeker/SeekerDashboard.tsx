import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { StatCards } from '@/components/seeker/StatCards';
import { LatestUpdates } from '@/components/seeker/LatestUpdates';
import { PrimaryActionPanel } from '@/components/seeker/PrimaryActionPanel';
import { DepositReleaseSummary } from '@/components/seeker/DepositReleaseSummary';
import { ProfileCompliance } from '@/components/seeker/ProfileCompliance';
import { DashboardHeader } from '@/components/seeker/DashboardHeader';
import PostHirePrompt from '@/components/post-hire/PostHirePrompt';
import { seekerService } from '@/services/seekerService';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useShortlist } from '@/contexts/ShortlistContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Mic, Video, Calendar, Clock, User, Briefcase, ArrowRight } from "lucide-react";
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { format } from 'date-fns';
import { EnhancedStatusBadge } from '@/components/common/EnhancedStatusBadge';

const SeekerDashboard = () => {
  const { user, logout } = useAuth();
  const { shortlistedExperts, isLoading: isShortlistLoading } = useShortlist();
  const navigate = useNavigate();
  const sidebarSections = useAppSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPostHirePrompt, setShowPostHirePrompt] = useState(false);

  // Check if post-hire prompt should be shown
  useEffect(() => {
    const showPrompt = searchParams.get('showPostHirePrompt') === 'true';
    if (showPrompt) {
      setShowPostHirePrompt(true);
      // Remove query param from URL
      searchParams.delete('showPostHirePrompt');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: stats } = useQuery({
    queryKey: ['seekerStats'],
    queryFn: () => seekerService.getStats(),
  });

  const { data: engagements } = useQuery({
    queryKey: ['seekerEngagements'],
    queryFn: () => seekerService.getEngagements(),
  });

  const { data: discussions } = useQuery({
    queryKey: ['seekerDiscussions'],
    queryFn: () => seekerService.getDiscussions(),
  });

  const { data: quotations } = useQuery({
    queryKey: ['seekerQuotations'],
    queryFn: () => seekerService.getQuotations(),
  });

  const { data: profile } = useQuery({
    queryKey: ['seekerProfile'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: any }>('/v1/seeker/profile');
        return response.data.data || null;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const statData = [
    { label: "Discussion", value: stats?.discussions ?? 0 },
    { label: "Pending Quotations", value: stats?.pendingQuotations ?? 0 },
    { label: "Active Engagements", value: stats?.activeEngagements ?? 0 },
    { label: "Deposit Held", value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats?.depositsHeld ?? 0) },
  ];

  const activities = discussions?.slice(0, 5).map(d => ({
    id: d.id,
    type: 'discussion',
    title: d.purpose,
    subtitle: `${d.expertName} • ${d.status}`,
    date: d.scheduledDate || d.createdAt || new Date(),
  })) || [];

  const handleFindExperts = () => {
    const token = localStorage.getItem('accessToken');
    const targetUrl = token
      ? `https://martechadda.com/experts?token=${encodeURIComponent(token)}&search=true`
      : 'https://martechadda.com/experts?search=true';
    window.location.href = targetUrl;
  };

  const financials = {
    held: stats?.depositsHeld ?? 0,
    released: stats?.fundsReleased ?? 0
  };

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'User',
        role: user?.role === 'expert' ? 'Marketing Expert' : user?.role === 'admin' ? 'Platform Administrator' : 'Business Owner',
      }}
      sections={sidebarSections}
      onSignOut={() => {
        logout();
        navigate('/login');
      }}
      headerTitle="Dashboard Overview"
    >
      {/* Header — Status & Trust */}
      <DashboardHeader
        seekerName={user?.name || 'Business Owner'}
        seekerId={profile?.seekerId}
        engagements={engagements || []}
        discussions={discussions || []}
        onFindExperts={handleFindExperts}
      />

      <div className="space-y-4 sm:space-y-6">
        {/* Primary Action Panel — What Needs My Attention? */}
        <PrimaryActionPanel
          engagements={engagements || []}
          quotations={quotations || []}
          discussions={discussions || []}
          isLoading={!engagements || !quotations || !discussions}
        />

        {/* Stats Cards */}
        <StatCards stats={statData} />

        {/* Deposit & Release Summary */}
        {engagements && engagements.filter((e: any) => {
          const s = e.status?.toLowerCase();
          return s === 'active' || s === 'completed' || s === 'closed';
        }).length > 0 && (
          <DepositReleaseSummary engagements={engagements.filter((e: any) => {
            const s = e.status?.toLowerCase();
            return s === 'active' || s === 'completed' || s === 'closed';
          })} />
        )}

        {/* Main Content Split */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Left Column: Quick Actions & Upcoming Items (2 cols width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleFindExperts}
                    className="h-auto py-4 px-4 gap-3 bg-white border-[#E5E7EB] rounded-xl hover:bg-gray-50 shadow-sm flex-col sm:flex-row cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg shrink-0">
                      <Users className="h-5 w-5 text-[#0EA5E9]" />
                    </div>
                    <div className="text-left sm:text-center">
                      <div className="font-semibold text-sm text-[#111926]">Find Experts</div>
                      <div className="text-xs text-[#6B7280] hidden sm:block">Browse experts</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/seeker/quotations')}
                    className="h-auto py-4 px-4 gap-3 bg-white border-[#E5E7EB] rounded-xl hover:bg-gray-50 shadow-sm flex-col sm:flex-row"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-[#FAF5FF] border border-[#F3E8FF] rounded-lg shrink-0">
                      <FileText className="h-5 w-5 text-[#A855F7]" />
                    </div>
                    <div className="text-left sm:text-center">
                      <div className="font-semibold text-sm text-[#111926]">Quotations</div>
                      <div className="text-xs text-[#6B7280] hidden sm:block">View quotes</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/seeker/discussions')}
                    className="h-auto py-4 px-4 gap-3 bg-white border-[#E5E7EB] rounded-xl hover:bg-gray-50 shadow-sm flex-col sm:flex-row"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-[#FAF5FF] border border-[#F3E8FF] rounded-lg shrink-0">
                      <Mic className="h-5 w-5 text-[#A855F7]" />
                    </div>
                    <div className="text-left sm:text-center">
                      <div className="font-semibold text-sm text-[#111926]">Discussions</div>
                      <div className="text-xs text-[#6B7280] hidden sm:block">View meetings</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Shortlisted Experts Card */}
            {!isShortlistLoading && shortlistedExperts.length > 0 && (
              <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight">Shortlisted Experts</h2>
                      <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Experts shortlisted for discussion</p>
                    </div>
                    <Badge variant="secondary" className="bg-[#F3F4F6] text-[#111926] shrink-0">
                      {shortlistedExperts.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {shortlistedExperts.slice(0, 3).map((expert) => (
                      <div
                        key={expert.expertId}
                        className="group p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-xl hover:border-rose-300 hover:shadow-md transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-400 text-white font-bold text-sm shadow-sm shrink-0">
                            {expert.expertData?.name?.charAt(0) || expert.expertData?.fullName?.charAt(0) || 'E'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-[#111926] truncate cursor-pointer hover:underline" onClick={() => navigate(`/experts/${expert.expertId}`)}>
                              {expert.expertData?.name || expert.expertData?.fullName || "Expert"}
                            </h3>
                            <p className="text-xs text-[#6B7280] line-clamp-1">{expert.profileData?.bio || "Marketing Professional"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/discussions/schedule/${expert.expertId}`)}
                            className="h-8 px-3 text-xs border-[#0EA5E9] text-[#0284C7] hover:bg-[#F0F9FF]"
                          >
                            Schedule Discussion
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/experts/compare?ids=${shortlistedExperts.map(e => e.expertId).join(',')}`)}
                            className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-full"
                            title="Compare Options"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {shortlistedExperts.length >= 2 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => navigate(`/experts/compare?ids=${shortlistedExperts.map(e => e.expertId).join(',')}`)}
                    >
                      Compare Shortlisted Experts
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {!isShortlistLoading && shortlistedExperts.length === 0 && (
              <Card className="border border-dashed border-[#CBD5E1] bg-white rounded-xl shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight">No experts shortlisted yet</h2>
                  <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Browse experts and shortlist one to schedule a call directly from the dashboard.</p>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Discussions */}
            {discussions && discussions.length > 0 && (() => {
              const scheduledDiscussions = discussions.filter(d => {
                const status = d.status?.toLowerCase();
                return (status === 'open' || status === 'scheduled') && d.scheduledDate;
              });

              return scheduledDiscussions.length > 0 ? (
                <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight">Upcoming Discussions</h2>
                        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Your scheduled meetings with experts</p>
                      </div>
                      <Badge variant="secondary" className="bg-[#F3F4F6] text-[#111926] shrink-0">
                        {scheduledDiscussions.length}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {scheduledDiscussions.slice(0, 3).map((d) => (
                        <div
                          key={d.id}
                          className="group p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#0EA5E9] hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] shrink-0">
                              <Video className="h-5 w-5 sm:h-6 sm:w-6 text-[#0EA5E9]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-sm sm:text-base text-[#111926] mb-1 truncate">{d.purpose || "Discussion"}</h3>
                                  <p className="text-xs sm:text-sm text-[#6B7280] line-clamp-2">{d.agenda || "No agenda provided"}</p>
                                </div>
                                <Badge variant="secondary" className="bg-[#F3F4F6] text-[#111926] shrink-0 text-xs">
                                  {d.scheduledDate ? format(new Date(d.scheduledDate), 'MMM d') : 'TBD'}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#6B7280] mb-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {d.scheduledDate ? format(new Date(d.scheduledDate), 'EEE, MMM d') : 'Date TBD'}
                                </span>
                                {d.scheduledTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {d.scheduledTime}
                                  </span>
                                )}
                                {(d as any).referenceId && (
                                  <span className="font-mono text-xs text-[#0EA5E9] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                    {(d as any).referenceId}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  {d.expertName || "Expert"}
                                </span>
                              </div>
                              <Button
                                onClick={() => navigate(`/seeker/discussions/${d.id}`)}
                                variant="outline"
                                className="w-full sm:w-auto border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9] hover:text-white text-xs sm:text-sm"
                              >
                                <Video className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Quotations Received */}
            {quotations && quotations.length > 0 && (
              <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight">Quotations Received</h2>
                      <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Review and accept proposals from experts</p>
                    </div>
                    <Badge variant="secondary" className="bg-[#F3F4F6] text-[#111926] shrink-0">
                      {quotations.filter(q => q.status?.toLowerCase() === 'sent' || q.status?.toLowerCase() === 'pending').length} New
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {quotations.slice(0, 5).map((q) => (
                      <div
                        key={q.id}
                        className="group p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#0EA5E9] hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 shrink-0">
                            <FileText className="h-5 w-5 text-[#0EA5E9]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                               <span className="font-mono text-[10px] font-bold text-[#0EA5E9] uppercase tracking-wider">{q.referenceId || `QT-${q.id.substring(18).toUpperCase()}`}</span>
                               <Badge className="text-[10px] h-4 capitalize" variant={q.status === 'accepted' ? 'default' : 'secondary'}>{q.status}</Badge>
                            </div>
                            <h3 className="font-semibold text-sm text-[#111926]">{q.expertName}</h3>
                            <p className="text-xs text-[#6B7280] line-clamp-1">{q.scope || "Marketing Proposal"}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                          <div className="text-left sm:text-right">
                             <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-tighter">Value</p>
                             <p className="text-sm font-bold text-[#111926]">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(q.totalAmount)}</p>
                          </div>
                          <Button
                            onClick={() => navigate(`/seeker/quotations/${q.id}`)}
                            size="sm"
                            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs h-8"
                          >
                            Review Quote
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Engagements */}
            {engagements && engagements.length > 0 && (() => {
              const activeEngagements = engagements.filter(e => {
                const status = e.status?.toLowerCase();
                return status === 'active' || status === 'in_progress';
              });

              return activeEngagements.length > 0 ? (
                <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-[#111926] tracking-tight">Active Engagements</h2>
                        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Your ongoing projects</p>
                      </div>
                      <Badge variant="secondary" className="bg-[#F3F4F6] text-[#111926] shrink-0">
                        {activeEngagements.length}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {activeEngagements.slice(0, 3).map((e) => (
                        <div
                          key={e.id}
                          className="group p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#A855F7] hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FAF5FF] border border-[#F3E8FF] shrink-0">
                              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-[#A855F7]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-sm sm:text-base text-[#111926] mb-1 truncate">{e.expertName || "Expert"}</h3>
                                  <p className="text-xs sm:text-sm text-[#6B7280] line-clamp-1">{(e as any).serviceCategory || "Marketing Service"}</p>
                                </div>
                                  <EnhancedStatusBadge status={e.status} type="engagement" className="shrink-0 text-xs" />
                                </div>
                              <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-3">
                                <span>{e.progressPercentage || 0}% Complete</span>
                                <span>•</span>
                                <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(e.totalDeposit || 0)}</span>
                                {(e as any).referenceId && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-[#A855F7]">{(e as any).referenceId}</span>
                                  </>
                                )}
                              </div>
                              <Button
                                onClick={() => navigate(`/seeker/engagements/${e.id}`)}
                                variant="outline"
                                className="w-full sm:w-auto border-[#A855F7] text-[#A855F7] hover:bg-[#A855F7] hover:text-white text-xs sm:text-sm"
                              >
                                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                                View Engagement
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}
          </div>

          {/* Right Column: Latest Updates & Profile (1 col width) */}
          <div className="space-y-6">
            {/* Latest Updates */}
            <LatestUpdates activities={activities} financials={financials} />

            {/* Profile & Compliance */}
            <ProfileCompliance />
          </div>
        </div>
      </div>

      {/* Post-Hire Smart Prompt */}
      {showPostHirePrompt && (
        <PostHirePrompt
          onAddService={() => {
            setShowPostHirePrompt(false);
            navigate('/experts/add-service');
          }}
          onSkip={() => {
            setShowPostHirePrompt(false);
          }}
        />
      )}
    </AppDashboardLayout>
  );
};

export default SeekerDashboard;
