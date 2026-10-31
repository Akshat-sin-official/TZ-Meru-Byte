import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/services'
import { fileToBase64, compressImage } from '@/utils/fileUtils'
import { extractCorporateDomain } from '@/utils/freeEmailDomains'
import SEO from './SEO'
import SchemaMarkup from './SchemaMarkup'
import { serviceCategories, industries, clientTypes, clientScales, engagementModels, pricingModels } from '@/data/mockData'
import {
  SERVICE_HEADS,
  SERVICE_HEAD_TO_PRIMARY_FILTERS,
  PRIMARY_TO_SUB_FILTERS,
  INDUSTRY_SECTORS,
  INDUSTRY_SECTOR_TO_SUB_SECTORS,
  BUSINESS_RELATIONSHIP_TYPES,
  BUSINESS_TYPES,
  BUSINESS_SIZES,
  ENGAGEMENT_MODELS,
  OPERATIONAL_MODELS,
  PRICING_STYLES,
  TURNAROUND_TIMES,
  INDIAN_STATES,
  MUMBAI_REGIONS,
  LANGUAGES
} from '@/data/taxonomy'
import StepProgressBar from './ui/StepProgressBar'
import ProfilePreview from './ui/ProfilePreview'
import PortfolioCard from './ui/PortfolioCard'
import ComplianceChecklist from './ui/ComplianceChecklist'
import WorkspaceMock from './ui/WorkspaceMock'
import Card from './ui/Card'
import Button from './ui/Button'
import Chip from './ui/Chip'
import Badge from './ui/Badge'
import {
  FiUser,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiBriefcase,
  FiAward,
  FiFileText,
  FiShield,
  FiDollarSign,
  FiCalendar,
  FiTarget,
  FiX,
  FiPlus,
  FiInfo,
  FiEdit2,
  FiChevronDown,
  FiChevronUp,
  FiLoader,
  FiAlertCircle,
  FiSmartphone,
  FiSave
} from 'react-icons/fi'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import styles from './ServiceExpert.module.css'
// Import helper utilities
import { formatTimeTo12hr, calculateDayHours, TIME_OPTIONS, GSTIN_REGEX, PAN_REGEX, CIN_REGEX, LLPIN_REGEX, PINCODE_REGEX, IFSC_REGEX, MOBILE_REGEX } from './utils/helpers'
// Import shared components
import RequiredLabel from './shared/RequiredLabel'
// Import step components
import AccountSetupStep from './steps/AccountSetupStep'
import ProfileStep from './steps/ProfileStep'
import ExpertiseStep from './steps/ExpertiseStep'
import PortfolioStep from './steps/PortfolioStep'
import ComplianceStep from './steps/ComplianceStep'
import ReviewStep from './steps/ReviewStep'
import { ComplianceUpdateModal } from '../expert/ComplianceUpdateModal'
import { LegalNameChangeModal } from '../expert/LegalNameChangeModal'
import { MobileChangeModal } from '../expert/MobileChangeModal'


/**
 * @param {Object} props
 * @param {string} [props.variant]
 * @param {boolean} [props.adminMode]
 * @param {string|null} [props.targetExpertId]
 * @param {any} [props.targetExpertProfile]
 * @param {(() => void)|null} [props.onAdminSaveSuccess]
 * @param {(() => void)|null} [props.onAdminClose]
 */
