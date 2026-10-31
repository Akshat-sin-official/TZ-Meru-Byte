import React from 'react'
import { Link } from 'react-router-dom'
import {
  FiAward,
  FiTarget,
  FiSearch,
  FiArrowRight,
  FiEye,
  FiMessageCircle,
  FiShield
} from 'react-icons/fi'
import { FaHourglassHalf, FaHandshake } from 'react-icons/fa'
import { TargetIcon } from './Icons'
import SEO from './SEO'
import SchemaMarkup from './SchemaMarkup'

const About = () => {
  const principles = [
    {
      title: 'Merit Over Promotion',
      description: 'Visibility is driven by capability, domain experience, and execution quality — not advertising budgets.',
      icon: FiAward,
      color: 'orange'
    },
    {
      title: 'Fit Over Volume',
      description: 'We prioritize relevant matches over unlimited options. More choices don\'t mean better outcomes.',
      icon: FiTarget,
      color: 'green'
    },
    {
      title: 'Clarity Before Engagement',
      description: 'Expectations, positioning, and scope should be clear before work or money is committed.',
      icon: FiEye,
      color: 'orange'
    },
    {
      title: 'Direct Alignment',
      description: 'We connect decision-makers directly with marketing experts to eliminate middleman friction.',
      icon: FaHandshake,
      color: 'green'
    }
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0D14] font-sans overflow-x-hidden">
      <SEO
        title="About MarTechAdda — Built for Better Marketing Hiring Decisions"
        description="Learn why MarTechAdda exists: a marketing-only platform built to simplify discovery, alignment, and hiring decisions before work begins."
      />
      <SchemaMarkup
        type="Organization"
        organization={{
          name: "MarTechAdda",
          url: "https://martechadda.com",
          description: "MarTechAdda is a specialized marketing-only platform designed to simplify how businesses discover, align with, and hire marketing experts.",
          founder: {
            "@type": "Person",
            name: "Ritesh Mishra"
          }
        }}
      />

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.06),_transparent_70%)] border-b border-slate-200/80 text-center">
        <div className="max-w-[1240px] mx-auto px-5">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-bold tracking-widest uppercase text-blue-600 bg-blue-50 border border-blue-200 font-poppins shadow-sm">
              ABOUT MARTECHADDA
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-poppins text-slate-900 leading-[1.15] tracking-tight max-w-[900px] mx-auto mb-6">
            Built for Better Marketing <span className="text-blue-600">Hiring Decisions</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-[760px] mx-auto font-medium mb-4">
            MarTechAdda is a specialized marketing-only platform designed to simplify how businesses discover, align with, and hire marketing experts — before work or money is committed.
          </p>

          <p className="text-base text-slate-500 font-semibold max-w-[680px] mx-auto">
            We don't replace agencies or freelancers. We remove the noise, confusion, and risk from hiring them.
          </p>
        </div>
      </section>

      {/* WHY WE EXIST */}
      <section className="py-16 lg:py-24 bg-[#FAF9F6]">
        <div className="max-w-[1240px] mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-poppins text-slate-900 tracking-tight mb-3">
              Why We Exist
            </h2>
            <p className="text-xl font-bold text-blue-600 mb-2">
              The hiring process is broken, not the talent.
            </p>
            <p className="text-base text-slate-500">
              Across businesses of all sizes, we kept seeing the same three problems:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center mb-5">
                <FiSearch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-poppins text-slate-900 leading-snug mb-3">
                Marketing expertise is scattered across generic platforms,
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                making relevant discovery difficult and confusing.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-5">
                <FaHourglassHalf className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-poppins text-slate-900 leading-snug mb-3">
                Hiring depends on traditional RFPs and pitches,
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                delaying real conversations and core requirement alignment.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center mb-5">
                <TargetIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-poppins text-slate-900 leading-snug mb-3">
                Clarity on capability, scope, and fit comes too late,
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                forcing high-risk hiring decisions without prior confidence.
              </p>
            </div>
          </div>

          <p className="text-center text-lg sm:text-xl text-slate-800 font-semibold max-w-[700px] mx-auto">
            The result isn't bad marketing talent — <span className="text-blue-600 font-bold">it's bad hiring decisions.</span>
          </p>
        </div>
      </section>

      {/* WHAT WE'RE BUILDING */}
      <section className="py-16 lg:py-24 bg-white border-y border-slate-200">
        <div className="max-w-[1240px] mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-poppins text-slate-900 tracking-tight mb-3">
              What We're Building
            </h2>
            <p className="text-xl font-bold text-blue-600 mb-1">
              We exist to support better hiring decisions.
            </p>
            <p className="text-base text-slate-500 font-medium">
              A marketing-only platform built for clarity before commitment.
            </p>
          </div>

          <div className="mt-8">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-8">
              WE HELP USERS:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#FAF9F6] border border-slate-200/90 rounded-2xl p-8 text-center hover:bg-white hover:border-blue-500 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
                  <FiSearch className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black font-poppins text-slate-900 mb-2">Find</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  marketing experts using domain-specific search and validated capability filters.
                </p>
              </div>

              <div className="bg-[#FAF9F6] border border-slate-200/90 rounded-2xl p-8 text-center hover:bg-white hover:border-blue-500 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center mx-auto mb-5">
                  <FiMessageCircle className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black font-poppins text-slate-900 mb-2">Connect</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  directly to align on scope, expectations, and operational fit.
                </p>
              </div>

              <div className="bg-[#FAF9F6] border border-slate-200/90 rounded-2xl p-8 text-center hover:bg-white hover:border-blue-500 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
                  <FaHandshake className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black font-poppins text-slate-900 mb-2">Hire</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  with milestone-protected scope and complete execution confidence.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-blue-50/60 border border-blue-200/80 rounded-2xl p-6 text-center max-w-[800px] mx-auto">
            <p className="text-base sm:text-lg text-slate-800 font-medium">
              We intentionally focus on the <strong className="text-blue-700 font-bold">decision stage</strong>, where most hiring mistakes are made.
            </p>
          </div>
        </div>
      </section>

      {/* OUR PRINCIPLES */}
      <section className="py-16 lg:py-24 bg-[#FAF9F6]">
        <div className="max-w-[1240px] mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-poppins text-slate-900 tracking-tight">
              Our Principles <span className="text-blue-600">(Why We're Different)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {principles.map((principle, index) => {
              const IconComponent = principle.icon
              const isOrange = principle.color === 'orange'

              return (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                    isOrange 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-extrabold font-poppins text-slate-900 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">✔</span> {principle.title}
                  </h3>
                  <p className="text-slate-600 text-base leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              )
            })}
          </div>

          <p className="text-center text-slate-600 font-semibold mb-2">
            Built for the decision stage of hiring — not execution or lead generation.
          </p>
          <p className="text-center text-blue-600 font-bold text-lg">
            These principles shape every product decision we make.
          </p>
        </div>
      </section>

      {/* OUR ROLE IN THE ECOSYSTEM */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-[1000px] mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-poppins text-slate-900 tracking-tight mb-8 text-center">
            Our Role in the Ecosystem
          </h2>

          <div className="bg-[#FAF9F6] border border-slate-200/90 rounded-2xl p-8 sm:p-10 space-y-4">
            <p className="text-lg font-semibold text-slate-800">
              • We don't execute marketing. We enable confident hiring.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              • We step in at the decision stage — before money changes hands — where most hiring mistakes are made.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              • MarTechAdda is not an agency. We are not a lead-selling marketplace.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              • We exist between confusion and commitment, helping both sides align before work begins.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              • MarTechAdda is not designed for rushed hiring, pay-to-win visibility, or lead resale.
            </p>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-[840px] mx-auto px-5 text-center relative z-10">
          <h3 className="text-2xl sm:text-4xl font-extrabold font-poppins text-white leading-snug mb-8">
            If hiring marketing experts feels harder than it should, we built MarTechAdda to make it clearer.
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/experts"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold font-poppins text-base shadow-lg shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              <FiSearch className="w-5 h-5" />
              Explore experts
            </Link>
            <Link
              to="/how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold font-poppins text-base backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5"
            >
              Learn how it works
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
