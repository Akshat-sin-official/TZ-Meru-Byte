import React, { useState } from 'react'
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import { toast } from 'sonner'
import Card from '../ui/Card'
import RequiredLabel from '../shared/RequiredLabel'
import Button from '../ui/Button'
import styles from '../ServiceExpert.module.css'

const entityTypes = [
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership Firm' },
  { value: 'llp', label: 'LLP' },
  { value: 'opc', label: 'OPC' },
  { value: 'pvt_ltd', label: 'Private Limited' },
  { value: 'public_ltd', label: 'Public Limited' },
]

const renderDocPreview = (doc) => {
  if (!doc) return null;
  const href = doc.file instanceof File ? URL.createObjectURL(doc.file) : (doc.file || doc.url || doc.fileUrl);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
      <p style={{ fontSize: '12px', color: '#10B981', margin: 0, fontWeight: '500' }}>✓ File Selected</p>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'underline', fontWeight: '500' }}>
          Preview Uploaded File
        </a>
      )}
    </div>
  );
};const renderExistingFilePreview = (url, label = 'Existing Document') => {
  if (!url) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', backgroundColor: '#F3F4F6', padding: '6px 12px', borderRadius: '4px', border: '1px solid #E5E7EB', width: 'fit-content' }}>
      <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: '500' }}>Current file:</span>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', textDecoration: 'underline' }}>
        View {label}
      </a>
    </div>
  );
};

