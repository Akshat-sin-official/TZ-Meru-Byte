import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiInfo, FiCheckCircle, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi'
import { toast } from 'sonner'
import Card from '../ui/Card'
import RequiredLabel from '../shared/RequiredLabel'
import styles from '../ServiceExpert.module.css'

const entityTypes = [
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership Firm' },
  { value: 'llp', label: 'LLP' },
  { value: 'opc', label: 'OPC' },
  { value: 'pvt_ltd', label: 'Private Limited' },
  { value: 'public_ltd', label: 'Public Limited' },
]

const arrRo = (v) => (Array.isArray(v) ? v : [])

/** Dashboard read-only: show enough to recognize without exposing full identifiers */
function maskTrailingAlnum(value, tailVisible = 4) {
  const raw = String(value ?? '').trim()
  if (!raw) return '—'
  const s = raw.replace(/\s/g, '').toUpperCase()
  const n = s.length
  if (n <= tailVisible) return `${'•'.repeat(Math.min(6, Math.max(n, 4)))}`
  const maskLen = Math.min(Math.max(n - tailVisible, 4), 16)
  return `${'•'.repeat(maskLen)}${s.slice(-tailVisible)}`
}

function maskInternationalAccount(value) {
  const raw = String(value ?? '').replace(/\s/g, '')
  if (!raw) return '—'
  if (raw.length <= 4) return '••••'
  return `${'•'.repeat(Math.min(raw.length - 4, 12))}${raw.slice(-4)}`
}

function maskIfsc(value) {
  const s = String(value ?? '').trim().toUpperCase().replace(/\s/g, '')
  if (!s) return '—'
  // Typical IFSC length 11: show bank code prefix + masked middle + suffix
  if (s.length >= 11) {
    return `${s.slice(0, 4)} ••• ${s.slice(-4)}`
  }
  return maskTrailingAlnum(s, 3)
}

function maskUpi(value) {
  const s = String(value ?? '').trim()
  if (!s) return '—'
  const at = s.indexOf('@')
  if (at < 1 || at === s.length - 1) {
    return maskTrailingAlnum(s, 4)
  }
  const local = s.slice(0, at)
  const domain = s.slice(at + 1)
  const maskedLocal =
    local.length <= 2
      ? `${local[0] || ''}•`
      : `${local[0]}${'•'.repeat(Math.min(local.length - 2, 6))}${local.slice(-1)}`
  return `${maskedLocal}@${domain}`
}

function readOnlyRow(label, value) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 200px) 1fr',
        gap: '8px 16px',
        padding: '10px 0',
        borderBottom: '1px solid #F3F4F6',
        fontSize: '14px',
      }}
    >
      <div style={{ color: '#6B7280', fontWeight: 500 }}>{label}</div>
      <div style={{ color: '#111827', wordBreak: 'break-word' }}>{value ?? '—'}</div>
    </div>
  )
}

