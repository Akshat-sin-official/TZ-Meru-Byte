import React from 'react'
import { FiBriefcase, FiCalendar, FiLoader, FiGlobe } from 'react-icons/fi'
import { toast } from 'sonner'
import Card from '../ui/Card'
import RequiredLabel from '../shared/RequiredLabel'
import OTPVerification from '../shared/OTPVerification'
import { extractCorporateDomain } from '../../../utils/freeEmailDomains'
import styles from '../ServiceExpert.module.css'

const ProfileStep = ({
  formData,
  handleInputChange,
  validationErrors,
  setValidationErrors,
  isRegistrationComplete,
  expertProfileIsVerified,
  onInitiateEmailChange,
  showEmailOTP,
  emailOTP,
  setEmailOTP,
  isEmailUpdating,
  onVerifyEmailChange,
  onResendEmailOTP,
  openComplianceModal,
  onOpenLegalNameModal,
  onOpenMobileModal,
  readOnly = false,
  showDashboardVerifiedSave = false,
  onDashboardSave,
  dashboardSaving = false,
  adminMode = false,
  triggerAutoEnrichment,
  isEnriching,
  enrichedSource,
}) => {
  return (
    <div className={styles.stepContentWrapper}>
      <Card className={styles.stepCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 className={styles.stepTitle} style={{ marginBottom: 0 }}>Business Profile</h2>
          {showDashboardVerifiedSave && onDashboardSave && (
            <button
              type="button"
              onClick={onDashboardSave}
              disabled={dashboardSaving}
              className={styles.dashboardSaveBtn}
              style={{
                backgroundColor: '#FF5722',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {dashboardSaving ? 'Saving...' : 'Save Profile Updates'}
            </button>
          )}
        </div>
        <p className={styles.helperText} style={{ marginBottom: '20px', color: '#6B7280' }}>
          Provide basic details about your business or practice identity.
        </p>

        {/* Auto-Enrichment Progress Banner */}
        {isEnriching && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#EEF2FF',
            border: '1px solid #C7D2FE',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#4338CA',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 1px 3px rgba(79, 70, 229, 0.1)'
          }}>
            <FiLoader style={{ animation: 'spin 1s linear infinite', fontSize: '18px', flexShrink: 0 }} />
            <span>
              ✨ Auto-detecting your company details, bio, logo &amp; service categories from{' '}
              <strong>{formData.website || (formData.email ? extractCorporateDomain(formData.email) : 'your domain')}</strong>...
            </span>
          </div>
        )}

        {/* Row 1: Entity Type + Business Logo */}
        <div className={styles.formGrid2} style={{ marginBottom: '16px' }}>
          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="entityType">Entity Type</RequiredLabel>
            <select
              id="entityType"
              value={formData.entityType || 'individual'}
              onChange={(e) => handleInputChange('entityType', e.target.value)}
              disabled={readOnly}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
                backgroundColor: readOnly ? '#F3F4F6' : '#FFFFFF',
                cursor: readOnly ? 'not-allowed' : 'default'
              }}
            >
              <option value="individual">Individual</option>
              <option value="proprietorship">Proprietorship</option>
              <option value="partnership">Partnership Firm</option>
              <option value="llp">LLP</option>
              <option value="opc">OPC</option>
              <option value="pvt_ltd">Private Limited</option>
              <option value="public_ltd">Public Limited</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="logo">Business Logo (Optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB',
                  flexShrink: 0
                }}
              >
                {(formData.logoFile || formData.logoUrl) ? (
                  <img
                    src={formData.logoFile instanceof Blob ? URL.createObjectURL(formData.logoFile) : (formData.logoFile || formData.logoUrl)}
                    alt="Logo Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <FiBriefcase style={{ color: '#9CA3AF' }} />
                )}
              </div>
              <input
                type="file"
                id="logo"
                accept="image/*"
                disabled={readOnly}
                onChange={(e) => {
                  if (readOnly) return;
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('File size must be less than 10MB')
                      return
                    }
                    handleInputChange('logoFile', file)
                  }
                }}
                style={{ fontSize: '11px', width: '100%', cursor: readOnly ? 'not-allowed' : 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Legal Name + Brand Name + Same Checkbox */}
        <div className={styles.formGrid2} style={{ marginBottom: '8px' }}>
          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="legalName">Legal Name</RequiredLabel>
            <div className={!adminMode && expertProfileIsVerified && !readOnly ? styles.inputWithAction : ''}>
              <input
                type="text"
                id="legalName"
                value={formData.legalName || formData.businessName || ''}
                onChange={(e) => {
                  if (readOnly) return;
                  const val = e.target.value;
                  handleInputChange('legalName', val);
                  handleInputChange('businessName', val);
                  if (formData.legalSameAsBrand) {
                    handleInputChange('alias', val);
                  }
                }}
                placeholder="Enter your legal registered name"
                maxLength={100}
                required
                readOnly={adminMode ? false : (expertProfileIsVerified || readOnly)}
                disabled={adminMode ? false : (expertProfileIsVerified || readOnly)}
                className={(!adminMode && (expertProfileIsVerified || readOnly)) ? styles.disabledInput : ''}
              />
              {!adminMode && expertProfileIsVerified && !readOnly && onOpenLegalNameModal && (
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={onOpenLegalNameModal}
                  style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                >
                  Request Name Change
                </button>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="alias">Brand Name / Operating Name</label>
            <input
              type="text"
              id="alias"
              value={formData.alias || ''}
              onChange={(e) => {
                if (readOnly) return;
                handleInputChange('alias', e.target.value);
              }}
              placeholder="Brand or trading name"
              maxLength={50}
              disabled={formData.legalSameAsBrand || readOnly}
              readOnly={readOnly}
              className={(formData.legalSameAsBrand || readOnly) ? styles.disabledInput : ''}
            />
          </div>
        </div>

        {/* Legal Same As Brand Checkbox */}
        <div style={{ marginBottom: '16px', marginTop: '-4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#374151', cursor: readOnly ? 'not-allowed' : 'pointer' }}>
            <input
              type="checkbox"
              id="legalSameAsBrand"
              checked={Boolean(formData.legalSameAsBrand)}
              disabled={readOnly}
              onChange={(e) => {
                if (readOnly) return;
                const isSame = e.target.checked;
                handleInputChange('legalSameAsBrand', isSame);
                if (isSame) {
                  handleInputChange('alias', formData.legalName || formData.businessName || '');
                }
              }}
            />
            Legal name same as brand name
          </label>
        </div>

        {/* Row 3: GST Registered? + PAN Registered? + Role Type */}
        <div className={styles.formGrid3} style={{ marginBottom: '16px' }}>
          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="gstRegistered">GST Registered?</RequiredLabel>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Yes', 'No'].map((opt) => {
                const val = opt === 'Yes';
                const selected = formData.gstRegistered === (val ? 'yes' : 'no') ||
                  (formData.gstRegistered !== 'yes' && formData.gstRegistered !== 'no' && typeof formData.isGstRegistered === 'boolean' && formData.isGstRegistered === val);
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      if (readOnly) return;
                      handleInputChange('isGstRegistered', val);
                      handleInputChange('gstRegistered', val ? 'yes' : 'no');
                      if (val) {
                        handleInputChange('isPanRegistered', true);
                        handleInputChange('panRegistered', 'yes');
                      }
                      if (setValidationErrors) {
                        setValidationErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.gstRegistered;
                          if (val) delete copy.panRegistered;
                          return copy;
                        });
                      }
                    }}
                    className={`${styles.chipButton} ${selected ? styles.selected : ''}`}
                    style={{
                      flex: 1,
                      padding: '6px',
                      cursor: readOnly ? 'not-allowed' : 'pointer',
                      opacity: readOnly && !selected ? 0.6 : 1
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {validationErrors?.gstRegistered && (
              <p style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px' }}>
                {validationErrors.gstRegistered}
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="panRegistered">PAN Registered?</RequiredLabel>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Yes', 'No'].map((opt) => {
                const val = opt === 'Yes';
                const selected = formData.panRegistered === (val ? 'yes' : 'no') ||
                  (formData.panRegistered !== 'yes' && formData.panRegistered !== 'no' && typeof formData.isPanRegistered === 'boolean' && formData.isPanRegistered === val);
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      if (readOnly) return;
                      handleInputChange('isPanRegistered', val);
                      handleInputChange('panRegistered', val ? 'yes' : 'no');
                      if (setValidationErrors) {
                        setValidationErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.panRegistered;
                          return copy;
                        });
                      }
                    }}
                    className={`${styles.chipButton} ${selected ? styles.selected : ''}`}
                    style={{
                      flex: 1,
                      padding: '6px',
                      cursor: readOnly ? 'not-allowed' : 'pointer',
                      opacity: readOnly && !selected ? 0.6 : 1
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {validationErrors?.panRegistered && (
              <p style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px' }}>
                {validationErrors.panRegistered}
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="roleType">Expert role type</RequiredLabel>
            <select
              id="roleType"
              value={formData.roleType || 'Independent Consultant'}
              onChange={(e) => handleInputChange('roleType', e.target.value)}
              disabled={readOnly}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                backgroundColor: readOnly ? '#F3F4F6' : '#FFFFFF',
                cursor: readOnly ? 'not-allowed' : 'default'
              }}
            >
              <option value="Independent Consultant">Independent Consultant</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Small Team / Boutique Agency">Small Team / Boutique Agency</option>
              <option value="Growth Agency / Specialist Firm">Growth Agency / Specialist Firm</option>
            </select>
          </div>
        </div>

        {/* Row 4: Work Email & Mobile */}
        <div className={styles.formGrid2} style={{ marginBottom: '16px' }}>
          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="email">Work Email</RequiredLabel>
            <div className={!adminMode && isRegistrationComplete && !readOnly ? styles.inputWithAction : ''}>
              <input
                type="email"
                id="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => {
                  if (formData.email) {
                    const corpDomain = extractCorporateDomain(formData.email);
                    if (corpDomain) {
                      triggerAutoEnrichment?.({ email: formData.email, triggerSource: 'business_email' });
                    }
                  }
                }}
                placeholder="you@company.com"
                required
                disabled={adminMode ? false : (readOnly || (isRegistrationComplete && !expertProfileIsVerified))}
                readOnly={adminMode ? false : (readOnly || isRegistrationComplete)}
                className={(!adminMode && (readOnly || isRegistrationComplete)) ? styles.disabledInput : ''}
              />
              {!adminMode && isRegistrationComplete && !readOnly && (
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={onInitiateEmailChange}
                  style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                >
                  Update Email
                </button>
              )}
            </div>
          </div>
          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="mobile">Mobile Number</RequiredLabel>
            <div className={!adminMode && expertProfileIsVerified && !readOnly ? styles.inputWithAction : ''}>
              <input
                type="tel"
                id="mobile"
                value={formData.mobile || ''}
                onChange={(e) => {
                  if (readOnly) return;
                  handleInputChange('mobile', e.target.value);
                }}
                placeholder="+91 9876543210"
                required
                readOnly={adminMode ? false : (expertProfileIsVerified || readOnly)}
                disabled={adminMode ? false : (expertProfileIsVerified || readOnly)}
                className={(!adminMode && (expertProfileIsVerified || readOnly)) ? styles.disabledInput : ''}
              />
              {!adminMode && expertProfileIsVerified && !readOnly && onOpenMobileModal && (
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={onOpenMobileModal}
                  style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                >
                  Request Mobile Change
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 5: Website + Experience Date */}
        <div className={styles.formGrid2} style={{ marginBottom: '16px' }}>
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="website">Website URL (Optional)</label>
              {isEnriching && enrichedSource === 'website_url' && (
                <span style={{ fontSize: '11px', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> Scraping website...
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <input
                type="url"
                id="website"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
                disabled={readOnly}
                readOnly={readOnly}
                className={readOnly ? styles.disabledInput : ''}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                disabled={readOnly || isEnriching || (!formData.website?.trim() && !extractCorporateDomain(formData.email || ''))}
                onClick={() => {
                  const targetUrl = formData.website?.trim() || (extractCorporateDomain(formData.email || '') ? `https://${extractCorporateDomain(formData.email || '')}` : '');
                  if (!targetUrl) {
                    toast.error('Please enter your website URL or work email first.');
                    return;
                  }
                  if (!formData.website?.trim() && targetUrl) {
                    handleInputChange('website', targetUrl);
                  }
                  triggerAutoEnrichment?.({ websiteUrl: targetUrl, triggerSource: 'website_url', force: true });
                }}
                style={{
                  padding: '0 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: readOnly || isEnriching || (!formData.website?.trim() && !extractCorporateDomain(formData.email || '')) ? 'not-allowed' : 'pointer',
                  opacity: readOnly || isEnriching || (!formData.website?.trim() && !extractCorporateDomain(formData.email || '')) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(79, 70, 229, 0.2)',
                  transition: 'all 0.2s ease',
                }}
              >
                {isEnriching ? (
                  <>
                    <FiLoader style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Auto-Fill from Website</span>
                  </>
                )}
              </button>
            </div>
            <p style={{ marginTop: '5px', fontSize: '11px', color: '#6B7280' }}>
              💡 Click <strong>Auto-Fill from Website</strong> to detect your business details, bio, logo, and pre-select your service categories.
            </p>
          </div>

          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="experienceStartDate">Inception Date / Years of Exp.</RequiredLabel>
            <div className={styles.dateInputContainer}>
              <input
                type="date"
                id="experienceStartDate"
                disabled={readOnly}
                readOnly={readOnly}
                className={readOnly ? styles.disabledInput : ''}
                ref={(el) => {
                  if (el) {
                    el.onclick = () => {
                      if (readOnly) return;
                      try { if (typeof el.showPicker === 'function') el.showPicker(); } catch (e) { }
                    };
                  }
                }}
                value={formData.experienceStartDate || ''}
                onChange={(e) => {
                  if (readOnly) return;
                  const selectedDate = e.target.value
                  handleInputChange('experienceStartDate', selectedDate)
                  if (selectedDate) {
                    const startDate = new Date(selectedDate)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    startDate.setHours(0, 0, 0, 0)
                    if (startDate > today) {
                      setValidationErrors(prev => ({ ...prev, experienceStartDate: 'Date cannot be in the future.' }))
                    } else {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.experienceStartDate
                        return newErrors
                      })
                    }
                  }
                }}
                required
                max={new Date().toISOString().split('T')[0]}
              />
              <FiCalendar className={styles.calendarIconOverlay} />
            </div>
            {formData.experienceStartDate && !validationErrors.experienceStartDate && (() => {
              const startDate = new Date(formData.experienceStartDate)
              const today = new Date()
              const diffTime = today.getTime() - startDate.getTime()
              const years = Math.floor(diffTime / (365.25 * 24 * 60 * 60 * 1000))
              return (
                <p style={{ marginTop: '4px', fontSize: '11px', color: '#10B981' }}>
                  ✓ {years} {years === 1 ? 'year' : 'years'} of experience
                </p>
              )
            })()}
          </div>
        </div>

        {/* Row 6: Location (Country, State, City) */}
        <div className={styles.formGrid3} style={{ marginBottom: '16px' }}>
          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="country">Country</RequiredLabel>
            <input
              type="text"
              id="country"
              value={formData.country || 'India'}
              onChange={(e) => handleInputChange('country', e.target.value)}
              disabled={readOnly}
              readOnly={readOnly}
              className={readOnly ? styles.disabledInput : ''}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="state">State</RequiredLabel>
            <select
              id="state"
              value={formData.state || 'Maharashtra'}
              onChange={(e) => handleInputChange('state', e.target.value)}
              disabled={readOnly}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
                backgroundColor: readOnly ? '#F3F4F6' : '#FFFFFF',
                cursor: readOnly ? 'not-allowed' : 'default'
              }}
            >
              {[
                'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
                'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
                'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
                'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
                'Uttarakhand', 'West Bengal', 'Delhi NCR', 'Other'
              ].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <RequiredLabel htmlFor="city">City</RequiredLabel>
            <input
              type="text"
              id="city"
              value={formData.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Mumbai"
              disabled={readOnly}
              readOnly={readOnly}
              className={readOnly ? styles.disabledInput : ''}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <RequiredLabel htmlFor="about">About / Summary</RequiredLabel>
            <button
              type="button"
              disabled={readOnly || isEnriching || !formData.about || formData.about.trim().length < 20}
              onClick={() => {
                if (!formData.about || formData.about.trim().length < 20) {
                  toast.error('Please write at least a few sentences about your services first.');
                  return;
                }
                triggerAutoEnrichment?.({ aboutText: formData.about, triggerSource: 'about_summary', force: true });
              }}
              style={{
                padding: '5px 14px',
                borderRadius: '7px',
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                color: '#4338CA',
                border: '1px solid #C7D2FE',
                fontWeight: '600',
                fontSize: '12px',
                cursor: readOnly || isEnriching || !formData.about || formData.about.trim().length < 20 ? 'not-allowed' : 'pointer',
                opacity: readOnly || isEnriching || !formData.about || formData.about.trim().length < 20 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(99, 102, 241, 0.1)',
                transition: 'all 0.2s ease',
              }}
            >
              {isEnriching && enrichedSource === 'about_summary' ? (
                <>
                  <FiLoader style={{ animation: 'spin 1s linear infinite' }} />
                  <span>AI Analyzing Services...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Auto-Detect Services from Summary</span>
                </>
              )}
            </button>
          </div>
          <textarea
            id="about"
            rows={5}
            maxLength={2000}
            value={formData.about || ''}
            onChange={(e) => handleInputChange('about', e.target.value)}
            placeholder="Describe your expertise, experience, and value proposition... (max 2000 characters)"
            disabled={readOnly}
            readOnly={readOnly}
            className={readOnly ? styles.disabledInput : ''}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
              💡 No website? Summarise your skills to auto-select relevant core services in Step 2.
            </p>
            {formData.about && (
              <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
                {formData.about.length}/2000 characters
              </p>
            )}
          </div>
        </div>

      </Card>
    </div>
  )
}

export default ProfileStep
