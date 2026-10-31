import React from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiMessageCircle, FiFileText, FiCheckCircle, FiArrowRight } from 'react-icons/fi'
import SEO from './SEO'
import SchemaMarkup from './SchemaMarkup'
import { HandshakeIcon, BriefcaseIcon, LockIcon } from './Icons'

const HowMarTechAddaWorks = () => {
  const steps = [
    {
      num: 1,
      title: "Discover & Filter",
      desc: "Find verified marketing experts using specialized domain filters — capability, focus area, and operational model.",
      icon: FiSearch,
      color: "bg-blue-50 text-blue-600 border-blue-200"
    },
    {
      num: 2,
      title: "Direct Discussion",
      desc: "Connect directly to discuss requirements, evaluate past portfolio execution, and align on expectations before any commitment.",
      icon: FiMessageCircle,
      color: "bg-orange-50 text-orange-600 border-orange-200"
    },
    {
      num: 3,
      title: "Scope & Proposal",
      desc: "Receive clear, itemized milestone proposals with explicit deliverables and timelines.",
      icon: FiFileText,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200"
    },
    {
      num: 4,
      title: "Milestone Hire",
      desc: "Engage with deposit protection. Payments are released only when milestones are approved.",
      icon: HandshakeIcon,
      color: "bg-purple-50 text-purple-600 border-purple-200"
    }
  ]

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'How It Works', path: '/how-it-works' }
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0D14] font-sans pb-20">
      <SEO
        title="How It Works - MarTechAdda Workflow & Hiring Process"
        description="Learn how MarTechAdda simplifies marketing hiring through structured search, direct connection, scope alignment, and deposit-protected engagements."
        canonical="https://martechadda.com/how-it-works"
      />
      <SchemaMarkup type="WebPage" breadcrumbs={breadcrumbs} />

      {/* HERO SECTION */}
      <section className="pt-20 pb-16 text-center bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.06),_transparent_70%)] border-b border-slate-200">
        <div className="max-w-[900px] mx-auto px-5">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 font-poppins mb-4">
            HOW MARTECHADDA WORKS
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-poppins text-slate-900 leading-tight mb-4">
            Clarity Before <span className="text-blue-600">Commitment</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-[700px] mx-auto mb-6">
            A structured, requirement-first approach to discovering, evaluating, and hiring validated marketing specialists.
          </p>

          <div className="inline-block bg-blue-50/80 border border-blue-200 rounded-2xl px-6 py-3 text-sm">
            <span className="font-bold text-blue-600 uppercase tracking-wider text-xs block mb-0.5">Service Availability</span>
            <span className="font-semibold text-slate-800">Currently serving across the Mumbai Metropolitan Region (MMR) & Global Remote Remote Experts.</span>
          </div>
        </div>
      </section>

      {/* 4-STEP WORKFLOW GRID */}
      <section className="py-16">
        <div className="max-w-[1240px] mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-poppins text-slate-900 mb-3">
              The 4-Step Hiring Process
            </h2>
            <p className="text-slate-500 max-w-[600px] mx-auto text-base">
              Designed to eliminate guesswork, endless sales pitches, and bad hiring decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => {
              const IconComp = step.icon
              return (
                <div
                  key={step.num}
                  className="bg-white border border-slate-200 rounded-2xl p-8 relative hover:shadow-xl hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center font-poppins">
                    {step.num}
                  </div>

                  <div>
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 ${step.color}`}>
                      <IconComp className="w-7 h-7" />
                    </div>

                    <h3 className="text-xl font-extrabold font-poppins text-slate-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* TWO PATHS SECTION */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-[1240px] mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-poppins text-slate-900 text-center mb-12">
            Two Paths. One Shared Goal: Perfect Alignment.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* For Businesses */}
            <div className="bg-[#FAF9F6] border border-slate-200 rounded-3xl p-8 sm:p-10">
              <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <BriefcaseIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold font-poppins text-slate-900">For Businesses</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hiring Marketing Talent</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm font-medium">Search verified experts by domain skill, industry experience, and operational model.</p>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm font-medium">Review detailed execution portfolios, validated capabilities, and transparent profiles.</p>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm font-medium">Schedule direct intro discussions and receive structured milestone quotes.</p>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm font-medium">Fund milestone deposits safely with platform dispute resolution and release guarantees.</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <Link
                  to="/experts"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
                >
                  Explore Experts <FiArrowRight />
                </Link>
              </div>
            </div>

            {/* For Experts */}
            <div className="bg-[#FAF9F6] border border-slate-200 rounded-3xl p-8 sm:p-10">
              <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-5">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <LockIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold font-poppins text-slate-900">For Experts</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Showcasing Capability</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm font-medium">Build a verified profile showcasing real domain cases, client results, and capability taxonomy.</p>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm font-medium">Get matched purely on merit and skill relevance without pay-to-win ad bidding.</p>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm font-medium">Create itemized proposals with clear milestone deliverables and payment terms.</p>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm font-medium">Work with guaranteed milestone deposits and timely payouts upon deliverable approval.</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <a
                  href="/register-expert"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md"
                >
                  Apply as an Expert <FiArrowRight />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HowMarTechAddaWorks
