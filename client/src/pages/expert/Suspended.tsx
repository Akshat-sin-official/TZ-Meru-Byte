/**
 * Profile Suspended Screen
 * 
 * Shown when profileStatus === "suspended"
 * Displays admin suspension feedback and support contact actions
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, LogOut, Mail, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Suspended() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Dynamic suspension reason passed via state, auth context, or a standard fallback message
  const suspensionReason = location.state?.suspensionReason || user?.suspensionReason || 'No specific reason provided by administration.';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background flex items-center justify-center p-4">
      <div className="container max-w-2xl mx-auto">
        <Card className="border-2 border-amber-500 shadow-xl overflow-hidden bg-card transition-all duration-300">
          {/* Top colored accent bar */}
          <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 w-full" />
          
          <CardHeader className="text-center space-y-4 pb-6 pt-8">
            <div className="mx-auto w-20 h-20 bg-amber-100/80 rounded-full flex items-center justify-center border border-amber-200 animate-pulse">
              <ShieldAlert className="h-10 w-10 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-amber-800">Profile Suspended</CardTitle>
              <CardDescription className="text-base text-amber-700/80 mt-1">
                Your expert workspace access has been temporarily restricted
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
            {/* Core Message */}
            <p className="text-center text-gray-700 font-semibold text-base leading-relaxed">
              Your MarTechAdda expert profile is currently suspended.
            </p>

            {/* Suspension Reason Box */}
            <Alert className="bg-amber-50/50 border-amber-200 shadow-sm">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 font-semibold">Reason for Suspension</AlertTitle>
              <AlertDescription className="text-amber-900 mt-2 font-mono text-sm bg-white/70 p-3 rounded border border-amber-100/50 whitespace-pre-wrap leading-relaxed">
                {suspensionReason}
              </AlertDescription>
            </Alert>

            {/* Dynamic notice */}
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              Access to workspace features and platform activities is temporarily restricted.
            </p>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <a 
                href="mailto:support@martechadda.com"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md text-white font-medium bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm text-center"
              >
                <Mail className="h-4 w-4" />
                Contact Support
              </a>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full gap-2 border-amber-200 hover:bg-amber-50/50 text-gray-700 font-medium"
              >
                <LogOut className="h-4 w-4 text-amber-600" />
                Logout Account
              </Button>
            </div>

            {/* Help/Clarification section */}
            <div className="text-center pt-6 border-t border-gray-100 flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                For assistance, please contact{' '}
                <a href="mailto:support@martechadda.com" className="text-amber-700 hover:text-amber-800 underline font-semibold transition-colors">
                  support@martechadda.com
                </a>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
