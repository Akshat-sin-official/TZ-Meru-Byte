import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Award, Shield, Landmark, Building2, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
import { INDUSTRY_SECTORS } from '@/data/taxonomy';
// @ts-ignore
import ServiceExpertComponent from '@/components/website/ServiceExpert';

const ServiceExpert = ServiceExpertComponent as React.ComponentType<{
  variant?: string;
  adminMode?: boolean;
  targetExpertId?: string;
  targetExpertProfile?: any;
  onAdminSaveSuccess?: (() => void) | null;
  onAdminClose?: (() => void) | null;
  key?: any;
}>;

interface AdminEditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any;
  type: 'experts' | 'seekers' | 'expert' | 'seeker';
  onSuccess?: () => void;
}

export function AdminEditProfileModal({
  open,
  onOpenChange,
  userData,
  type,
  onSuccess,
}: AdminEditProfileModalProps) {
  const isExpert = type === 'experts' || type === 'expert';
  const targetUserId = (
    userData?.userId?._id ||
    userData?.userId?.id ||
    userData?.userId ||
    userData?._id ||
    userData?.id ||
    userData?.expertId ||
    userData?.referenceId
  )?.toString() || '';
  const [saving, setSaving] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState(isExpert ? 'profile' : 'account');

  // Form State - User Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [role, setRole] = useState('expert');

  // Form State - Expert Professional
  const [displayName, setDisplayName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [entityType, setEntityType] = useState('individual');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | string>('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number | string>('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');

  // Form State - Expert Skills & Taxonomy
  const [primarySkills, setPrimarySkills] = useState('');
  const [secondarySkills, setSecondarySkills] = useState('');
  const [tools, setTools] = useState('');
  const [servicesOffered, setServicesOffered] = useState('');
  const [industrySector, setIndustrySector] = useState('');

  // Form State - Compliance & Legal
  const [panNumber, setPanNumber] = useState('');
  const [gstin, setGstin] = useState('');
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [profileStatus, setProfileStatus] = useState('under_review');

  // Form State - Bank Details
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  // Form State - Seeker Info
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [website, setWebsite] = useState('');
  const [seekerBio, setSeekerBio] = useState('');
  const [identityVerified, setIdentityVerified] = useState(false);
  const [authorizationVerified, setAuthorizationVerified] = useState(false);

  // Form State - Admin Reason
  const [adminReason, setAdminReason] = useState('Admin manual profile update');
  const [loadingDetails, setLoadingDetails] = useState(false);

  const populateFromData = (data: any) => {
    if (!data) return;
    const u = data.userId || data;
    setFullName(u.fullName || u.name || data.fullName || '');
    setEmail(u.email || data.email || '');
    setMobile(u.mobile || u.phone || data.mobile || data.phone || '');
    setIsActive(u.isActive !== undefined ? u.isActive : data.isActive !== false);
    setRole(u.role || data.role || (isExpert ? 'expert' : 'seeker'));

    if (isExpert) {
      setDisplayName(data.displayName || data.name || '');
      setBusinessName(data.businessName || '');
      setLegalName(data.legalName || '');
      setEntityType(data.entityType || 'individual');
      setHeadline(data.headline || data.title || '');
      setHourlyRate(
        data.minEngagementValue !== undefined && data.minEngagementValue !== null && data.minEngagementValue !== ''
          ? data.minEngagementValue
          : (data.hourlyRate !== undefined && data.hourlyRate !== null ? data.hourlyRate : '')
      );
      const expYears = data.yearsExperience ?? data.yearsOfExperience ?? data.experienceYears ?? (() => {
        const start = data.experienceStartDate || data.inceptionDate;
        if (start) {
          const d = new Date(start).getTime();
          if (!isNaN(d)) {
            return Math.max(0, Math.round(((Date.now() - d) / (365.25 * 24 * 3600 * 1000)) * 10) / 10);
          }
        }
        return '';
      })();
      setYearsOfExperience(expYears !== undefined && expYears !== null ? expYears : '');
      setCity(data.city || data.location?.city || '');
      setCountry(data.country || data.location?.country || 'India');

      // Arrays to comma-separated strings
      const toStr = (arr: any) => (Array.isArray(arr) ? arr.join(', ') : arr || '');
      setPrimarySkills(toStr(data.primarySkills || data.skills));
      setSecondarySkills(toStr(data.secondarySkills));
      setTools(toStr(data.tools));
      setServicesOffered(toStr(data.servicesOffered || data.services));
      setIndustrySector(data.industrySector || (data.industrySectors && data.industrySectors[0]) || '');

      setPanNumber(data.panNumber || '');
      setGstin(data.gstin || '');
      setIsKycVerified(!!(data.isKycVerified || data.kycVerified || data.kycStatus === 'verified'));
      setProfileStatus(data.profileStatus || 'under_review');

      // Bank details
      const bd = data.bankDetails || {};
      setAccountHolderName(bd.accountHolderName || '');
      setAccountNumber(bd.accountNumber || '');
      setIfscCode(bd.ifscCode || '');
      setBankName(bd.bankName || '');
    } else {
      // Seeker
      setCompanyName(data.companyName || '');
      setDesignation(data.designation || '');
      setIndustry(data.industry || '');
      setCompanySize(data.companySize || '');
      setWebsite(data.website || '');
      setSeekerBio(data.bio || '');
      setIdentityVerified(!!data.identityVerified);
      setAuthorizationVerified(!!data.authorizationVerified);
    }
  };

  // Populate data when modal opens or userData changes, with automatic full details fetching
  useEffect(() => {
    if (!userData || !open) return;

    // Immediately populate whatever data is available
    populateFromData(userData);
    setActiveTab(isExpert ? 'profile' : 'account');

    if (!targetUserId) return;

    let isCancelled = false;
    const fetchFullData = async () => {
      try {
        setLoadingDetails(true);
        let fullData: any;
        if (isExpert) {
          fullData = await adminService.getExpertDetail(targetUserId);
        } else {
          fullData = await adminService.getSeekerDetail(targetUserId);
        }
        if (!isCancelled && fullData) {
          populateFromData(fullData);
        }
      } catch (err) {
        console.warn('Could not fetch full user detail for edit modal:', err);
      } finally {
        if (!isCancelled) setLoadingDetails(false);
      }
    };

    fetchFullData();

    return () => {
      isCancelled = true;
    };
  }, [userData, isExpert, open]);

  const handleSave = async () => {
    if (!targetUserId) {
      toast.error('Unable to determine user ID');
      return;
    }

    setSaving(true);
    try {
      const userUpdates: Record<string, any> = {
        fullName: fullName.trim(),
        name: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        isActive,
        role,
      };

      const parseCsv = (val: string) =>
        val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

      let profileUpdates: Record<string, any> = {};

      if (isExpert) {
        profileUpdates = {
          displayName: displayName.trim(),
          businessName: businessName.trim(),
          legalName: legalName.trim(),
          entityType,
          headline: headline.trim(),
          title: headline.trim(),
          bio: bio.trim(),
          about: bio.trim(),
          hourlyRate: hourlyRate !== '' ? Number(hourlyRate) : undefined,
          minEngagementValue: hourlyRate !== '' ? Number(hourlyRate) : undefined,
          yearsOfExperience: yearsOfExperience !== '' ? Number(yearsOfExperience) : undefined,
          yearsExperience: yearsOfExperience !== '' ? Number(yearsOfExperience) : undefined,
          city: city.trim(),
          country: country.trim(),
          primarySkills: parseCsv(primarySkills),
          skills: parseCsv(primarySkills),
          secondarySkills: parseCsv(secondarySkills),
          tools: parseCsv(tools),
          servicesOffered: parseCsv(servicesOffered),
          services: parseCsv(servicesOffered),
          industrySector: industrySector || undefined,
          industrySectors: industrySector ? [industrySector] : undefined,
          panNumber: panNumber.trim().toUpperCase(),
          gstin: gstin.trim().toUpperCase(),
          isKycVerified,
          kycStatus: isKycVerified ? 'verified' : 'pending',
          profileStatus,
        };

        // If bank fields provided
        if (accountHolderName || accountNumber || ifscCode || bankName) {
          profileUpdates.bankDetails = {
            accountHolderName: accountHolderName.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim().toUpperCase(),
            bankName: bankName.trim(),
          };
        }
      } else {
        // Seeker
        profileUpdates = {
          companyName: companyName.trim(),
          designation: designation.trim(),
          industry: industry.trim(),
          companySize: companySize.trim(),
          website: website.trim(),
          bio: seekerBio.trim(),
          city: city.trim(),
          country: country.trim(),
          identityVerified,
          authorizationVerified,
        };
      }

      await adminService.updateUserProfile(targetUserId, {
        userUpdates,
        profileUpdates,
        reason: adminReason.trim() || 'Admin manual profile edit',
      });

      toast.success('Profile updated successfully by Admin');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMaximized ? "w-[99vw] h-[98vh] max-w-none max-h-none flex flex-col p-0 overflow-hidden" : (isExpert ? "max-w-6xl w-[96vw] max-h-[94vh] flex flex-col p-0 overflow-hidden" : "max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden")}>
        <DialogHeader className="p-6 pb-3 border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Edit {isExpert ? 'Expert' : 'Seeker'} Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {isExpert
                  ? 'Admin master edit: modify profile, expertise, and portfolio sections on behalf of this service expert.'
                  : 'Admin master edit: modify any user attribute, compliance status, or profile field.'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-8">
              {loadingDetails && (
                <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading full details...
                </span>
              )}
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded">
                {isExpert ? 'EXPERT' : 'SEEKER'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsMaximized(!isMaximized)}
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 ml-1"
                title={isMaximized ? "Restore size" : "Maximize view"}
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isExpert ? (
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {targetUserId ? (
              <ServiceExpert
                variant="dashboard"
                adminMode={true}
                targetExpertId={targetUserId}
                targetExpertProfile={userData}
                onAdminSaveSuccess={onSuccess}
                onAdminClose={() => onOpenChange(false)}
                key={targetUserId}
              />
            ) : (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 pt-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full ${isExpert ? 'grid-cols-3' : 'grid-cols-2'} mb-4`}>
              {isExpert ? (
                <>
                  <TabsTrigger value="profile" className="text-xs flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> 1. Profile
                  </TabsTrigger>
                  <TabsTrigger value="expertise" className="text-xs flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" /> 2. Expertise
                  </TabsTrigger>
                  <TabsTrigger value="credibility" className="text-xs flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> 3. Credibility & Compliance
                  </TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="account" className="text-xs flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Account
                  </TabsTrigger>
                  <TabsTrigger value="company" className="text-xs flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> Company & Profile
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* EXPERT TAB 1: PROFILE (Account + Professional Overview) */}
            {isExpert && (
              <TabsContent value="profile" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account & Contact</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-xs font-semibold">
                        Full Name / Contact Person
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. john@example.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mobile" className="text-xs font-semibold">
                        Mobile / Phone Number
                      </Label>
                      <Input
                        id="mobile"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="role" className="text-xs font-semibold">
                        User Role
                      </Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="seeker">Seeker</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Account Active Status</p>
                      <p className="text-[11px] text-muted-foreground">
                        Allows or blocks user login and platform interactions.
                      </p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>

                  <hr className="my-3 border-slate-200" />
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Professional Profile</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="displayName" className="text-xs font-semibold">
                        Public Display Name
                      </Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Alex Marketing Pro"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="businessName" className="text-xs font-semibold">
                        Business / Agency Name
                      </Label>
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Growth Hackers LLP"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="legalName" className="text-xs font-semibold">
                        Legal Name (on PAN)
                      </Label>
                      <Input
                        id="legalName"
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="e.g. Johnathan Doe"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="entityType" className="text-xs font-semibold">
                        Entity Type
                      </Label>
                      <Select value={entityType} onValueChange={setEntityType}>
                        <SelectTrigger id="entityType">
                          <SelectValue placeholder="Select entity type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual Freelancer</SelectItem>
                          <SelectItem value="proprietorship">Sole Proprietorship</SelectItem>
                          <SelectItem value="partnership">Partnership Firm</SelectItem>
                          <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                          <SelectItem value="private_limited">Private Limited (Pvt Ltd)</SelectItem>
                          <SelectItem value="opc">One Person Company (OPC)</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="headline" className="text-xs font-semibold">
                        Professional Headline / Title
                      </Label>
                      <Input
                        id="headline"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g. Senior HubSpot & Salesforce Architect | 10+ Yrs Exp"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="bio" className="text-xs font-semibold">
                        Professional Bio / About
                      </Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Detailed expert bio, qualifications, and domain background..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="hourlyRate" className="text-xs font-semibold">
                        Hourly Rate (INR ₹)
                      </Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="e.g. 2500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="experience" className="text-xs font-semibold">
                        Years of Experience
                      </Label>
                      <Input
                        id="experience"
                        type="number"
                        value={yearsOfExperience}
                        onChange={(e) => setYearsOfExperience(e.target.value)}
                        placeholder="e.g. 8"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-semibold">
                        City
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Mumbai, Bengaluru"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="country" className="text-xs font-semibold">
                        Country
                      </Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. India"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* SEEKER TAB 1: USER ACCOUNT */}
            {!isExpert && (
              <TabsContent value="account" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold">
                      Full Name / Contact Person
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mobile" className="text-xs font-semibold">
                      Mobile / Phone Number
                    </Label>
                    <Input
                      id="mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-xs font-semibold">
                      User Role
                    </Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expert">Expert</SelectItem>
                        <SelectItem value="seeker">Seeker</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg border bg-slate-50/50 mt-4">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Account Active Status</p>
                    <p className="text-[11px] text-muted-foreground">
                      Allows or blocks user login and platform interactions.
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </TabsContent>
            )}

            {/* EXPERT TAB 2: EXPERTISE & SKILLS */}
            {isExpert && (
              <TabsContent value="expertise" className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="industrySector" className="text-xs font-semibold">
                      Primary Industry Sector
                    </Label>
                    <Select value={industrySector} onValueChange={setIndustrySector}>
                      <SelectTrigger id="industrySector">
                        <SelectValue placeholder="Select primary industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_SECTORS.map((sec) => (
                          <SelectItem key={sec} value={sec}>
                            {sec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="primarySkills" className="text-xs font-semibold">
                      Primary Skills (comma-separated)
                    </Label>
                    <Input
                      id="primarySkills"
                      value={primarySkills}
                      onChange={(e) => setPrimarySkills(e.target.value)}
                      placeholder="e.g. Marketing Automation, CRM Migration, Lead Scoring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="secondarySkills" className="text-xs font-semibold">
                      Secondary Skills (comma-separated)
                    </Label>
                    <Input
                      id="secondarySkills"
                      value={secondarySkills}
                      onChange={(e) => setSecondarySkills(e.target.value)}
                      placeholder="e.g. SEO, Content Marketing, Analytics"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tools" className="text-xs font-semibold">
                      Tools & Platforms (comma-separated)
                    </Label>
                    <Input
                      id="tools"
                      value={tools}
                      onChange={(e) => setTools(e.target.value)}
                      placeholder="e.g. HubSpot, Marketo, Salesforce, Segment, Zapier"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="servicesOffered" className="text-xs font-semibold">
                      Services Offered (comma-separated)
                    </Label>
                    <Textarea
                      id="servicesOffered"
                      rows={3}
                      value={servicesOffered}
                      onChange={(e) => setServicesOffered(e.target.value)}
                      placeholder="e.g. MarTech Stack Audit, End-to-end Onboarding, Zapier Webhooks Integration"
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            {/* EXPERT TAB 3: CREDIBILITY & COMPLIANCE (Compliance + Bank Details) */}
            {isExpert && (
              <TabsContent value="credibility" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Compliance & Identity</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="panNumber" className="text-xs font-semibold">
                        PAN Number
                      </Label>
                      <Input
                        id="panNumber"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="gstin" className="text-xs font-semibold">
                        GSTIN (Optional)
                      </Label>
                      <Input
                        id="gstin"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        placeholder="27ABCDE1234F1Z5"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="profileStatus" className="text-xs font-semibold">
                        Marketplace Profile Status
                      </Label>
                      <Select value={profileStatus} onValueChange={setProfileStatus}>
                        <SelectTrigger id="profileStatus">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verified">Verified (Live on Marketplace)</SelectItem>
                          <SelectItem value="under_review">Under Review (Pending Approval)</SelectItem>
                          <SelectItem value="suspended">Suspended (Restricted Access)</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-lg border bg-emerald-50/50 border-emerald-200">
                    <div>
                      <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        KYC Verified Badge
                      </p>
                      <p className="text-[11px] text-emerald-700/80">
                        Marks identity & PAN verification as officially cleared by Admin.
                      </p>
                    </div>
                    <Switch checked={isKycVerified} onCheckedChange={setIsKycVerified} />
                  </div>

                  <hr className="my-3 border-slate-200" />
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-amber-700" /> Bank Details
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    Bank details are automatically encrypted with AES-256 upon saving.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="accountHolderName" className="text-xs font-semibold">
                        Account Holder Name
                      </Label>
                      <Input
                        id="accountHolderName"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="Exact name as in bank record"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bankName" className="text-xs font-semibold">
                        Bank Name
                      </Label>
                      <Input
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank, ICICI Bank"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="accountNumber" className="text-xs font-semibold">
                        Account Number
                      </Label>
                      <Input
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 5010023456789"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ifscCode" className="text-xs font-semibold">
                        IFSC Code
                      </Label>
                      <Input
                        id="ifscCode"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0001234"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* SEEKER TAB: COMPANY INFO */}
            {!isExpert && (
              <TabsContent value="company" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="text-xs font-semibold">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp India"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="designation" className="text-xs font-semibold">
                      Designation / Role
                    </Label>
                    <Input
                      id="designation"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. VP of Marketing"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="industry" className="text-xs font-semibold">
                      Industry
                    </Label>
                    <Input
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. E-Commerce, SaaS, Healthcare"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="companySize" className="text-xs font-semibold">
                      Company Size
                    </Label>
                    <Select value={companySize} onValueChange={setCompanySize}>
                      <SelectTrigger id="companySize">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 Employees</SelectItem>
                        <SelectItem value="11-50">11-50 Employees</SelectItem>
                        <SelectItem value="51-200">51-200 Employees</SelectItem>
                        <SelectItem value="201-500">201-500 Employees</SelectItem>
                        <SelectItem value="500+">500+ Employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="website" className="text-xs font-semibold">
                      Company Website
                    </Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="seekerBio" className="text-xs font-semibold">
                      Company / Seeker Bio
                    </Label>
                    <Textarea
                      id="seekerBio"
                      rows={3}
                      value={seekerBio}
                      onChange={(e) => setSeekerBio(e.target.value)}
                      placeholder="Brief overview of the business requirements..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center justify-between p-3.5 rounded-lg border bg-slate-50/50">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Identity Verified</p>
                      <p className="text-[11px] text-muted-foreground">Corporate identity status.</p>
                    </div>
                    <Switch checked={identityVerified} onCheckedChange={setIdentityVerified} />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-lg border bg-slate-50/50">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Authorization Verified</p>
                      <p className="text-[11px] text-muted-foreground">Signatory authorization status.</p>
                    </div>
                    <Switch checked={authorizationVerified} onCheckedChange={setAuthorizationVerified} />
                  </div>
                </div>
              </TabsContent>
            )}

            {/* AUDIT NOTE */}
            <div className="mt-5 pt-4 border-t space-y-1.5">
              <Label htmlFor="adminReason" className="text-xs font-semibold text-slate-700">
                Reason for Edit (for Audit Log)
              </Label>
              <Input
                id="adminReason"
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                placeholder="e.g. Corrected spelling in legal name upon user request"
                className="text-xs"
              />
            </div>
          </Tabs>
        </div>

        <DialogFooter className="p-4 border-t bg-slate-50 flex items-center justify-between sm:justify-between">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile Changes
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
