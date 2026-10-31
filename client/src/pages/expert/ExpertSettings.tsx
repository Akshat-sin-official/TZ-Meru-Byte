/**
 * Expert Settings Page
 * 
 * Sections:
 * - Account (Login credentials)
 * - Preferences (Notification preferences, Availability toggle)
 * - Support (Expert ID, Contact support)
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { expertService } from '@/services/expertService';
import { apiClient } from '@/services/apiClient';
import { toast } from 'sonner';
import { Loader2, User, Bell, HelpCircle, Key, Mail } from 'lucide-react';
import { EmailChangeSection } from '@/components/settings/EmailChangeSection';

export default function ExpertSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sidebarSections = useAppSidebar();
  const queryClient = useQueryClient();

  // Fetch expert profile (preferences, identifiers for support section)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['expertProfile'],
    queryFn: () => expertService.getProfile(),
  });

  // State for form fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'unavailable'>('available');


  // Initialize from profile
  useEffect(() => {
    if (profile) {
      setAvailabilityStatus(profile.availabilityStatus || 'available');
    }
  }, [profile]);


  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (status: 'available' | 'busy' | 'unavailable') => {
      return await expertService.updateProfile({
        availabilityStatus: status,
      } as any);
    },
    onSuccess: () => {
      toast.success('Availability updated successfully');
      queryClient.invalidateQueries({ queryKey: ['expertProfile'] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update availability';
      toast.error(errorMessage);
    },
  });

  const handleUpdateAvailability = () => {
    updateAvailabilityMutation.mutate(availabilityStatus);
  };


  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/v1/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to update password';
      const errorStr = typeof msg === 'string' ? msg : JSON.stringify(msg);
      toast.error(errorStr);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleContactSupport = () => {
    // Opens default email client with pre-filled support request
    // Future enhancement: Could integrate with support ticket system
    window.location.href = `mailto:support@martechadda.com?subject=Expert Support Request&body=Expert ID: ${user?.id || 'N/A'}`;
  };

  if (profileLoading) {
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
        headerTitle="Settings"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppDashboardLayout>
    );
  }

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
      headerTitle="Settings"
    >
      <div className="p-6 lg:p-8 space-y-8">
        {/* Account Section */}
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#111926]">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription className="text-[#6B7280]">
              Manage your login credentials and account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <EmailChangeSection
                currentEmail={user?.email || ''}
                onEmailChanged={() => {
                  queryClient.invalidateQueries({ queryKey: ['session'] });
                  queryClient.invalidateQueries({ queryKey: ['expertProfile'] });
                }}
              />

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-[#111926] flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Change Password
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="currentPassword" className="text-sm font-medium">
                      Current Password
                    </Label>
                    <PasswordInput
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium">
                      New Password
                    </Label>
                    <PasswordInput
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm New Password
                    </Label>
                    <PasswordInput
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleChangePassword} className="w-full sm:w-auto">
                    Update Password
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#111926]">
              <Bell className="h-5 w-5" />
              Preferences
            </CardTitle>
            <CardDescription className="text-[#6B7280]">
              Manage your notification preferences and availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications" className="text-sm font-medium text-[#111926]">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-[#111926] mb-3 block">
                    Availability Status
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="available"
                        name="availability"
                        value="available"
                        checked={availabilityStatus === 'available'}
                        onChange={() => setAvailabilityStatus('available')}
                        className="h-4 w-4 text-primary"
                      />
                      <Label htmlFor="available" className="font-normal cursor-pointer">
                        Available
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="busy"
                        name="availability"
                        value="busy"
                        checked={availabilityStatus === 'busy'}
                        onChange={() => setAvailabilityStatus('busy')}
                        className="h-4 w-4 text-primary"
                      />
                      <Label htmlFor="busy" className="font-normal cursor-pointer">
                        Busy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="unavailable"
                        name="availability"
                        value="unavailable"
                        checked={availabilityStatus === 'unavailable'}
                        onChange={() => setAvailabilityStatus('unavailable')}
                        className="h-4 w-4 text-primary"
                      />
                      <Label htmlFor="unavailable" className="font-normal cursor-pointer">
                        Unavailable
                      </Label>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpdateAvailability}
                    disabled={updateAvailabilityMutation.isPending}
                    className="mt-4"
                  >
                    {updateAvailabilityMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Availability
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Support Section */}
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#111926]">
              <HelpCircle className="h-5 w-5" />
              Support
            </CardTitle>
            <CardDescription className="text-[#6B7280]">
              Get help and contact support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-[#111926] mb-2 block">
                  Expert ID
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={user?.id || profile?.id || 'N/A'}
                    disabled
                    className="font-mono bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(user?.id || profile?.id || '');
                      toast.success('Expert ID copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your unique expert identifier. Include this when contacting support.
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-[#111926] mb-2 block">
                  Contact Support
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Need help? Contact our support team for assistance.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleContactSupport} variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email Support
                  </Button>
                  <Button
                    onClick={() => navigate('/expert/help-support')}
                    variant="outline"
                    className="gap-2"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help Center
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppDashboardLayout>
  );
}

