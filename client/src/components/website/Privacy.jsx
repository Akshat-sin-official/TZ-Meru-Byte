import React, { useState, useMemo } from 'react';
import SEO from './SEO';
import SchemaMarkup from './SchemaMarkup';
import WebsiteLayout from './WebsiteLayout';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Search,
  Server,
  UserCheck,
  Globe,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function Privacy() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('section-1');

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Privacy Policy', path: '/privacy' },
  ];

  const sections = [
    {
      id: 'section-1',
      number: '01',
      title: 'Introduction & Scope',
      icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            MarTechAdda (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates{' '}
            <a href="https://martechadda.com" className="text-blue-600 font-semibold hover:underline">
              martechadda.com
            </a>{' '}
            and the platform workspace at{' '}
            <a href="https://app.martechadda.com" className="text-blue-600 font-semibold hover:underline">
              app.martechadda.com
            </a>. We are committed to safeguarding your privacy and protecting the confidentiality of personal data shared by Businesses (&quot;Seekers&quot;) and Marketing Specialists (&quot;Experts&quot;).
          </p>
          <div className="rounded-2xl bg-blue-50/80 border border-blue-200/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-600" /> DPDP Act 2023 &amp; GDPR Compliance Notice
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              This Privacy Policy strictly aligns with the Digital Personal Data Protection (DPDP) Act 2023 (India) and Global Data Protection Regulation (GDPR) standards.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'section-2',
      number: '02',
      title: 'Information We Collect',
      icon: <Eye className="w-5 h-5 text-indigo-600" />,
      content: (
        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" /> 2.1 Account &amp; Identity Data
            </h3>
            <p className="mb-3">
              We collect information provided directly by you during account creation and expert onboarding:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Full Name, Work Email & Password',
                'Business Entity Type (Proprietorship, LLP, Pvt Ltd)',
                'Permanent Account Number (PAN) & GST Proof',
                'Bank Account Number, IFSC Code & Cancelled Cheque',
                'WhatsApp Number & Preferred Communication Channel',
                'Portfolio Work Samples, Certificates & Deliverables',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" /> 2.2 Technical &amp; Operational Analytics
            </h3>
            <p className="mb-2 text-xs text-slate-600">
              When you navigate MarTechAdda, our telemetry servers automatically capture technical metadata:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-2">
              <li>IP address, browser type, operating system, and geolocation (City/State level)</li>
              <li>Session timestamps, page view events, interaction analytics, and clickstream data</li>
              <li>Encrypted video discussion metadata (session duration and participant IDs via Daily.co)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'section-3',
      number: '03',
      title: 'How We Use Your Data',
      icon: <Lock className="w-5 h-5 text-emerald-600" />,
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Your information is processed strictly to provide high-quality matching, milestone administration, and compliance verification:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">Deterministic Matching</h4>
              <p className="text-xs text-slate-600">
                To evaluate capabilities against seeker project requirements using transparent, non-sponsored skill filters.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">Escrow &amp; Payout Release</h4>
              <p className="text-xs text-slate-600">
                To process milestone deposits via Cashfree escrow and disburse expert payouts upon seeker approval.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">Identity &amp; Tax Verification</h4>
              <p className="text-xs text-slate-600">
                To verify PAN/GST details, generate immutable Expert IDs (e.g. MTA-EXP-XXXXXX), and meet statutory compliance.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">Service Communication</h4>
              <p className="text-xs text-slate-600">
                To dispatch transactional emails (ZeptoMail), SMS OTPs, and real-time dashboard notifications.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'section-4',
      number: '04',
      title: 'Data Sharing & Third Parties',
      icon: <Globe className="w-5 h-5 text-purple-600" />,
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            We <strong>never sell, rent, or trade</strong> your personal data. Data is shared exclusively with vetted operational infrastructure partners:
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 font-bold text-slate-900 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Partner Service</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Data Shared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Cashfree Payments</td>
                  <td className="p-3">Milestone Escrow &amp; Payouts</td>
                  <td className="p-3">Bank details, IFSC, PAN number</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">ZeptoMail (Zoho)</td>
                  <td className="p-3">Transactional Email &amp; OTPs</td>
                  <td className="p-3">Work Email, Full Name</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Daily.co</td>
                  <td className="p-3">HD Video Requirement Discussions</td>
                  <td className="p-3">Session token, User display name</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">MongoDB Atlas / AWS</td>
                  <td className="p-3">Encrypted Cloud Storage</td>
                  <td className="p-3">Encrypted application databases</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: 'section-5',
      number: '05',
      title: 'Data Security & Storage',
      icon: <Lock className="w-5 h-5 text-amber-600" />,
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            We enforce defense-in-depth security measures to protect your documents and identity credentials:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-2 pl-2">
            <li><strong>256-Bit SSL/TLS Encryption:</strong> All data in transit is encrypted using HTTPS / TLS 1.3 protocol.</li>
            <li><strong>Encryption at Rest:</strong> Sensitive banking details and PAN proofs are stored with AES-256 encryption.</li>
            <li><strong>Strict Role Access Control:</strong> Only authorized governance team members access compliance files during verification.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'section-6',
      number: '06',
      title: 'Your Rights & Contact Us',
      icon: <Building className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
          <p>
            Under DPDP Act 2023 and GDPR, you possess the right to access, rectify, or request deletion of your personal profile data.
          </p>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-base font-poppins flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" /> Official Grievance Officer Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="space-y-1.5">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Email:</strong> support@martechadda.com</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Phone:</strong> +91-81048-60682</span>
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Address:</strong> A-1702, 17th FLR, Parinee Crescenzo, Bandra Kurla Complex (BKC), Mumbai – 400051, India</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(
      (s) => s.title.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(id);
    }
  };

  return (
    <WebsiteLayout>
      <div className="min-h-screen bg-slate-50/50 text-[#0A0D14] font-sans pb-24">
        <SEO
          title="Privacy Policy - MarTechAdda"
          description="Learn how MarTechAdda collects, uses, and safeguards your personal data under DPDP Act 2023 and GDPR guidelines."
          canonical="https://martechadda.com/privacy"
        />
        <SchemaMarkup type="WebPage" breadcrumbs={breadcrumbs} />

        {/* HERO SECTION */}
        <section className="relative pt-24 pb-16 text-center overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-blue-50/80 via-indigo-50/30 to-background">
          <div className="max-w-[840px] mx-auto px-5 relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-xs font-bold text-blue-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> DPDP Act 2023 &amp; GDPR Compliant
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-poppins text-slate-900 tracking-tight leading-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-xl mx-auto">
              Transparency, data minimization, and statutory compliance. Effective Date: <strong>May 1, 2026</strong>
            </p>

            {/* Search Input */}
            <div className="pt-4 max-w-md mx-auto relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search privacy topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-white text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </section>

        {/* MAIN BODY LAYOUT */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* STICKY SIDEBAR TOC */}
            <div className="hidden lg:block lg:col-span-4 sticky top-28 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Table of Contents</span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </h3>
                <nav className="space-y-1">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                        activeSection === s.id
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] opacity-60">{s.number}</span>
                        <span className="truncate">{s.title}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* CONTENT SECTIONS */}
            <div className="lg:col-span-8 space-y-6">
              {filteredSections.map((s) => (
                <div
                  key={s.id}
                  id={s.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold font-mono text-slate-400 uppercase tracking-wider block">
                        Section {s.number}
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold font-poppins text-slate-900">{s.title}</h2>
                    </div>
                  </div>
                  {s.content}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
