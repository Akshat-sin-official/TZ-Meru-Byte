/**
 * Profile Rejected Screen
 * 
 * Shown when profileStatus === "rejected"
 * Displays admin feedback and allows resubmission after corrections
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, Edit, Home, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileRejected() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const rejectionReason = location.state?.rejectionReason || user?.rejectionReason || 'Your profile did not meet our verification requirements. Please review and correct the issues highlighted by our team.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-background flex items-center justify-center p-4">
      <div className="container max-w-2xl mx-auto">
        <Card className="border-2 border-red-500 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-3xl mb-2 text-red-700">Profile Verification Failed</CardTitle>
              <CardDescription className="text-base">
                Your profile could not be verified
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Rejection Reason */}
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Feedback from Verification Team</AlertTitle>
              <AlertDescription className="text-red-700 mt-2">
                <p className="whitespace-pre-wrap">{rejectionReason}</p>
              </AlertDescription>
            </Alert>

            {/* What You Need to Do */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">What You Need to Do:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Review the feedback above carefully</li>
                <li>Go to your onboarding stages and make necessary corrections</li>
                <li>Update documents, information, or compliance details as required</li>
                <li>Re-submit your profile for verification</li>
              </ol>
            </div>

            {/* Common Issues */}
            <Alert>
              <AlertDescription className="text-sm space-y-2">
                <p className="font-medium">Common Issues:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Invalid or expired documents</li>
                  <li>Incomplete address or bank details</li>
                  <li>Mismatch in provided information</li>
                  <li>Poor quality document scans</li>
                  <li>Missing required certifications</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={() => navigate('/expert/onboarding')}
                className="w-full gap-2"
                variant="default"
              >
                <Edit className="h-4 w-4" />
                Edit Profile & Resubmit
              </Button>

              <Button
                onClick={() => navigate('/expert/dashboard')}
                variant="outline"
                className="w-full gap-2"
              >
                <Home className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>

            {/* Important Note */}
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-sm text-yellow-800">
                <strong>Important:</strong> You can resubmit your profile as many times as needed.
                Make sure all issues are addressed before resubmitting to avoid further delays.
              </AlertDescription>
            </Alert>

            {/* Footer Note */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need clarification?{' '}
                <a href="/help-support" className="text-primary hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