/* --- PREMIUM UX COMPLIANCE SECTION WRAPPER --- */
const ComplianceSectionWrapper = ({
  title,
  subtitle,
  sectionKey,
  isRequested,
  isActive,
  onToggle,
  hasExistingData,
  existingDataSummary,
  children
}) => {
  return (
    <div style={{
      marginBottom: '32px',
      borderBottom: '1px solid #F3F4F6',
      paddingBottom: '28px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#111827',
            margin: 0,
            display: 'inline-flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {title}
            {isRequested && (
              <span style={{
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid #FCD34D',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <FiAlertTriangle size={10} /> Action Required
              </span>
            )}
            {!isRequested && (
              <span style={{
                backgroundColor: '#F3F4F6',
                color: '#6B7280',
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                display: 'inline-flex',
                alignItems: 'center'
              }}>
                Optional Update
              </span>
            )}
          </h3>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: '4px 0 0 0', lineHeight: 1.4 }}>{subtitle}</p>
        </div>

        {/* Dynamic iOS Toggle Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: isActive ? 'var(--color-primary, #3b82f6)' : '#6B7280', transition: 'color 0.2s' }}>
            {isActive ? 'Updating' : 'Keeping Current'}
          </span>
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '46px',
            height: '24px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => onToggle(sectionKey)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: isActive ? 'var(--color-primary, #3b82f6)' : '#D1D5DB',
              transition: '0.3s',
              borderRadius: '24px'
            }} />
            <span style={{
              position: 'absolute',
              content: '""',
              height: '18px',
              width: '18px',
              left: '3px',
              bottom: '3px',
              backgroundColor: 'white',
              transition: '0.3s',
              borderRadius: '50%',
              transform: isActive ? 'translateX(22px)' : 'none'
            }} />
          </label>
        </div>
      </div>

      {isActive ? (
        <div style={{
          padding: '20px',
          backgroundColor: isRequested ? 'rgba(251, 191, 36, 0.01)' : 'rgba(243, 244, 246, 0.02)',
          borderRadius: '12px',
          border: isRequested ? '1.5px dashed #F59E0B' : '1px dashed #E5E7EB',
          transition: 'all 0.3s ease',
          boxShadow: isRequested ? '0 4px 6px -1px rgba(245, 158, 11, 0.02)' : 'none'
        }}>
          {children}
        </div>
      ) : (
        <div style={{
          padding: '14px 20px',
          backgroundColor: '#F9FAFB',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiCheckCircle style={{ color: '#10B981', fontSize: '18px', flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Using existing information on file
              </p>
              {hasExistingData && existingDataSummary && (
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6B7280', fontFamily: 'monospace', letterSpacing: '0.2px' }}>
                  {existingDataSummary}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggle(sectionKey)}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-primary, #3b82f6)',
              backgroundColor: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.06)';
            }}
          >
            Update Section
          </button>
        </div>
      )}
    </div>
  );
};

const RequestedDocsStep = ({
  formData,
  handleInputChange,
  handleDocumentChange,
  validationErrors,
  setValidationErrors,
  activeUpdates = {
    profileAssets: false,
    portfolio: false,
    entity: false,
    gst: false,
    address: false,
    bank: false
  },
  onToggle = () => {}
}) => {
  const [showAccountNumber, setShowAccountNumber] = useState(false)
  let requestedDocs = formData.requestedDocuments || []
  if (requestedDocs.length === 0 && !formData.kycVerified) {
    requestedDocs = ['panCard', 'registeredAddressProof', 'bankDetailsProof'];
    if (formData.gstRegistered === 'yes') {
      requestedDocs.push('gstCertificate');
    }
    if (['opc', 'pvt_ltd', 'public_ltd'].includes(formData.entityType)) {
      requestedDocs.push('cinCertificate');
    }
    if (formData.entityType === 'llp') {
      requestedDocs.push('llpinCertificate');
    }
  }

  // Helper to check if a specific document or field is requested
  const isRequested = (docId) => requestedDocs.includes(docId)

  // Mapping of requested document IDs to display labels
  const getDocLabel = (id) => {
    const labels = {
      'businessLogo': 'Business Logo',
      'profileImage': 'Profile Image',
      'portfolioItems': 'Portfolio Samples',
      'certifications': 'Certifications',
      'registeredAddressProof': 'Address Proof',
      'bankDetailsProof': 'Bank Account Proof',
      'panCard': 'PAN Card',
      'gstCertificate': 'GST Certificate',
      'cinCertificate': 'CIN Certificate',
      'llpinCertificate': 'LLPIN Certificate',
      'msmeCertificate': 'MSME Certificate',
      'isoCertificate': 'ISO Certificate'
    }
    return labels[id] || id
  }

  const getFieldStyle = (fieldKeys) => {
    const keysArray = Array.isArray(fieldKeys) ? fieldKeys : [fieldKeys];
    const isReq = keysArray.some(key => isRequested(key));
    return {
      padding: '20px',
      backgroundColor: isReq ? 'rgba(251, 191, 36, 0.01)' : '#ffffff',
      borderRadius: '12px',
      border: isReq ? '1.5px solid #F59E0B' : '1px solid #E5E7EB',
      marginTop: '16px',
      boxShadow: isReq ? '0 4px 6px -1px rgba(245, 158, 11, 0.02)' : 'none',
      transition: 'all 0.2s ease'
    };
  };

  const renderActionBadge = (fieldKeys) => {
    const keysArray = Array.isArray(fieldKeys) ? fieldKeys : [fieldKeys];
    const isReq = keysArray.some(key => isRequested(key));
    if (!isReq) return null;
    return (
      <span style={{
        backgroundColor: '#FEF3C7',
        color: '#D97706',
        fontSize: '11px',
        fontWeight: '700',
        padding: '3px 10px',
        borderRadius: '20px',
        marginLeft: '12px',
        border: '1px solid #FCD34D',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.3px'
      }}>
        <FiAlertTriangle size={12} /> Action Required
      </span>
    );
  };

  const renderLabelWithAsterisk = (text, fieldKeys, htmlFor = undefined) => {
    const keysArray = Array.isArray(fieldKeys) ? fieldKeys : [fieldKeys];
    const isReq = keysArray.some(key => isRequested(key));
    return (
      <label htmlFor={htmlFor} style={{ fontWeight: '600', fontSize: '14px', color: '#374151', display: 'block', marginBottom: '6px' }}>
        {text}
        {isReq && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
      </label>
    );
  };

  return (
    <div className={styles.stepContentWrapper}>
      <Card className={styles.stepCard}>
        {/* Banner */}
        <div style={{
          backgroundColor: '#fff7ed',
          border: '1px solid #fdba74',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '28px',
          display: 'flex',
          gap: '12px'
        }}>
          <FiAlertTriangle style={{ color: '#ea580c', fontSize: '24px', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ color: '#9a3412', fontSize: '16px', fontWeight: '600', marginBottom: '4px', marginTop: 0 }}>
              Action Required: Onboarding Compliance Verification
            </h3>
            <p style={{ color: '#c2410c', fontSize: '14px', marginBottom: '8px', whiteSpace: 'pre-line' }}>
              The verification team has requested action or supporting documents for the highlighted parameters:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {requestedDocs.map(docId => (
                <span key={docId} style={{ 
                  backgroundColor: '#ffedd5', 
                  color: '#9a3412', 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  fontWeight: '600',
                  border: '1px solid #fed7aa'
                }}>
                  {getDocLabel(docId)}
                </span>
              ))}
            </div>
            {formData.documentsRequestedReason && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '6px', borderLeft: '4px solid #f97316' }}>
                <p style={{ color: '#9a3412', fontSize: '13px', margin: 0, fontStyle: 'italic', fontWeight: '500' }}>
                  Instructions: "{formData.documentsRequestedReason}"
                </p>
              </div>
            )}
          </div>
        </div>

        <h2 className={styles.stepTitle}>Compliance Portal</h2>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '28px', lineHeight: '1.6' }}>
          Verify and update your business legal structure, tax identifiers, address proofs, and banking payouts below. Only highlighted fields with the red <span style={{ color: '#ef4444' }}>*</span> asterisk are compulsory. All other compliance parameters are fully optional.
        </p>

        {/* 1. PROFILE ASSETS SECTION */}
        {(isRequested('businessLogo') || isRequested('profileImage')) && (
          <ComplianceSectionWrapper
            title="Profile Assets"
            subtitle="Verify and update your business brand logo and personal expert photo."
            sectionKey="profileAssets"
            isRequested={isRequested('businessLogo') || isRequested('profileImage')}
            isActive={activeUpdates.profileAssets}
            onToggle={onToggle}
            hasExistingData={!!(formData.logoUrl || formData.profileImageUrl)}
            existingDataSummary={(formData.logoUrl && formData.profileImageUrl) ? 'Logo & Profile photo are active on record' : (formData.logoUrl ? 'Logo is active on record' : (formData.profileImageUrl ? 'Profile photo is active on record' : 'No assets on record'))}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {isRequested('businessLogo') && (
                <div className={styles.formGroup} style={getFieldStyle('businessLogo')}>
                  {renderLabelWithAsterisk('Business Logo', 'businessLogo', 'logo')}
                  {renderActionBadge('businessLogo')}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                      {formData.logoFile ? (
                        <img src={formData.logoFile instanceof Blob ? URL.createObjectURL(formData.logoFile) : formData.logoFile} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Current Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <FiInfo style={{ color: '#9CA3AF' }} />
                      )}
                    </div>
                    <input type="file" id="logo" accept="image/*" onChange={(e) => handleInputChange('logoFile', e.target.files?.[0])} style={{ fontSize: '12px' }} />
                  </div>
                </div>
              )}

              {isRequested('profileImage') && (
                <div className={styles.formGroup} style={getFieldStyle('profileImage')}>
                  {renderLabelWithAsterisk('Profile Image (Expert Photo)', 'profileImage', 'profileImage')}
                  {renderActionBadge('profileImage')}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                      {formData.profileImageFile ? (
                        <img src={formData.profileImageFile instanceof Blob ? URL.createObjectURL(formData.profileImageFile) : formData.profileImageFile} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : formData.profileImageUrl ? (
                        <img src={formData.profileImageUrl} alt="Current Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <FiInfo style={{ color: '#9CA3AF' }} />
                      )}
                    </div>
                    <input type="file" id="profileImage" accept="image/*" onChange={(e) => handleInputChange('profileImageFile', e.target.files?.[0])} style={{ fontSize: '12px' }} />
                  </div>
                </div>
              )}
            </div>
          </ComplianceSectionWrapper>
        )}

        {/* 2. PORTFOLIO & CREDIBILITY SECTION */}
        {(isRequested('portfolioItems') || isRequested('certifications')) && (
          <ComplianceSectionWrapper
            title="Portfolio & Credibility"
            subtitle="Verify and update your showcase samples and professional certifications."
            sectionKey="portfolio"
            isRequested={isRequested('portfolioItems') || isRequested('certifications')}
            isActive={activeUpdates.portfolio}
            onToggle={onToggle}
            hasExistingData={!!(formData.portfolioItems?.length > 0 || formData.certifications?.length > 0)}
            existingDataSummary={`${formData.portfolioItems?.length || 0} portfolio items | ${formData.certifications?.length || 0} certifications on record.`}
          >
            {isRequested('portfolioItems') && (
              <div className={styles.formGroup} style={getFieldStyle('portfolioItems')}>
                {renderLabelWithAsterisk('Update Portfolio Samples', 'portfolioItems')}
                {renderActionBadge('portfolioItems')}
                {formData.portfolioItems?.map((item, index) => (
                  <div key={index} className={styles.summaryCard} style={{ marginTop: '8px', padding: '12px' }}>
                    <div className={styles.flexResponsive} style={{ gap: '8px' }}>
                      <select 
                        value={item.type || 'url'} 
                        onChange={(e) => {
                          const newItems = [...formData.portfolioItems];
                          newItems[index] = { ...newItems[index], type: e.target.value, file: null, url: '' };
                          handleInputChange('portfolioItems', newItems);
                        }}
                        style={{ padding: '6px', fontSize: '12px' }}
                      >
                        <option value="image">Image</option>
                        <option value="pdf">PDF</option>
                        <option value="url">URL</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Title" 
                        value={item.title || ''} 
                        onChange={(e) => {
                          const newItems = [...formData.portfolioItems];
                          newItems[index] = { ...newItems[index], title: e.target.value };
                          handleInputChange('portfolioItems', newItems);
                        }}
                        style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      {item.type === 'url' ? (
                        <input type="url" placeholder="Paste link" value={item.url || ''} onChange={(e) => {
                          const newItems = [...formData.portfolioItems];
                          newItems[index] = { ...newItems[index], url: e.target.value };
                          handleInputChange('portfolioItems', newItems);
                        }} style={{ width: '100%', padding: '6px', fontSize: '12px' }} />
                      ) : (
                        <input type="file" accept={item.type === 'image' ? 'image/*' : 'application/pdf'} onChange={(e) => {
                          const newItems = [...formData.portfolioItems];
                          newItems[index] = { ...newItems[index], file: e.target.files?.[0] };
                          handleInputChange('portfolioItems', newItems);
                        }} style={{ fontSize: '12px' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isRequested('certifications') && (
              <div className={styles.formGroup} style={getFieldStyle('certifications')}>
                {renderLabelWithAsterisk('Update Certifications', 'certifications')}
                {renderActionBadge('certifications')}
                {formData.certifications?.map((cert, index) => (
                  <div key={index} className={styles.summaryCard} style={{ marginTop: '8px' }}>
                    <input type="text" placeholder="Certification Title" value={cert.title || ''} onChange={(e) => {
                      const newCerts = [...formData.certifications];
                      newCerts[index] = { ...newCerts[index], title: e.target.value };
                      handleInputChange('certifications', newCerts);
                    }} style={{ width: '100%', marginBottom: '8px' }} />
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => {
                      const newCerts = [...formData.certifications];
                      newCerts[index] = { ...newCerts[index], file: e.target.files?.[0] };
                      handleInputChange('certifications', newCerts);
                    }} style={{ fontSize: '12px' }} />
                  </div>
                ))}
              </div>
            )}
          </ComplianceSectionWrapper>
        )}

        {/* 3. LEGAL IDENTITY, ENTITY SELECTION & CORPORATE PROOFS */}
        <ComplianceSectionWrapper
          title="Legal Entity & PAN Details"
          subtitle="Define your business registration classification, PAN card identity, and registration certificates."
          sectionKey="entity"
          isRequested={isRequested('panCard') || isRequested('cinCertificate') || isRequested('llpinCertificate')}
          isActive={activeUpdates.entity}
          onToggle={onToggle}
          hasExistingData={!!formData.panNumber}
          existingDataSummary={`Type: ${(formData.entityType || '').toUpperCase()} | PAN: ${formData.panNumber ? '••••' + formData.panNumber.slice(-4) : '—'} ${formData.cinNumber ? '| CIN: ••••' + formData.cinNumber.slice(-4) : ''} ${formData.llpinNumber ? '| LLPIN: ••••' + formData.llpinNumber.slice(-4) : ''}`}
        >
          <div className={styles.formGroup} style={{ padding: '4px 0' }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>Entity Type (Update structure if needed)</label>
            {validationErrors.entityType && (
              <span className={styles.errorText} style={{ display: 'block', marginTop: '4px' }}>{validationErrors.entityType}</span>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginTop: '12px' }}>
              {entityTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    handleInputChange('entityType', type.value)
                    setValidationErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.entityType
                      delete newErrors.documents
                      return newErrors
                    })
                  }}
                  className={`${styles.chipButton} ${formData.entityType === type.value ? styles.selected : ''}`}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `2px solid ${formData.entityType === type.value ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                    backgroundColor: formData.entityType === type.value ? 'var(--color-primary-light, rgba(59, 130, 246, 0.1))' : 'transparent',
                    textAlign: 'center',
                    fontWeight: formData.entityType === type.value ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '24px' }}>
            {/* PAN Number & Card */}
            <div className={styles.formGroup} style={getFieldStyle('panCard')}>
              {renderLabelWithAsterisk('Permanent Account Number (PAN)', 'panCard', 'panNumber')}
              {renderActionBadge('panCard')}
              <input 
                type="text" 
                value={formData.panNumber || ''} 
                onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                style={{ width: '100%', marginBottom: '12px', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', textTransform: 'uppercase', fontWeight: '500' }}
              />
              {validationErrors.panNumber && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: 0 }}>{validationErrors.panNumber}</p>}
              
              <div style={{ marginTop: '4px' }}>
                <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: '#4B5563', fontWeight: '500' }}>
                  Upload PAN Card Proof
                  {isRequested('panCard') && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                </label>
                <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'PAN Card')} style={{ fontSize: '13px' }} />
                {renderDocPreview(formData.documents?.find(d => d.type === 'PAN Card' || d.documentType === 'PAN Card'))}
                {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'PAN Card' || d.type === 'PAN Card')?.fileUrl, 'PAN Card')}
              </div>
            </div>

            {/* CIN for Companies */}
            {['opc', 'pvt_ltd', 'public_ltd'].includes(formData.entityType) && (
              <div className={styles.formGroup} style={getFieldStyle('cinCertificate')}>
                {renderLabelWithAsterisk('Corporate Identification Number (CIN)', 'cinCertificate')}
                {renderActionBadge('cinCertificate')}
                <input 
                  type="text" 
                  value={formData.cinNumber || ''} 
                  onChange={(e) => handleInputChange('cinNumber', e.target.value.toUpperCase())}
                  placeholder="U12345MH2020PTC123456"
                  maxLength={21}
                  style={{ width: '100%', marginBottom: '12px', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', textTransform: 'uppercase', fontWeight: '500' }}
                />
                {validationErrors.cinNumber && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: 0 }}>{validationErrors.cinNumber}</p>}
                
                <div>
                  <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: '#4B5563', fontWeight: '500' }}>
                    Upload Certificate of Incorporation (CIN)
                    {isRequested('cinCertificate') && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                  </label>
                  <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'CIN')} style={{ fontSize: '13px' }} />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'CIN' || d.documentType === 'CIN'))}
                  {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'CIN' || d.type === 'CIN')?.fileUrl, 'CIN Certificate')}
                </div>
              </div>
            )}

            {/* LLPIN for LLPs */}
            {formData.entityType === 'llp' && (
              <div className={styles.formGroup} style={getFieldStyle('llpinCertificate')}>
                {renderLabelWithAsterisk('Limited Liability Partnership Identification Number (LLPIN)', 'llpinCertificate')}
                {renderActionBadge('llpinCertificate')}
                <input 
                  type="text" 
                  value={formData.llpinNumber || ''} 
                  onChange={(e) => handleInputChange('llpinNumber', e.target.value.toUpperCase())}
                  placeholder="AAA-1234"
                  maxLength={8}
                  style={{ width: '100%', marginBottom: '12px', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', textTransform: 'uppercase', fontWeight: '500' }}
                />
                {validationErrors.llpinNumber && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: 0 }}>{validationErrors.llpinNumber}</p>}
                
                <div>
                  <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: '#4B5563', fontWeight: '500' }}>
                    Upload LLP Registration Certificate (LLPIN)
                    {isRequested('llpinCertificate') && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                  </label>
                  <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'LLPIN')} style={{ fontSize: '13px' }} />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'LLPIN' || d.documentType === 'LLPIN'))}
                  {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'LLPIN' || d.type === 'LLPIN')?.fileUrl, 'LLPIN Certificate')}
                </div>
              </div>
            )}

            {/* Entity-Specific Additional Supporting Proofs */}
            <div className={styles.formGroup} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '12px' }}>
                Required Supporting Identity Documents
              </label>
              
              {validationErrors.documents && (
                <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '13px', borderRadius: '6px', marginBottom: '16px' }}>
                  {validationErrors.documents}
                </div>
              )}

              {/* Proprietorship */}
              {formData.entityType === 'proprietorship' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div style={getFieldStyle('panCard')}>
                    {renderLabelWithAsterisk('Proprietor Identity Proof (PAN)', 'panCard')}
                    {renderActionBadge('panCard')}
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Proprietor PAN')} style={{ fontSize: '13px' }} />
                    {renderDocPreview(formData.documents?.find(d => d.type === 'Proprietor PAN' || d.documentType === 'Proprietor PAN'))}
                    {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'Proprietor PAN' || d.type === 'Proprietor PAN')?.fileUrl, 'Proprietor PAN')}
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Business Proof (if available)</label>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', margin: 0 }}>Shop Act, Udyam Registration, Trade License (if applicable)</p>
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Business Proof')} style={{ fontSize: '13px', marginTop: '6px' }} />
                    {renderDocPreview(formData.documents?.find(d => d.type === 'Business Proof' || d.documentType === 'Business Proof'))}
                    {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'Business Proof' || d.type === 'Business Proof')?.fileUrl, 'Business Proof')}
                  </div>
                </div>
              )}

              {/* Partnership Firm */}
              {formData.entityType === 'partnership' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div style={getFieldStyle('panCard')}>
                    {renderLabelWithAsterisk('Firm PAN', 'panCard')}
                    {renderActionBadge('panCard')}
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Firm PAN')} style={{ fontSize: '13px' }} />
                    {renderDocPreview(formData.documents?.find(d => d.type === 'Firm PAN' || d.documentType === 'Firm PAN'))}
                    {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'Firm PAN' || d.type === 'Firm PAN')?.fileUrl, 'Firm PAN')}
                  </div>
                  <div>
                    {renderLabelWithAsterisk('Partnership Deed', 'partnershipDeed')}
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', margin: 0 }}>
                      Upload a single PDF containing: first page with firm name, partners' details, and signature pages.
                    </p>
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Partnership Deed')} style={{ fontSize: '13px', marginTop: '6px' }} />
                    {renderDocPreview(formData.documents?.find(d => d.type === 'Partnership Deed' || d.documentType === 'Partnership Deed'))}
                    {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'Partnership Deed' || d.type === 'Partnership Deed')?.fileUrl, 'Partnership Deed')}
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Authorized Signatory PAN <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'normal' }}>(Optional)</span></label>
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Authorized Signatory PAN')} style={{ fontSize: '13px' }} />
                    {renderDocPreview(formData.documents?.find(d => d.type === 'Authorized Signatory PAN' || d.documentType === 'Authorized Signatory PAN'))}
                    {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'Authorized Signatory PAN' || d.type === 'Authorized Signatory PAN')?.fileUrl, 'Authorized Signatory PAN')}
                  </div>
                </div>
              )}

              {/* LLP */}
              {formData.entityType === 'llp' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div style={getFieldStyle('panCard')}>
                    {renderLabelWithAsterisk('LLP PAN', 'panCard')}
                    {renderActionBadge('panCard')}
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'LLP PAN')} style={{ fontSize: '13px' }} />
                    {renderDocPreview(formData.documents?.find(d => d.type === 'LLP PAN' || d.documentType === 'LLP PAN'))}
                    {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'LLP PAN' || d.type === 'LLP PAN')?.fileUrl, 'LLP PAN')}
                  </div>
                </div>
              )}

              {/* OPC / Private / Public Limited */}
              {['opc', 'pvt_ltd', 'public_ltd'].includes(formData.entityType) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div style={getFieldStyle('panCard')}>
                    {renderLabelWithAsterisk('Company PAN', 'panCard')}
                    {renderActionBadge('panCard')}
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Company PAN')} style={{ fontSize: '13px' }} />
                    {renderDocPreview(formData.documents?.find(d => d.type === 'Company PAN' || d.documentType === 'Company PAN'))}
                    {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'Company PAN' || d.type === 'Company PAN')?.fileUrl, 'Company PAN')}
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Authorized Signatory PAN <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'normal' }}>(Optional)</span></label>
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Authorized Signatory PAN')} style={{ fontSize: '13px' }} />
                    {renderDocPreview(formData.documents?.find(d => d.type === 'Authorized Signatory PAN' || d.documentType === 'Authorized Signatory PAN'))}
                    {renderExistingFilePreview(formData.documents?.find(d => d.documentType === 'Authorized Signatory PAN' || d.type === 'Authorized Signatory PAN')?.fileUrl, 'Authorized Signatory PAN')}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Badges (MSME / ISO) */}
            {(isRequested('msmeCertificate') || isRequested('isoCertificate')) && (
              <div className={styles.formGroup} style={getFieldStyle(['msmeCertificate', 'isoCertificate'])}>
                <label style={{ fontWeight: '600' }}>
                  Additional Compliance Badges (MSME / ISO)
                  {renderActionBadge(['msmeCertificate', 'isoCertificate'])}
                </label>
                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>Upload certificates as requested</p>
                <input type="file" multiple accept="application/pdf,image/*" onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleInputChange('complianceBadgeFiles', files);
                }} style={{ fontSize: '12px' }} />
              </div>
            )}
          </div>
        </ComplianceSectionWrapper>

        {/* 4. GST REGISTRATION DETAILS */}
        <ComplianceSectionWrapper
          title="Tax & GST Registration"
          subtitle="Specify whether your entity operates with a GST registration, and upload certificate proofs."
          sectionKey="gst"
          isRequested={isRequested('gstCertificate')}
          isActive={activeUpdates.gst}
          onToggle={onToggle}
          hasExistingData={formData.gstRegistered === 'yes' ? !!formData.gstNumber : true}
          existingDataSummary={`Status: ${formData.gstRegistered === 'yes' ? 'Registered (' + (formData.gstNumber ? '••••' + formData.gstNumber.slice(-5) : '') + ')' : 'Not Registered (RCM applicable)'}`}
        >
          <div className={styles.formGroup} style={getFieldStyle('gstCertificate')}>
            {renderLabelWithAsterisk('Are you registered under GST?', 'gstCertificate')}
            {renderActionBadge('gstCertificate')}

            <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <input
                  type="radio"
                  name="gstRegistered"
                  checked={formData.gstRegistered === 'yes'}
                  onChange={() => handleInputChange('gstRegistered', 'yes')}
                  style={{ cursor: 'pointer' }}
                />
                Yes, I have GST
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <input
                  type="radio"
                  name="gstRegistered"
                  checked={formData.gstRegistered === 'no'}
                  onChange={() => handleInputChange('gstRegistered', 'no')}
                  style={{ cursor: 'pointer' }}
                />
                No, GST not applicable
              </label>
            </div>

            {formData.gstRegistered === 'yes' && (
              <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', marginTop: '12px' }}>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiInfo style={{ flexShrink: 0 }} />
                  This will serve as your Business Verification and Primary Address Proof.
                </p>
                <div style={{ marginBottom: '16px' }}>
                  {renderLabelWithAsterisk('GSTIN Number', 'gstCertificate')}
                  <input
                    type="text"
                    value={formData.gstNumber || ''}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', textTransform: 'uppercase', fontWeight: '500' }}
                  />
                  {validationErrors.gstNumber && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.gstNumber}</p>
                  )}
                </div>
                <div>
                  {renderLabelWithAsterisk('Upload GST Certificate', 'gstCertificate')}
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('File size must be less than 10MB')
                          return
                        }
                        handleInputChange('gstCertificateFile', file)
                        setValidationErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.gstCertificateFile
                          return newErrors
                        })
                      }
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                  />
                  {validationErrors.gstCertificateFile && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.gstCertificateFile}</p>
                  )}
                  {formData.gstCertificateFile && (
                    <p style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', margin: 0 }}>
                      ✓ Selected File: {formData.gstCertificateFile.name}
                    </p>
                  )}
                  {renderExistingFilePreview(formData.gstCertificateUrl, 'GST Certificate')}
                </div>
              </div>
            )}

            {formData.gstRegistered === 'no' && (
              <div style={{ padding: '12px 16px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <FiInfo style={{ flexShrink: 0 }} />
                <span>If services are provided to a GST-registered business, GST may be payable by the service seeker under Reverse Charge Mechanism (RCM), as applicable.</span>
              </div>
            )}
          </div>
        </ComplianceSectionWrapper>

        {/* 5. BUSINESS ADDRESS MANUAL INPUTS & PROOFS */}
        <ComplianceSectionWrapper
          title="Registered Business Address"
          subtitle="Verify your physical office location or registered seat coordinates with supporting documents."
          sectionKey="address"
          isRequested={isRequested('registeredAddressProof')}
          isActive={activeUpdates.address}
          onToggle={onToggle}
          hasExistingData={!!formData.addressLine1}
          existingDataSummary={`Address: ${[formData.addressLine1, formData.city, formData.pincode].filter(Boolean).join(', ')}`}
        >
          <div className={styles.formGroup} style={getFieldStyle('registeredAddressProof')}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>
              Registered Address Details
              {renderActionBadge('registeredAddressProof')}
            </label>

            {formData.gstRegistered === 'yes' ? (
              <div style={{ padding: '14px 16px', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #10B981', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '12px' }}>
                <FiCheckCircle style={{ color: '#10B981', fontSize: '20px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#065F46', fontWeight: '500' }}>Your business address will be verified using your GST certificate. No additional proof required.</span>
              </div>
            ) : (
              <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', marginTop: '12px', marginBottom: '16px' }}>
                <div>
                  {renderLabelWithAsterisk('Upload Business Address Proof', 'registeredAddressProof')}
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px', margin: 0 }}>Utility Bill, Rent Agreement, Shop Act, or LLP/CIN registration containing address</p>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('File size must be less than 10MB')
                          return
                        }
                        handleInputChange('addressProofFile', file)
                        setValidationErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.addressProofFile
                          return newErrors
                        })
                      }
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginTop: '6px' }}
                  />
                  {validationErrors.addressProofFile && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.addressProofFile}</p>
                  )}
                  {formData.addressProofFile && (
                    <p style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', margin: 0 }}>
                      ✓ Selected File: {formData.addressProofFile.name}
                    </p>
                  )}
                  {renderExistingFilePreview(formData.addressProofUrl, 'Address Proof')}
                </div>
              </div>
            )}

            {/* Manual Address Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                {renderLabelWithAsterisk('Address Line 1', 'registeredAddressProof', 'addressLine1')}
                <input
                  type="text"
                  id="addressLine1"
                  value={formData.addressLine1 || ''}
                  onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  placeholder="Building name, Street address"
                  maxLength={200}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500' }}
                />
                {validationErrors.addressLine1 && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.addressLine1}</p>
                )}
              </div>

              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label htmlFor="addressLine2" style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>Address Line 2 (Optional)</label>
                <input
                  type="text"
                  id="addressLine2"
                  value={formData.addressLine2 || ''}
                  onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                  placeholder="Apartment, suite, unit, floor"
                  maxLength={200}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  {renderLabelWithAsterisk('City', 'registeredAddressProof', 'city')}
                  <input
                    type="text"
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500' }}
                  />
                  {validationErrors.city && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.city}</p>
                  )}
                </div>

                <div className={styles.formGroup} style={{ margin: 0 }}>
                  {renderLabelWithAsterisk('State', 'registeredAddressProof', 'state')}
                  <input
                    type="text"
                    id="state"
                    value={formData.state || 'Maharashtra'}
                    readOnly
                    disabled
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed', fontWeight: '500' }}
                  />
                </div>

                <div className={styles.formGroup} style={{ margin: 0 }}>
                  {renderLabelWithAsterisk('Pincode', 'registeredAddressProof', 'pincode')}
                  <input
                    type="text"
                    id="pincode"
                    value={formData.pincode || ''}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    placeholder="Pincode"
                    maxLength={6}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500' }}
                  />
                  {validationErrors.pincode && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.pincode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ComplianceSectionWrapper>

        {/* 6. BANK DETAILS & SECURE PAYOUTS */}
        <ComplianceSectionWrapper
          title="Payout Banking Details"
          subtitle="Configure your bank coordinates, branch codes, and payout methods securely."
          sectionKey="bank"
          isRequested={isRequested('bankDetailsProof')}
          isActive={activeUpdates.bank}
          onToggle={onToggle}
          hasExistingData={!!formData.bankName}
          existingDataSummary={`Bank: ${formData.bankName || '—'} | Account: ${formData.accountNumber ? '••••' + formData.accountNumber.slice(-4) : '—'} | IFSC: ${formData.ifscCode ? '••••' + formData.ifscCode.slice(-4) : '—'}`}
        >
          <div className={styles.formGroup} style={getFieldStyle('bankDetailsProof')}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>
              Payout Account Parameters
              {renderActionBadge('bankDetailsProof')}
            </label>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', marginTop: '4px' }}>
              Payouts are sent to this account securely. This information is encrypted and never shared.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                {renderLabelWithAsterisk('Account Holder Name', 'bankDetailsProof', 'accountHolderName')}
                <input
                  type="text"
                  id="accountHolderName"
                  value={formData.accountHolderName || ''}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  placeholder="Name as per bank records"
                  maxLength={100}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500', marginTop: '6px' }}
                />
                {validationErrors.accountHolderName && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.accountHolderName}</p>
                )}
              </div>

              <div>
                {renderLabelWithAsterisk('Bank Name', 'bankDetailsProof', 'bankName')}
                <input
                  type="text"
                  id="bankName"
                  value={formData.bankName || ''}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  maxLength={100}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500', marginTop: '6px' }}
                />
                {validationErrors.bankName && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.bankName}</p>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label htmlFor="branchName" style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>Branch Name (Optional)</label>
                <input
                  type="text"
                  id="branchName"
                  value={formData.branchName || ''}
                  onChange={(e) => handleInputChange('branchName', e.target.value)}
                  placeholder="Branch location"
                  maxLength={100}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500', marginTop: '6px' }}
                />
              </div>

              <div>
                {renderLabelWithAsterisk('Account Type', 'bankDetailsProof', 'accountType')}
                <select
                  id="accountType"
                  value={formData.accountType || 'savings'}
                  onChange={(e) => handleInputChange('accountType', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500', marginTop: '6px', height: '42px', backgroundColor: '#ffffff' }}
                >
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                {renderLabelWithAsterisk('Account Number', 'bankDetailsProof', 'accountNumber')}
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <input
                    type={showAccountNumber ? "text" : "password"}
                    id="accountNumber"
                    value={formData.accountNumber || ''}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="Enter Account Number"
                    maxLength={30}
                    style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#6B7280'
                    }}
                  >
                    {showAccountNumber ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {validationErrors.accountNumber && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.accountNumber}</p>
                )}
              </div>

              <div>
                {renderLabelWithAsterisk('IFSC Code', 'bankDetailsProof', 'ifscCode')}
                <input
                  type="text"
                  id="ifscCode"
                  value={formData.ifscCode || ''}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  maxLength={11}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500', marginTop: '6px', textTransform: 'uppercase' }}
                />
                {validationErrors.ifscCode && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.ifscCode}</p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="upiId" style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>UPI ID (Optional)</label>
              <input
                type="text"
                id="upiId"
                value={formData.upiId || ''}
                onChange={(e) => handleInputChange('upiId', e.target.value)}
                placeholder="yourname@bank"
                maxLength={50}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontWeight: '500', marginTop: '6px' }}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              {renderLabelWithAsterisk('Upload Bank Account Proof', 'bankDetailsProof')}
              <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px', margin: 0 }}>Cancelled Cheque, Bank Statement (first page), or Passbook front Photo</p>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('File size must be less than 10MB')
                      return
                    }
                    handleInputChange('bankProofFile', file)
                    setValidationErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.bankProofFile
                      return newErrors
                    })
                  }
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginTop: '8px' }}
              />
              {validationErrors.bankProofFile && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{validationErrors.bankProofFile}</p>
              )}
              {formData.bankProofFile && (
                <p style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', margin: 0 }}>
                  ✓ Selected File: {formData.bankProofFile.name}
                </p>
              )}
              {renderExistingFilePreview(formData.bankProofUrl, 'Bank Account Proof')}
            </div>
          </div>
        </ComplianceSectionWrapper>

        {/* Footer info box */}
        <div style={{ marginTop: '28px', padding: '16px', backgroundColor: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FiInfo style={{ color: '#0284C7', fontSize: '20px', flexShrink: 0 }} />
            <p style={{ color: '#0369A1', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
              Once you submit, your compliance documents will be re-sent to our team for auditing. Verified experts remain publicly active and discoverable throughout this update.
            </p>
          </div>
        </div>

      </Card>
    </div>
  )
}

export default RequestedDocsStep
