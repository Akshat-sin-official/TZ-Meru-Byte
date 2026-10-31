import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiCheckCircle, FiLoader, FiEdit2, FiChevronDown, FiChevronUp, FiShield, FiBriefcase, FiTarget, FiLayers, FiFileText, FiX } from 'react-icons/fi'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { formatTimeTo12hr } from '../utils/helpers'
import styles from '../ServiceExpert.module.css'
import { EXPERIENCE_RANGES, INDUSTRY_SECTOR_TO_SUB_SECTORS } from '@/data/taxonomy'
import { useAuth } from '@/contexts/AuthContext'

const arr = (v) => (Array.isArray(v) ? v : [])

const entityTypes = [
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership Firm' },
  { value: 'llp', label: 'LLP' },
  { value: 'opc', label: 'OPC' },
  { value: 'pvt_ltd', label: 'Private Limited' },
  { value: 'public_ltd', label: 'Public Limited' },
]

// Helper Component for Accordion Sections
const SectionAccordion = ({
  title,
  icon,
  isOpen,
  onToggle,
  summary,
  children,
  badge
}) => {
  return (
    <div style={{
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      marginBottom: '16px',
      overflow: 'hidden',
      backgroundColor: 'white'
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: isOpen ? '#F9FAFB' : 'white',
          borderBottom: isOpen ? '1px solid #E5E7EB' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
                {title}
              </h3>
              {badge && (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  fontWeight: '500'
                }}>
                  {badge}
                </span>
              )}
            </div>
            {!isOpen && summary && (
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                {summary}
              </div>
            )}
          </div>
        </div>
        <div style={{ color: '#9CA3AF' }}>
          {isOpen ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
        </div>
      </div>
      {isOpen && (
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

const ReviewStep = ({
  formData,
  handleInputChange,
  validationErrors,
  handleBack,
  handleFinalSubmit,
  canProceed,
  isLoading,
  isSubmitted,
  expertId,
  clearFormData,
  navigate,
  submitLabel = 'Submit for Verification',
  onGoToDashboard,
  verifiedSelfServe = false,
  onSectionEdit,
  user: propUser
}) => {
  const { user: authUser } = useAuth()
  const user = propUser || authUser

  const isProfileSubmitted = Boolean(
    isSubmitted ||
    user?.profileStatus === 'submitted_for_verification' ||
    user?.profileStatus === 'under_verification'
  )
  const [showSubmittedModal, setShowSubmittedModal] = useState(isProfileSubmitted)

  useEffect(() => {
    if (isProfileSubmitted) {
      setShowSubmittedModal(true)
    }
  }, [isProfileSubmitted])

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (showSubmittedModal && isProfileSubmitted && typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [showSubmittedModal, isProfileSubmitted])

  // Accordion states - Business Profile (section 1) is always visible/managed differently
  const [expandedSection, setExpandedSection] = useState(null)

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  // Calculate Experience Range
  const getExperienceRange = () => {
    let years = null
    if (formData.experienceStartDate) {
      const startDate = new Date(formData.experienceStartDate)
      if (!isNaN(startDate.getTime())) {
        const today = new Date()
        years = Math.max(0, Math.floor((today - startDate) / (365.25 * 24 * 60 * 60 * 1000)))
      }
    }
    if (years === null && (formData.yearsExperience !== undefined || formData.experienceYears !== undefined || formData.yearsOfExperience !== undefined)) {
      const parsed = Number(formData.yearsExperience || formData.experienceYears || formData.yearsOfExperience)
      if (!isNaN(parsed)) years = parsed
    }
    if (years === null) return null
    const range = EXPERIENCE_RANGES.find(r => years >= r.min && years < r.max)
    return { years, label: range ? range.label : `${years} Years` }
  }

  const expData = getExperienceRange()

  // Helper to count sub-industries
  const getSubIndustryCount = (sector) => {
    return arr(formData.industrySubSectors).filter(sub => {
      const sectorSubs = INDUSTRY_SECTOR_TO_SUB_SECTORS[sector] || []
      return sectorSubs.includes(sub) || sub === `Other (${sector})` || (sectorSubs.includes('Other') && sub.startsWith('Other'))
    }).length
  }

  return (
    <div className={styles.stepContentWrapper}>
      <Card className={styles.stepCard}>
        <h2 className={styles.stepTitle}>
          {isSubmitted ? 'Submitted Profile' : verifiedSelfServe ? 'Review & save changes' : 'Review Your Profile'}
        </h2>
        <p className={styles.stepDescription} style={{ marginBottom: '24px' }}>
          {isSubmitted
            ? 'Your profile is currently under review.'
            : verifiedSelfServe
              ? 'You are verified. Saving updates your live listing; routine edits (services, languages, portfolio presentation) do not send you back through full admin approval.'
              : 'Confirm your details before submission.'}
        </p>

        {/* 1. Business Profile (Always Expanded) */}
        <div style={{
          padding: '20px',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
              Business Identity
            </h3>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: '500' }}>
              ✓ Complete
            </span>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Business Name</span>
              <span className={styles.summaryValue} style={{ fontWeight: '600', color: '#111827' }}>
                {formData.businessName || formData.legalName || formData.brandName || formData.fullName || 'Branding Internationals Pvt Ltd'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Entity Type</span>
              <span className={styles.summaryValue}>
                {entityTypes.find(e => e.value === formData.entityType)?.label || formData.entityType || 'Private Limited'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Business Type</span>
              <span className={styles.summaryValue}>
                {formData.roleType || formData.subEntityType || 'Independent Consultant'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>GST Registered</span>
              <span className={styles.summaryValue}>
                {formData.gstRegistered === 'yes' || formData.isGstRegistered ? 'Yes' : 'No'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>PAN Registered</span>
              <span className={styles.summaryValue}>
                {formData.panRegistered === 'yes' || formData.panNumber || formData.isPanRegistered ? 'Yes' : 'No'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Location</span>
              <span className={styles.summaryValue}>
                {formData.city || 'Mumbai'}, {formData.state || 'Maharashtra'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Contact</span>
              <span className={styles.summaryValue}>
                {formData.email || 'Email'} <br /> {formData.mobile || 'Mobile'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Experience Level</span>
              <span className={styles.summaryValue}>
                {expData ? `${expData.years} ${expData.years === 1 ? 'Year' : 'Years'}` : 'Not Specified'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Experience category</span>
              <span className={styles.summaryValue} style={{ color: '#0369A1', fontWeight: '600' }}>
                {expData?.label || 'Not Specified'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Expertise (Collapsed by Default) */}
        <SectionAccordion
          title="Expertise"
          icon={<FiBriefcase size={18} />}
          isOpen={expandedSection === 'expertise'}
          onToggle={() => toggleSection('expertise')}
          badge="✓ Ready"
          summary={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {arr(formData.servicesDraft).map((s, idx) => (
                <span key={idx} style={{ display: 'block' }}>
                  • {s.serviceHead} <span style={{ color: '#9CA3AF' }}>({arr(s.primaryFilters).length} focus areas, {arr(s.subFilters).length} specific needs)</span>
                </span>
              ))}
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {arr(formData.servicesDraft).map((service, idx) => (
              <div key={idx} style={{ paddingBottom: '12px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px', fontSize: '14px' }}>
                  {service.serviceHead}
                </div>
                <div style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5' }}>
                  <p><span style={{ fontWeight: '500' }}>Focus Areas ({arr(service.primaryFilters).length}):</span> {arr(service.primaryFilters).join(', ')}</p>
                  {arr(service.subFilters).length > 0 && (
                    <p style={{ marginTop: '2px' }}><span style={{ fontWeight: '500' }}>Specific Needs ({arr(service.subFilters).length}):</span> {arr(service.subFilters).join(', ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionAccordion>

        {/* 3. Market & Commercial Fit (Collapsed by Default) */}
        <SectionAccordion
          title="Market & Commercial Fit"
          icon={<FiTarget size={18} />}
          isOpen={expandedSection === 'market'}
          onToggle={() => toggleSection('market')}
          badge="✓ Ready"
          summary={
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              {arr(formData.industrySectors).length} Sectors | {arr(formData.businessRelationshipTypes).length} Engagement Models | {arr(formData.pricingModels).length} Pricing Models
            </span>
          }
        >
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem} style={{ gridColumn: 'span 2' }}>
              <span className={styles.summaryLabel}>Industries Served</span>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                {arr(formData.industrySectors).map(sector => {
                  const count = getSubIndustryCount(sector)
                  return (
                    <div key={sector} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #E5E7EB' }}>
                      <span style={{ fontWeight: '500' }}>{sector}</span>
                      <span style={{ color: '#6B7280' }}>({count} sub-industries selected)</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Client Engagement Types</span>
              <details style={{ fontSize: '13px', cursor: 'pointer' }}>
                <summary style={{ color: '#3B82F6', fontWeight: '500' }}>
                  {arr(formData.businessRelationshipTypes).length} selected (View detail)
                </summary>
                <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #E5E7EB', color: '#374151' }}>
                  {arr(formData.businessRelationshipTypes).join(', ')}
                </div>
              </details>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Business Types (Client Scale)</span>
              <details style={{ fontSize: '13px', cursor: 'pointer' }}>
                <summary style={{ color: '#3B82F6', fontWeight: '500' }}>
                  {arr(formData.businessSizes).length} selected (View detail)
                </summary>
                <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #E5E7EB', color: '#374151' }}>
                  {arr(formData.businessSizes).join(', ')}
                </div>
              </details>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Engagement Models</span>
              <details style={{ fontSize: '13px', cursor: 'pointer' }}>
                <summary style={{ color: '#3B82F6', fontWeight: '500' }}>
                  {arr(formData.engagementModels).length} selected (View detail)
                </summary>
                <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #E5E7EB', color: '#374151' }}>
                  {arr(formData.engagementModels).join(', ')}
                </div>
              </details>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Pricing Models</span>
              <details style={{ fontSize: '13px', cursor: 'pointer' }}>
                <summary style={{ color: '#3B82F6', fontWeight: '500' }}>
                  {arr(formData.pricingModels).length} selected (View detail)
                </summary>
                <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #E5E7EB', color: '#374151' }}>
                  {arr(formData.pricingModels).join(', ')}
                </div>
              </details>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Delivery Channels</span>
              <details style={{ fontSize: '13px', cursor: 'pointer' }}>
                <summary style={{ color: '#3B82F6', fontWeight: '500' }}>
                  {arr(formData.deliveryChannels).length} selected (View detail)
                </summary>
                <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #E5E7EB', color: '#374151' }}>
                  {arr(formData.deliveryChannels).join(', ')}
                </div>
              </details>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Delivery Speed</span>
              <details style={{ fontSize: '13px', cursor: 'pointer' }}>
                <summary style={{ color: '#3B82F6', fontWeight: '500' }}>
                  {arr(formData.deliverySpeed).length} selected (View detail)
                </summary>
                <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #E5E7EB', color: '#374151' }}>
                  {arr(formData.deliverySpeed).join(', ')}
                </div>
              </details>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Operational Capacity</span>
              <span className={styles.summaryValue}>
                <span style={{ fontWeight: '600', color: '#059669', fontSize: '12px' }}>{formData.workSchedule?.weeklyHours || 0} hrs/week</span>
              </span>
            </div>
          </div>
        </SectionAccordion>

        {/* 4. Portfolio & Credibility (Collapsed by Default) */}
        <SectionAccordion
          title="Portfolio & Credibility"
          icon={<FiLayers size={18} />}
          isOpen={expandedSection === 'portfolio'}
          onToggle={() => toggleSection('portfolio')}
          badge="✓ Ready"
          summary={
            <span>
              {arr(formData.portfolioItems).filter(i => i && (i.url || i.file)).length} items uploaded • {arr(formData.certifications).length} certifications • {arr(formData.tools).length} tools
            </span>
          }
        >
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Portfolio Items</span>
              <ul style={{ paddingLeft: '16px', margin: '4px 0', fontSize: '13px' }}>
                {arr(formData.portfolioItems).filter(i => i && (i.url || i.file)).map((item, i) => (
                  <li key={i}>{item.title || item.type} ({item.file ? 'File' : 'URL'})</li>
                ))}
              </ul>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Tools & Tech</span>
              <p style={{ fontSize: '13px', lineHeight: '1.4' }}>{arr(formData.tools).join(', ')}</p>
            </div>
            {arr(formData.certifications).length > 0 && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Certifications</span>
                <p style={{ fontSize: '13px' }}>{arr(formData.certifications).map(c => c?.title ?? c?.name ?? '').filter(Boolean).join(', ')}</p>
              </div>
            )}
          </div>
        </SectionAccordion>

        {/* Platform Fee & Terms */}
        <div className={styles.summaryCard} style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', marginTop: '24px', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>Platform Fee & Terms</h3>
          <div style={{ fontSize: '13.5px', color: '#374151', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '12px', fontWeight: '500' }}>
              <span style={{ color: '#16A34A', fontWeight: '700' }}>10% flat platform fee</span>, charged only when a payment is released to the expert.
            </p>

            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12.5px', padding: '4px 10px', backgroundColor: '#DCFCE7', color: '#166534', borderRadius: '6px', fontWeight: '600' }}>✓ No fees at discussion</span>
              <span style={{ fontSize: '12.5px', padding: '4px 10px', backgroundColor: '#DCFCE7', color: '#166534', borderRadius: '6px', fontWeight: '600' }}>✓ No fees at engagement initiation</span>
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '14px' }}>
              {validationErrors.feeAcknowledgement && (
                <span style={{ display: 'block', marginBottom: '8px', color: '#ef4444', fontSize: '12px', fontWeight: '500' }}>{validationErrors.feeAcknowledgement}</span>
              )}
              <label style={{ display: 'flex', alignItems: 'start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.feeAcknowledgement}
                  onChange={(e) => handleInputChange('feeAcknowledgement', e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#1F2937' }}>
                  I acknowledge that the 10% platform fee applies when a payment is released to me. *
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Declaration & Consents + Submit Buttons OR Submitted Read-Only Banner */}
        {!isProfileSubmitted ? (
          <>
            <div style={{ border: '1px solid #E5E7EB', padding: '20px', marginBottom: '24px', borderRadius: '12px', marginTop: '16px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Declaration</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.infoAccurate || false}
                      onChange={(e) => handleInputChange('infoAccurate', e.target.checked)}
                      required
                      style={{ marginTop: '3px' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1F2937' }}>
                      I confirm the information provided is accurate. *
                    </span>
                  </label>
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.platformAgreement}
                      onChange={(e) => handleInputChange('platformAgreement', e.target.checked)}
                      style={{ marginTop: '3px' }}
                    />
                    <span style={{ fontSize: '13px' }}>
                      I agree to the{' '}
                      <a href="/legal/expert-consent" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#3b82f6' }}>
                        Expert Consent & Agreements
                      </a> *
                    </span>
                  </label>
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted || false}
                      onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                      style={{ marginTop: '3px' }}
                    />
                    <span style={{ fontSize: '13px' }}>
                      I accept the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#3b82f6' }}>Terms</a> & <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#3b82f6' }}>Privacy Policy</a> *
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', gap: '16px', flexWrap: 'wrap' }}>
              <Button variant="outline" onClick={handleBack} className={styles.flexResponsive}>
                <ArrowLeft size={18} /> Back
              </Button>
              <Button
                variant="primary"
                onClick={handleFinalSubmit}
                disabled={!formData.infoAccurate || !formData.platformAgreement || !formData.termsAccepted || !formData.feeAcknowledgement || isLoading}
                className={styles.flexResponsive}
              >
                {isLoading ? (
                  <FiLoader className={styles.spinner} />
                ) : (
                  <>
                    Submit for Review <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div style={{
            marginTop: '28px',
            padding: '18px 22px',
            backgroundColor: '#F0FDF4',
            borderRadius: '12px',
            border: '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FiCheckCircle size={22} color="#16A34A" />
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '14.5px', fontWeight: '700', color: '#166534' }}>
                  Profile Submitted for Review
                </p>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#15803D' }}>
                  Your profile is locked in read-only mode while the MarTechAdda team verifies your application.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSubmittedModal(true)}
              style={{
                borderColor: '#16A34A',
                color: '#15803D',
                fontWeight: '600',
                fontSize: '13px',
                borderRadius: '8px',
                padding: '8px 16px',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              View Submission Status
            </Button>
          </div>
        )}
      </Card>

      {/* Profile Submitted Successfully Modal Popup Teleported to document.body */}
      {showSubmittedModal && isProfileSubmitted && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-submitted-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px',
            overflowY: 'auto',
            animation: 'modalFadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSubmittedModal(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              padding: '36px 32px 32px',
              textAlign: 'center',
              margin: 'auto',
              zIndex: 10,
              animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowSubmittedModal(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#6B7280',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E5E7EB';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
                e.currentTarget.style.color = '#6B7280';
              }}
            >
              <FiX size={18} />
            </button>

            {/* Big Green Check Circle */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 0 0 8px #F0FDF4'
            }}>
              <FiCheckCircle style={{ fontSize: '44px', color: '#10B981' }} />
            </div>

            <h2
              id="profile-submitted-modal-title"
              style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}
            >
              Profile Submitted Successfully
            </h2>
            <p style={{ fontSize: '14.5px', color: '#4B5563', marginBottom: '22px' }}>
              Your profile is now <strong>under review</strong> by the MarTechAdda team.
            </p>

            {/* Status Box */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#F0F9FF',
              borderRadius: '12px',
              border: '1px solid #BAE6FD',
              marginBottom: '18px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0369A1' }}>Current Status</span>
                <span style={{
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  ⏳ Under Review
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#0C4A6E', margin: 0 }}>
                Estimated review time: <strong>1–2 business days</strong>
              </p>
            </div>

            {/* Once Approved Details List */}
            <div style={{
              padding: '18px 20px',
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '13.5px', fontWeight: '700', color: '#1F2937', marginBottom: '10px' }}>
                Once approved Your:
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Expert ID</strong> will be generated</li>
                <li><strong>Profile</strong> will go live</li>
                <li><strong>Expert Workspace</strong> will be activated — your space to engage with businesses</li>
              </ul>
            </div>

            {/* Notification note */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '12.5px', color: '#6B7280', marginBottom: '4px' }}>
                You'll receive a confirmation by <strong>email and dashboard notification</strong> once your profile is approved.
              </p>
              <p style={{ fontSize: '12.5px', fontWeight: '600', color: '#4B5563', margin: 0 }}>
                No action is required from you at this stage.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <Button
                onClick={() => {
                  if (onGoToDashboard) {
                    onGoToDashboard();
                  } else {
                    window.location.href = '/expert/dashboard';
                  }
                  setShowSubmittedModal(false);
                }}
                style={{
                  minWidth: '240px',
                  borderRadius: '24px',
                  fontWeight: '700',
                  padding: '12px 28px',
                  fontSize: '15px',
                  backgroundColor: '#FF5722',
                  color: '#FFFFFF',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(255,87,34,0.3)',
                  cursor: 'pointer'
                }}
              >
                ➔ Go to Dashboard
              </Button>
              <button
                type="button"
                onClick={() => setShowSubmittedModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6B7280',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '6px',
                  textDecoration: 'underline'
                }}
              >
                Review My Submitted Profile
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default ReviewStep
