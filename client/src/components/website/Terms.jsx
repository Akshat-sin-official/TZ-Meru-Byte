import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from './SEO';
import SchemaMarkup from './SchemaMarkup';
import WebsiteLayout from './WebsiteLayout';
import {
  Scale,
  FileText,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Search,
  ShieldCheck,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Briefcase,
  Award,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function Terms() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('type') === 'provider' || searchParams.get('role') === 'expert' ? 'provider' : 'receiver';
  const [activeRole, setActiveRole] = useState(initialRole);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('section-1');

  useEffect(() => {
    const roleParam = searchParams.get('type') || searchParams.get('role');
    if (roleParam === 'provider' || roleParam === 'expert') {
      setActiveRole('provider');
    } else if (roleParam === 'receiver' || roleParam === 'seeker' || roleParam === 'business') {
      setActiveRole('receiver');
    }
  }, [searchParams]);

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setActiveSection('section-1');
    setSearchParams({ role });
  };

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Terms of Service', path: '/terms' },
  ];

  // RECEIVER (BUSINESS) TERMS — PDF Pages 5-6
  const receiverSections = [
    {
      id: 'receiver-1',
      number: '01',
      title: 'Agreement',
      icon: <Scale className="w-5 h-5 text-blue-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>18+ and legally capable of entering commercial agreements.</li>
          <li>Creating an account or using MarTechAdda means you accept these Terms.</li>
        </ul>
      ),
    },
    {
      id: 'receiver-2',
      number: '02',
      title: "MarTechAdda's Role",
      icon: <Award className="w-5 h-5 text-indigo-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>On-demand, requirement-first marketplace for marketing services.</li>
          <li>Start with what you need, not who to hire.</li>
          <li>Discover relevant consultants, specialists, agencies and firms.</li>
          <li>MarTechAdda is a marketplace, not a marketing agency or employer.</li>
          <li>No sponsored listings or paid ranking.</li>
        </ul>
      ),
    },
    {
      id: 'receiver-3',
      number: '03',
      title: 'Find & Hire',
      icon: <Search className="w-5 h-5 text-emerald-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>Define your marketing requirement.</li>
          <li>Discover relevant marketing expertise.</li>
          <li>Compare, connect and discuss your requirement.</li>
          <li>Receive and evaluate quotations.</li>
          <li>You decide whether to proceed with a Service Provider.</li>
        </ul>
      ),
    },
    {
      id: 'receiver-4',
      number: '04',
      title: 'Milestones & Payments',
      icon: <CreditCard className="w-5 h-5 text-amber-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>Accept a quotation and deposit the applicable milestone amount.</li>
          <li>Funds remain held until the milestone is completed and approved.</li>
          <li>No platform fee is currently charged to Service Receivers.</li>
          <li>Future Service Receiver fees will be communicated in advance.</li>
          <li>Refunds & cancellations are governed by our Refund Policy.</li>
        </ul>
      ),
    },
    {
      id: 'receiver-5',
      number: '05',
      title: 'Delivery & Ownership',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>Service Provider delivers the agreed scope and milestones.</li>
          <li>You review and approve completed milestones.</li>
          <li>Custom deliverables belong to you upon payment, unless otherwise agreed in writing.</li>
        </ul>
      ),
    },
    {
      id: 'receiver-6',
      number: '06',
      title: 'Confidentiality & Legal',
      icon: <Lock className="w-5 h-5 text-rose-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>Keep confidential business and project information private.</li>
          <li>Your service engagement is directly with the Service Provider.</li>
          <li>MarTechAdda facilitates discovery, requirement alignment and platform processes.</li>
          <li>Terms governed by Indian law; applicable jurisdiction: Mumbai, Maharashtra.</li>
        </ul>
      ),
    },
  ];

  // PROVIDER (EXPERT) TERMS — PDF Pages 8-9
  const providerSections = [
    {
      id: 'provider-1',
      number: '01',
      title: 'Agreement',
      icon: <Scale className="w-5 h-5 text-blue-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>18+ and legally capable of entering commercial agreements.</li>
          <li>Registering or using MarTechAdda means you accept these Terms.</li>
        </ul>
      ),
    },
    {
      id: 'provider-2',
      number: '02',
      title: "MarTechAdda's Role",
      icon: <Award className="w-5 h-5 text-indigo-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>On-demand, requirement-first marketplace for marketing services.</li>
          <li>Businesses start with what they need; relevant expertise is discovered and connected.</li>
          <li>MarTechAdda is a marketplace, not a marketing agency or employer.</li>
          <li>No sponsored listings or paid ranking.</li>
        </ul>
      ),
    },
    {
      id: 'provider-3',
      number: '03',
      title: 'Provider Onboarding',
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>Complete the required profile, expertise and compliance information.</li>
          <li>Only verified and approved profiles can become discoverable and participate in engagements.</li>
          <li>Required business, identity and bank details must be completed before eligible payouts.</li>
          <li>An approved provider receives a unique Expert ID.</li>
        </ul>
      ),
    },
    {
      id: 'provider-4',
      number: '04',
      title: 'Matching, Engagement & Quotations',
      icon: <Briefcase className="w-5 h-5 text-amber-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>Your profile may be discovered when your expertise fits a business requirement.</li>
          <li>You decide whether to pursue an opportunity.</li>
          <li>You set your scope, quotation and professional fees.</li>
          <li>Engagement terms and deliverables are agreed with the Service Receiver before work begins.</li>
        </ul>
      ),
    },
    {
      id: 'provider-5',
      number: '05',
      title: 'Milestones & Platform Fee',
      icon: <CreditCard className="w-5 h-5 text-purple-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>Service Receiver funds the applicable milestone before the engagement proceeds.</li>
          <li>Deliver the agreed milestone and submit it for Service Receiver approval.</li>
          <li><strong>10% platform fee</strong> applies to successfully delivered and approved milestone payments.</li>
          <li>Net payout = approved milestone amount − 10% platform fee.</li>
          <li>Platform fees may change from time to time and will be communicated in advance.</li>
          <li>No platform fee for initial discussions or introductory calls.</li>
          <li>Eligible payouts are released after the applicable milestone approval and settlement process.</li>
        </ul>
      ),
    },
    {
      id: 'provider-6',
      number: '06',
      title: 'Cancellation, Delivery & Disputes',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>Complete work within the agreed scope and timeline.</li>
          <li>If you need to cancel or cannot deliver, notify the Service Receiver and MarTechAdda promptly.</li>
          <li>Provider-initiated cancellation may result in a 10% cancellation/platform charge under the applicable Refund & Cancellation Policy.</li>
          <li>Delays, non-delivery or material disputes may result in payout being held pending review.</li>
          <li>Repeated or unjustified cancellations/non-delivery may result in account review, restriction, suspension or removal.</li>
        </ul>
      ),
    },
    {
      id: 'provider-7',
      number: '07',
      title: 'Deliverables & Confidentiality',
      icon: <ShieldCheck className="w-5 h-5 text-teal-600" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>Custom deliverables are transferred to the Service Receiver upon applicable milestone payment, unless otherwise agreed in writing.</li>
          <li>Protect all confidential business, campaign, customer and project information.</li>
          <li>You remain responsible for ensuring that your work does not knowingly infringe third-party rights.</li>
        </ul>
      ),
    },
    {
      id: 'provider-8',
      number: '08',
      title: 'Legal & Contact',
      icon: <Lock className="w-5 h-5 text-blue-700" />,
      content: (
        <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed space-y-2 pl-1">
          <li>These Terms are governed by the laws of India.</li>
          <li>Applicable disputes are subject to the courts of Mumbai, Maharashtra.</li>
        </ul>
      ),
    },
  ];

  const currentSections = activeRole === 'receiver' ? receiverSections : providerSections;

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return currentSections;
    const query = searchQuery.toLowerCase();
    return currentSections.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.number.includes(query)
    );
  }, [currentSections, searchQuery]);

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
          title={`Terms of Service (${activeRole === 'receiver' ? 'For Service Receivers' : 'For Service Providers'}) - MarTechAdda`}
          description="Read MarTechAdda's Terms of Service for non-sponsored matching, milestone delivery, and escrow protection."
          canonical="https://martechadda.com/terms"
        />
        <SchemaMarkup type="WebPage" breadcrumbs={breadcrumbs} />

        {/* HERO SECTION */}
        <section className="relative pt-24 pb-14 text-center overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-blue-50/80 via-indigo-50/30 to-background">
          <div className="max-w-[840px] mx-auto px-5 relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-xs font-bold text-blue-700">
              <Scale className="w-4 h-4 text-blue-600" /> Commercial Marketplace Governance
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-poppins text-slate-900 tracking-tight leading-tight">
              Terms of Service
            </h1>
            <p className="text-sm font-semibold text-slate-600 max-w-xl mx-auto">
              Effective: <strong>May 1, 2026</strong>
            </p>

            {/* TAB SELECTOR: RECEIVER vs PROVIDER */}
            <div className="pt-4 flex justify-center">
              <div className="inline-flex p-1.5 rounded-full bg-white border border-slate-200 shadow-xs gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRoleChange('receiver')}
                  className={`px-5 py-2 rounded-full text-xs font-bold font-poppins transition-all cursor-pointer ${
                    activeRole === 'receiver'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  For Service Receivers (Businesses)
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('provider')}
                  className={`px-5 py-2 rounded-full text-xs font-bold font-poppins transition-all cursor-pointer ${
                    activeRole === 'provider'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  For Service Providers (Experts)
                </button>
              </div>
            </div>

            {/* Sub-header description */}
            <p className="text-xs text-slate-500 max-w-md mx-auto pt-1 font-medium">
              {activeRole === 'receiver'
                ? 'Governing terms for businesses discovering, hiring, and managing marketing experts on MarTechAdda.'
                : 'Commercial terms for marketplace participation, milestone delivery, and payouts.'}
            </p>

            {/* Search Input */}
            <div className="pt-2 max-w-md mx-auto relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search clauses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-white text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </section>

        {/* MAIN BODY LAYOUT */}
        <div className="max-w-[1100px] mx-auto px-5 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* STICKY SIDEBAR TOC */}
            <div className="hidden lg:block lg:col-span-4 sticky top-28 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Table of Contents</span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </h3>
                <nav className="space-y-1">
                  {currentSections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        activeSection === s.id
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100/80'
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

              {/* Secretariat Sidebar Mini Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" /> Legal Secretariat
                </div>
                <p>support@martechadda.com</p>
                <p>Desk: +91-9702050682</p>
              </div>
            </div>

            {/* CONTENT SECTIONS */}
            <div className="lg:col-span-8 space-y-6">
              {filteredSections.map((s) => (
                <div
                  key={s.id}
                  id={s.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold font-mono text-slate-400 uppercase tracking-wider block">
                        Section {s.number}
                      </span>
                      <h2 className="text-lg font-bold font-poppins text-slate-900">{s.number} — {s.title}</h2>
                    </div>
                  </div>
                  {s.content}
                </div>
              ))}

              {/* MarTechAdda Legal Secretariat Card (PDF Pages 6 & 9) */}
              <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-6 sm:p-8 space-y-4 shadow-xs">
                <h3 className="text-base font-extrabold font-poppins text-slate-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" /> MarTechAdda Legal Secretariat
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block">Legal Support</span>
                    <a href="mailto:support@martechadda.com" className="text-blue-600 hover:underline">
                      support@martechadda.com
                    </a>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block">Desk</span>
                    <a href="tel:+919702050682" className="text-blue-600 hover:underline">
                      +91-9702050682
                    </a>
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-200/60 text-xs text-slate-600">
                  <span className="font-bold text-slate-900 block mb-0.5">Registered Office</span>
                  <p>A-1702, 17th FLR, Parinee Crescenzo, BKC, Mumbai – 400051, India</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