function ComplianceDashboardReadOnly({ formData }) {
  const entityLabel =
    entityTypes.find((t) => t.value === formData.entityType)?.label ||
    (formData.entityType === 'individual' ? 'Individual' : null) ||
    formData.entityType ||
    '—'

  const gstLabel =
    formData.gstRegistered === 'yes'
      ? 'Registered'
      : formData.gstRegistered === 'no'
        ? 'Not registered'
        : formData.gstRegistered || '—'

  const addressBlock = [
    formData.addressLine1,
    formData.addressLine2,
    [formData.city, formData.state, formData.pincode].filter(Boolean).join(', '),
    formData.country,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div className={styles.stepContentWrapper}>
      <Card className={styles.stepCard}>
        {formData.documentsRequested && (
          <div
            style={{
              backgroundColor: '#fff7ed',
              border: '1px solid #fdba74',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              gap: '12px',
            }}
          >
            <FiAlertTriangle style={{ color: '#ea580c', fontSize: '24px', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ color: '#9a3412', fontSize: '16px', fontWeight: '600', marginBottom: '4px', marginTop: 0 }}>
                Action Required: Additional Documents Needed
              </h3>
              <p style={{ color: '#c2410c', fontSize: '14px', marginBottom: '12px', whiteSpace: 'pre-line' }}>
                {formData.documentsRequestedReason}
              </p>
              <Link
                to="/expert/update-documents"
                style={{ color: '#c2410c', fontWeight: 600, textDecoration: 'underline', fontSize: '14px' }}
              >
                Open document update →
              </Link>
            </div>
          </div>
        )}

        <h2 className={styles.stepTitle}>Trust, legal identity & compliance</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px', lineHeight: 1.5 }}>
          This information is verified on file. Use the linked flow if the platform has requested updated documents or
          you need compliance support — you cannot edit these fields from this wizard. Sensitive numbers are partially
          masked below.
        </p>
        {!formData.documentsRequested && (
          <p style={{ fontSize: '14px', marginBottom: '20px' }}>
            <Link
              to="/expert/update-documents"
              style={{ color: 'var(--color-primary, #2563eb)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Request or upload document updates →
            </Link>
          </p>
        )}

        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Legal identity</h3>
          {readOnlyRow('Entity type', entityLabel)}
          {readOnlyRow('Business role on platform', formData.roleType)}
          {readOnlyRow(
            'PAN',
            maskTrailingAlnum(formData.panNumber, 4)
          )}
          {readOnlyRow('GST status', gstLabel)}
          {(formData.gstRegistered === 'yes' || formData.gstNumber) &&
            readOnlyRow(
              'GSTIN',
              maskTrailingAlnum(formData.gstNumber, 5)
            )}
          {(formData.cinNumber || '').trim()
            ? readOnlyRow(
                'CIN / company registration No.',
                maskTrailingAlnum(formData.cinNumber, 4)
              )
            : null}
          {(formData.llpinNumber || '').trim()
            ? readOnlyRow('LLPIN', maskTrailingAlnum(formData.llpinNumber, 4))
            : null}
          {readOnlyRow(
            'Registered address',
            <span style={{ whiteSpace: 'pre-line' }}>{addressBlock.trim() ? addressBlock : '—'}</span>
          )}
          {formData.addressProofUrl ? readOnlyRow('Address proof', (
            <a href={formData.addressProofUrl} target="_blank" rel="noopener noreferrer">
              View file
            </a>
          )) : null}
        </section>

        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Supporting documents</h3>
          {arrRo(formData.documents).length === 0 ? (
            <p style={{ fontSize: '14px', color: '#6B7280' }}>No documents on record.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#111827', fontSize: '14px' }}>
              {arrRo(formData.documents).map((doc, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>
                  <span style={{ fontWeight: 500 }}>{doc.type || doc.documentType || 'Document'}</span>
                  {doc.url ? (
                    <>
                      {' '}
                      —{' '}
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {formData.gstCertificateUrl ? (
            <div style={{ marginTop: '8px', fontSize: '14px' }}>
              <span style={{ fontWeight: 500 }}>GST certificate</span>{' '}
              <a href={formData.gstCertificateUrl} target="_blank" rel="noopener noreferrer">
                View
              </a>
            </div>
          ) : null}
        </section>

        <section>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Bank details</h3>
          {readOnlyRow('Account holder', formData.accountHolderName)}
          {readOnlyRow('Bank name', formData.bankName)}
          {readOnlyRow('Branch', formData.branchName)}
          {readOnlyRow('Account type', formData.accountType)}
          {readOnlyRow(
            'Account number',
            maskInternationalAccount(formData.accountNumber)
          )}
          {readOnlyRow('IFSC', maskIfsc(formData.ifscCode))}
          {(formData.upiId || '').trim()
            ? readOnlyRow('UPI ID', maskUpi(formData.upiId))
            : null}
          {formData.bankProofUrl ? readOnlyRow('Bank proof', (
            <a href={formData.bankProofUrl} target="_blank" rel="noopener noreferrer">
              View file
            </a>
          )) : null}
        </section>
      </Card>
    </div>
  )
}

const renderDocPreview = (doc) => {
  if (!doc) return null;
  const href = doc.file instanceof File ? URL.createObjectURL(doc.file) : (doc.file || doc.url);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
      <p style={{ fontSize: '12px', color: '#10B981', margin: 0 }}>✓ File Selected</p>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'underline' }}>
          Preview
        </a>
      )}
    </div>
  );
};

const ComplianceStep = ({
  formData,
  handleInputChange,
  handleDocumentChange,
  validationErrors,
  setValidationErrors,
  readOnlyCompliance
}) => {
  const [showAccountNumber, setShowAccountNumber] = useState(false)

  if (readOnlyCompliance) {
    return <ComplianceDashboardReadOnly formData={formData} />
  }

  return (
    <div className={styles.stepContentWrapper}>
      <Card className={styles.stepCard}>
        {formData.documentsRequested && (
          <div style={{
            backgroundColor: '#fff7ed',
            border: '1px solid #fdba74',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px'
          }}>
            <FiAlertTriangle style={{ color: '#ea580c', fontSize: '24px', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ color: '#9a3412', fontSize: '16px', fontWeight: '600', marginBottom: '4px', marginTop: 0 }}>
                Action Required: Additional Documents Needed
              </h3>
              <p style={{ color: '#c2410c', fontSize: '14px', marginBottom: '0', whiteSpace: 'pre-line' }}>
                {formData.documentsRequestedReason}
              </p>
            </div>
          </div>
        )}

        <h2 className={styles.stepTitle}>Legal Identity & Compliance</h2>

        {/* 1. Select Entity Type */}
        <div className={styles.formGroup}>
          <label>Entity Type <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
          {validationErrors.entityType && (
            <span className={styles.errorText} style={{ display: 'block', marginTop: '4px' }}>{validationErrors.entityType}</span>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginTop: '8px' }}>
            {entityTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  handleInputChange('entityType', type.value)
                  handleInputChange('documents', []) // Clear documents on type change
                  // Clear validation error when entity type is selected
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
                  textAlign: 'center'
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. GST Details */}
        <div className={styles.formGroup} style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px', marginTop: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Are you registered under GST? <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="gstRegistered"
                checked={formData.gstRegistered === 'yes'}
                onChange={() => handleInputChange('gstRegistered', 'yes')}
              />
              Yes, I have GST
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="gstRegistered"
                checked={formData.gstRegistered === 'no'}
                onChange={() => handleInputChange('gstRegistered', 'no')}
              />
              No, GST not applicable
            </label>
          </div>

          {formData.gstRegistered === 'yes' && (
            <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
                <FiInfo style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                This will serve as your Business Verification and Primary Address Proof.
              </p>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>GST Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={formData.gstNumber || ''}
                  onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                />
                {validationErrors.gstNumber && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{validationErrors.gstNumber}</p>
                )}
              </div>
              <div>
                <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Upload GST Certificate <span style={{ color: '#ef4444' }}>*</span></label>
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
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                />
                {validationErrors.gstCertificateFile && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{validationErrors.gstCertificateFile}</p>
                )}
                {formData.gstCertificateFile && (
                  <p style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>
                    ✓ {formData.gstCertificateFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {formData.gstRegistered === 'no' && (
            <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: '13px' }}>
              <FiInfo style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              If services are provided to a GST-registered business, GST may be payable by the service seeker under Reverse Charge Mechanism (RCM), as applicable.
            </div>
          )}
        </div>

        {/* 3. Business Address Verification */}
        <div className={styles.formGroup} style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px', marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Business Address Verification</h3>

          {formData.gstRegistered === 'yes' ? (
            <div style={{ padding: '16px', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle style={{ color: '#10B981', fontSize: '20px' }} />
              <span style={{ fontSize: '14px', color: '#065F46' }}>Your business address will be verified using your GST certificate.</span>
            </div>
          ) : (
            <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              {formData.entityType === 'proprietorship' && (
                <div>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Upload Business Address Proof <span style={{ color: '#ef4444' }}>*</span></label>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Any one: Shop Act Certificate, Utility Bill, or Rent Agreement</p>
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
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                  />
                </div>
              )}
              {formData.entityType === 'partnership' && (
                <div>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Upload Business Address Proof <span style={{ color: '#ef4444' }}>*</span></label>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Any one: Partnership Deed (address page), Utility Bill, or Rent Agreement</p>
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
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                  />
                </div>
              )}
              {formData.entityType === 'llp' && (
                <div>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Upload Registered Office Proof <span style={{ color: '#ef4444' }}>*</span></label>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Utility Bill / Rent Agreement (or LLPIN if address included)</p>
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
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                  />
                </div>
              )}
              {(formData.entityType === 'pvt_ltd' || formData.entityType === 'public_ltd' || formData.entityType === 'opc') && (
                <div>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Upload Registered Office Proof <span style={{ color: '#ef4444' }}>*</span></label>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Certificate of Incorporation (CIN) or utility bill/rent agreement</p>
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
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                  />
                </div>
              )}
              {validationErrors.addressProofFile && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{validationErrors.addressProofFile}</p>
              )}
              {formData.addressProofFile && (
                <p style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>
                  ✓ {formData.addressProofFile.name}
                </p>
              )}
            </div>
          )}

          {/* Manual Address Entry Fields (Always visible to capture address data) */}
          <div style={{ marginTop: '16px' }}>
            <div className={styles.formGroup}>
              <RequiredLabel htmlFor="address1">Address Line 1</RequiredLabel>
              <input
                type="text"
                id="address1"
                value={formData.addressLine1 || ''}
                onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                placeholder="Building, Street"
                maxLength={200}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
              />
              {validationErrors.addressLine1 && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{validationErrors.addressLine1}</p>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
              <div className={styles.formGroup}>
                <RequiredLabel htmlFor="city">City</RequiredLabel>
                <input
                  type="text"
                  id="city"
                  value={formData.city || ''}
                  readOnly
                  disabled
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed' }}
                />
              </div>
              <div className={styles.formGroup}>
                <RequiredLabel htmlFor="state">State</RequiredLabel>
                <input
                  type="text"
                  id="state"
                  value={formData.state || 'Maharashtra'}
                  readOnly
                  disabled
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed' }}
                />
              </div>
              <div className={styles.formGroup}>
                <RequiredLabel htmlFor="pincode">Pincode</RequiredLabel>
                <input type="text" value={formData.pincode || ''} onChange={(e) => handleInputChange('pincode', e.target.value)} placeholder="Pincode" maxLength={6} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }} />
                {validationErrors.pincode && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{validationErrors.pincode}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Identity & Entity Proof (NOT Address) */}
        <div className={styles.formGroup} style={{ borderTop: '0px solid #E5E7EB', paddingTop: '24px', marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Identity & Entity Proof</h3>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>Required for legal identity, tax compliance, and contract enforceability.</p>
          {validationErrors.documents && (
            <div style={{ padding: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FEE2E2', color: '#991B1B', fontSize: '13px', marginBottom: '16px' }}>
              {validationErrors.documents}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
              Permanent Account Number (PAN) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.panNumber || ''}
              onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', textTransform: 'uppercase' }}
            />
            {validationErrors.panNumber && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{validationErrors.panNumber}</p>
            )}
          </div>

          {/* CIN for Companies */}
          {(formData.entityType === 'pvt_ltd' || formData.entityType === 'public_ltd' || formData.entityType === 'opc') && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Corporate Identification Number (CIN) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.cinNumber || ''}
                onChange={(e) => handleInputChange('cinNumber', e.target.value.toUpperCase())}
                placeholder="U12345MH2020PTC123456"
                maxLength={21}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', textTransform: 'uppercase' }}
              />
              {validationErrors.cinNumber && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{validationErrors.cinNumber}</p>
              )}
            </div>
          )}

          {/* LLPIN for LLP */}
          {formData.entityType === 'llp' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Limited Liability Partnership Identification Number (LLPIN) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.llpinNumber || ''}
                onChange={(e) => handleInputChange('llpinNumber', e.target.value.toUpperCase())}
                placeholder="AAA-1234"
                maxLength={8}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', textTransform: 'uppercase' }}
              />
              {validationErrors.llpinNumber && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{validationErrors.llpinNumber}</p>
              )}
            </div>
          )}

          <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>

            {/* Proprietorship */}
            {formData.entityType === 'proprietorship' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Upload Proprietor Identity Proof (PAN) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Proprietor PAN')}
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'Proprietor PAN'))}
                </div>
                <div>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Upload Business Proof (if available)</label>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Shop Act, Udyam Registration, Trade License (if applicable)</p>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Business Proof')}
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'Business Proof'))}
                </div>
              </>
            )}

            {/* Partnership Firm */}
            {formData.entityType === 'partnership' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Upload Firm PAN <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Firm PAN')}
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'Firm PAN'))}
                </div>
                <div>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Upload Partnership Deed <span style={{ color: '#ef4444' }}>*</span></label>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                    Please upload a single PDF containing:<br />
                    • First page with firm name & partner details<br />
                    • Signature page with all partners' signatures<br />
                    • Address page
                  </p>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Partnership Deed')}
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'Partnership Deed'))}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Upload Authorized Signatory PAN <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'normal' }}> (Optional)</span></label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Authorized Signatory PAN')}
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'Authorized Signatory PAN'))}
                </div>
              </>
            )}

            {/* LLP */}
            {formData.entityType === 'llp' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Upload LLP Registration Certificate <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleDocumentChange(e.target.files?.[0], 'LLPIN')}
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'LLPIN'))}
                </div>
                <div>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Upload Company PAN <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleDocumentChange(e.target.files?.[0], 'LLP PAN')}
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'LLP PAN'))}
                </div>
              </>
            )}

            {/* Private / Public Limited / OPC */}
            {(formData.entityType === 'pvt_ltd' || formData.entityType === 'public_ltd' || formData.entityType === 'opc') && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Upload Certificate of Incorporation <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleDocumentChange(e.target.files?.[0], 'CIN')}
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'CIN'))}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Upload Company PAN <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Company PAN')}
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                  {renderDocPreview(formData.documents?.find(d => d.type === 'Company PAN'))}
                </div>
                <div>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Upload Authorized Signatory PAN {!(formData.entityType === 'pvt_ltd' || formData.entityType === 'opc' || formData.entityType === 'public_ltd') ? <span style={{ color: '#ef4444' }}>*</span> : <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: 'normal' }}> (Optional)</span>}</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleDocumentChange(e.target.files?.[0], 'Authorized Signatory PAN')}
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                  {formData.documents?.find(d => d.type === 'Authorized Signatory PAN') && (
                    <p style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>✓ File Selected</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>



        {/* 7. Bank Details */}
        <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '24px', marginTop: '24px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>Bank Details</h3>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
            Required for Secure Payouts. Add your bank details to enable secure payouts for your completed projects. This information is encrypted and never shared.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div className={styles.formGroup}>
              <RequiredLabel htmlFor="accountHolderName">Account Holder Name</RequiredLabel>
              {validationErrors.accountHolderName && (
                <span className={styles.errorText} style={{ display: 'block', marginTop: '4px' }}>{validationErrors.accountHolderName}</span>
              )}
              <input
                type="text"
                id="accountHolderName"
                value={formData.accountHolderName || ''}
                onChange={(e) => {
                  handleInputChange('accountHolderName', e.target.value)
                  setValidationErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.accountHolderName
                    return newErrors
                  })
                }}
                placeholder="Name as per bank records"
                maxLength={100}
                required
                className={validationErrors.accountHolderName ? styles.inputError : ''}
              />
            </div>
            <div className={styles.formGroup}>
              <RequiredLabel htmlFor="bankName">Bank Name</RequiredLabel>
              {validationErrors.bankName && (
                <span className={styles.errorText} style={{ display: 'block', marginTop: '4px' }}>{validationErrors.bankName}</span>
              )}
              <input
                type="text"
                id="bankName"
                value={formData.bankName || ''}
                onChange={(e) => {
                  handleInputChange('bankName', e.target.value)
                  setValidationErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.bankName
                    return newErrors
                  })
                }}
                placeholder="HDFC Bank"
                maxLength={100}
                required
                className={validationErrors.bankName ? styles.inputError : ''}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div className={styles.formGroup}>
              <label htmlFor="branchName">Branch Name</label>
              <input
                type="text"
                id="branchName"
                value={formData.branchName || ''}
                onChange={(e) => handleInputChange('branchName', e.target.value)}
                placeholder="Branch name"
                maxLength={100}
              />
            </div>
            <div className={styles.formGroup}>
              <RequiredLabel htmlFor="accountType">Account Type</RequiredLabel>
              <select
                id="accountType"
                value={formData.accountType || ''}
                onChange={(e) => handleInputChange('accountType', e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
              >
                <option value="savings">Savings</option>
                <option value="current">Current</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div className={styles.formGroup}>
              <RequiredLabel htmlFor="accountNumber">Account Number</RequiredLabel>
              {validationErrors.accountNumber && (
                <span className={styles.errorText} style={{ display: 'block', marginTop: '4px' }}>{validationErrors.accountNumber}</span>
              )}
              <div style={{ position: 'relative' }}>
                <input
                  type={showAccountNumber ? "text" : "password"}
                  id="accountNumber"
                  value={formData.accountNumber || ''}
                  onChange={(e) => {
                    handleInputChange('accountNumber', e.target.value)
                    setValidationErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.accountNumber
                      return newErrors
                    })
                  }}
                  placeholder="••••••••••••"
                  maxLength={30}
                  required
                  className={validationErrors.accountNumber ? styles.inputError : ''}
                  style={{ paddingRight: '40px' }}
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
                  {showAccountNumber ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <RequiredLabel htmlFor="ifsc">IFSC Code</RequiredLabel>
              {validationErrors.ifscCode && (
                <span className={styles.errorText} style={{ display: 'block', marginTop: '4px' }}>{validationErrors.ifscCode}</span>
              )}
              <input
                type="text"
                id="ifsc"
                value={formData.ifscCode || ''}
                onChange={(e) => {
                  handleInputChange('ifscCode', e.target.value.toUpperCase())
                  setValidationErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.ifscCode
                    return newErrors
                  })
                }}
                placeholder="HDFC0001234"
                maxLength={11}
                required
                className={validationErrors.ifscCode ? styles.inputError : ''}
              />
            </div>
          </div>
          <div className={styles.formGroup} style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              Upload Bank Proof <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
              Cancelled Cheque / Passbook front Photo / Bank Statement (first page)
            </p>
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
              style={{ width: '100%', fontSize: '14px' }}
            />
            {validationErrors.bankProofFile && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{validationErrors.bankProofFile}</p>
            )}
            {formData.bankProofFile && (
              <p style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>✓ {formData.bankProofFile.name}</p>
            )}
          </div>

        </div>
        <div className={styles.formGroup}>
          <label htmlFor="upiId">UPI ID (Optional)</label>
          <input
            type="text"
            id="upiId"
            value={formData.upiId || ''}
            onChange={(e) => handleInputChange('upiId', e.target.value)}
            placeholder="yourname@bank / upi / paytm / gpay"
            maxLength={50}
          />
          <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
            Payouts are subject to milestone approval and applicable platform charges.
          </p>
        </div>


      </Card>
    </div>
  )
}

export default ComplianceStep