const ServiceExpert = ({
  variant = 'website',
  adminMode = false,
  targetExpertId = null,
  targetExpertProfile = null,
  onAdminSaveSuccess = undefined,
  onAdminClose = undefined,
}) => {
  const { register, verifyOTP, refreshUser, acknowledgeWelcome, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = variant === 'dashboard'
  const isComplianceMode = location.pathname.includes('/compliance') || new URLSearchParams(location.search).get('tab') === 'compliance'
  /** Track last loaded profile.profileStatus from onboarding full-profile (verified → PUT updates). */
  const [loadedProfileStatus, setLoadedProfileStatus] = useState(null)

  /** Prefer API status; fall back to JWT /me so verified experts never hit bulk-submit by mistake. */
  const expertProfileIsVerified = useMemo(() => {
    if (adminMode) return true
    const api = String(loadedProfileStatus || '').toLowerCase() === 'verified'
    const jwt = String(user?.profileStatus || '').toLowerCase() === 'verified'
    return Boolean(api || jwt)
  }, [adminMode, loadedProfileStatus, user?.profileStatus])

  const isProfileInitiallySubmitted =
    !adminMode && (
      user?.profileStatus === 'submitted_for_verification' ||
      user?.profileStatus === 'under_verification' ||
      user?.profileStatus === 'stage4_completed'
    )

  const initialSubmitted =
    !adminMode && (
      isProfileInitiallySubmitted ||
      user?.profileStatus === 'verified'
    )

  const getInitialStep = () => {
    if (adminMode) return 1
    if (isProfileInitiallySubmitted) return 5
    return variant === 'dashboard' ? 1 : 0
  }

  const [currentStep, setCurrentStep] = useState(getInitialStep)
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState('')
  const [showEmailOTP, setShowEmailOTP] = useState(false)
  const [emailOTP, setEmailOTP] = useState('')
  const [isEmailUpdating, setIsEmailUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [expandedSections, setExpandedSections] = useState({})
  const [otpChannel, setOtpChannel] = useState('email')
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false)
  const [expertId, setExpertId] = useState(null)
  const [complianceModalOpen, setComplianceModalOpen] = useState(false)
  const [legalNameModalOpen, setLegalNameModalOpen] = useState(false)
  const [mobileModalOpen, setMobileModalOpen] = useState(false)
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false)
  const [selectedComplianceField, setSelectedComplianceField] = useState({ field: '', label: '' })

  const openComplianceModal = (field, label) => {
    setSelectedComplianceField({ field, label })
    setComplianceModalOpen(true)
  }

  const [isSubmitted, setIsSubmitted] = useState(initialSubmitted)
  const [currentServiceEditIndex, setCurrentServiceEditIndex] = useState(null)
  const [stepDraftSaved, setStepDraftSaved] = useState(false)
  const autoSaveStateRef = useRef({ lastSavedAtMs: 0, inFlight: false })
  const autoSaveTimerRef = useRef(null)

  // 3-Tier Progressive Auto-Enrichment State
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichedSource, setEnrichedSource] = useState(null)
  const autoEnrichedRef = useRef({ business_email: false, website_url: false, about_summary: false })

  const [formData, setFormData] = useState({
    // Account Basics
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    isEmailVerified: false,
    documentsRequested: false,
    documentsRequestedReason: '',

    // Profile
    businessName: '',
    alias: '',
    logoFile: null,
    roleType: 'Independent Consultant',
    website: '',
    about: '',
    experienceStartDate: '',
    businessBackground: '',

    // Expertise - What You Do
    serviceHead: '', // Single select from SERVICE_HEADS for current form
    primaryFilters: [], // Multi-select for current form
    subFilters: [], // Multi-select for current form
    servicesDraft: [], // Array of { serviceHead, primaryFilters, subFilters }

    // Expertise - Who You Serve
    industrySectors: [], // Multi-select from INDUSTRY_SECTORS
    industrySubSectors: [], // Multi-select nested sub-sectors
    serviceDeliveryStates: [...MUMBAI_REGIONS], // Auto-select all 4 Mumbai regions by default
    panIndiaAvailable: false, // Toggle for pan-India
    businessRelationshipTypes: ['B2B'], // Canonical default: B2B
    businessTypes: [...BUSINESS_TYPES], // Default: Select All
    businessSizes: [...BUSINESS_SIZES], // Default: Select All

    // Expertise - How You Work
    engagementModels: [...ENGAGEMENT_MODELS], // Default: Select All
    deliveryChannels: [...OPERATIONAL_MODELS], // Default: Select All
    pricingModels: [...PRICING_STYLES], // Default: Select All
    deliverySpeed: [...TURNAROUND_TIMES], // Default: Select All
    minEngagementValue: '',
    minEngagementUnit: 'Per Project',

    // Expertise - Communication & Availability
    languages: ['Hindi', 'English', 'Marathi'], // Default: Hindi, English, Marathi
    weeklyAvailability: 40,
    workSchedule: {
      weeklyHours: 40,
      daysOff: ['Saturday', 'Sunday'],
      availability: {
        monday: { available: true, from: '10:00', to: '18:00' },
        tuesday: { available: true, from: '10:00', to: '18:00' },
        wednesday: { available: true, from: '10:00', to: '18:00' },
        thursday: { available: true, from: '10:00', to: '18:00' },
        friday: { available: true, from: '10:00', to: '18:00' },
        saturday: { available: false, from: '10:00', to: '18:00' },
        sunday: { available: false, from: '10:00', to: '18:00' }
      },
      instantBooking: true
    },

    // Portfolio
    portfolioItems: [], // Array of { type: 'image'|'video'|'pdf'|'url', url: string, file: File|null }
    certifications: [], // Array of { title: string, file: File|null, verificationUrl: string }
    tools: [], // Multi-select from predefined tools
    teamMembers: [], // Array of { name: string, role: string, expertise: string[], experienceYears: number, photo: File|null }
    testimonials: [], // Array of { type: 'screenshot'|'link', file: File|null, url: string, platform: string }

    // Legal & Compliance
    entityType: 'proprietorship',
    isGstRegistered: false,
    gstRegistered: '', // 'yes' or 'no'
    isPanRegistered: false,
    panRegistered: '', // 'yes' or 'no'
    gstCertificateFile: null, // Address proof A
    documents: [], // Array of { type: string, file: File, uploadedAt: Date }
    panNumber: '',
    gstNumber: '',
    gstApplicable: false,
    addressLine1: '',
    addressLine2: '',
    city: '', // Pre-filled from profile, editable
    state: 'Maharashtra', // Pre-filled from profile, editable
    country: 'India', // Pre-filled from profile, editable
    pincode: '',
    addressProofFile: null, // Utility bill, rent agreement, letterhead

    // Bank Details
    bankName: '',
    branchName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'savings', // savings or current
    accountHolderName: '',
    bankProofFile: null, // Cancelled cheque, passbook, bank statement
    upiId: '', // Optional UPI ID

    // Consent & Agreements
    termsAccepted: false,
    platformAgreement: false,
    feeAcknowledgement: false
  })

  const buildLightDraftData = (value, keyPath = '') => {
    if (value === null || value === undefined) return value
    if (typeof value !== 'object') return value

    if (value instanceof File || value instanceof Blob) {
      return null
    }

    if (Array.isArray(value)) {
      return value.map((item, idx) => buildLightDraftData(item, `${keyPath}[${idx}]`))
    }

    const obj = value
    const sanitized = {}
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'password' || k === 'otp') continue
      sanitized[k] = buildLightDraftData(v, keyPath ? `${keyPath}.${k}` : k)
    }
    return sanitized
  }

  const resolveSubSectors = (sectors, existingSubs) => {
    const current = Array.isArray(existingSubs) ? existingSubs : []
    if (current.length > 0) return current
    if (!Array.isArray(sectors) || sectors.length === 0) return []
    const allSubs = new Set()
    sectors.forEach(sec => {
      const subs = INDUSTRY_SECTOR_TO_SUB_SECTORS[sec] || []
      subs.forEach(s => {
        allSubs.add((s === 'Other' || s.startsWith('Other')) ? `Other (${sec})` : s)
      })
    })
    return Array.from(allSubs)
  }

  /**
   * 3-Tier Progressive Auto-Enrichment Handler
   * Triggers AI classification across:
   * Tier 1: Business Email Domain
   * Tier 2: Website URL
   * Tier 3: About Summary Text
   */
  const triggerAutoEnrichment = async ({ email, websiteUrl, aboutText, triggerSource, force = false }) => {
    if (!force && triggerSource && autoEnrichedRef.current[triggerSource]) {
      return
    }

    try {
      setIsEnriching(true)
      const { expertService } = await import('@/services/expertService')
      const response = await expertService.autoEnrichOnboarding({ email, websiteUrl, aboutText })

      if (response && response.success && response.data) {
        const enriched = response.data
        if (triggerSource) {
          autoEnrichedRef.current[triggerSource] = true
        }
        setEnrichedSource(enriched.source || triggerSource)

        setFormData(prev => {
          const next = { ...prev }
          if (enriched.businessName && (!next.businessName || force || triggerSource === 'business_email')) {
            next.businessName = enriched.businessName
            if (!next.legalName || force) next.legalName = enriched.businessName
            if (!next.alias || force) next.alias = enriched.businessName
            next.legalSameAsBrand = true
          }
          if (enriched.website && (!next.website || force || triggerSource === 'business_email')) {
            next.website = enriched.website
          }
          if (email && !next.email) {
            next.email = email
          }
          if (enriched.aboutSummary && (!next.about || next.about.length < 20 || (force && triggerSource === 'website_url'))) {
            next.about = enriched.aboutSummary
          }
          if (enriched.roleType && (!next.roleType || next.roleType === 'Independent Consultant' || force)) {
            next.roleType = enriched.roleType
          }
          if (enriched.entityType && (!next.entityType || next.entityType === 'proprietorship' || next.entityType === 'individual' || force)) {
            next.entityType = enriched.entityType
          }
          if (enriched.logoUrl && (!next.logoFile || force)) {
            next.logoFile = enriched.logoUrl
            next.logoUrl = enriched.logoUrl
          }
          if (enriched.gstNumber && (!next.gstNumber || force)) {
            next.gstNumber = enriched.gstNumber
            next.isGstRegistered = true
            next.gstRegistered = 'yes'
            next.gstApplicable = true
            next.isPanRegistered = true
            next.panRegistered = 'yes'
          } else if (enriched.gstRegistered) {
            next.gstRegistered = enriched.gstRegistered
            next.isGstRegistered = enriched.gstRegistered === 'yes'
            if (enriched.gstRegistered === 'yes') {
              next.isPanRegistered = true
              next.panRegistered = 'yes'
            }
          }
          if (enriched.panNumber && (!next.panNumber || force)) {
            next.panNumber = enriched.panNumber
            next.isPanRegistered = true
            next.panRegistered = 'yes'
          } else if (enriched.panRegistered && !next.panRegistered) {
            next.panRegistered = enriched.panRegistered
            next.isPanRegistered = enriched.panRegistered === 'yes'
          }
          if (enriched.experienceStartDate && (!next.experienceStartDate || force)) {
            next.experienceStartDate = enriched.experienceStartDate
          }
          if (enriched.yearsExperience && (!next.yearsExperience || force)) {
            next.yearsExperience = enriched.yearsExperience
          }
          if (enriched.operatingHours) {
            const daysOff = enriched.operatingHours.daysOff || ['Saturday', 'Sunday']
            const from = enriched.operatingHours.from || '10:00'
            const to = enriched.operatingHours.to || '18:00'
            const availability = { ...(next.workSchedule?.availability || {}) }
            const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            let weeklyHours = 0
            dayNames.forEach(d => {
              const capitalized = d.charAt(0).toUpperCase() + d.slice(1)
              const isOff = daysOff.includes(capitalized)
              const avail = !isOff
              availability[d] = { available: avail, from, to }
              if (avail) {
                weeklyHours += calculateDayHours(from, to)
              }
            })
            next.workSchedule = {
              ...next.workSchedule,
              daysOff,
              weeklyHours: parseFloat(weeklyHours.toFixed(1)),
              availability,
              instantBooking: true
            }
          }
          if (enriched.city && (!next.city || force)) {
            next.city = enriched.city
          }
          if (enriched.state && (!next.state || next.state === 'Maharashtra' || force)) {
            next.state = enriched.state
          }
          if (enriched.country && (!next.country || force)) {
            next.country = enriched.country
          }
          if (Array.isArray(enriched.businessRelationshipTypes) && enriched.businessRelationshipTypes.length > 0) {
            const relSet = new Set(force ? [] : (next.businessRelationshipTypes || []))
            enriched.businessRelationshipTypes.forEach(r => relSet.add(r))
            next.businessRelationshipTypes = Array.from(relSet)
          }
          if (Array.isArray(enriched.businessSizes) && enriched.businessSizes.length > 0) {
            const sizeSet = new Set(force ? [] : (next.businessSizes || []))
            enriched.businessSizes.forEach(s => sizeSet.add(s))
            next.businessSizes = Array.from(sizeSet)
          }
          if (Array.isArray(enriched.engagementModels) && enriched.engagementModels.length > 0) {
            const engSet = new Set(force ? [] : (next.engagementModels || []))
            enriched.engagementModels.forEach(e => engSet.add(e))
            next.engagementModels = Array.from(engSet)
          }
          if (Array.isArray(enriched.deliveryChannels) && enriched.deliveryChannels.length > 0) {
            const delSet = new Set(force ? [] : (next.deliveryChannels || []))
            enriched.deliveryChannels.forEach(d => delSet.add(d))
            next.deliveryChannels = Array.from(delSet)
          }
          if (Array.isArray(enriched.pricingModels) && enriched.pricingModels.length > 0) {
            const prcSet = new Set(force ? [] : (next.pricingModels || []))
            enriched.pricingModels.forEach(p => prcSet.add(p))
            next.pricingModels = Array.from(prcSet)
          }
          if (Array.isArray(enriched.languages) && enriched.languages.length > 0) {
            const langSet = new Set(force ? [] : (next.languages || []))
            enriched.languages.forEach(l => langSet.add(l))
            next.languages = Array.from(langSet)
          }
          if (Array.isArray(enriched.industrySectors) && enriched.industrySectors.length > 0) {
            const currentSectors = new Set(force ? [] : (next.industrySectors || []))
            enriched.industrySectors.forEach(s => currentSectors.add(s))
            next.industrySectors = Array.from(currentSectors)

            // Auto-select ALL sub-sectors for every selected industry sector
            const currentSubs = new Set(force ? [] : (next.industrySubSectors || []))
            next.industrySectors.forEach(sec => {
              const sectorSubs = INDUSTRY_SECTOR_TO_SUB_SECTORS[sec] || []
              sectorSubs.forEach(sub => {
                const subKey = (sub === 'Other' || sub.startsWith('Other')) ? `Other (${sec})` : sub
                currentSubs.add(subKey)
              })
            })
            next.industrySubSectors = Array.from(currentSubs)
          }
          if (Array.isArray(enriched.industrySubSectors) && enriched.industrySubSectors.length > 0) {
            const currentSubs = new Set(next.industrySubSectors || [])
            enriched.industrySubSectors.forEach(s => currentSubs.add(s))
            next.industrySubSectors = Array.from(currentSubs)
          }
          if (Array.isArray(enriched.servicesDraft) && enriched.servicesDraft.length > 0) {
            if (force) {
              next.servicesDraft = enriched.servicesDraft.slice(0, 4)
            } else {
              const existingServices = [...(next.servicesDraft || [])]
              enriched.servicesDraft.forEach(newS => {
                const existingIdx = existingServices.findIndex(s => s.serviceHead === newS.serviceHead)
                if (existingIdx >= 0) {
                  const mergedPrimary = Array.from(new Set([...(existingServices[existingIdx].primaryFilters || []), ...(newS.primaryFilters || [])]))
                  const mergedSub = Array.from(new Set([...(existingServices[existingIdx].subFilters || []), ...(newS.subFilters || [])]))
                  existingServices[existingIdx] = {
                    ...existingServices[existingIdx],
                    primaryFilters: mergedPrimary,
                    subFilters: mergedSub,
                  }
                } else if (existingServices.length < 4) {
                  existingServices.push(newS)
                }
              })
              next.servicesDraft = existingServices
            }
          }

          // Step 3: Tools & Technologies
          if (Array.isArray(enriched.tools) && enriched.tools.length > 0) {
            const toolsSet = new Set(force ? [] : (next.tools || []))
            enriched.tools.forEach(t => toolsSet.add(t))
            next.tools = Array.from(toolsSet)
          }

          // Step 3: Portfolio Items
          if (Array.isArray(enriched.portfolioItems) && enriched.portfolioItems.length > 0) {
            const currentPortfolio = Array.isArray(next.portfolioItems) ? next.portfolioItems : []
            const isDefaultEmpty = currentPortfolio.length === 0 || (currentPortfolio.length === 1 && !currentPortfolio[0].url && !currentPortfolio[0].title)
            if (force || isDefaultEmpty) {
              next.portfolioItems = enriched.portfolioItems.slice(0, 4)
            } else {
              const merged = [...currentPortfolio]
              enriched.portfolioItems.forEach(item => {
                if (merged.length < 4 && !merged.some(e => e.url === item.url)) {
                  merged.push(item)
                }
              })
              next.portfolioItems = merged
            }
          }

          // Step 3: Certifications & Awards
          if (Array.isArray(enriched.certifications) && enriched.certifications.length > 0) {
            const currentCerts = Array.isArray(next.certifications) ? next.certifications : []
            const isDefaultEmpty = currentCerts.length === 0 || (currentCerts.length === 1 && !currentCerts[0].title)
            const fallbackUrl = enriched.website || next.website || formData.website || ''
            const mappedEnrichedCerts = enriched.certifications.map(c => ({
              ...c,
              verificationUrl: c.verificationUrl || fallbackUrl
            }))
            if (force || isDefaultEmpty) {
              next.certifications = mappedEnrichedCerts.slice(0, 5)
            } else {
              const merged = [...currentCerts]
              mappedEnrichedCerts.forEach(cert => {
                if (merged.length < 5 && !merged.some(c => c.title?.toLowerCase() === cert.title?.toLowerCase())) {
                  merged.push(cert)
                }
              })
              next.certifications = merged
            }
          }

          // Step 3: Key Team Members
          if (Array.isArray(enriched.teamMembers) && enriched.teamMembers.length > 0) {
            const currentTeam = Array.isArray(next.teamMembers) ? next.teamMembers : []
            const isDefaultEmpty = currentTeam.length === 0 || (currentTeam.length === 1 && !currentTeam[0].name)
            if (force || isDefaultEmpty) {
              next.teamMembers = enriched.teamMembers.slice(0, 3)
            } else {
              const merged = [...currentTeam]
              enriched.teamMembers.forEach(mem => {
                if (merged.length < 3 && !merged.some(m => m.name?.toLowerCase() === mem.name?.toLowerCase())) {
                  merged.push(mem)
                }
              })
              next.teamMembers = merged
            }
          }

          // Step 3: Testimonials
          const enrichedTestimonials = (Array.isArray(enriched.testimonials) && enriched.testimonials.length > 0)
            ? enriched.testimonials
            : (websiteToEnrich ? [{ type: 'link', platform: 'other', url: `${websiteToEnrich.replace(/\/+$/, '')}#testimonials` }] : [])

          if (enrichedTestimonials.length > 0) {
            const currentTestimonials = Array.isArray(next.testimonials) ? next.testimonials : []
            const isDefaultEmpty = currentTestimonials.length === 0 || (currentTestimonials.length === 1 && !currentTestimonials[0].url)
            if (force || isDefaultEmpty) {
              next.testimonials = enrichedTestimonials.slice(0, 3)
            } else {
              const merged = [...currentTestimonials]
              enrichedTestimonials.forEach(t => {
                if (merged.length < 3 && !merged.some(e => e.url === t.url)) {
                  merged.push(t)
                }
              })
              next.testimonials = merged
            }
          }

          return next
        })

        const count = enriched.servicesDraft?.length || 0
        const extractions = []
        if (count > 0) extractions.push(`${count} service categories`)
        if (enriched.tools?.length) extractions.push(`${enriched.tools.length} tools`)
        if (enriched.portfolioItems?.length) extractions.push(`${enriched.portfolioItems.length} portfolio links`)
        if (enriched.certifications?.length) extractions.push(`${enriched.certifications.length} certifications`)

        const notice = triggerSource === 'business_email'
          ? `✨ Auto-detected company & ${extractions.length ? extractions.join(', ') : 'services'} from ${enriched.website || 'work domain'}!`
          : triggerSource === 'website_url'
          ? `✨ Auto-filled profile, services, tools & portfolio from website!`
          : `✨ Auto-mapped profile & services from your summary!`
        toast.success(notice, { duration: 5000 })

        // Auto-save the enriched fields so they persist across page refreshes
        setTimeout(() => {
          scheduleAutoSaveDraftLight()
        }, 500)
      } else {
        toast.error('Could not auto-detect details. You can enter them manually.')
      }
    } catch (err) {
      console.warn('Auto-enrichment exception:', err)
      toast.error('Auto-fill temporarily unavailable. Please enter details manually.')
    } finally {
      setIsEnriching(false)
    }
  }

  const autoSaveDraftLight = async (nextStep) => {
    try {
      if (adminMode) return
      if (!user) return
      if (isSubmitted) return

      const now = Date.now()
      if (autoSaveStateRef.current.inFlight) return
      if (now - autoSaveStateRef.current.lastSavedAtMs < 3000) return

      const token = localStorage.getItem('accessToken')
      if (!token) return

      autoSaveStateRef.current.inFlight = true

      const { expertService } = await import('@/services/expertService')
      const lightFormData = buildLightDraftData(formData)

      if (lightFormData.experienceStartDate && !lightFormData.yearsExperience) {
        const start = new Date(lightFormData.experienceStartDate)
        if (!isNaN(start.getTime())) {
          const diffYears = (Date.now() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
          lightFormData.yearsExperience = Math.max(0, Math.round(diffYears * 10) / 10)
        }
      }

      await expertService.saveOnboardingDraft({
        formData: lightFormData,
        currentStep: typeof nextStep === 'number' ? nextStep : currentStep
      })

      autoSaveStateRef.current.lastSavedAtMs = now
    } catch (e) {
      console.warn('Auto-save draft failed', e)
    } finally {
      autoSaveStateRef.current.inFlight = false
    }
  }

  const scheduleAutoSaveDraftLight = (nextStep) => {
    try {
      if (adminMode) return
      if (!user) return
      if (isLoading || isSubmitted) return
      if (currentStep === 0) return

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(() => {
        autoSaveDraftLight(nextStep)
      }, 1200)
    } catch {
    }
  }

  const progressSteps = [
    { title: 'Account Setup' },
    { title: 'Profile' },
    { title: 'Expertise' },
    { title: 'Portfolio' },
    { title: 'Compliance' },
    { title: 'Review' }
  ]

  const formSteps = [
    { id: 0, title: 'Account Basics', icon: FiUser },
    { id: 1, title: 'Profile', icon: FiUser },
    { id: 2, title: 'Expertise', icon: FiBriefcase },
    { id: 3, title: 'Portfolio', icon: FiAward },
    { id: 4, title: 'Compliance', icon: FiShield },
    { id: 5, title: 'Review', icon: FiCheckCircle }
  ]

  const entityTypes = [
    { value: 'proprietorship', label: 'Proprietorship' },
    { value: 'partnership', label: 'Partnership Firm' },
    { value: 'llp', label: 'LLP' },
    { value: 'opc', label: 'OPC' },
    { value: 'pvt_ltd', label: 'Private Limited' },
    { value: 'public_ltd', label: 'Public Limited' },
  ]

  // Check profile status on mount and load draft
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const lastFetchedUserId = useRef(null)
  const [profileReloadTick, setProfileReloadTick] = useState(0)
  const consumedProfileReloadTick = useRef(-1)
  const [dashboardSectionSaving, setDashboardSectionSaving] = useState(null)

  /** Dashboard wizard never uses step 0 (account is already created). */
  useEffect(() => {
    if (!isDashboard || currentStep !== 0) return
    setCurrentStep(1)
  }, [isDashboard, currentStep])

  useEffect(() => {
    const init = async () => {
      // Prevents background fetches during active submission
      if (isLoading) return;

      if (adminMode) {
        if (!targetExpertId) return;
        setIsReadOnlyMode(false)
        setIsSubmitted(false)
        setCurrentStep(1)

        const mapProfileToForm = (profile) => {
          if (!profile) return
          const u = profile.userId || profile
          setFormData(prev => ({
            ...prev,
            fullName: u.fullName || u.name || profile.name || prev.fullName || '',
            email: u.email || profile.email || prev.email || '',
            mobile: u.phone || u.mobile || profile.mobile || profile.whatsappNumber || profile.mobileNumber || prev.mobile || '',
            legalName: profile.legalName || profile.businessName || prev.legalName || '',
            businessName: profile.businessName || profile.displayName || prev.businessName || '',
            legalSameAsBrand: profile.legalSameAsBrand ?? Boolean(profile.legalName && profile.brandAlias && profile.legalName === profile.brandAlias),
            alias: profile.brandAlias || prev.alias || '',
            roleType: profile.businessRole || prev.roleType || 'Independent Consultant',
            entityType: profile.entityType || prev.entityType || 'individual',
            isGstRegistered: typeof profile.isGstRegistered === 'boolean' ? profile.isGstRegistered : (profile.gstStatus === 'registered'),
            isPanRegistered: typeof profile.isPanRegistered === 'boolean' ? profile.isPanRegistered : Boolean(profile.panNumber),
            requestedDocuments: profile.requestedDocuments || [],
            about: profile.aboutSummary || profile.bio || prev.about || '',
            website: profile.website || prev.website || '',
            linkedin: profile.linkedinProfile || prev.linkedin || '',
            experienceStartDate: (() => {
              const expDate = profile.experienceStartDate || profile.pendingData?.experienceStartDate || profile.onboardingDraft?.formData?.experienceStartDate;
              if (expDate) {
                const d = new Date(expDate);
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                return String(expDate).split('T')[0];
              }
              const yrs = profile.yearsExperience || profile.experienceYears || profile.yearsOfExperience || profile.pendingData?.yearsExperience;
              if (yrs && Number(yrs) > 0) {
                const months = Math.round(Number(yrs) * 12);
                const d = new Date();
                d.setMonth(d.getMonth() - months);
                return d.toISOString().split('T')[0];
              }
              return prev.experienceStartDate;
            })(),
            minEngagementValue: profile.minEngagementValue !== undefined ? profile.minEngagementValue : prev.minEngagementValue,
            minEngagementUnit: profile.minEngagementUnit || prev.minEngagementUnit || 'Per Project',
            country: typeof profile.location === 'object' ? (profile.location.country || prev.country) : prev.country,
            city: profile.location?.city || profile.registeredAddress?.city || prev.city || '',
            state: profile.location?.state || profile.registeredAddress?.state || prev.state || 'Maharashtra',
            servicesDraft: (profile.services && profile.services.length > 0) ? profile.services : (prev.servicesDraft || []),
            industrySectors: ((profile.industrySectors && profile.industrySectors.length > 0)
              ? profile.industrySectors
              : (profile.industrySector ? [profile.industrySector] : (prev.industrySectors || []))
            ).filter((s) => !['Primary', 'Secondary', 'Tertiary', 'Quaternary'].includes(s)),
            industrySubSectors: resolveSubSectors(
              ((profile.industrySectors && profile.industrySectors.length > 0)
                ? profile.industrySectors
                : (profile.industrySector ? [profile.industrySector] : (prev.industrySectors || []))
              ).filter((s) => !['Primary', 'Secondary', 'Tertiary', 'Quaternary'].includes(s)),
              profile.subIndustries || profile.industrySubSectors || prev.industrySubSectors || []
            ),
            serviceDeliveryStates: (profile.serviceDeliveryStates && profile.serviceDeliveryStates.length > 0)
              ? profile.serviceDeliveryStates
              : (prev.serviceDeliveryStates?.length ? prev.serviceDeliveryStates : [...MUMBAI_REGIONS]),
            panIndiaAvailable: (profile.serviceDeliveryStates && profile.serviceDeliveryStates.length > 0) ? false : (typeof profile.panIndiaAvailable === 'boolean' ? profile.panIndiaAvailable : prev.panIndiaAvailable),
            businessRelationshipTypes: (profile.clientEngagementTypes && profile.clientEngagementTypes.length > 0)
              ? profile.clientEngagementTypes
              : ((profile.businessRelationshipTypes && profile.businessRelationshipTypes.length > 0)
                ? profile.businessRelationshipTypes
                : (prev.businessRelationshipTypes?.length ? prev.businessRelationshipTypes : ['B2B'])),
            businessTypes: (profile.businessTypesServed && profile.businessTypesServed.length > 0)
              ? profile.businessTypesServed
              : ((profile.businessTypes && profile.businessTypes.length > 0) ? profile.businessTypes : (prev.businessTypes?.length ? prev.businessTypes : [...BUSINESS_TYPES])),
            businessSizes: (profile.clientScales && profile.clientScales.length > 0)
              ? profile.clientScales
              : ((profile.businessSizes && profile.businessSizes.length > 0) ? profile.businessSizes : (prev.businessSizes?.length ? prev.businessSizes : [...BUSINESS_SIZES])),
            engagementModels: (profile.engagementModels && profile.engagementModels.length > 0)
              ? profile.engagementModels
              : (prev.engagementModels?.length ? prev.engagementModels : [...ENGAGEMENT_MODELS]),
            deliveryChannels: (profile.deliveryChannels && profile.deliveryChannels.length > 0)
              ? profile.deliveryChannels
              : (prev.deliveryChannels?.length ? prev.deliveryChannels : [...OPERATIONAL_MODELS]),
            pricingModels: (profile.pricingStyle && profile.pricingStyle.length > 0)
              ? profile.pricingStyle
              : ((profile.pricingModels && profile.pricingModels.length > 0) ? profile.pricingModels : (prev.pricingModels?.length ? prev.pricingModels : [...PRICING_STYLES])),
            deliverySpeed: Array.isArray(profile.preferredDeliverySpeed) && profile.preferredDeliverySpeed.length > 0
              ? profile.preferredDeliverySpeed
              : (profile.deliverySpeed?.length ? profile.deliverySpeed : (prev.deliverySpeed?.length ? prev.deliverySpeed : [...TURNAROUND_TIMES])),
            languages: (profile.languages && profile.languages.length > 0)
              ? profile.languages
              : (prev.languages?.length ? prev.languages : ['Hindi', 'English', 'Marathi']),
            workSchedule: profile.workSchedule || prev.workSchedule || {
              weeklyHours: 40,
              daysOff: ['Saturday', 'Sunday'],
              availability: {
                monday: { available: true, from: '10:00', to: '18:00' },
                tuesday: { available: true, from: '10:00', to: '18:00' },
                wednesday: { available: true, from: '10:00', to: '18:00' },
                thursday: { available: true, from: '10:00', to: '18:00' },
                friday: { available: true, from: '10:00', to: '18:00' },
                saturday: { available: false, from: '10:00', to: '18:00' },
                sunday: { available: false, from: '10:00', to: '18:00' }
              },
              instantBooking: true
            },
            gstRegistered: profile.gstStatus === 'registered' ? 'yes' : (profile.gstStatus === 'not_registered' ? 'no' : prev.gstRegistered),
            gstNumber: profile.gstNumber || prev.gstNumber || '',
            panNumber: profile.panNumber || prev.panNumber || '',
            cinNumber: profile.cinNumber || prev.cinNumber || '',
            llpinNumber: profile.llpinNumber || prev.llpinNumber || '',
            addressLine1: profile.registeredAddress?.line1 || prev.addressLine1,
            addressLine2: profile.registeredAddress?.line2 || prev.addressLine2,
            pincode: profile.registeredAddress?.pincode || prev.pincode,
            bankName: profile.bankDetails?.bankName || prev.bankName,
            branchName: profile.bankDetails?.branchName || prev.branchName,
            accountNumber: profile.bankDetails?.accountNumber || prev.accountNumber,
            ifscCode: profile.bankDetails?.ifscCode || prev.ifscCode,
            accountHolderName: profile.bankDetails?.accountHolderName || prev.accountHolderName,
            accountType: profile.bankDetails?.accountType || prev.accountType,
            upiId: profile.bankDetails?.upiId || prev.upiId,
            logoUrl: profile.logoUrl || profile.profileImageUrl || prev.logoUrl,
            logoFile: profile.logoUrl || profile.profileImageUrl || prev.logoFile || null,
            portfolioItems: (profile.portfolioItems || prev.portfolioItems || []).map(item => ({
              ...item,
              type: item.type || 'url',
              url: item.url || ''
            })),
            certifications: (profile.certifications || prev.certifications || []).map(cert => ({
              ...cert,
              title: cert.name || cert.title,
              url: cert.fileUrl || cert.url
            })),
            tools: profile.tools || prev.tools || [],
            teamMembers: (profile.teamMembers || prev.teamMembers || []).map(m => ({
              ...m,
              experienceYears: m.experience || m.experienceYears,
              photo: m.photoUrl || m.photo
            })),
            testimonials: profile.testimonials || prev.testimonials || []
          }))
        }

        if (targetExpertProfile) {
          mapProfileToForm(targetExpertProfile)
        }

        try {
          const { adminService } = await import('@/services/adminService')
          const fullData = await adminService.getExpertDetail(targetExpertId)
          if (fullData) {
            mapProfileToForm(fullData)
            setIsDataLoaded(true)
            setLoadedProfileStatus('verified')
            setStepDraftSaved(true)
          }
        } catch (err) {
          console.error('Failed to load expert details in adminMode:', err)
        }
        return
      }

      const currentUserId = user?.userId || user?._id || user?.id

      // Sync with logged-in user if available (every time user changes)
      if (user) {
        setFormData(prev => ({
          ...prev,
          fullName: user.name || user.fullName || prev.fullName,
          email: user.email || prev.email,
          mobile: user.mobile || prev.mobile,
          isEmailVerified: user.isVerified || false
        }))

        // If already verified, move past account setup (public registration only — dashboard skips step 0)
        if (
          user.isVerified &&
          (user.role === 'expert' || user.registrationStatus === 'verified' || user.registrationStatus === 'onboarding_in_progress')
        ) {
          if (!isDashboard && currentStep === 0) {
            setCurrentStep(1)
          }
        }
      }

      const token = localStorage.getItem('accessToken')
      const shouldRefetchProfile =
        !!currentUserId &&
        !!token &&
        (currentUserId !== lastFetchedUserId.current ||
          consumedProfileReloadTick.current !== profileReloadTick)

      if (shouldRefetchProfile) {
        try {
          const { expertService } = await import('@/services/expertService')
          const profile = await expertService.getOnboardingFullProfile()

          if (profile) {
            consumedProfileReloadTick.current = profileReloadTick
            const isBootstrapProfileFetch = currentUserId !== lastFetchedUserId.current
            lastFetchedUserId.current = currentUserId
            setIsDataLoaded(true)

            const status = profile?.profileStatus || user?.profileStatus || null
            setLoadedProfileStatus(status)
            setStepDraftSaved(true) // Profile loaded from server = draft is saved

            if (profile?.expertId) setExpertId(profile.expertId)

            if (status === 'submitted_for_verification') {
              setIsSubmitted(true)
              if (isComplianceMode) {
                setCurrentStep(4)
              } else {
                setCurrentStep(5) // Lock into Under Review / Freeze screen
              }
            } else if (status === 'verified') {
              setIsSubmitted(false) // Verified experts have self-serve workspace editing
              setIsReadOnlyMode(false)
              if (isComplianceMode) {
                setCurrentStep(4)
              } else {
                setCurrentStep(1)
              }
            } else if (isBootstrapProfileFetch) {
              if (isComplianceMode) {
                setCurrentStep(4)
              } else if (profile.currentStep !== undefined && Number(profile.currentStep) > 0) {
                setCurrentStep(Math.max(1, Math.min(Number(profile.currentStep), 5)))
              } else {
                setCurrentStep(1)
              }
            }

            // Pre-fill form data from backend profile
            setFormData(prev => ({
              ...prev,
              // Identity
              legalName: profile.legalName || profile.businessName || prev.legalName || '',
              businessName: profile.businessName || profile.displayName || prev.businessName,
              legalSameAsBrand: profile.legalSameAsBrand ?? Boolean(profile.legalName && profile.brandAlias && profile.legalName === profile.brandAlias),
              alias: profile.brandAlias || prev.alias,
              roleType: profile.businessRole || prev.roleType || 'Independent Consultant',
              entityType: profile.entityType || prev.entityType || 'individual',
              isGstRegistered: typeof profile.isGstRegistered === 'boolean' ? profile.isGstRegistered : (profile.gstStatus === 'registered'),
              isPanRegistered: typeof profile.isPanRegistered === 'boolean' ? profile.isPanRegistered : Boolean(profile.panNumber),

              // Requested docs list
              requestedDocuments: profile.requestedDocuments || [],

              // Contact
              email: profile.userId?.email || profile.email || user?.email || prev.email,
              mobile: profile.userId?.mobile || profile.whatsappNumber || profile.mobile || user?.mobile || prev.mobile || '',

              // Profile Details
              about: profile.aboutSummary || profile.bio || prev.about || '',
              website: profile.website || prev.website,
              linkedin: profile.linkedinProfile || prev.linkedin,
              experienceStartDate: (() => {
                const expDate = profile.experienceStartDate || profile.pendingData?.experienceStartDate || profile.onboardingDraft?.formData?.experienceStartDate;
                if (expDate) {
                  const d = new Date(expDate);
                  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                  return String(expDate).split('T')[0];
                }
                const yrs = profile.yearsExperience || profile.experienceYears || profile.yearsOfExperience || profile.pendingData?.yearsExperience;
                if (yrs && Number(yrs) > 0) {
                  const months = Math.round(Number(yrs) * 12);
                  const d = new Date();
                  d.setMonth(d.getMonth() - months);
                  return d.toISOString().split('T')[0];
                }
                return prev.experienceStartDate;
              })(),
              minEngagementValue: profile.minEngagementValue !== undefined ? profile.minEngagementValue : prev.minEngagementValue,
              minEngagementUnit: profile.minEngagementUnit || prev.minEngagementUnit || 'Per Project',

              // Location
              country: typeof profile.location === 'object' ? (profile.location.country || prev.country) : prev.country,
              city: profile.location?.city || profile.registeredAddress?.city || prev.city || '',
              state: profile.location?.state || profile.registeredAddress?.state || prev.state || 'Maharashtra',

              // Resolved services and industry sectors prioritizing non-empty sources
              servicesDraft: (profile.pendingData?.servicesDraft && profile.pendingData.servicesDraft.length > 0)
                ? profile.pendingData.servicesDraft
                : ((profile.services && profile.services.length > 0) ? profile.services : (prev.servicesDraft || [])),
              industrySectors: (profile.pendingData?.industrySectors && profile.pendingData.industrySectors.length > 0)
                ? profile.pendingData.industrySectors
                : (((profile.industrySectors && profile.industrySectors.length > 0)
                    ? profile.industrySectors
                    : (profile.industrySector ? [profile.industrySector] : (prev.industrySectors || []))
                  ).filter((s) => !['Primary', 'Secondary', 'Tertiary', 'Quaternary'].includes(s))),
              industrySubSectors: resolveSubSectors(
                (profile.pendingData?.industrySectors && profile.pendingData.industrySectors.length > 0)
                  ? profile.pendingData.industrySectors
                  : (((profile.industrySectors && profile.industrySectors.length > 0)
                      ? profile.industrySectors
                      : (profile.industrySector ? [profile.industrySector] : (prev.industrySectors || []))
                    ).filter((s) => !['Primary', 'Secondary', 'Tertiary', 'Quaternary'].includes(s))),
                (profile.pendingData?.industrySubSectors && profile.pendingData.industrySubSectors.length > 0)
                  ? profile.pendingData.industrySubSectors
                  : (profile.subIndustries || profile.industrySubSectors || prev.industrySubSectors || [])
              ),
              serviceDeliveryStates: (profile.pendingData?.serviceDeliveryStates?.length
                ? profile.pendingData.serviceDeliveryStates
                : (profile.serviceDeliveryStates?.length ? profile.serviceDeliveryStates : (prev.serviceDeliveryStates?.length ? prev.serviceDeliveryStates : [...MUMBAI_REGIONS]))),
              panIndiaAvailable: (profile.serviceDeliveryStates && profile.serviceDeliveryStates.length > 0) ? false : (typeof profile.panIndiaAvailable === 'boolean' ? profile.panIndiaAvailable : prev.panIndiaAvailable),
              businessRelationshipTypes: (profile.pendingData?.businessRelationshipTypes?.length
                ? profile.pendingData.businessRelationshipTypes
                : (profile.clientEngagementTypes?.length ? profile.clientEngagementTypes : (profile.businessRelationshipTypes?.length ? profile.businessRelationshipTypes : (prev.businessRelationshipTypes?.length ? prev.businessRelationshipTypes : ['B2B'])))),
              businessTypes: (profile.pendingData?.businessTypes?.length
                ? profile.pendingData.businessTypes
                : (profile.businessTypesServed?.length ? profile.businessTypesServed : (profile.businessTypes?.length ? profile.businessTypes : (prev.businessTypes?.length ? prev.businessTypes : [...BUSINESS_TYPES])))),
              businessSizes: (profile.pendingData?.businessSizes?.length
                ? profile.pendingData.businessSizes
                : (profile.clientScales?.length ? profile.clientScales : (profile.businessSizes?.length ? profile.businessSizes : (prev.businessSizes?.length ? prev.businessSizes : [...BUSINESS_SIZES])))),
              engagementModels: (profile.pendingData?.engagementModels?.length
                ? profile.pendingData.engagementModels
                : (profile.engagementModels?.length ? profile.engagementModels : (prev.engagementModels?.length ? prev.engagementModels : [...ENGAGEMENT_MODELS]))),
              deliveryChannels: (profile.pendingData?.deliveryChannels?.length
                ? profile.pendingData.deliveryChannels
                : (profile.deliveryChannels?.length ? profile.deliveryChannels : (prev.deliveryChannels?.length ? prev.deliveryChannels : [...OPERATIONAL_MODELS]))),
              pricingModels: (profile.pendingData?.pricingModels?.length
                ? profile.pendingData.pricingModels
                : (profile.pricingStyle?.length ? profile.pricingStyle : (profile.pricingModels?.length ? profile.pricingModels : (prev.pricingModels?.length ? prev.pricingModels : [...PRICING_STYLES])))),
              deliverySpeed: (profile.pendingData?.deliverySpeed?.length
                ? profile.pendingData.deliverySpeed
                : ((Array.isArray(profile.preferredDeliverySpeed) && profile.preferredDeliverySpeed.length) ? profile.preferredDeliverySpeed : (profile.deliverySpeed?.length ? profile.deliverySpeed : (prev.deliverySpeed?.length ? prev.deliverySpeed : [...TURNAROUND_TIMES])))),
              languages: (profile.pendingData?.languages?.length
                ? profile.pendingData.languages
                : (profile.languages?.length ? profile.languages : (prev.languages?.length ? prev.languages : ['Hindi', 'English', 'Marathi']))),
              workSchedule: {
                weeklyHours: profile.pendingData?.workSchedule?.weeklyHours ?? profile.workSchedule?.weeklyHours ?? prev.workSchedule?.weeklyHours ?? 40,
                daysOff: profile.pendingData?.workSchedule?.daysOff ?? profile.workSchedule?.daysOff ?? prev.workSchedule?.daysOff ?? ['Saturday', 'Sunday'],
                availability: profile.pendingData?.workSchedule?.availability ?? profile.workSchedule?.availability ?? prev.workSchedule?.availability ?? {
                  monday: { available: true, from: '10:00', to: '18:00' },
                  tuesday: { available: true, from: '10:00', to: '18:00' },
                  wednesday: { available: true, from: '10:00', to: '18:00' },
                  thursday: { available: true, from: '10:00', to: '18:00' },
                  friday: { available: true, from: '10:00', to: '18:00' },
                  saturday: { available: false, from: '10:00', to: '18:00' },
                  sunday: { available: false, from: '10:00', to: '18:00' }
                },
                instantBooking: profile.pendingData?.workSchedule?.instantBooking ?? profile.workSchedule?.instantBooking ?? true
              },

              // Compliance
              gstRegistered: profile.gstStatus === 'registered' ? 'yes' : (profile.gstStatus === 'not_registered' ? 'no' : prev.gstRegistered),
              gstNumber: profile.gstNumber || prev.gstNumber,
              panNumber: profile.panNumber || prev.panNumber,
              cinNumber: profile.cinNumber || prev.cinNumber,
              llpinNumber: profile.llpinNumber || prev.llpinNumber,
              entityType: profile.entityType || prev.entityType,

              // Address
              addressLine1: profile.registeredAddress?.line1 || prev.addressLine1,
              addressLine2: profile.registeredAddress?.line2 || prev.addressLine2,
              pincode: profile.registeredAddress?.pincode || prev.pincode,
              city: profile.registeredAddress?.city || profile.location?.city || prev.city,
              state: profile.registeredAddress?.state || profile.location?.state || prev.state || 'Maharashtra',
              addressProofUrl: profile.registeredAddress?.proofUrl || prev.addressProofUrl,

              // Bank
              bankName: profile.bankDetails?.bankName || prev.bankName,
              branchName: profile.bankDetails?.branchName || prev.branchName,
              accountNumber: profile.bankDetails?.accountNumber || prev.accountNumber,
              ifscCode: profile.bankDetails?.ifscCode || prev.ifscCode,
              accountHolderName: profile.bankDetails?.accountHolderName || prev.accountHolderName,
              accountType: profile.bankDetails?.accountType || prev.accountType,
              bankProofUrl: profile.bankDetails?.proofUrl || prev.bankProofUrl,
              upiId: profile.bankDetails?.upiId || prev.upiId,

              // Logo (guarantee logoFile and logoUrl are both populated)
              logoUrl: profile.profileImageUrl || profile.logoUrl || profile.pendingData?.logoUrl || profile.pendingData?.logoFile || prev.logoUrl || null,
              logoFile: profile.profileImageUrl || profile.logoUrl || profile.pendingData?.logoFile || profile.pendingData?.logoUrl || prev.logoFile || null,

              // Merge ANY detail from the dedicated draft table (pendingData holds the raw formData blob)
              ...(profile.pendingData || {}),

              // Re-enforce logo & services so empty pendingData cannot wipe them:
              logoFile: profile.profileImageUrl || profile.logoUrl || profile.pendingData?.logoFile || profile.pendingData?.logoUrl || prev.logoFile || null,
              logoUrl: profile.profileImageUrl || profile.logoUrl || profile.pendingData?.logoUrl || profile.pendingData?.logoFile || prev.logoUrl || null,
              servicesDraft: (profile.pendingData?.servicesDraft && profile.pendingData.servicesDraft.length > 0)
                ? profile.pendingData.servicesDraft
                : ((profile.services && profile.services.length > 0) ? profile.services : (prev.servicesDraft || [])),
              industrySectors: (profile.pendingData?.industrySectors && profile.pendingData.industrySectors.length > 0)
                ? profile.pendingData.industrySectors
                : (((profile.industrySectors && profile.industrySectors.length > 0)
                    ? profile.industrySectors
                    : (profile.industrySector ? [profile.industrySector] : (prev.industrySectors || []))
                  ).filter((s) => !['Primary', 'Secondary', 'Tertiary', 'Quaternary'].includes(s))),
              industrySubSectors: resolveSubSectors(
                (profile.pendingData?.industrySectors && profile.pendingData.industrySectors.length > 0)
                  ? profile.pendingData.industrySectors
                  : (((profile.industrySectors && profile.industrySectors.length > 0)
                      ? profile.industrySectors
                      : (profile.industrySector ? [profile.industrySector] : (prev.industrySectors || []))
                    ).filter((s) => !['Primary', 'Secondary', 'Tertiary', 'Quaternary'].includes(s))),
                (profile.pendingData?.industrySubSectors && profile.pendingData.industrySubSectors.length > 0)
                  ? profile.pendingData.industrySubSectors
                  : (profile.subIndustries || profile.industrySubSectors || prev.industrySubSectors || [])
              ),

              // Ensure essential user identity & contact values are never cleared by empty strings in draft:
              email: (profile.pendingData?.email && profile.pendingData.email.trim()) || user?.email || profile.userId?.email || profile.email || prev.email || '',
              mobile: (profile.pendingData?.mobile && profile.pendingData.mobile.trim()) || user?.mobile || profile.userId?.mobile || profile.whatsappNumber || profile.mobile || prev.mobile || '',
              fullName: (profile.pendingData?.fullName && profile.pendingData.fullName.trim()) || user?.name || user?.fullName || prev.fullName || '',
              website: (profile.pendingData?.website && profile.pendingData.website.trim()) || profile.website || prev.website || (extractCorporateDomain(user?.email || profile.userId?.email || profile.email || '') ? `https://${extractCorporateDomain(user?.email || profile.userId?.email || profile.email || '')}` : ''),

              // Ensure arrays are actually arrays even after merge (safety against nulls in DB)
              portfolioItems: (profile.pendingData?.portfolioItems || profile.portfolioItems || prev.portfolioItems || []).map(item => ({
                ...item,
                type: item.type || 'url',
                url: item.url || ''
              })),
              certifications: (profile.pendingData?.certifications || profile.certifications || prev.certifications || []).map(cert => ({
                ...cert,
                title: cert.name || cert.title,
                url: cert.fileUrl || cert.url
              })),
              tools: (profile.pendingData?.tools || profile.tools || prev.tools || []),
              teamMembers: (profile.pendingData?.teamMembers || profile.teamMembers || prev.teamMembers || []).map(m => ({
                ...m,
                experienceYears: m.experience || m.experienceYears,
                photo: m.photoUrl || m.photo
              })),
              testimonials: (profile.pendingData?.testimonials || profile.testimonials || prev.testimonials || []),

              // Document Request Status - Override any pending data
              documentsRequested: profile.documentsRequested,
              documentsRequestedReason: profile.documentsRequestedReason,

              // Documents (Ensure we load existing documents from draft or profile)
              documents: (() => {
                const draftDocs = profile.pendingData?.documents || [];
                const officialDocs = profile.documents || [];

                if (draftDocs.length > 0) {
                  return draftDocs.map(doc => ({
                    type: doc.type || doc.documentType,
                    file: doc.file || null,
                    name: doc.name || (doc.url || doc.fileUrl)?.split('/').pop() || 'Document',
                    url: doc.url || doc.fileUrl,
                    uploadedAt: doc.uploadedAt
                  }));
                }

                return officialDocs.map(doc => ({
                  type: doc.documentType,
                  file: null,
                  name: doc.fileUrl ? doc.fileUrl.split('/').pop() : 'Document',
                  url: doc.fileUrl,
                  uploadedAt: doc.uploadedAt
                }));
              })(),
              gstCertificateUrl: profile.pendingData?.gstCertificateUrl || (profile.documents || []).find(d =>
                d.documentType === 'GST Certificate' ||
                d.documentType === 'gst_certificate' ||
                (d.documentType && d.documentType.toLowerCase().includes('gst'))
              )?.fileUrl,
            }))
          } else {
            setIsDataLoaded(true)
          }
        } catch (err) {
          console.error('Failed to fetch profile draft:', err)
          setIsDataLoaded(true)
        }
      }

      // 3. Fallback to local storage ONLY if user is logged in
      // This prevents data leakage: logged-out users should see a blank form
      if (token && user) {
        const draft = localStorage.getItem('expertRegistrationDraft')
        if (draft) {
          try {
            const parsed = JSON.parse(draft)
            // Only apply localStorage if it doesn't override backend data
            // Backend data takes precedence if it was successfully loaded
            setFormData(prev => ({
              ...prev,
              ...parsed,
              email: (parsed.email && parsed.email.trim()) || prev.email || user?.email || '',
              mobile: (parsed.mobile && parsed.mobile.trim()) || prev.mobile || user?.mobile || '',
              fullName: (parsed.fullName && parsed.fullName.trim()) || prev.fullName || user?.name || user?.fullName || '',
              website: (parsed.website && parsed.website.trim()) || prev.website || (extractCorporateDomain(user?.email || '') ? `https://${extractCorporateDomain(user?.email || '')}` : '')
            }))
          } catch (e) {
            console.error('Failed to parse local draft')
          }
        }
      }
    }
    init()
  }, [user, profileReloadTick, adminMode, targetExpertId]) // Refetch profile when profileReloadTick increments or targetExpertId changes

  // Auto-enrich on dashboard/wizard load if logged in with corporate email and profile is fresh/unpopulated
  useEffect(() => {
    if (!isDataLoaded || !user?.email || isSubmitted || isReadOnlyMode) return
    if (autoEnrichedRef.current.business_email) return

    const corpDomain = extractCorporateDomain(user.email)
    if (!corpDomain) return

    // If profile is fresh (no business name and no service categories yet)
    const isProfileEmpty =
      (!formData.businessName || formData.businessName.trim() === '') &&
      (!formData.servicesDraft || formData.servicesDraft.length === 0)

    if (isProfileEmpty) {
      console.log('✨ Auto-enriching empty corporate profile for:', user.email)
      triggerAutoEnrichment({ email: user.email, triggerSource: 'business_email', force: false })
    }
  }, [isDataLoaded, user?.email, formData.businessName, formData.servicesDraft?.length, isSubmitted, isReadOnlyMode])

  // Clear form data when user navigates away from the page
  useEffect(() => {
    return () => {
      // Only clear if registration is not complete
      // This prevents clearing during normal navigation after successful registration
      if (!isRegistrationComplete && location.pathname !== '/service-expert-register') {
        // User navigated away - clear form unless they explicitly saved
        // Note: We don't auto-clear here to allow user to come back if they saved
        // Form will be fresh on next visit unless explicitly saved
      }
    }
  }, [isRegistrationComplete, location.pathname])

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }

      // Reset verification if email or mobile changes
      if (field === 'email' || field === 'mobile') {
        newData.isEmailVerified = false
      }

      return newData
    })

    // Clear validation error for this field
    setValidationErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      }
      return prev
    })

    // Lock Next button — user must re-save draft after any field change
    if (currentStep > 0) {
      setStepDraftSaved(false)
    }

    scheduleAutoSaveDraftLight()
  }

  // Helper function to render required field label with red asterisk

  const handleMultiSelect = (field, value) => {
    const current = formData[field] || []
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value]
    setFormData({ ...formData, [field]: updated })
    // Lock Next button — user must re-save draft after any field change
    if (currentStep > 0) {
      setStepDraftSaved(false)
    }
    scheduleAutoSaveDraftLight()
  }

  const validateStep = (step, updateState = true) => {
    const errors = {}

    switch (step) {
      case 0:
        if (!formData.fullName.trim()) errors.fullName = 'Full name is required'
        if (!formData.email.trim()) errors.email = 'Work email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format'
        if (!formData.mobile.trim()) {
          errors.mobile = 'Mobile number is required'
        } else if (!MOBILE_REGEX.test(formData.mobile.trim())) {
          errors.mobile = 'Invalid mobile number (10 digits)'
        }
        if (!formData.password) errors.password = 'Password is required'
        else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters'
        else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          errors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
        }
        break
      case 1:
        // Stage 1 validation - matching backend requirements
        if (!formData.businessName?.trim()) errors.businessName = 'Business name is required'
        if (!formData.roleType) errors.roleType = 'Expert role type is required'
        if (!formData.country?.trim()) errors.country = 'Country is required'
        if (!formData.city?.trim()) errors.city = 'City is required'
        if (!formData.about?.trim()) errors.about = 'About section is required'

        // Experience is now required for ALL roles
        if (!formData.experienceStartDate) {
          errors.experienceStartDate = 'Years of experience/operation is required'
        }

        // GST & PAN compulsory selections (PDF Page 3)
        const hasGstSelection = formData.gstRegistered === 'yes' || formData.gstRegistered === 'no' || typeof formData.isGstRegistered === 'boolean';
        if (!hasGstSelection) {
          errors.gstRegistered = 'GST selection (Yes/No) is required';
        }
        const hasPanSelection = formData.panRegistered === 'yes' || formData.panRegistered === 'no' || typeof formData.isPanRegistered === 'boolean';
        if (!hasPanSelection) {
          errors.panRegistered = 'PAN selection (Yes/No) is required';
        }
        break
      case 2:
        if (!formData.servicesDraft || formData.servicesDraft.length === 0) {
          errors.servicesDraft = 'Please add at least one complete service category with specific needs'
          if (!formData.serviceHead) errors.serviceHead = 'Select a service category and click "Add Service"'
        } else {
          const hasInvalidService = formData.servicesDraft.some(
            s => !s.serviceHead || (!s.subFilters || s.subFilters.length === 0)
          )
          if (hasInvalidService) {
            errors.servicesDraft = 'Each service must have at least one specific need (sub-filter) selected'
          }
        }
        const minVal = Number(formData.minEngagementValue)
        if (!minVal || isNaN(minVal) || minVal <= 0) {
          errors.minEngagementValue = 'Minimum engagement / project budget value is required'
        }
        const hasIndustrySector = formData.industrySector || (formData.industrySectors && formData.industrySectors.length > 0)
        if (!hasIndustrySector) errors.industrySectors = 'Select at least one industry sector'

        // Mandatory Work Schedule & Availability (Pages 22-23)
        const avail = formData.workSchedule?.availability ?? {}
        const hasAvailableDay = Object.values(avail).some(
          (d) => d && d.available && d.from && d.to && calculateDayHours(d.from, d.to) >= 0.5
        )
        const weeklyHours = Number(formData.workSchedule?.weeklyHours) || 0
        if (!hasAvailableDay || weeklyHours < 0.5) {
          errors.workSchedule = 'Please configure your work schedule and availability (at least one working day of 30+ minutes is required)'
        }
        break
      case 3:
        // Portfolio is now optional
        // if (formData.portfolioItems.length === 0) errors.portfolioItems = 'Add at least one portfolio item'
        break
      case 4:
        // Compliance section (optional during initial onboarding submission)
        break
      case 5:
        if (!formData.platformAgreement) errors.platformAgreement = 'Platform agreement must be accepted'
        if (!formData.termsAccepted) errors.termsAccepted = 'Terms and conditions must be accepted'
        if (!formData.feeAcknowledgement) errors.feeAcknowledgement = 'Please acknowledge platform fees'
        break
    }

    if (updateState) {
      setValidationErrors(errors)
    }
    return { isValid: Object.keys(errors).length === 0, errors }
  }

  const handleAccountSubmit = async (e) => {
    e.preventDefault()

    if (!formData.fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    if (!formData.email.trim()) {
      toast.error('Work email is required')
      return
    }

    if (!formData.mobile.trim()) {
      toast.error('Mobile number is required')
      return
    }

    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      toast.error('Password must contain at least one lowercase letter, one uppercase letter, and one number')
      return
    }

    setIsLoading(true)

    try {
      // NOTE: register() creates account in backend, but user state is not set until OTP verification
      // This is a backend limitation - account is created but not activated until OTP is verified
      await register({
        name: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        role: 'expert'
      })

      // Send OTP via selected channel
      const response = await apiClient.post('/v1/auth/send-otp', {
        [otpChannel]: otpChannel === 'email' ? formData.email : formData.mobile,
        type: 'email_verification',
        channel: otpChannel,
      })

      if (!response.data.success) {
        const apiError = response.data?.error
        const errorMessage =
          typeof apiError === 'string'
            ? apiError
            : (apiError && typeof apiError === 'object' && apiError.message)
              ? apiError.message
              : response.data?.message || 'Failed to send OTP'
        throw new Error(errorMessage)
      }

      toast.success('OTP sent! Please check your inbox/messages.')
      setShowOTP(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.'
      toast.error(errorMessage)

      // If email is already registered, suggest logging in
      if (errorMessage.toLowerCase().includes('already registered')) {
        toast.info('If you already have an account, please log in first.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)

    try {
      const success = await verifyOTP(otp)
      if (success) {
        toast.success('Email verified successfully!')
        setFormData({ ...formData, isEmailVerified: true })
        setShowOTP(false)
        setOtp('')
        setIsRegistrationComplete(true)

        // Refresh user to get latest verification status and registrationStatus
        await refreshUser()

        // Wait a bit to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 500))

        // Refresh user state again to ensure we have latest data
        await refreshUser()

        // Confirm role and move to Profile step
        // Only proceed if user is verified and has correct role
        const currentUser = user
        if (currentUser?.isVerified && currentUser?.role === 'expert_candidate') {
          await handleConfirmRole()
        } else if (currentUser?.role === 'expert' || currentUser?.isVerified) {
          // Role already confirmed or just verified
          setFormData(prev => ({ ...prev, isEmailVerified: true }))
          setCurrentStep(1)
        } else {
          toast.error('Please verify your email and confirm your expert role')
        }
      } else {
        toast.error('Invalid OTP. Please try again.')
        setOtp('')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed. Please try again.'
      toast.error(errorMessage)
      setOtp('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    try {
      const response = await apiClient.post('/v1/auth/resend-otp', {
        email: formData.email,
        type: 'email_verification',
      })

      if (!response.data.success) {
        const apiError = response.data?.error
        const errorMessage =
          typeof apiError === 'string'
            ? apiError
            : (apiError && typeof apiError === 'object' && apiError.message)
              ? apiError.message
              : response.data?.message || 'Failed to resend OTP'
        throw new Error(errorMessage)
      }

      toast.success('New OTP sent!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP'
      toast.error(errorMessage)
    }
  }

  const handleInitiateEmailChange = async () => {
    if (!formData.email) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsEmailUpdating(true)
    try {
      const response = await apiClient.post('/v1/auth/change-email/initiate', {
        newEmail: formData.email
      })

      if (response.data.success) {
        toast.success('Verification code sent to your new email!')
        setShowEmailOTP(true)
      } else {
        toast.error(response.data.error || 'Failed to initiate email change')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initiate email change')
    } finally {
      setIsEmailUpdating(false)
    }
  }

  const handleVerifyEmailChange = async () => {
    if (emailOTP.length !== 6) {
      toast.error('Please enter a 6-digit verification code')
      return
    }

    setIsEmailUpdating(true)
    try {
      const response = await apiClient.post('/v1/auth/change-email/verify', {
        otp: emailOTP
      })

      if (response.data.success) {
        toast.success('Email updated successfully!')
        setShowEmailOTP(false)
        setEmailOTP('')
        await refreshUser()
      } else {
        toast.error(response.data.error || 'Verification failed')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed')
    } finally {
      setIsEmailUpdating(false)
    }
  }

  const handleResendEmailOTP = async () => {
    await handleInitiateEmailChange()
  }

  const handleConfirmRole = async () => {
    setIsLoading(true)
    try {
      // Ensure user is verified before confirming role
      await refreshUser()
      const currentUser = user

      if (!currentUser?.isVerified) {
        throw new Error('Please verify your email first before confirming your role')
      }

      if (currentUser?.registrationStatus !== 'verified') {
        throw new Error('Registration not verified. Please verify your email first.')
      }

      const response = await apiClient.post('/v1/auth/confirm-role')
      if (response.data.success) {
        // Refresh user to get updated role
        await refreshUser()
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 300))
        setCurrentStep(1) // Move to Profile step
        toast.success('Role confirmed! You can now complete your profile.')
      } else {
        const apiError = response.data?.error
        const errorMessage =
          typeof apiError === 'string'
            ? apiError
            : (apiError && typeof apiError === 'object' && apiError.message)
              ? apiError.message
              : response.data?.message || 'Failed to confirm role'
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Confirmation failed. Please try again.'
      toast.error(errorMessage)
      console.error('Role confirmation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleArrayItem = (arr, setArr, item) => {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item))
    } else {
      setArr([...arr, item])
    }
  }

  const addArrayItem = (arr, setArr) => {
    setArr([...arr, ''])
  }

  const updateArrayItem = (arr, setArr, index, value) => {
    const newArr = [...arr]
    newArr[index] = value
    setArr(newArr)
  }

  const removeArrayItem = (arr, setArr, index) => {
    if (arr.length > 1) {
      setArr(arr.filter((_, i) => i !== index))
    }
  }

  const handleDocumentUpload = (docType) => {
    // Simulate file upload (This function seems unused or legacy placeholder, replacing with actual handler)
    // We will use handleDocumentChange instead for real file inputs
  }

  const handleDocumentChange = (file, docType) => {
    if (!file) return

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`File ${file.name} is too large. Max size is 10MB.`)
      return
    }

    // Eagerly convert to base64 so the url survives draft serialization (File objects are stripped)
    fileToBase64(file).then(base64 => {
      setFormData(prev => {
        const otherDocs = (prev.documents || []).filter(d => d.type !== docType)
        return {
          ...prev,
          documents: [...otherDocs, { type: docType, file: file, name: file.name, url: base64 }]
        }
      })
      scheduleAutoSaveDraftLight()
    }).catch(() => {
      // Fallback: store without base64 (will not persist across sessions but works for this session)
      setFormData(prev => {
        const otherDocs = (prev.documents || []).filter(d => d.type !== docType)
        return {
          ...prev,
          documents: [...otherDocs, { type: docType, file: file, name: file.name }]
        }
      })
      scheduleAutoSaveDraftLight()
    })

    // Clear validation error if it exists
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      return newErrors
    })
  }

  const handleFinalSubmit = async () => {
    // Comprehensive validation before submission - matching backend requirements exactly
    const errors = {}

    // Stage 1 validations (backend: businessName, businessRole, location.country, location.city, aboutSummary)
    if (!formData.businessName?.trim()) errors.businessName = 'Business name is required'
    if (!formData.roleType) errors.roleType = 'Expert role type is required'
    if (!formData.country?.trim()) errors.country = 'Country is required'
    if (!formData.city?.trim()) errors.city = 'City is required'
    if (!formData.about?.trim()) errors.about = 'About section is required'

    // Role-specific validations for Stage 1 (backend requirements)
    if (!formData.experienceStartDate) {
      errors.experienceStartDate = 'Years of experience/operation is required'
    } else {
      try {
        const startDate = new Date(formData.experienceStartDate)
        const today = new Date()
        if (isNaN(startDate.getTime()) || startDate > today) {
          errors.experienceStartDate = 'Please select a valid start date'
        }
      } catch (e) {
        errors.experienceStartDate = 'Invalid date format'
      }
    }

    // Stage 2 validations (backend: at least one category required)
    // Check if we have drafted services OR current selections
    const hasServices = (formData.servicesDraft && formData.servicesDraft.length > 0);

    if (!hasServices) {
      const hasInputs = formData.serviceHead || (formData.primaryFilters && formData.primaryFilters.length > 0);

      if (hasInputs) {
        // User has inputs but didn't add service
        if (!formData.serviceHead) errors.serviceHead = 'Select a service category';
        if (!formData.primaryFilters || formData.primaryFilters.length === 0) {
          errors.primaryFilters = 'Select at least one focus area';
        }
        // If both are present, the main issue is they didn't click Add Service
        if (formData.serviceHead && formData.primaryFilters && formData.primaryFilters.length > 0) {
          errors.servicesDraft = 'Please click "Add Service" in the Expertise step to save your selection';
        }
      } else {
        // Nothing added, nothing filled
        errors.serviceHead = 'Select a service category';
        errors.primaryFilters = 'Select at least one focus area';
      }
    }

    const hasIndustry = formData.industrySector || (formData.industrySectors && formData.industrySectors.length > 0)
    if (!hasIndustry) {
      errors.industrySectors = 'Select at least one Industry Sector (Market Fit)'
    }

    // Consent & declaration validation
    if (!formData.platformAgreement) errors.platformAgreement = 'Platform agreement must be accepted'
    if (!formData.termsAccepted) errors.termsAccepted = 'Terms and conditions must be accepted'
    if (!formData.feeAcknowledgement) errors.feeAcknowledgement = 'Platform fee acknowledgement is required'
    if (!formData.infoAccurate) errors.infoAccurate = 'Information accuracy confirmation is required'

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      // Show specific error messages to help user identify missing fields
      const errorFields = Object.keys(errors)
      const errorMessages = errorFields.slice(0, 5).map(field => {
        // Convert field names to readable format
        const readableNames = {
          businessName: 'Business Name',
          roleType: 'Expert role type',
          country: 'Country',
          city: 'City',
          about: 'About Section',
          experienceStartDate: 'Experience Start Date',
          businessBackground: 'Business Background',
          serviceHead: 'Service Category',
          primaryFilters: 'Service Focus Area',
          subFilters: 'Specific Needs',
          industrySectors: 'Target Industry Sectors',
          entityType: 'Entity Type',
          subEntityType: 'Sub-Entity Type',
          panNumber: 'PAN Number',
          addressLine1: 'Address Line 1',
          state: 'State',
          pincode: 'Pincode',
          accountHolderName: 'Account Holder Name',
          bankName: 'Bank Name',
          accountNumber: 'Account Number',
          ifscCode: 'IFSC Code',
          platformAgreement: 'Platform Agreement',
          termsAccepted: 'Terms & Conditions',
          feeAcknowledgement: 'Platform Fee Acknowledgement'
        }
        return readableNames[field] || field
      }).join(', ')

      toast.error(`Please fill: ${errorMessages}${errorFields.length > 5 ? ` and ${errorFields.length - 5} more` : ''}`)
      console.error('Validation errors:', errors)
      console.error('Form data state:', {
        businessName: formData.businessName,
        roleType: formData.roleType,
        country: formData.country,
        city: formData.city,
        state: formData.state,
        about: formData.about?.substring(0, 50),
        serviceHead: formData.serviceHead,
        primaryFilters: formData.primaryFilters,
        industrySectors: formData.industrySectors,
        entityType: formData.entityType,
        subEntityType: formData.subEntityType,
        panNumber: formData.panNumber,
        addressLine1: formData.addressLine1,
        pincode: formData.pincode,
        accountHolderName: formData.accountHolderName,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        platformAgreement: formData.platformAgreement,
        termsAccepted: formData.termsAccepted,
        feeAcknowledgement: formData.feeAcknowledgement
      })
      return
    }

    // Check if user is authenticated
    if (!user) {
      toast.error('Please log in to continue. You need to be authenticated to submit your profile.')
      navigate('/login')
      return
    }

    // Check if user has verified their email
    // Note: user.isVerified comes from AuthContext and maps to isEmailVerified from backend
    // Refresh user to get latest status first
    await refreshUser()

    // Check if email is verified - use formData.isEmailVerified as fallback
    // since user object might not be updated immediately after OTP verification
    const isEmailVerified = user?.isVerified || formData.isEmailVerified

    if (!isEmailVerified) {
      toast.error('Please verify your email first before submitting your profile.')
      return
    }

    // Check if user has the correct role
    if (user.role !== 'expert' && user.role !== 'expert_candidate') {
      toast.error('You must be registered as an expert to submit this form.')
      navigate('/service-expert-register')
      return
    }

    // Strict validation of mandatory stages before final submission
    const step1Validation = validateStep(1, true)
    if (!step1Validation.isValid) {
      const firstError = Object.values(step1Validation.errors)[0]
      toast.error(firstError || 'Please complete all required fields in Business Profile (Step 1)')
      setCurrentStep(isDashboard ? 2 : 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const step2Validation = validateStep(2, true)
    if (!step2Validation.isValid) {
      const firstError = Object.values(step2Validation.errors)[0]
      toast.error(firstError || 'Please complete all required fields in Expertise & Services (Step 2)')
      setCurrentStep(isDashboard ? 3 : 2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const step5Validation = validateStep(5, true)
    if (!step5Validation.isValid) {
      const firstError = Object.values(step5Validation.errors)[0]
      toast.error(firstError || 'Please accept all agreements before submitting.')
      setCurrentStep(isDashboard ? 6 : 5)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsLoading(true)
    try {
      // Confirm role first (only if user is not already an expert)
      // Skip if user is already an expert or if registration is not verified
      // Check if user is verified (either from user object or formData)
      const isVerified = user?.isVerified || formData.isEmailVerified
      const registrationStatus = user?.registrationStatus || (isVerified ? 'verified' : 'registration_started')

      if (user.role === 'expert_candidate' && (registrationStatus === 'verified' || isVerified)) {
        try {
          const roleResponse = await apiClient.post('/v1/auth/confirm-role')
          if (roleResponse.data.success) {
            await refreshUser()
            // Wait a moment for the token to be updated
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (roleError) {
          // If confirm-role fails, check the error
          const errorMsg = roleError?.response?.data?.error || roleError.message
          console.warn('Role confirmation skipped:', errorMsg)

          // If registration is not verified, show error
          if (errorMsg.includes('not verified') || errorMsg.includes('Registration not verified')) {
            toast.error('Please verify your email first before submitting your profile.')
            setIsLoading(false)
            return
          }

          // For other errors, continue anyway (user might already be an expert)
        }
      } else if (user.role !== 'expert' && user.role !== 'expert_candidate') {
        toast.error('You must be registered as an expert to submit this form.')
        setIsLoading(false)
        return
      }

      toast.info('Converting files to base64...')

      // Convert all files to base64
      toast.info('Processing all items and files...', { duration: 3000 })

      // OPTIMIZED: Parallel File Conversion
      const convertFilesParallel = async () => {
        const conversions = {}
        const tasks = []

        // Helper to safely convert file
        const safeConvert = async (file, key) => {
          if (!file) return;

          // If already a base64 string (from draft), extract the base64 part
          if (typeof file === 'string' && file.startsWith('data:')) {
            const base64 = file.split(',')[1] || file;
            conversions[key] = { base64, mimeType: file.split(';')[0].split(':')[1] || 'application/octet-stream', fileName: 'cached_file' };
            return;
          }

          if (file instanceof Blob) {
            try {
              let base64;
              if (file.type.startsWith('image/')) {
                // Compress images to keep payload manageable
                base64 = await compressImage(file, 1200, 0.7);
              } else {
                base64 = await fileToBase64(file);
              }
              conversions[key] = { base64, mimeType: file.type, fileName: file.name };
            } catch (err) {
              console.error(`Failed to convert file for key ${key}:`, err);
            }
          }
        }

        // 1. Portfolio items
        formData.portfolioItems?.forEach((item, i) => {
          if (item.file) tasks.push(safeConvert(item.file, `portfolio_${item.url || item.file.name || i}`));
        });

        // 2. Certifications 
        formData.certifications?.forEach((cert, i) => {
          if (cert.file) tasks.push(safeConvert(cert.file, `cert_${cert.title || cert.file.name || i}`));
        });

        // 3. Team members
        formData.teamMembers?.forEach((member, i) => {
          if (member.photo) tasks.push(safeConvert(member.photo, `team_${member.name || i}`));
        });

        // 4. Testimonials
        formData.testimonials?.forEach((testimonial, i) => {
          if (testimonial.file) tasks.push(safeConvert(testimonial.file, `testimonial_${testimonial.url || testimonial.file.name || i}`));
        });

        // 5. Documents
        formData.documents?.forEach((doc, i) => {
          if (doc.file) tasks.push(safeConvert(doc.file, `doc_${doc.type || doc.file.name || i}`));
        });

        // 6. Identity & Compliance
        if (formData.gstRegistered === 'yes' && formData.gstCertificateFile) {
          tasks.push(safeConvert(formData.gstCertificateFile, 'address_proof'));
          tasks.push(safeConvert(formData.gstCertificateFile, 'gst_certificate'));
        } else if (formData.addressProofFile) {
          tasks.push(safeConvert(formData.addressProofFile, 'address_proof'));
        }

        if (formData.bankProofFile) tasks.push(safeConvert(formData.bankProofFile, 'bank_proof'));
        if (formData.logoFile) tasks.push(safeConvert(formData.logoFile, 'logo'));
        if (formData.profileImageFile) tasks.push(safeConvert(formData.profileImageFile, 'profile_image'));

        formData.complianceBadges?.proofFiles?.forEach((file, i) => {
          tasks.push(safeConvert(file, `compliance_proof_${i}`));
        });

        await Promise.all(tasks);
        return conversions;
      }

      const fileConversions = await convertFilesParallel()

      // Calculate years of experience
      let yearsOfExperience = undefined
      if (formData.experienceStartDate) {
        try {
          const startDate = new Date(formData.experienceStartDate)
          const today = new Date()
          // Set today to start of day for accurate comparison
          today.setHours(0, 0, 0, 0)
          startDate.setHours(0, 0, 0, 0)

          if (isNaN(startDate.getTime())) {
            console.error('Invalid date format:', formData.experienceStartDate)
            yearsOfExperience = undefined
          } else if (startDate > today) {
            console.error('Future date not allowed:', formData.experienceStartDate)
            yearsOfExperience = undefined
          } else {
            const diffTime = today.getTime() - startDate.getTime()
            // Calculate exact years as float (1 decimal) to allow counting months
            const yearsFloat = diffTime / (365.25 * 24 * 60 * 60 * 1000)
            yearsOfExperience = Math.max(0, parseFloat(yearsFloat.toFixed(1)))

            // Log for debugging
            console.log('Years calculation:', { diffTime, yearsFloat, yearsOfExperience })
          }
        } catch (error) {
          console.error('Error calculating years of experience:', error)
          // If calculation fails, yearsOfExperience remains undefined
          yearsOfExperience = undefined
        }
      }

      // STAGE 1, 2, 3, 4 Data Preparation
      const servicesDraft = formData.servicesDraft || []
      const categories = [...new Set(servicesDraft.map(s => s.serviceHead))].filter(Boolean)
      const subServices = [...new Set(servicesDraft.flatMap(s => [...s.primaryFilters, ...s.subFilters]))].filter(Boolean)

      const stage1 = {
        legalName: formData.legalName?.trim() || formData.businessName.trim(),
        businessName: formData.businessName.trim(),
        legalSameAsBrand: Boolean(formData.legalSameAsBrand),
        brandAlias: formData.alias?.trim() || undefined,
        businessRole: formData.roleType,
        entityType: formData.entityType || 'individual',
        isGstRegistered: Boolean(formData.isGstRegistered || formData.gstRegistered === 'yes'),
        isPanRegistered: Boolean(formData.isPanRegistered || formData.panRegistered === 'yes' || !!formData.panNumber),
        gstRegistered: (formData.isGstRegistered || formData.gstRegistered === 'yes') ? 'yes' : 'no',
        panRegistered: (formData.isPanRegistered || formData.panRegistered === 'yes' || !!formData.panNumber) ? 'yes' : 'no',
        gstStatus: (formData.isGstRegistered || formData.gstRegistered === 'yes') ? 'registered' : 'not_registered',
        panNumber: formData.panNumber ? formData.panNumber.trim().toUpperCase() : '',
        gstNumber: formData.gstNumber ? formData.gstNumber.trim().toUpperCase() : '',
        experienceStartDate: formData.experienceStartDate,
        mobile: formData.mobile?.trim() || undefined,
        location: {
          country: formData.country?.trim() || 'India',
          state: formData.state || 'Maharashtra',
          city: formData.city?.trim() || ''
        },
        logoUrl: fileConversions['logo'] ? `data:${fileConversions['logo'].mimeType};base64,${fileConversions['logo'].base64}` : (formData.logoUrl || undefined),
        profileImageUrl: fileConversions['profile_image'] ? `data:${fileConversions['profile_image'].mimeType};base64,${fileConversions['profile_image'].base64}` : (formData.profileImageUrl || undefined),
        website: formData.website?.trim() || undefined,
        aboutSummary: formData.about.trim(),
        yearsExperience: yearsOfExperience,
        businessBackground: formData.businessBackground?.trim() || undefined,
      };

      const stage2 = {
        categories, subServices, services: servicesDraft,
        industrySectors: (formData.industrySectors || []).filter((s) => !['Primary', 'Secondary', 'Tertiary', 'Quaternary'].includes(s)),
        subIndustries: formData.industrySubSectors || [],
        serviceDeliveryStates: formData.serviceDeliveryStates || [],
        panIndiaAvailable: (formData.serviceDeliveryStates && formData.serviceDeliveryStates.length > 0) ? false : !!formData.panIndiaAvailable,
        clientEngagementTypes: formData.businessRelationshipTypes || [],
        businessTypesServed: formData.businessTypes || [],
        clientScales: formData.businessSizes || [],
        engagementModels: formData.engagementModels || [],
        deliveryChannels: formData.deliveryChannels || [],
        pricingStyle: (formData.pricingModels?.length > 0) ? formData.pricingModels : ['To Be Discussed'],
        preferredDeliverySpeed: formData.deliverySpeed || [],
        languages: formData.languages || [],
        minEngagementValue: formData.minEngagementValue !== undefined && formData.minEngagementValue !== '' ? Number(formData.minEngagementValue) : 0,
        minEngagementUnit: formData.minEngagementUnit || 'Per Project',
        availability: {
          weeklyWorkingHours: Number(formData.workSchedule?.weeklyHours) || 0,
          daysOff: formData.workSchedule?.daysOff || [],
          availableForInstantBooking: !!formData.workSchedule?.instantBooking,
          ...(formData.workSchedule?.availability || {})
        }
      };

      const stage3 = {
        portfolioItems: (formData.portfolioItems || [])
          .map((item, i) => {
            const conv = fileConversions[`portfolio_${item.url || item.file?.name || i}`];
            const resolvedUrl = conv ? `data:${conv.mimeType};base64,${conv.base64}` : (item.url || '');
            return {
              title: item.title || item.file?.name || 'Portfolio Item',
              type: item.type || (item.file?.type?.includes('image') ? 'image' : item.file?.type?.includes('video') ? 'video' : 'url'),
              url: resolvedUrl,
              description: item.description || ''
            };
          })
          .filter(item => Boolean(item.url && item.url.trim())),
        certifications: (formData.certifications || []).map((cert, i) => {
          const conv = fileConversions[`cert_${cert.title || cert.file?.name || i}`];
          return {
            name: cert.title,
            issuer: cert.issuer || 'Unknown',
            year: parseInt(cert.year) || new Date().getFullYear(),
            fileUrl: conv ? `data:${conv.mimeType};base64,${conv.base64}` : cert.url,
            verificationUrl: cert.verificationUrl
          };
        }),
        tools: formData.tools || [],
        teamMembers: (formData.teamMembers || []).map((m, i) => {
          const conv = fileConversions[`team_${m.name || i}`];
          return {
            ...m,
            experience: m.experienceYears || 0,
            photoUrl: conv ? `data:${conv.mimeType};base64,${conv.base64}` : m.photo
          };
        }),
        testimonials: (formData.testimonials || []).map((t, i) => {
          const conv = fileConversions[`testimonial_${t.url || t.file?.name || i}`];
          const rawLower = (t.platform || 'other').toLowerCase();
          const validSource = ['google', 'clutch', 'linkedin', 'instagram', 'facebook', 'twitter', 'youtube', 'trustpilot', 'other'].includes(rawLower) ? rawLower : (rawLower === 'x' ? 'twitter' : 'other');
          return {
            type: t.type || 'screenshot',
            source: validSource,
            url: conv ? `data:${conv.mimeType};base64,${conv.base64}` : (t.url || undefined),
            content: t.content
          };
        })
      };

      const stage4 = {
        entityType: formData.entityType,
        subEntityType: formData.roleType,
        gstStatus: formData.gstRegistered === 'yes' ? 'registered' : 'not_registered',
        panNumber: formData.panNumber,
        gstNumber: formData.gstNumber,
        cinNumber: formData.cinNumber,
        llpinNumber: formData.llpinNumber,
        documents: [
          ...(formData.documents || []).map((doc, i) => {
            const conv = fileConversions[`doc_${doc.type || doc.name || i}`];
            return {
              documentType: doc.type || 'Other',
              fileUrl: conv ? `data:${conv.mimeType};base64,${conv.base64}` : doc.url,
              verified: false,
              uploadedAt: doc.uploadedAt || new Date()
            };
          }),
          // Add GST Certificate if present
          ...(formData.gstRegistered === 'yes' && fileConversions['gst_certificate'] ? [{
            documentType: 'GST Certificate',
            fileUrl: `data:${fileConversions['gst_certificate'].mimeType};base64,${fileConversions['gst_certificate'].base64}`,
            verified: false,
            uploadedAt: new Date()
          }] : (formData.gstRegistered === 'yes' && formData.gstCertificateUrl ? [{
            documentType: 'GST Certificate',
            fileUrl: formData.gstCertificateUrl,
            verified: false,
            uploadedAt: new Date()
          }] : []))
        ],
        registeredAddress: {
          line1: formData.addressLine1,
          line2: formData.addressLine2 || undefined,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country,
          proofUrl: fileConversions['address_proof'] ? `data:${fileConversions['address_proof'].mimeType};base64,${fileConversions['address_proof'].base64}` : (formData.addressProofUrl || undefined)
        },
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          branchName: formData.branchName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          accountType: formData.accountType,
          proofUrl: fileConversions['bank_proof'] ? `data:${fileConversions['bank_proof'].mimeType};base64,${fileConversions['bank_proof'].base64}` : (formData.bankProofUrl || undefined),
          upiId: formData.upiId
        },
        consentAgreements: {
          accepted: formData.termsAccepted && formData.platformAgreement && formData.feeAcknowledgement,
          version: '1.0'
        }
      };

      const {
        weeklyWorkingHours: wsHours,
        daysOff: wsDaysOff,
        availableForInstantBooking: wsInstant,
        ...dayAvailabilityMap
      } = stage2.availability || {}

      if (isDashboard && expertProfileIsVerified) {
        const { expertService } = await import('@/services/expertService')
        const portfolioUrlList = (stage3.portfolioItems || []).map((p) => p.url).filter(Boolean)
        await expertService.updateProfile({
          profileSelfServiceScope: 'verified_wizard',
          displayName: stage1.businessName,
          bio: stage1.aboutSummary,
          businessName: stage1.businessName,
          brandAlias: stage1.brandAlias,
          businessRole: stage1.businessRole,
          businessBackground: stage1.businessBackground,
          website: stage1.website,
          yearsExperience: stage1.yearsExperience,
          location: stage1.location,
          profileImageUrl: stage1.profileImageUrl,
          categories,
          services: servicesDraft,
          industrySectors: stage2.industrySectors,
          subIndustries: stage2.subIndustries,
          serviceDeliveryStates: stage2.serviceDeliveryStates,
          panIndiaAvailable: stage2.panIndiaAvailable,
          clientEngagementTypes: stage2.clientEngagementTypes,
          businessTypesServed: stage2.businessTypesServed,
          clientScales: stage2.clientScales,
          engagementModels: stage2.engagementModels,
          deliveryChannels: stage2.deliveryChannels,
          preferredDeliverySpeed: stage2.preferredDeliverySpeed,
          languages: stage2.languages,
          pricingStyle: stage2.pricingStyle,
          weeklyWorkingHours: wsHours,
          daysOff: wsDaysOff,
          availableForInstantBooking: wsInstant,
          availability: dayAvailabilityMap,
          certifications: stage3.certifications,
          portfolioItems: stage3.portfolioItems,
          ...(portfolioUrlList.length > 0 ? { portfolioUrls: portfolioUrlList } : {}),
          tools: stage3.tools,
          teamMembers: stage3.teamMembers,
          testimonials: stage3.testimonials,
          mobileNumber: formData.mobile?.trim() || undefined,
        })

        toast.success('Profile saved.')
        setProfileReloadTick((t) => t + 1)
        setLoadedProfileStatus('verified')
        setIsLoading(false)
        return
      }

      // FINAL SUBMISSION: Optimized Bulk Save
      toast.info('Finalizing profile and submitting for review...', { duration: 5000 });
      // Early acknowledge welcome so it never displays or flashes
      try { await acknowledgeWelcome(); } catch (_) {}

      const response = await apiClient.post('/v1/expert/onboarding/bulk-submit', { stage1, stage2, stage3, stage4 });

      if (response.data.success) {
        setExpertId(response.data.data.expertId);
        setIsSubmitted(true);
        setLoadedProfileStatus('submitted_for_verification');
        setCurrentStep(5);
        localStorage.removeItem('expertRegistrationDraft');
        // Ensure welcome modal is dismissed and sync profile status into AuthContext
        try { await acknowledgeWelcome(); } catch (_) {}
        try { await refreshUser(); } catch (_) {}
        const assignedId = response.data?.data?.expertId;
        if (assignedId) {
          toast.success(`Profile submitted successfully! Expert ID: ${assignedId}`);
        } else {
          toast.success('Profile submitted successfully for admin review!');
        }
      } else {
        throw new Error(response.data.error || 'Bulk submission failed');
      }
    } catch (error) {
      // Improved error handling to show actual backend error messages
      const backendError = error.response?.data?.error;
      let errorMessage = 'Submission failed. Please try again.';
      let description = undefined;

      if (backendError) {
        if (typeof backendError === 'string') {
          errorMessage = backendError;
        } else if (backendError.message) {
          errorMessage = backendError.message;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (error.response?.data?.missingFields) {
        description = `Missing fields: ${error.response.data.missingFields.join(', ')}`;
      }

      toast.error(errorMessage, {
        duration: 8000,
        description: description
      });

      console.error('Submission error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
        error: error
      });
    } finally {
      setIsLoading(false)
    }
  }



  // Helper function to clear all form data
  const clearFormData = () => {
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      password: '',
      isEmailVerified: false,
      businessName: '',
      alias: '',
      roleType: 'Independent Consultant',
      website: '',
      about: '',
      experienceStartDate: '',
      businessBackground: '',
      serviceHead: '',
      primaryFilters: [],
      subFilters: [],
      industrySectors: [],
      industrySubSectors: [],
      serviceDeliveryStates: [],
      panIndiaAvailable: false,
      businessRelationshipTypes: [],
      businessTypes: [],
      businessSizes: [],
      engagementModels: [],
      deliveryChannels: [],
      pricingModels: [],
      deliverySpeed: [],
      languages: [],
      weeklyAvailability: 40,
      workSchedule: {
        weeklyHours: 40,
        daysOff: ['Saturday', 'Sunday'],
        availability: {
          monday: { available: true, from: '10:00', to: '18:00' },
          tuesday: { available: true, from: '10:00', to: '18:00' },
          wednesday: { available: true, from: '10:00', to: '18:00' },
          thursday: { available: true, from: '10:00', to: '18:00' },
          friday: { available: true, from: '10:00', to: '18:00' },
          saturday: { available: false, from: '10:00', to: '18:00' },
          sunday: { available: false, from: '10:00', to: '18:00' }
        },
        instantBooking: false
      },
      portfolioItems: [],
      certifications: [],
      tools: [],
      teamMembers: [],
      testimonials: [],
      entityType: 'individual',
      subEntityType: 'Independent Consultant',
      logoFile: null,
      documents: [],
      panNumber: '',
      gstNumber: '',
      cinNumber: '',
      llpinNumber: '',
      gstApplicable: false,
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      addressProofFile: null,
      bankName: '',
      branchName: '',
      accountNumber: '',
      ifscCode: '',
      accountType: 'savings',
      accountHolderName: '',
      bankProofFile: null,
      upiId: '',
      termsAccepted: false,
      platformAgreement: false,
      servicesDraft: [],
      currentServiceEditIndex: null
    })
    setCurrentStep(0)
    setShowOTP(false)
    setOtp('')
    setIsRegistrationComplete(false)
    setValidationErrors({})
    localStorage.removeItem('expertRegistrationDraft')
  }

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    })
  }

  const canProceed = () => {
    // If already submitted, cannot proceed
    if (isSubmitted) {
      return false
    }
    return validateStep(currentStep, false).isValid
  }

  const handleNext = () => {
    // Step 0: Account setup - handled by handleAccountSubmit
    if (currentStep === 0) {
      return
    }

    // Require Save Draft before proceeding (steps 1-4)
    if (!adminMode && !stepDraftSaved) {
      toast.error('Please save your draft before proceeding to the next step.')
      return
    }

    // Validate current step
    const { isValid, errors } = validateStep(currentStep, true) // Update validation errors

    if (isValid || adminMode) {
      if (adminMode && currentStep >= 3) {
        handleDashboardSectionSave('portfolio')
        return
      }
      // If moving from Profile (Step 1) to Expertise (Step 2) with no services yet, trigger Tier 3 bio classification
      if (currentStep === 1 && (!formData.servicesDraft || formData.servicesDraft.length === 0) && formData.about?.trim().length >= 25) {
        triggerAutoEnrichment({ aboutText: formData.about, triggerSource: 'about_summary' })
      }
      const nextStep = currentStep + 1
      if (!adminMode) {
        autoSaveDraftLight(nextStep)
        setStepDraftSaved(false) // Reset for next step
      }
      setCurrentStep(nextStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Show validation errors to user
      if (Object.keys(errors).length > 0) {
        const errorMessages = Object.values(errors).slice(0, 3).join(', ')
        toast.error(`Please fix: ${errorMessages}${Object.keys(errors).length > 3 ? '...' : ''}`)
        console.error('❌ Step validation failed for step', currentStep, ':', errors)
      }
    }
  }

  /**
   * Verified experts: save Profile, Expertise, or Portfolio without admin approval (uses profileSelfServiceScope on API).
   */
  const handleDashboardSectionSave = async (scope) => {
    if (!isDashboard || !expertProfileIsVerified) return
    const step = scope === 'profile' ? 1 : scope === 'expertise' ? 2 : 3
    const { isValid, errors } = validateStep(step, true)
    if (!isValid) {
      const errorMessages = Object.values(errors).slice(0, 3).join(', ')
      toast.error(
        errorMessages
          ? `Please fix: ${errorMessages}${Object.keys(errors).length > 3 ? '...' : ''}`
          : 'Please complete the required fields before saving.'
      )
      return
    }

    setDashboardSectionSaving(scope)
    try {
      if (adminMode) {
        if (!targetExpertId) {
          toast.error('Expert ID missing for admin update')
          return
        }
        const { adminService } = await import('@/services/adminService')
        const userUpdates = {
          fullName: (formData.legalName || formData.businessName || formData.fullName || '').trim(),
          name: (formData.legalName || formData.businessName || formData.fullName || '').trim(),
          email: (formData.email || '').trim(),
          mobile: (formData.mobile || '').trim(),
        }

        let profileUpdates = {}

        if (scope === 'profile') {
          let logoDataUrl = formData.logoFile;
          if (formData.logoFile instanceof Blob) {
            try {
              const base64 = await compressImage(formData.logoFile, 600, 0.7);
              logoDataUrl = `data:${formData.logoFile.type || 'image/jpeg'};base64,${base64}`;
            } catch (e) {
              console.error('Logo conversion failed', e);
            }
          }

          profileUpdates = {
            displayName: formData.businessName || formData.legalName,
            businessName: formData.businessName || formData.legalName,
            legalName: formData.legalName || formData.businessName,
            brandAlias: formData.alias,
            businessRole: formData.roleType,
            entityType: formData.entityType,
            website: formData.website,
            bio: formData.about,
            aboutSummary: formData.about,
            experienceStartDate: formData.experienceStartDate,
            location: {
              country: formData.country || 'India',
              state: formData.state || 'Maharashtra',
              city: formData.city || ''
            },
            isGstRegistered: typeof formData.isGstRegistered === 'boolean' ? formData.isGstRegistered : formData.gstRegistered === 'yes',
            isPanRegistered: typeof formData.isPanRegistered === 'boolean' ? formData.isPanRegistered : formData.panRegistered === 'yes' || !!formData.panNumber,
            panNumber: formData.panNumber ? formData.panNumber.trim().toUpperCase() : '',
            gstStatus: (formData.isGstRegistered || formData.gstRegistered === 'yes') ? 'registered' : 'not_registered',
            gstNumber: formData.gstNumber ? formData.gstNumber.trim().toUpperCase() : '',
            cinNumber: formData.cinNumber ? formData.cinNumber.trim().toUpperCase() : '',
            llpinNumber: formData.llpinNumber ? formData.llpinNumber.trim().toUpperCase() : '',
            ...(logoDataUrl ? { profileImageUrl: logoDataUrl, logoUrl: logoDataUrl } : {})
          }
        } else if (scope === 'expertise') {
          const servicesDraft = formData.servicesDraft || []
          const categories = [...new Set(servicesDraft.map((s) => s.serviceHead))].filter(Boolean)
          const subServices = [
            ...new Set(servicesDraft.flatMap((s) => [...(s.primaryFilters || []), ...(s.subFilters || [])])),
          ].filter(Boolean)

          const stage2Avail = {
            weeklyWorkingHours: Number(formData.workSchedule?.weeklyHours) || 0,
            daysOff: formData.workSchedule?.daysOff || [],
            availableForInstantBooking: !!formData.workSchedule?.instantBooking,
            ...(formData.workSchedule?.availability || {}),
          }
          const { weeklyWorkingHours, daysOff, availableForInstantBooking, ...availability } = stage2Avail

          profileUpdates = {
            categories,
            subServices,
            services: servicesDraft,
            industrySectors: formData.industrySectors || [],
            subIndustries: formData.industrySubSectors || [],
            serviceDeliveryStates: formData.panIndiaAvailable ? [] : formData.serviceDeliveryStates || [],
            serviceArea: formData.panIndiaAvailable ? ['Pan India'] : formData.serviceDeliveryStates || [],
            panIndiaAvailable: !!formData.panIndiaAvailable,
            minEngagementValue: formData.minEngagementValue ? Number(formData.minEngagementValue) : undefined,
            minEngagementUnit: formData.minEngagementUnit || 'Per Project',
            clientEngagementTypes: formData.businessRelationshipTypes || [],
            businessTypesServed: formData.businessTypes || [],
            clientScales: formData.businessSizes || [],
            engagementModels: formData.engagementModels || [],
            deliveryChannels: formData.deliveryChannels || [],
            pricingStyle: formData.pricingModels?.length > 0 ? formData.pricingModels : ['To Be Discussed'],
            preferredDeliverySpeed: formData.deliverySpeed || [],
            languages: formData.languages || [],
            workSchedule: formData.workSchedule,
            weeklyWorkingHours,
            daysOff,
            availableForInstantBooking,
            availability,
          }
        } else {
          // portfolio
          const conversions = {}
          const tasks = []

          const safeConvert = async (file, key) => {
            if (!file) return
            if (typeof file === 'string' && file.startsWith('data:')) {
              const base64 = file.split(',')[1] || file
              conversions[key] = {
                base64,
                mimeType: file.split(';')[0].split(':')[1] || 'application/octet-stream',
                fileName: 'cached_file',
              }
              return
            }
            if (file instanceof Blob) {
              try {
                let base64
                if (file.type.startsWith('image/')) {
                  base64 = await compressImage(file, 1200, 0.7)
                } else {
                  base64 = await fileToBase64(file)
                }
                conversions[key] = { base64, mimeType: file.type, fileName: file.name }
              } catch (err) {
                console.error(`Failed to convert file for key ${key}:`, err)
              }
            }
          }

          formData.portfolioItems?.forEach((item, i) => {
            if (item.file) tasks.push(safeConvert(item.file, `portfolio_${item.url || item.file.name || i}`))
          })
          formData.certifications?.forEach((cert, i) => {
            if (cert.file) tasks.push(safeConvert(cert.file, `cert_${cert.title || cert.file?.name || i}`))
          })
          formData.teamMembers?.forEach((member, i) => {
            if (member.photo) tasks.push(safeConvert(member.photo, `team_${member.name || i}`))
          })
          formData.testimonials?.forEach((testimonial, i) => {
            if (testimonial.file) {
              tasks.push(
                safeConvert(testimonial.file, `testimonial_${testimonial.url || testimonial.file.name || i}`)
              )
            }
          })

          await Promise.all(tasks)

          const certifications = (formData.certifications || []).map((cert, i) => {
            const conv = conversions[`cert_${cert.title || cert.file?.name || i}`]
            return {
              name: cert.title,
              issuer: cert.issuer || 'Unknown',
              year: parseInt(cert.year, 10) || new Date().getFullYear(),
              fileUrl: conv ? `data:${conv.mimeType};base64,${conv.base64}` : cert.url,
              verificationUrl: cert.verificationUrl,
            }
          })

          const portfolioItems = (formData.portfolioItems || [])
            .map((item, i) => {
              const conv = conversions[`portfolio_${item.url || item.file?.name || i}`]
              const resolvedUrl = conv ? `data:${conv.mimeType};base64,${conv.base64}` : (item.url || '')
              return {
                title: item.title || item.file?.name || 'Portfolio Item',
                type:
                  item.type ||
                  (item.file?.type?.includes('image') ? 'image' : item.file?.type?.includes('video') ? 'video' : 'url'),
                url: resolvedUrl,
                description: item.description || '',
              }
            })
            .filter(item => Boolean(item.url && item.url.trim()))

          const teamMembers = (formData.teamMembers || []).map((m, i) => {
            const conv = conversions[`team_${m.name || i}`]
            return {
              ...m,
              experience: m.experienceYears || 0,
              photoUrl: conv ? `data:${conv.mimeType};base64,${conv.base64}` : m.photo,
            }
          })

          const testimonials = (formData.testimonials || []).map((t, i) => {
            const conv = conversions[`testimonial_${t.url || t.file?.name || i}`]
            const rawLower = (t.platform || 'other').toLowerCase()
            const validSource = ['google', 'clutch', 'linkedin', 'instagram', 'facebook', 'twitter', 'youtube', 'trustpilot', 'other'].includes(
              rawLower
            )
              ? rawLower
              : rawLower === 'x'
                ? 'twitter'
                : 'other'
            return {
              type: t.type || 'screenshot',
              source: validSource,
              url: conv ? `data:${conv.mimeType};base64,${conv.base64}` : t.url || undefined,
              content: t.content,
            }
          })

          const tools = formData.tools || []
          const portfolioUrlList = portfolioItems.map((p) => p.url).filter(Boolean)

          profileUpdates = {
            portfolioItems,
            certifications,
            tools,
            teamMembers,
            testimonials,
            ...(portfolioUrlList.length > 0 ? { portfolioUrls: portfolioUrlList } : {}),
          }
        }

        await adminService.updateUserProfile(targetExpertId, {
          userUpdates,
          profileUpdates,
          reason: 'Admin updated expert profile sections directly',
        })

        toast.success(`Expert ${scope.charAt(0).toUpperCase() + scope.slice(1)} updated successfully by Admin.`)
        onAdminSaveSuccess?.()
        setProfileReloadTick((t) => t + 1)
        return
      }

      const { expertService } = await import('@/services/expertService')

      if (scope === 'profile') {
        let logoDataUrl = formData.logoFile;
        if (formData.logoFile instanceof Blob) {
          try {
            const base64 = await compressImage(formData.logoFile, 600, 0.7);
            logoDataUrl = `data:${formData.logoFile.type || 'image/jpeg'};base64,${base64}`;
          } catch (e) {
            console.error('Logo conversion failed', e);
          }
        }

        await expertService.updateProfile({
          profileSelfServiceScope: 'profile',
          businessName: formData.businessName || formData.legalName,
          brandAlias: formData.alias,
          businessRole: formData.roleType,
          entityType: formData.entityType,
          website: formData.website,
          bio: formData.about,
          experienceStartDate: formData.experienceStartDate,
          location: {
            country: formData.country || 'India',
            state: formData.state || 'Maharashtra',
            city: formData.city || ''
          },
          isGstRegistered: typeof formData.isGstRegistered === 'boolean' ? formData.isGstRegistered : formData.gstRegistered === 'yes',
          isPanRegistered: typeof formData.isPanRegistered === 'boolean' ? formData.isPanRegistered : formData.panRegistered === 'yes' || !!formData.panNumber,
          panNumber: formData.panNumber ? formData.panNumber.trim().toUpperCase() : '',
          gstStatus: (formData.isGstRegistered || formData.gstRegistered === 'yes') ? 'registered' : 'not_registered',
          gstNumber: formData.gstNumber ? formData.gstNumber.trim().toUpperCase() : '',
          cinNumber: formData.cinNumber ? formData.cinNumber.trim().toUpperCase() : '',
          llpinNumber: formData.llpinNumber ? formData.llpinNumber.trim().toUpperCase() : '',
          ...(logoDataUrl ? { profileImageUrl: logoDataUrl, logoUrl: logoDataUrl } : {})
        })
        toast.success('Business Profile updated.')
      } else if (scope === 'expertise') {
        const servicesDraft = formData.servicesDraft || []
        const categories = [...new Set(servicesDraft.map((s) => s.serviceHead))].filter(Boolean)
        const subServices = [
          ...new Set(servicesDraft.flatMap((s) => [...(s.primaryFilters || []), ...(s.subFilters || [])])),
        ].filter(Boolean)

        const stage2Avail = {
          weeklyWorkingHours: Number(formData.workSchedule?.weeklyHours) || 0,
          daysOff: formData.workSchedule?.daysOff || [],
          availableForInstantBooking: !!formData.workSchedule?.instantBooking,
          ...(formData.workSchedule?.availability || {}),
        }
        const { weeklyWorkingHours, daysOff, availableForInstantBooking, ...availability } = stage2Avail

        await expertService.updateProfile({
          profileSelfServiceScope: 'expertise',
          categories,
          subServices,
          services: servicesDraft,
          industrySectors: formData.industrySectors || [],
          subIndustries: formData.industrySubSectors || [],
          serviceDeliveryStates: formData.panIndiaAvailable ? [] : formData.serviceDeliveryStates || [],
          serviceArea: formData.panIndiaAvailable ? ['Pan India'] : formData.serviceDeliveryStates || [],
          panIndiaAvailable: !!formData.panIndiaAvailable,
          minEngagementValue: formData.minEngagementValue ? Number(formData.minEngagementValue) : undefined,
          minEngagementUnit: formData.minEngagementUnit || 'Per Project',
          clientEngagementTypes: formData.businessRelationshipTypes || [],
          businessTypesServed: formData.businessTypes || [],
          clientScales: formData.businessSizes || [],
          engagementModels: formData.engagementModels || [],
          deliveryChannels: formData.deliveryChannels || [],
          pricingStyle: formData.pricingModels?.length > 0 ? formData.pricingModels : ['To Be Discussed'],
          preferredDeliverySpeed: formData.deliverySpeed || [],
          languages: formData.languages || [],
          weeklyWorkingHours,
          daysOff,
          availableForInstantBooking,
          availability,
        })
        toast.success('Expertise updated.')
      } else {
        const conversions = {}
        const tasks = []

        const safeConvert = async (file, key) => {
          if (!file) return
          if (typeof file === 'string' && file.startsWith('data:')) {
            const base64 = file.split(',')[1] || file
            conversions[key] = {
              base64,
              mimeType: file.split(';')[0].split(':')[1] || 'application/octet-stream',
              fileName: 'cached_file',
            }
            return
          }
          if (file instanceof Blob) {
            try {
              let base64
              if (file.type.startsWith('image/')) {
                base64 = await compressImage(file, 1200, 0.7)
              } else {
                base64 = await fileToBase64(file)
              }
              conversions[key] = { base64, mimeType: file.type, fileName: file.name }
            } catch (err) {
              console.error(`Failed to convert file for key ${key}:`, err)
            }
          }
        }

        formData.portfolioItems?.forEach((item, i) => {
          if (item.file) tasks.push(safeConvert(item.file, `portfolio_${item.url || item.file.name || i}`))
        })
        formData.certifications?.forEach((cert, i) => {
          if (cert.file) tasks.push(safeConvert(cert.file, `cert_${cert.title || cert.file?.name || i}`))
        })
        formData.teamMembers?.forEach((member, i) => {
          if (member.photo) tasks.push(safeConvert(member.photo, `team_${member.name || i}`))
        })
        formData.testimonials?.forEach((testimonial, i) => {
          if (testimonial.file) {
            tasks.push(
              safeConvert(testimonial.file, `testimonial_${testimonial.url || testimonial.file.name || i}`)
            )
          }
        })

        await Promise.all(tasks)

        const certifications = (formData.certifications || []).map((cert, i) => {
          const conv = conversions[`cert_${cert.title || cert.file?.name || i}`]
          return {
            name: cert.title,
            issuer: cert.issuer || 'Unknown',
            year: parseInt(cert.year, 10) || new Date().getFullYear(),
            fileUrl: conv ? `data:${conv.mimeType};base64,${conv.base64}` : cert.url,
            verificationUrl: cert.verificationUrl,
          }
        })

        const portfolioItems = (formData.portfolioItems || [])
          .map((item, i) => {
            const conv = conversions[`portfolio_${item.url || item.file?.name || i}`]
            const resolvedUrl = conv ? `data:${conv.mimeType};base64,${conv.base64}` : (item.url || '')
            return {
              title: item.title || item.file?.name || 'Portfolio Item',
              type:
                item.type ||
                (item.file?.type?.includes('image') ? 'image' : item.file?.type?.includes('video') ? 'video' : 'url'),
              url: resolvedUrl,
              description: item.description || '',
            }
          })
          .filter(item => Boolean(item.url && item.url.trim()))

        const teamMembers = (formData.teamMembers || []).map((m, i) => {
          const conv = conversions[`team_${m.name || i}`]
          return {
            ...m,
            experience: m.experienceYears || 0,
            photoUrl: conv ? `data:${conv.mimeType};base64,${conv.base64}` : m.photo,
          }
        })

        const testimonials = (formData.testimonials || []).map((t, i) => {
          const conv = conversions[`testimonial_${t.url || t.file?.name || i}`]
          const rawLower = (t.platform || 'other').toLowerCase()
          const validSource = ['google', 'clutch', 'linkedin', 'instagram', 'facebook', 'twitter', 'youtube', 'trustpilot', 'other'].includes(
            rawLower
          )
            ? rawLower
            : rawLower === 'x'
              ? 'twitter'
              : 'other'
          return {
            type: t.type || 'screenshot',
            source: validSource,
            url: conv ? `data:${conv.mimeType};base64,${conv.base64}` : t.url || undefined,
            content: t.content,
          }
        })

        const tools = formData.tools || []
        const portfolioUrlList = portfolioItems.map((p) => p.url).filter(Boolean)

        await expertService.updateProfile({
          profileSelfServiceScope: 'portfolio',
          portfolioItems,
          certifications,
          tools,
          teamMembers,
          testimonials,
          ...(portfolioUrlList.length > 0 ? { portfolioUrls: portfolioUrlList } : {}),
        })
        toast.success('Portfolio updated.')
      }

      setProfileReloadTick((t) => t + 1)
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (error instanceof Error ? error.message : 'Could not save changes')
      toast.error(typeof msg === 'string' ? msg : 'Could not save changes')
      console.error('Dashboard section save failed:', error)
    } finally {
      setDashboardSectionSaving(null)
    }
  }

  /* Save draft feature */
  const handleSaveDraft = async () => {
    try {
      if (!user) {
        toast.error('You must be logged in to save a draft')
        return
      }

      setIsLoading(true)

      // Deeply scan formData for Files and convert to base64
      const processFilesRecursively = async (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        if (obj instanceof File || obj instanceof Blob) {
          try {
            // For images, use compression to stay under the 16MB MongoDB limit
            if (obj.type.startsWith('image/')) {
              const base64 = await compressImage(obj, 1200, 0.6); // 1200px wide, 60% quality
              const mimeType = obj.type || 'image/jpeg';
              return `data:${mimeType};base64,${base64}`;
            }

            // For non-images (PDFs), use standard base64 but warn if huge
            if (obj.size > 5 * 1024 * 1024) {
              console.warn(`File ${obj.name} is large (${(obj.size / 1024 / 1024).toFixed(2)}MB). Draft may fail to save.`);
            }

            const base64 = await fileToBase64(obj);
            const mimeType = obj.type || 'application/octet-stream';
            return `data:${mimeType};base64,${base64}`;
          } catch (e) {
            console.error('File conversion failed', e);
            return null;
          }
        }

        // Optimization: If it's already a string and looks like a data URL or normal URL, return it as is
        if (typeof obj === 'string' && (obj.startsWith('data:') || obj.startsWith('http'))) {
          return obj;
        }

        if (Array.isArray(obj)) {
          return Promise.all(obj.map(item => processFilesRecursively(item)));
        }

        // OPTIMIZED: Parallel object processing
        const newObj = {};
        const entries = Object.entries(obj);
        const results = await Promise.all(entries.map(async ([key, value]) => {
          return [key, await processFilesRecursively(value)];
        }));

        results.forEach(([key, value]) => {
          newObj[key] = value;
        });

        return newObj;
      };

      toast.info('Processing files and saving draft...', { duration: 2000 });
      const processedData = await processFilesRecursively(formData);

      // CRITICAL SIZE CHECK: MongoDB has a 16MB limit per document.
      // Base64 encoding + JSON overhead can easily hit this.
      const jsonString = JSON.stringify(processedData);
      const sizeInMb = jsonString.length / (1024 * 1024);

      if (sizeInMb > 15.5) {
        toast.error(`Draft is too large (${sizeInMb.toFixed(1)}MB). Please remove some high-resolution images or large PDFs before saving.`);
        setIsLoading(false);
        return;
      }

      if (processedData.experienceStartDate && !processedData.yearsExperience) {
        const start = new Date(processedData.experienceStartDate)
        if (!isNaN(start.getTime())) {
          const diffYears = (Date.now() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
          processedData.yearsExperience = Math.max(0, Math.round(diffYears * 10) / 10)
        }
      }

      // Call service to save draft
      const { expertService } = await import('@/services/expertService')
      await expertService.saveOnboardingDraft({
        formData: processedData,
        currentStep: currentStep
      })

      toast.success(`Draft saved successfully! (${sizeInMb.toFixed(1)}MB handled)`)
      setFormData(processedData)
      setStepDraftSaved(true)

      // ✅ SPEC COMPLIANCE: Server-side drafts only, no localStorage
      // The draft is already saved to backend above, which is the single source of truth
    } catch (error) {
      console.error('Failed to save draft:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      if (errorMsg.includes('offset') || errorMsg.includes('large')) {
        toast.error('Draft too large to save. Please reduce image sizes or quantity.');
      } else {
        toast.error(`Failed to save draft: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    const minStep = isDashboard ? 1 : 0
    if (currentStep <= minStep) return
    setCurrentStep(currentStep - 1)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }


  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Account Setup
        return (
          <AccountSetupStep
            formData={formData}
            handleInputChange={handleInputChange}
            validationErrors={validationErrors}
            otpChannel={otpChannel}
            setOtpChannel={setOtpChannel}
            showOTP={showOTP}
            otp={otp}
            setOtp={setOtp}
            isLoading={isLoading}
            isRegistrationComplete={isRegistrationComplete}
            handleAccountSubmit={handleAccountSubmit}
            handleVerifyOTP={handleVerifyOTP}
            handleResendOTP={handleResendOTP}
            handleConfirmRole={async () => {
              if (user?.role === 'expert_candidate' && user?.isVerified) {
                await handleConfirmRole()
              } else if (user?.role === 'expert') {
                setCurrentStep(1)
              } else {
                toast.error('Please verify your email and confirm your expert role')
              }
            }}
            user={user}
            triggerAutoEnrichment={triggerAutoEnrichment}
            isEnriching={isEnriching}
            enrichedSource={enrichedSource}
          />
        )

      case 1: // Profile (matching ExpertOnboarding step 1)
        return (
          <ProfileStep
            formData={formData}
            handleInputChange={handleInputChange}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            isRegistrationComplete={isRegistrationComplete}
            expertProfileIsVerified={expertProfileIsVerified}
            onInitiateEmailChange={handleInitiateEmailChange}
            showEmailOTP={showEmailOTP}
            emailOTP={emailOTP}
            setEmailOTP={setEmailOTP}
            isEmailUpdating={isEmailUpdating}
            onVerifyEmailChange={handleVerifyEmailChange}
            onResendEmailOTP={handleResendEmailOTP}
            openComplianceModal={openComplianceModal}
            onOpenLegalNameModal={() => setLegalNameModalOpen(true)}
            onOpenMobileModal={() => setMobileModalOpen(true)}
            readOnly={isReadOnlyMode}
            showDashboardVerifiedSave={isDashboard && expertProfileIsVerified}
            onDashboardSave={() => handleDashboardSectionSave('profile')}
            dashboardSaving={dashboardSectionSaving === 'profile'}
            adminMode={adminMode}
            triggerAutoEnrichment={triggerAutoEnrichment}
            isEnriching={isEnriching}
            enrichedSource={enrichedSource}
          />
        )

      case 2: // Expertise (Complete implementation per spec)
        return (
          <ExpertiseStep
            formData={formData}
            setFormData={setFormData}
            handleInputChange={handleInputChange}
            currentServiceEditIndex={currentServiceEditIndex}
            setCurrentServiceEditIndex={setCurrentServiceEditIndex}
            showDashboardVerifiedSave={isDashboard && expertProfileIsVerified}
            onDashboardSave={() => handleDashboardSectionSave('expertise')}
            dashboardSaving={dashboardSectionSaving === 'expertise'}
            readOnly={isReadOnlyMode}
            validationErrors={validationErrors}
            enrichedSource={enrichedSource}
          />
        )

      case 3: // Portfolio & Credibility (Complete implementation per spec)
        return (
          <PortfolioStep
            formData={formData}
            handleInputChange={handleInputChange}
            showDashboardVerifiedSave={isDashboard && expertProfileIsVerified}
            onDashboardSave={() => handleDashboardSectionSave('portfolio')}
            dashboardSaving={dashboardSectionSaving === 'portfolio'}
            readOnly={isReadOnlyMode}
            triggerAutoEnrichment={triggerAutoEnrichment}
            isEnriching={isEnriching}
            enrichedSource={enrichedSource}
          />
        )

      case 4: // Review
      case 5: // Freeze Screen / Under Review
        return (
          <ReviewStep
            formData={formData}
            handleInputChange={handleInputChange}
            validationErrors={validationErrors}
            handleBack={handleBack}
            handleFinalSubmit={handleFinalSubmit}
            canProceed={canProceed}
            isLoading={isLoading}
            isSubmitted={isSubmitted || user?.profileStatus === 'submitted_for_verification' || loadedProfileStatus === 'submitted_for_verification'}
            user={user}
            expertId={expertId}
            clearFormData={clearFormData}
            navigate={navigate}
            verifiedSelfServe={isDashboard && expertProfileIsVerified}
            onGoToDashboard={() => {
              setIsReadOnlyMode(true)
              setCurrentStep(1)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            submitLabel={
              isDashboard && expertProfileIsVerified
                ? 'Save profile updates'
                : 'Submit for Review'
            }
          />
        )

      default:
        return null
    }
  }

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const breadcrumbs = isDashboard
    ? [
      { name: 'Overview', path: '/expert/dashboard' },
      { name: 'Profile', path: '/expert/profile' },
    ]
    : [
      { name: 'Home', path: '/' },
      { name: 'Register as Expert', path: '/service-expert-register' },
    ]

  const stepperTitles = (adminMode || (isDashboard && expertProfileIsVerified))
    ? [
      { title: 'Profile' },
      { title: 'Expertise' },
      { title: 'Portfolio' },
    ]
    : [
      { title: 'Profile' },
      { title: 'Expertise' },
      { title: 'Portfolio' },
      { title: 'Review' },
    ]

  const totalSteps = stepperTitles.length
  const stepperIndex = Math.min(Math.max(currentStep - 1, 0), totalSteps - 1)
  const progressFillPercent = ((stepperIndex + 1) / totalSteps) * 100

  const isProfileUnderReviewOrSubmitted =
    isSubmitted ||
    user?.profileStatus === 'submitted_for_verification' ||
    loadedProfileStatus === 'submitted_for_verification' ||
    user?.profileStatus === 'under_verification' ||
    loadedProfileStatus === 'under_verification'

  const wizardLocked =
    !adminMode &&
    isProfileUnderReviewOrSubmitted &&
    !formData.documentsRequested

  // Footer navigation (Back, Save Draft, Next) is only shown for editable steps (1-3)
  // When submitted, under review, or on Review/Submitted step, footer nav is hidden completely.
  const allowFooterNav = (adminMode || (isDashboard && expertProfileIsVerified))
    ? (!wizardLocked && currentStep <= 3)
    : (!wizardLocked && currentStep < 4 && !isProfileUnderReviewOrSubmitted)

  return (
    <>
      <div className={styles.serviceExpert}>
        {!adminMode && (
          !isDashboard ? (
            <>
              <SEO
                title="Register as Marketing Expert - Join MarTechAdda"
                description="Register as a marketing expert on MarTechAdda. Create your profile, Join As Marketing Expert, and connect with businesses seeking marketing services. Verified professionals only."
                canonical="https://martechadda.com/service-expert-register"
              />
              <SchemaMarkup type="WebPage" breadcrumbs={breadcrumbs} />
            </>
          ) : (
            <SchemaMarkup type="WebPage" breadcrumbs={breadcrumbs} />
          )
        )}
        {/* Top Progress Bar */}
        <section className={styles.overviewSection}>
          <div className={`container ${styles.container}`}>
            <div className={styles.headerActions}>
              <h1 className={styles.heroTitle}>{adminMode ? 'Expert Profile' : isDashboard ? 'Expert profile' : 'Service Expert Registration'}</h1>
            </div>
            <div className={styles.animatedProgressBar} style={{ marginBottom: '32px' }}>
              <div
                className={styles.animatedProgressBarFill}
                style={{ width: `${progressFillPercent}%` }}
              />
            </div>
            <StepProgressBar
              steps={stepperTitles}
              currentStep={stepperIndex}
              hideTimeEstimate={Boolean(isProfileUnderReviewOrSubmitted || isSubmitted)}
              onStepClick={(step) => {
                if (adminMode) {
                  setCurrentStep(step + 1)
                  return
                }

                if (
                  !isReadOnlyMode &&
                  !expertProfileIsVerified &&
                  (isSubmitted || user?.profileStatus === 'submitted_for_verification' || loadedProfileStatus === 'submitted_for_verification') &&
                  !formData.documentsRequested
                ) {
                  return
                }

                const targetStep = isDashboard ? step + 1 : step

                // Validation guard: cannot jump forward past incomplete mandatory steps
                const currentActualIndex = isDashboard ? currentStep - 1 : currentStep
                if (step > currentActualIndex) {
                  if (currentActualIndex <= 1 || step > 1) {
                    const step1Check = validateStep(1, true)
                    if (!step1Check.isValid) {
                      toast.error('Please complete Business Profile (Step 1) first')
                      setCurrentStep(isDashboard ? 2 : 1)
                      return
                    }
                  }
                  if (step > 2) {
                    const step2Check = validateStep(2, true)
                    if (!step2Check.isValid) {
                      toast.error('Please complete Expertise & Services (Step 2) first')
                      setCurrentStep(isDashboard ? 3 : 2)
                      return
                    }
                  }
                }

                if (!isReadOnlyMode && !adminMode) autoSaveDraftLight(targetStep)
                setCurrentStep(targetStep)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onSaveDraft={handleSaveDraft}
              className={styles.overviewStepper}
            />

          </div>
        </section>


        <section className={styles.contentSection}>
          <div className={`container ${styles.container}`}>
            {isReadOnlyMode && !expertProfileIsVerified && (
              <div style={{
                padding: '14px 20px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⏳</span>
                  <span style={{ fontSize: '13.5px', color: '#92400E', fontWeight: '600' }}>
                    Your profile is currently under review by the MarTechAdda team. Your submitted details are displayed below in read-only mode.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsReadOnlyMode(false);
                    setCurrentStep(5);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D97706',
                    color: '#B45309',
                    fontWeight: '700',
                    borderRadius: '20px',
                    fontSize: '12px',
                    padding: '6px 14px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Review Status
                </button>
              </div>
            )}
            {renderStepContent()}
          </div>
        </section>

        {(isReadOnlyMode || allowFooterNav) && (
          <section className={styles.navigationSection}>
            <div className={`container ${styles.container}`}>
              <div className={styles.navigationButtons}>
                {isReadOnlyMode ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        className={`${styles.navButton} ${styles.navButtonOutline}`}
                        onClick={() => {
                          setCurrentStep(prev => Math.max(1, prev - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <ArrowLeft size={18} /> Previous Tab
                      </button>
                    ) : <div />}

                    <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                      Tab {currentStep} of 4 (Read-Only)
                    </div>

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        className={`${styles.navButton} ${styles.navButtonPrimary}`}
                        onClick={() => {
                          setCurrentStep(prev => Math.min(4, prev + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Next Tab <ArrowRight size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.navButton} ${styles.navButtonPrimary}`}
                        onClick={() => {
                          setIsReadOnlyMode(false);
                          setCurrentStep(5);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        View Status <ArrowRight size={18} />
                      </button>
                    )}
                  </div>
                ) : allowFooterNav ? (
                  <>
                    {currentStep > (isDashboard ? 1 : 0) && !isComplianceMode && (
                      <button
                        type="button"
                        className={`${styles.navButton} ${styles.navButtonOutline}`}
                        onClick={handleBack}
                        disabled={isLoading}
                      >
                        <ArrowLeft size={18} /> Back
                      </button>
                    )}

                    <div className={styles.navSpacer} />

                    {!adminMode && (
                      <button
                        type="button"
                        className={`${styles.navButton} ${styles.navButtonDraft}`}
                        onClick={handleSaveDraft}
                        disabled={isLoading}
                        title="Save your progress and resume later"
                      >
                        <FiSave size={18} /> Save Draft
                      </button>
                    )}

                    <button
                      type="button"
                      className={`${styles.navButton} ${styles.navButtonPrimary}`}
                      onClick={(isDashboard && expertProfileIsVerified && currentStep === 3) ? () => handleDashboardSectionSave('portfolio') : handleNext}
                      disabled={isLoading || (!stepDraftSaved && currentStep > 0 && !(isDashboard && expertProfileIsVerified) && !adminMode)}
                      title={(!stepDraftSaved && currentStep > 0 && !(isDashboard && expertProfileIsVerified) && !adminMode) ? "Please click 'Save Draft' to save your progress and unlock the button" : undefined}
                    >
                      {isLoading ? (
                        <FiLoader className={styles.spinner} />
                      ) : (isDashboard && expertProfileIsVerified && currentStep === 3) ? (
                        <>
                          <FiSave size={18} /> Save Portfolio Updates
                        </>
                      ) : isComplianceMode ? (
                        <>
                          Submit for Verification <ArrowRight size={18} />
                        </>
                      ) : (
                        <>
                          Next <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Compliance Update Modal for self-serve name change requests */}
      <ComplianceUpdateModal
        open={complianceModalOpen}
        onOpenChange={setComplianceModalOpen}
        field={selectedComplianceField.field}
        fieldLabel={selectedComplianceField.label}
        currentValues={{
          entityType: formData.entityType,
          bankDetails: formData.bankDetails,
          businessName: formData.businessName,
        }}
        pendingValues={formData.pendingData ? {
          entityType: formData.pendingData.entityType,
          bankDetails: formData.pendingData.bankDetails,
          businessName: formData.pendingData.businessName,
        } : undefined}
        changeRequestStatus={formData.changeRequestStatus}
      />

      {/* Governance Change Request Modals */}
      <LegalNameChangeModal
        open={legalNameModalOpen}
        onOpenChange={setLegalNameModalOpen}
        currentLegalName={formData.legalName || formData.businessName || ''}
        onRequestSubmitted={() => {
          refreshUser?.();
        }}
      />

      <MobileChangeModal
        open={mobileModalOpen}
        onOpenChange={setMobileModalOpen}
        currentMobile={formData.mobile || ''}
        onRequestSubmitted={() => {
          refreshUser?.();
        }}
      />
    </>
  )
}

export default ServiceExpert
