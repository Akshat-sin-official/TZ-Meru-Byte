import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ModernToggle } from '@/components/ui/modern-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { useAdminSidebar } from '@/hooks/useAdminSidebar';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Mail,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settingsService';
import { EmailChangeSection } from '@/components/settings/EmailChangeSection';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use admin sidebar if accessed from /admin/settings, otherwise use app sidebar
  const isAdminRoute = location.pathname.startsWith('/admin');
  const appSidebarSections = useAppSidebar();
  const adminSidebarSections = useAdminSidebar();
  const sidebarSections = isAdminRoute ? adminSidebarSections : appSidebarSections;


  const [settings, setSettings] = useState({
    // Preferences (from UserSettings backend)
    emailNotifications: true,
    pushNotifications: true,
    discussionReminders: true,
    engagementUpdates: true,
    quotationAlerts: true,
    profileVisibility: 'public' as 'public' | 'private' | 'expert-only',
    showEmail: false,
    showMobile: false,
    language: 'en',
    timezone: 'Asia/Kolkata',
    theme: 'light' as 'light' | 'dark' | 'system',
    currency: 'INR',
  });

  const { data: serverSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
    retry: 2,
  });

  useEffect(() => {
    if (serverSettings) {
      setSettings(prev => ({
        ...prev,
        emailNotifications: serverSettings.emailNotifications ?? prev.emailNotifications,
        pushNotifications: serverSettings.pushNotifications ?? prev.pushNotifications,
        discussionReminders: serverSettings.discussionReminders ?? prev.discussionReminders,
        engagementUpdates: serverSettings.engagementUpdates ?? prev.engagementUpdates,
        quotationAlerts: serverSettings.quotationAlerts ?? prev.quotationAlerts,
        profileVisibility: (serverSettings.profileVisibility ?? prev.profileVisibility) as 'public' | 'private' | 'expert-only',
        showEmail: serverSettings.showEmail ?? prev.showEmail,
        showMobile: serverSettings.showMobile ?? prev.showMobile,
        language: serverSettings.language ?? prev.language,
        timezone: serverSettings.timezone ?? prev.timezone,
        theme: (serverSettings.theme ?? prev.theme) as 'light' | 'dark' | 'system',
        currency: serverSettings.currency ?? prev.currency,
      }));
    }
  }, [serverSettings]);

  const updateMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save settings';
      toast.error(errorMessage);
    }
  });

  const handleSave = () => {
    // Only send settings that are part of UserSettings model
    const settingsToSave: Partial<typeof settings> = {
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      discussionReminders: settings.discussionReminders,
      engagementUpdates: settings.engagementUpdates,
      quotationAlerts: settings.quotationAlerts,
      profileVisibility: settings.profileVisibility,
      showEmail: settings.showEmail,
      showMobile: settings.showMobile,
      language: settings.language,
      timezone: settings.timezone,
      theme: settings.theme,
      currency: settings.currency,
    };
    updateMutation.mutate(settingsToSave);
  };

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'User',
        role: user?.role === 'expert' ? 'Marketing Expert' : user?.role === 'admin' ? 'Platform Administrator' : 'Business Owner',
      }}
      sections={sidebarSections}
      onSignOut={() => navigate('/login')}
      headerTitle="Settings"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your account settings and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="h-9">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={handleSave} 
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={updateMutation.isPending || isLoadingSettings}
            >
              {updateMutation.isPending ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account - Email Change */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Account</h2>
                  <p className="text-sm text-muted-foreground">Manage your email address</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <EmailChangeSection
                currentEmail={user?.email || ''}
                onEmailChanged={() => {
                  queryClient.invalidateQueries({ queryKey: ['session'] });
                }}
              />
            </div>
          </div>

          {/* Notification Settings - Full Width, Most Important */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                  <p className="text-sm text-muted-foreground">Manage your alerts</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {[
                { id: 'email-notifications', label: 'Email Notifications', desc: 'Receive updates via email', key: 'emailNotifications' },
                { id: 'push-notifications', label: 'Push Notifications', desc: 'Browser push alerts', key: 'pushNotifications' },
                { id: 'discussion-reminders', label: 'Discussion Reminders', desc: 'Alerts for upcoming meetings', key: 'discussionReminders' },
                { id: 'engagement-updates', label: 'Engagement Updates', desc: 'Milestone and task updates', key: 'engagementUpdates' },
                { id: 'quotation-alerts', label: 'Quotation Alerts', desc: 'New quotes and approvals', key: 'quotationAlerts' },
              ].map((item, idx) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor={item.id} className="text-base font-medium text-gray-900">{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <ModernToggle
                      id={item.id}
                      checked={settings[item.key as keyof typeof settings] as boolean}
                      onCheckedChange={checked => setSettings({ ...settings, [item.key]: checked })}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                  {idx < 4 && <Separator className="bg-gray-100 mt-5" />}
                </div>
              ))}
            </div>
          </div>

          {/* Privacy and Preferences - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Privacy Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Privacy</h2>
                    <p className="text-sm text-muted-foreground">Control what others see</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profile-visibility" className="text-sm font-medium text-gray-700">Profile Visibility</Label>
                  <Select
                    value={settings.profileVisibility}
                    onValueChange={value => setSettings({ ...settings, profileVisibility: value as 'public' | 'private' | 'expert-only' })}
                  >
                    <SelectTrigger id="profile-visibility" className="bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="expert-only">Experts Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-email" className="text-base font-medium text-gray-900">Show Email</Label>
                    <p className="text-sm text-muted-foreground">Display email on public profile</p>
                  </div>
                  <ModernToggle
                    id="show-email"
                    checked={settings.showEmail}
                    onCheckedChange={checked => setSettings({ ...settings, showEmail: checked })}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <Separator className="bg-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-mobile" className="text-base font-medium text-gray-900">Show Mobile</Label>
                    <p className="text-sm text-muted-foreground">Display mobile on public profile</p>
                  </div>
                  <ModernToggle
                    id="show-mobile"
                    checked={settings.showMobile}
                    onCheckedChange={checked => setSettings({ ...settings, showMobile: checked })}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
                    <p className="text-sm text-muted-foreground">Language and region</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium text-gray-700">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={value => setSettings({ ...settings, language: value })}
                  >
                    <SelectTrigger id="language" className="bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                      <SelectItem value="ta">Tamil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium text-gray-700">Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={value => setSettings({ ...settings, currency: value })}
                  >
                    <SelectTrigger id="currency" className="bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-sm font-medium text-gray-700">Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={value => setSettings({ ...settings, theme: value as 'light' | 'dark' | 'system' })}
                  >
                    <SelectTrigger id="theme" className="bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light"><div className="flex items-center gap-2"><Sun className="h-4 w-4" /> Light</div></SelectItem>
                      <SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="h-4 w-4" /> Dark</div></SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppDashboardLayout>
  );
};

export default Settings;

