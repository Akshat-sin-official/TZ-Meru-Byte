import WebsiteLayout from '@/components/website/WebsiteLayout';
import SEO from '@/components/website/SEO';
import { Scale, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExpertConsentPage() {
  return (
    <WebsiteLayout>
      <SEO
        title="Expert Consent & Agreements — MarTechAdda"
        description="Official Platform Terms, Fee Obligations, Escrow Protection, and Professional Conduct Agreement for Experts."
      />
      <div className="bg-slate-50/50 min-h-screen pb-20">
        {/* Header Section */}
        <section className="relative border-b border-slate-200/80 bg-white py-12">
          <div className="max-w-[1100px] mx-auto px-5">
            <Link to="/register-expert" className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Registration
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-4">
              <Scale className="w-3.5 h-3.5" />
              <span>Commercial & Compliance Standard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-poppins text-slate-900 tracking-tight mb-3">
              Expert Consent & Platform Agreements
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Transparent platform standards governing 10% milestone fees, escrow protection, intellectual property, and client confidentiality. Effective Date: <strong>May 1, 2026</strong>
            </p>
          </div>
        </section>

        {/* Content Body */}
        <div className="max-w-[1100px] mx-auto px-5 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Section 1: Platform Fee */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                    01
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">10% Platform Commission Policy</h2>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  MarTechAdda operates on a performance-aligned model. A flat <strong>10% platform fee</strong> is applicable only when a project payment milestone is approved and released to the expert by the business client.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-emerald-900 font-medium">No fees for initial discovery discussions</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-emerald-900 font-medium">No fee charged on unreleased deposits</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Independent Contractor & Direct Client Dealings */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    02
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Non-Bypassing & Platform Integrity Commitment</h2>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  All contracts, work milestones, proposals, and payments originating from client connections initiated through MarTechAdda must be processed through the platform. Bypassing the platform for off-platform financial settlement with clients introduced via MarTechAdda violates our Terms of Service.
                </p>
              </div>

              {/* Section 3: Confidentiality & Work Product Quality */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                    03
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Confidentiality & Intellectual Property Ownership</h2>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Experts agree to maintain strict confidentiality of all business assets, client data, and proprietary materials shared during engagements. Upon complete release of agreed milestone payments, ownership of work products transfers to the client as stipulated in the engagement contract.
                </p>
              </div>

              {/* Section 4: Verification & Identity Standard */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                    04
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Profile Accuracy & Verification Lifecycle</h2>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Experts warrant that all identity details, business registrations (GST/PAN/CIN), capabilities, and experience history submitted in their application are genuine and accurate. Applications undergo administrative verification before workspace activation and Expert ID generation.
                </p>
              </div>
            </div>

            {/* Sidebar Summary Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sticky top-24 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Summary Checklist</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>10% fee charged only on released funds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Protected milestone escrow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Admin verification before activation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Full IP transfer upon final payment</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
