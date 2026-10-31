/**
 * Under Review Screen
 * 
 * Shown when profileStatus === "submitted_for_verification"
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UnderReview() {
  const { logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleRefresh = async () => {
    try {
      await refreshUser();
    } catch (e) {
      window.location.reload();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleViewSubmittedProfile = () => {
    navigate('/expert/profile');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="container max-w-xl mx-auto">
        <Card className="border border-slate-200 shadow-lg rounded-2xl bg-white overflow-hidden">
          <CardHeader className="text-left space-y-2 pb-4 pt-8 px-8 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Profile Submitted Successfully
            </CardTitle>
            <p className="text-base text-slate-600">
              Your profile has been submitted for review.
            </p>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Status Section */}
            <div className="space-y-4 bg-amber-50/60 border border-amber-200/80 rounded-xl p-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Status:
                </span>
                <div className="flex items-center gap-2 text-amber-700 font-semibold text-base">
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                  <span>Under Review</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Estimated review time:
                </span>
                <p className="text-slate-900 font-medium text-sm">
                  1–2 business days
                </p>
              </div>

              <p className="text-xs text-slate-600 border-t border-amber-200/60 pt-3">
                You'll receive an <strong>email and dashboard notification</strong> once the review is complete.
              </p>
            </div>

            {/* Primary Action */}
            <div className="pt-2 space-y-3">
              <Button
                onClick={handleViewSubmittedProfile}
                className="w-full py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>View My Submitted Profile</span>
                <ArrowRight className="h-5 w-5" />
              </Button>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="flex-1 gap-2 text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Status
                </Button>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1 gap-2 text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
