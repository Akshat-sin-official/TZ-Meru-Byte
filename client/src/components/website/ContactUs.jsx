import React, { useState } from 'react'
import SEO from './SEO'
import SchemaMarkup from './SchemaMarkup'
import { UserIcon, BriefcaseIcon, MessageCircleIcon } from './Icons'
import { apiClient } from '../../services/apiClient'

const ContactUs = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    role: '',
    category: '',
    name: '',
    email: '',
    company: '',
    message: ''
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const steps = [
    { title: 'Role', description: 'Select your role' },
    { title: 'Category', description: 'Choose help category' },
    { title: 'Details', description: 'Enter your details' },
    { title: 'Review', description: 'Review & submit' }
  ]

  const roles = [
    {
      id: 'seeker',
      label: 'Service Seeker',
      description: 'I\'m looking for marketing experts',
      icon: UserIcon,
      badge: 'For businesses'
    },
    {
      id: 'provider',
      label: 'Service Provider',
      description: 'I\'m a marketing expert',
      icon: BriefcaseIcon,
      badge: 'For experts'
    },
    {
      id: 'other',
      label: 'Other',
      description: 'General inquiry or feedback',
      icon: MessageCircleIcon,
      badge: 'General'
    }
  ]

  const categoriesByRole = {
    seeker: [
      'Hiring guidance',
      'Using search & filters',
      'Account or access issue',
      'Payments / invoicing',
      'Other'
    ],
    provider: [
      'Profile onboarding',
      'Verification & compliance',
      'Discovery & visibility',
      'Payments / payouts',
      'Other'
    ],
    other: [
      'Partnerships',
      'Media / press',
      'Feedback / suggestions',
      'Careers',
      'Other'
    ]
  }

  const validateField = (field, value) => {
    let error = ''
    switch (field) {
      case 'name':
        if (!value.trim()) error = 'Name is required'
        break
      case 'email':
        if (!value.trim()) error = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) error = 'Invalid email address'
        break
      case 'message':
        if (!value.trim()) error = 'Message is required'
        else if (value.trim().length < 10) error = 'Message must be at least 10 characters'
        break
      default:
        break
    }
    return error
  }

  const handleRoleSelect = (roleId) => {
    setFormData({ ...formData, role: roleId, category: '' })
    setCurrentStep(1)
  }

  const handleCategorySelect = (category) => {
    setFormData({ ...formData, category })
    setCurrentStep(2)
  }

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors({ ...errors, [field]: error })
    }
  }

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true })
    const error = validateField(field, formData[field])
    setErrors({ ...errors, [field]: error })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    Object.keys(formData).forEach(key => {
      if (key !== 'company') {
        const error = validateField(key, formData[key])
        if (error) newErrors[key] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setTouched({ name: true, email: true, message: true })
      return
    }

    setSubmitError('')
    setIsSubmitting(true)

    try {
      const response = await apiClient.post('/v1/contact', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        company: formData.company?.trim() || undefined,
        role: formData.role || 'other',
        category: formData.category.trim(),
        message: formData.message.trim(),
      })

      if (response.data.success) {
        setSubmitSuccess(true)
        setTimeout(() => {
          setFormData({ role: '', category: '', name: '', email: '', company: '', message: '' })
          setCurrentStep(0)
          setSubmitSuccess(false)
        }, 3000)
      } else {
        throw new Error(response.data.error || 'Failed to submit inquiry')
      }
    } catch (error) {
      setSubmitError(error.response?.data?.error || error.message || 'Failed to submit inquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Contact', path: '/contact' }
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0D14] font-sans pb-20">
      <SEO
        title="Contact Us - Get in Touch with MarTechAdda"
        description="Contact MarTechAdda for support, questions, or feedback. We're here to help businesses and marketing experts connect better."
        canonical="https://martechadda.com/contact"
      />
      <SchemaMarkup type="WebPage" breadcrumbs={breadcrumbs} />

      {/* HERO SECTION */}
      <section className="pt-20 pb-12 text-center bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.06),_transparent_70%)] border-b border-slate-200">
        <div className="max-w-[800px] mx-auto px-5">
          <h1 className="text-4xl sm:text-5xl font-black font-poppins text-slate-900 leading-tight mb-4">
            We're here to help, <span className="text-blue-600">tell us how</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Hiring, showcasing expertise, or exploring MarTechAdda? We'll guide you in the right direction.
          </p>
        </div>
      </section>

      {/* FORM CONTAINER */}
      <section className="py-12">
        <div className="max-w-[900px] mx-auto px-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg">

            {/* STEP PROGRESS CAPSULES */}
            <div className="flex justify-between items-center mb-10 gap-2 overflow-x-auto pb-2">
              {steps.map((step, index) => {
                const isActive = index === currentStep
                const isCompleted = index < currentStep

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold font-poppins transition-all shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs bg-black/10">
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span>{step.title}</span>
                  </div>
                )
              })}
            </div>

            {/* STEP 1: ROLE */}
            {currentStep === 0 && (
              <div className="max-w-[700px] mx-auto">
                <h2 className="text-2xl font-extrabold font-poppins text-slate-900 text-center mb-2">
                  I'm contacting you as
                </h2>
                <p className="text-slate-500 text-center text-sm mb-8">
                  Select your role to get started
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {roles.map(role => {
                    const IconComp = role.icon
                    const isSelected = formData.role === role.id
                    return (
                      <div
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`relative bg-[#FAF9F6] border-2 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
                          isSelected
                            ? 'border-blue-600 bg-white shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-blue-400 hover:bg-white'
                        }`}
                      >
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200/60 text-slate-600 mb-4">
                          {role.badge}
                        </span>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                          <IconComp className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold font-poppins text-slate-900 mb-1">{role.label}</h3>
                        <p className="text-xs text-slate-500">{role.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: CATEGORY */}
            {currentStep === 1 && (
              <div className="max-w-[700px] mx-auto text-center">
                <h2 className="text-2xl font-extrabold font-poppins text-slate-900 mb-2">
                  How can we help?
                </h2>
                <p className="text-slate-500 text-sm mb-8">
                  Select a category that best describes your need
                </p>

                <div className="flex flex-wrap gap-3 justify-center mb-10">
                  {(categoriesByRole[formData.role] || categoriesByRole.other).map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={`px-5 py-3 rounded-full text-sm font-semibold transition-all ${
                        formData.category === category
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(0)}
                    className="px-6 py-2.5 rounded-xl border border-slate-300 font-semibold text-sm text-slate-600 hover:bg-slate-100"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DETAILS */}
            {currentStep === 2 && (
              <div className="max-w-[650px] mx-auto">
                <h2 className="text-2xl font-extrabold font-poppins text-slate-900 text-center mb-2">
                  Your Contact Information
                </h2>
                <p className="text-slate-500 text-center text-sm mb-8">
                  We'll use this to respond to your inquiry
                </p>

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-blue-600 text-sm font-medium"
                    />
                    {errors.name && <span className="text-xs text-rose-500 font-semibold mt-1 inline-block">{errors.name}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Work Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="john@company.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-blue-600 text-sm font-medium"
                    />
                    {errors.email && <span className="text-xs text-rose-500 font-semibold mt-1 inline-block">{errors.email}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Company / Organization (Optional)</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Acme Inc"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-blue-600 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Message *</label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      onBlur={() => handleBlur('message')}
                      placeholder="Tell us briefly how we can help..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-blue-600 text-sm font-medium resize-none"
                    />
                    {errors.message && <span className="text-xs text-rose-500 font-semibold mt-1 inline-block">{errors.message}</span>}
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-2.5 rounded-xl border border-slate-300 font-semibold text-sm text-slate-600 hover:bg-slate-100"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.name && formData.email && formData.message && !errors.name && !errors.email && !errors.message) {
                          setCurrentStep(3)
                        }
                      }}
                      className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20"
                    >
                      Review & Submit →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {currentStep === 3 && (
              <div className="max-w-[650px] mx-auto">
                <h2 className="text-2xl font-extrabold font-poppins text-slate-900 text-center mb-2">
                  Review Your Information
                </h2>
                <p className="text-slate-500 text-center text-sm mb-8">
                  Please review your details before submitting
                </p>

                <div className="bg-[#FAF9F6] border border-slate-200 rounded-2xl p-6 space-y-4 mb-8">
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold uppercase text-slate-500">Role</span>
                    <span className="text-sm font-bold text-slate-900 capitalize">{formData.role}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold uppercase text-slate-500">Category</span>
                    <span className="text-sm font-bold text-slate-900">{formData.category}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold uppercase text-slate-500">Name</span>
                    <span className="text-sm font-bold text-slate-900">{formData.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold uppercase text-slate-500">Email</span>
                    <span className="text-sm font-bold text-slate-900">{formData.email}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Message</span>
                    <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">{formData.message}</p>
                  </div>
                </div>

                {submitSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-center font-bold text-sm">
                    ✓ Inquiry submitted successfully! We'll get back to you shortly.
                  </div>
                )}

                {submitError && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-center font-semibold text-sm">
                    {submitError}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 rounded-xl border border-slate-300 font-semibold text-sm text-slate-600 hover:bg-slate-100"
                  >
                    ← Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/30"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Inquiry ✓'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactUs
