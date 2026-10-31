import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Edit,
  Shield,
} from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sidebarSections = useAppSidebar();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: '',
    company: '',
    location: '',
    bio: '',
  });

  // Redirect experts to expert profile edit page
  useEffect(() => {
    if (user?.role === 'expert') {
      navigate('/expert/profile', { replace: true });
    }
  }, [user?.role, navigate]);

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    enabled: !!user, // Only run if user is logged in
  });

  useEffect(() => {
    if (profileData) {
      setFormData(prev => ({
        ...prev,
        // Map backend fields to form state
        name: profileData.user?.fullName || profileData.profile?.displayName || prev.name,
        email: profileData.user?.email || prev.email,
        mobile: profileData.profile?.mobileNumber || profileData.user?.mobile || '',
        company: profileData.profile?.companyName || '',
        location: profileData.profile?.billingAddress?.city || '', // explicit mapping example
        bio: profileData.profile?.bio || '',
      }));
    }
  }, [profileData]);

  const updateMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const handleSave = () => {
    // Map form data back to backend expected structure
    const payload = {
      name: formData.name,
      // Seeker profile fields
      companyName: formData.company,
      bio: formData.bio,
      mobileNumber: formData.mobile,
      billingAddress: {
        city: formData.location // Simple mapping for now
      }
    };
    updateMutation.mutate(payload);
  };

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'User',
        role:
          user?.role === 'expert'
            ? 'Marketing Expert'
            : user?.role === 'admin'
              ? 'Platform Administrator'
              : 'Business Owner',
      }}
      sections={sidebarSections}
      onSignOut={() => navigate('/login')}
      headerTitle="Profile"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your profile information</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="h-9">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="h-9">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative group">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-lg ring-1 ring-gray-100">
                    <AvatarImage src="" alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-3xl font-bold text-white">
                      {(user?.name)?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                  {isEditing ? (
                    <div className="max-w-md space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-left block">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="bg-gray-50 bg-opacity-50"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</h2>
                      <p className="text-muted-foreground font-medium">
                        {user?.role === 'expert'
                          ? 'Marketing Expert'
                          : user?.role === 'admin'
                            ? 'Platform Administrator'
                            : 'Business Owner'}
                      </p>
                      {user?.role === 'seeker' && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mt-1 font-mono uppercase">
                          Seeker ID: {profileData?.profile?.seekerId || 'PENDING'}
                        </div>
                      )}
                      {formData.company && (
                        <p className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground mt-2">
                          <Building className="h-4 w-4" />
                          {formData.company}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="p-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                    <p className="text-sm text-muted-foreground">Contact details and location</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Email Address
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="bg-gray-50"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium pl-6">{formData.email || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Mobile Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      className="bg-gray-50"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium pl-6">{formData.mobile || 'Not set'}</p>
                  )}
                </div>

                {user?.role === 'seeker' && (
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      Location
                    </Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="bg-gray-50"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium pl-6">{formData.location || 'Not set'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Business/Additional Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="p-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {user?.role === 'seeker' ? 'Business Details' : 'Professional Details'}
                    </h2>
                    <p className="text-sm text-muted-foreground">About your work</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {user?.role === 'seeker' && (
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium text-gray-700">Company Name</Label>
                    {isEditing ? (
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        className="bg-gray-50"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{formData.company || 'Not set'}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio / Description</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      rows={6}
                      value={formData.bio}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="bg-gray-50 resize-none"
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm leading-relaxed border border-gray-100 min-h-[100px]">
                      {formData.bio || 'No bio added yet.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Account Status</h2>
                  <p className="text-sm text-muted-foreground">Verification and standing</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">Email Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Action required to secure your account
                  </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${user?.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                  <div className={`h-2 w-2 rounded-full ${user?.isVerified ? 'bg-green-600' : 'bg-amber-600'}`} />
                  {user?.isVerified ? 'Verified' : 'Pending'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppDashboardLayout>
  );
};

export default Profile;

