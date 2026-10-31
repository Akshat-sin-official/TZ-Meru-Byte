import React from 'react'
import { FiX, FiPlus, FiInfo, FiLoader } from 'react-icons/fi'
import { toast } from 'sonner'
import Card from '../ui/Card'
import Button from '../ui/Button'
import styles from '../ServiceExpert.module.css'

const TOOLS_LIST = [
  'Canva', 'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'HubSpot', 'Zoho CRM',
  'Salesforce', 'Google Ads', 'Meta Ads', 'LinkedIn Ads', 'Google Analytics 4',
  'Semrush', 'Hotjar', 'Mailchimp', 'Klaviyo', 'Zapier', 'WordPress', 'Webflow',
  'Shopify', 'Wix', 'Other'
]
const TESTIMONIAL_PLATFORMS = ['Google', 'Clutch', 'Trustpilot', 'LinkedIn', 'Instagram', 'Facebook', 'X', 'YouTube', 'Other']
import { EXPERIENCE_RANGES } from '@/data/taxonomy'
import { fileToBase64, compressImage } from '@/utils/fileUtils'

const arr = (v) => (Array.isArray(v) ? v : [])

const PortfolioStep = ({
  formData,
  handleInputChange,
  showDashboardVerifiedSave,
  onDashboardSave,
  dashboardSaving,
  readOnly = false,
  triggerAutoEnrichment,
  isEnriching = false,
  enrichedSource = null
}) => {
  // Auto-fetch and display source link for any certification that has a title but empty verification URL
  React.useEffect(() => {
    const certs = arr(formData.certifications)
    const sourceLink = formData.website || ''
    if (!sourceLink || certs.length === 0) return

    let needsUpdate = false
    const updatedCerts = certs.map(c => {
      if (c && c.title && c.title.trim() && !c.verificationUrl) {
        needsUpdate = true
        return { ...c, verificationUrl: sourceLink }
      }
      return c
    })

    if (needsUpdate) {
      handleInputChange('certifications', updatedCerts)
    }
  }, [formData.website, formData.certifications])

  // Auto-fetch and display client feedback / testimonial link if empty or missing URL
  React.useEffect(() => {
    const website = formData.website || ''
    if (!website) return

    const tList = arr(formData.testimonials)
    let needsUpdate = false
    let updatedTestimonials = [...tList]

    if (updatedTestimonials.length === 0) {
      needsUpdate = true
      updatedTestimonials = [{
        type: 'link',
        platform: 'other',
        url: `${website.replace(/\/+$/, '')}#testimonials`,
        file: null
      }]
    } else {
      updatedTestimonials = updatedTestimonials.map(t => {
        if (t && t.type === 'link' && !t.url) {
          needsUpdate = true
          return {
            ...t,
            url: `${website.replace(/\/+$/, '')}#testimonials`,
            platform: t.platform || 'other'
          }
        }
        return t
      })
    }

    if (needsUpdate) {
      handleInputChange('testimonials', updatedTestimonials)
    }
  }, [formData.website, formData.testimonials])

  const handlePreviewDocument = (target) => {
    if (!target) return;
    if (target instanceof File) {
      const blobUrl = URL.createObjectURL(target);
      window.open(blobUrl, '_blank');
    } else if (typeof target === 'string' && target.startsWith('data:')) {
      try {
        const byteString = atob(target.split(',')[1]);
        const mimeString = target.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch {
        window.open(target, '_blank');
      }
    } else if (typeof target === 'string' && target.trim()) {
      window.open(target, '_blank');
    }
  };
  return (
    <div className={styles.stepContentWrapper} style={readOnly ? { pointerEvents: 'none', opacity: 0.95 } : undefined}>
      <Card className={styles.stepCard}>
        <h2 className={styles.stepTitle}>Portfolio & Credibility</h2>

        {/* ⚡ Auto-fill from Website & Credentials */}
        {triggerAutoEnrichment && !readOnly && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                  Auto-fill Portfolio & Credentials
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#15803D' }}>
                  {formData.website
                    ? `Auto-detect tools, case studies, certifications & testimonials from ${formData.website}`
                    : 'Auto-detect your tools, portfolio links and credentials from your website domain'}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isEnriching}
              onClick={() => {
                if (formData.website) {
                  triggerAutoEnrichment({ websiteUrl: formData.website, triggerSource: 'website_url', force: true })
                } else if (formData.email) {
                  triggerAutoEnrichment({ email: formData.email, triggerSource: 'business_email', force: true })
                } else if (formData.about) {
                  triggerAutoEnrichment({ aboutText: formData.about, triggerSource: 'about_summary', force: true })
                } else {
                  toast.info('Please enter your website URL in Step 1 (Profile) first')
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #16A34A',
                color: '#15803D',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isEnriching ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              {isEnriching ? (
                <>
                  <FiLoader className={styles.spinner} style={{ marginRight: 4 }} />
                  Extracting website data...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Auto-fill from Website
                </>
              )}
            </button>
          </div>
        )}

        {/* Experience Range Display (Auto-linked) */}
        {(formData.experienceStartDate || formData.yearsExperience) && (() => {
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

          const range = EXPERIENCE_RANGES.find(r =>
            years >= r.min && years < r.max
          )

          return (
            <div style={{ padding: '16px', backgroundColor: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#0369A1', fontWeight: '600', marginBottom: '4px' }}>
                    Experience Level (Auto-derived)
                  </p>
                  <p style={{ fontSize: '15px', color: '#0C4A6E', fontWeight: '500' }}>
                    {range ? range.label : `${years} Years of Experience`}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#E0F2FE', color: '#0284C7', borderRadius: '20px', fontWeight: '600' }}>
                    {years} {years === 1 ? 'Year' : 'Years'}
                  </span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Portfolio Uploads */}
        <div className={styles.formGroup}>
          <label>
            Portfolio Uploads (Max: 3-4 samples)
            <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Upload images, PDFs, or provide links to your best work." />
          </label>
          <p className={styles.helperText} style={{ marginBottom: '12px', fontSize: '12px', color: '#6B7280' }}>
            Supported formats: Images, PDFs, Video Links, or External URLs (Behance, Dribbble, Drive, etc.)
          </p>

          {arr(formData.portfolioItems).map((item, index) => (
            <div key={index} className={styles.summaryCard} style={{ marginTop: index > 0 ? '16px' : '8px' }}>
              <div className={styles.flexResponsive} style={{ marginBottom: '12px' }}>
                <select
                  value={item.type || 'url'}
                  onChange={(e) => {
                    const newItems = [...arr(formData.portfolioItems)]
                    newItems[index] = { ...newItems[index], type: e.target.value, file: null, url: '' }
                    handleInputChange('portfolioItems', newItems)
                  }}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px', minWidth: '120px' }}
                >
                  <option value="image">Image Logo/Shot</option>
                  <option value="video">Video (URL link only)</option>
                  <option value="pdf">PDF Document</option>
                  <option value="url">External URL (Behance, etc.)</option>
                </select>

                <input
                  type="text"
                  placeholder="Title (optional)"
                  value={item.title || ''}
                  onChange={(e) => {
                    const newItems = [...arr(formData.portfolioItems)]
                    newItems[index] = { ...newItems[index], title: e.target.value }
                    handleInputChange('portfolioItems', newItems)
                  }}
                  maxLength={100}
                  style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                />

                {arr(formData.portfolioItems).length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newItems = arr(formData.portfolioItems).filter((_, i) => i !== index)
                      handleInputChange('portfolioItems', newItems)
                    }}
                  >
                    <FiX />
                  </Button>
                )}
              </div>

              {item.type === 'url' || item.type === 'video' ? (
                <input
                  type="url"
                  value={item.url || ''}
                  onChange={(e) => {
                    const newItems = [...arr(formData.portfolioItems)]
                    newItems[index] = { ...newItems[index], url: e.target.value }
                    handleInputChange('portfolioItems', newItems)
                  }}
                  placeholder={item.type === 'video' ? 'Paste video link (YouTube, Vimeo...)' : 'Paste project link (Behance, Dribbble, Drive...)'}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                />
              ) : (
                <input
                  type="file"
                  accept={item.type === 'image' ? 'image/*' : 'application/pdf'}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('File size must be less than 10MB')
                        return
                      }
                      const defaultTitle = item.title?.trim() ? item.title : file.name.replace(/\.[^/.]+$/, '')
                      
                      if (file.type.startsWith('image/')) {
                        compressImage(file, 1200, 0.6).then(base64 => {
                          const mimeType = file.type || 'image/jpeg';
                          const dataUrl = `data:${mimeType};base64,${base64}`;
                          const newItems = [...arr(formData.portfolioItems)]
                          newItems[index] = { ...newItems[index], title: defaultTitle, file, url: dataUrl }
                          handleInputChange('portfolioItems', newItems)
                        }).catch(() => {
                          fileToBase64(file).then(base64 => {
                            const mimeType = file.type || 'image/jpeg';
                            const dataUrl = `data:${mimeType};base64,${base64}`;
                            const newItems = [...arr(formData.portfolioItems)]
                            newItems[index] = { ...newItems[index], title: defaultTitle, file, url: dataUrl }
                            handleInputChange('portfolioItems', newItems)
                          }).catch(() => {
                            const newItems = [...arr(formData.portfolioItems)]
                            newItems[index] = { ...newItems[index], title: defaultTitle, file }
                            handleInputChange('portfolioItems', newItems)
                          })
                        })
                      } else {
                        fileToBase64(file).then(base64 => {
                          const mimeType = file.type || 'application/pdf';
                          const dataUrl = `data:${mimeType};base64,${base64}`;
                          const newItems = [...arr(formData.portfolioItems)]
                          newItems[index] = { ...newItems[index], title: defaultTitle, file, url: dataUrl }
                          handleInputChange('portfolioItems', newItems)
                        }).catch(err => {
                          console.error('Failed to convert file to base64', err)
                          const newItems = [...arr(formData.portfolioItems)]
                          newItems[index] = { ...newItems[index], title: defaultTitle, file }
                          handleInputChange('portfolioItems', newItems)
                        })
                      }
                    }
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                />
              )}
              {(item.file || (item.url && (item.type === 'image' || item.type === 'pdf'))) && (
                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <p style={{ fontSize: '12px', color: '#374151', fontWeight: '500', marginBottom: '4px' }}>
                    {item.file instanceof File ? `Selected: ${item.file.name}` : (item.title ? `Attached: ${item.title}` : 'Document Saved (Draft)')}
                  </p>
                  {item.type === 'image' && (
                    <img
                      src={item.file instanceof File ? URL.createObjectURL(item.file) : item.url}
                      alt="Preview"
                      style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', marginTop: '4px' }}
                      onClick={() => handlePreviewDocument(item.file || item.url)}
                      title="Click to view full image"
                    />
                  )}
                  {item.type === 'pdf' && (
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        color: '#3B82F6', 
                        cursor: 'pointer',
                        marginTop: '4px',
                        padding: '4px 8px',
                        backgroundColor: '#EFF6FF',
                        borderRadius: '4px',
                        width: 'fit-content'
                      }}
                      onClick={() => handlePreviewDocument(item.file || item.url)}
                      title="Click to preview PDF"
                    >
                      <FiInfo /> <span style={{ fontSize: '12px', fontWeight: '500' }}>PDF attached (Click to preview)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {arr(formData.portfolioItems).length < 4 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleInputChange('portfolioItems', [...arr(formData.portfolioItems), { type: 'url', url: '', file: null }])
              }}
              style={{ marginTop: '8px' }}
            >
              <FiPlus /> Add Portfolio Upload
            </Button>
          )}
        </div>

        {/* Certifications & Awards */}
        <div className={styles.formGroup}>
          <label>Certifications & Awards</label>
          {arr(formData.certifications).map((cert, index) => (
            <div key={index} className={styles.summaryCard} style={{ marginTop: index > 0 ? '16px' : '8px' }}>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={cert.title || ''}
                  onChange={(e) => {
                    const newTitle = e.target.value
                    const newCerts = [...arr(formData.certifications)]
                    const currentCert = newCerts[index] || {}
                    const autoUrl = (!currentCert.verificationUrl && formData.website && newTitle.trim())
                      ? formData.website
                      : currentCert.verificationUrl || ''
                    newCerts[index] = { ...currentCert, title: newTitle, verificationUrl: autoUrl }
                    handleInputChange('certifications', newCerts)
                  }}
                  placeholder="Title (e.g., Google Ads Certified)"
                  maxLength={150}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', marginBottom: '8px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Upload Certificate (Optional)</span>
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
                        const newCerts = [...arr(formData.certifications)]
                        newCerts[index] = { ...newCerts[index], file }
                        handleInputChange('certifications', newCerts)
                      }
                    }}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                  />
                  {cert.file && (
                    <div 
                      style={{ 
                        marginTop: '4px', 
                        fontSize: '11px', 
                        color: '#059669', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                      onClick={() => {
                        const url = cert.file instanceof File ? URL.createObjectURL(cert.file) : cert.file;
                        window.open(url, '_blank');
                      }}
                      title="Click to preview certificate"
                    >
                      <FiInfo size={12} /> {cert.file instanceof File ? `Attached: ${cert.file.name}` : '✓ Certificate Saved'} (Click to view)
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Verification URL (Optional)</span>
                  <input
                    type="url"
                    value={cert.verificationUrl || ''}
                    onChange={(e) => {
                      const newCerts = [...arr(formData.certifications)]
                      newCerts[index] = { ...newCerts[index], verificationUrl: e.target.value }
                      handleInputChange('certifications', newCerts)
                    }}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newCerts = arr(formData.certifications).filter((_, i) => i !== index)
                    handleInputChange('certifications', newCerts)
                  }}
                  style={{ color: '#ef4444' }}
                >
                  <FiX /> Remove
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleInputChange('certifications', [...arr(formData.certifications), { title: '', file: null, verificationUrl: '' }])
            }}
            style={{ marginTop: '8px' }}
          >
            <FiPlus /> Add Certification
          </Button>
        </div>

        {/* Tools & Technologies */}
        <div className={styles.formGroup}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ margin: 0 }}>Tools & Technologies</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleInputChange('tools', [...TOOLS_LIST])}
                style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #3B82F6', color: '#2563EB', backgroundColor: '#EFF6FF', cursor: 'pointer', fontWeight: '600' }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('tools', [])}
                style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #D1D5DB', color: '#4B5563', backgroundColor: '#F3F4F6', cursor: 'pointer', fontWeight: '600' }}
              >
                Clear All
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {TOOLS_LIST.map((tool) => (
              <button
                key={tool}
                type="button"
                onClick={() => {
                  const newTools = arr(formData.tools).includes(tool)
                    ? arr(formData.tools).filter(t => t !== tool)
                    : [...arr(formData.tools), tool]
                  handleInputChange('tools', newTools)
                }}
                className={`${styles.chipButton} ${arr(formData.tools).includes(tool) ? styles.selected : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px', // Pills
                  border: `1px solid ${arr(formData.tools).includes(tool) ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                  backgroundColor: arr(formData.tools).includes(tool) ? 'var(--color-primary-light, rgba(59, 130, 246, 0.1))' : 'transparent',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>

        {/* Key Team Members (Optional, max 3) */}
        <div className={styles.formGroup}>
          <label>Key Team Members (Optional, max 3)</label>
          {arr(formData.teamMembers).map((member, index) => (
            <div key={index} className={styles.summaryCard} style={{ marginTop: index > 0 ? '16px' : '8px' }}>
              <div className={styles.formGrid2} style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={member.name || ''}
                  onChange={(e) => {
                    const newMembers = [...arr(formData.teamMembers)]
                    newMembers[index] = { ...newMembers[index], name: e.target.value }
                    handleInputChange('teamMembers', newMembers)
                  }}
                  placeholder="Name"
                  maxLength={100}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                />
                <input
                  type="text"
                  value={member.role || ''}
                  onChange={(e) => {
                    const newMembers = [...arr(formData.teamMembers)]
                    newMembers[index] = { ...newMembers[index], role: e.target.value }
                    handleInputChange('teamMembers', newMembers)
                  }}
                  placeholder="Role"
                  maxLength={100}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                />
                {arr(formData.teamMembers).length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMembers = arr(formData.teamMembers).filter((_, i) => i !== index)
                      handleInputChange('teamMembers', newMembers)
                    }}
                  >
                    <FiX />
                  </Button>
                )}
              </div>
              <div className={styles.formGrid2} style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={(member.expertise || []).join(', ')}
                  onChange={(e) => {
                    const newMembers = [...arr(formData.teamMembers)]
                    newMembers[index] = {
                      ...newMembers[index],
                      expertise: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }
                    handleInputChange('teamMembers', newMembers)
                  }}
                  placeholder="Expertise (comma-separated)"
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                />
                <input
                  type="number"
                  min="0"
                  value={member.experienceYears || ''}
                  onChange={(e) => {
                    const newMembers = [...arr(formData.teamMembers)]
                    newMembers[index] = { ...newMembers[index], experienceYears: parseInt(e.target.value) || 0 }
                    handleInputChange('teamMembers', newMembers)
                  }}
                  placeholder="Years"
                  style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('File size must be less than 10MB')
                      return
                    }
                    const newMembers = [...arr(formData.teamMembers)]
                    newMembers[index] = { ...newMembers[index], photo: file }
                    handleInputChange('teamMembers', newMembers)
                  }
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
              {member.photo && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={member.photo instanceof File ? URL.createObjectURL(member.photo) : member.photo}
                    alt="Member Preview"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E5E7EB' }}
                  />
                  <p style={{ fontSize: '12px', color: '#374151' }}>
                    {member.photo instanceof File ? member.photo.name : 'Photo Saved'}
                  </p>
                </div>
              )}
            </div>
          ))}
          {arr(formData.teamMembers).length < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleInputChange('teamMembers', [...arr(formData.teamMembers), { name: '', role: '', expertise: [], experienceYears: 0, photo: null }])
              }}
              style={{ marginTop: '8px' }}
            >
              <FiPlus /> Add Team Member
            </Button>
          )}
        </div>

        {/* Testimonials */}
        <div className={styles.formGroup}>
          <label>Testimonials (Optional)</label>
          {arr(formData.testimonials).map((testimonial, index) => (
            <div key={index} className={styles.summaryCard} style={{ marginTop: index > 0 ? '16px' : '8px' }}>
              <div className={styles.flexResponsive} style={{ marginBottom: '12px' }}>
                <select
                  value={testimonial.type || 'screenshot'}
                  onChange={(e) => {
                    const newTestimonials = [...arr(formData.testimonials)]
                    newTestimonials[index] = { ...newTestimonials[index], type: e.target.value, file: null, url: '', platform: '' }
                    handleInputChange('testimonials', newTestimonials)
                  }}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value="screenshot">Upload Screenshot</option>
                  <option value="link">Social Review/Rating Link</option>
                </select>
                {arr(formData.testimonials).length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newTestimonials = arr(formData.testimonials).filter((_, i) => i !== index)
                      handleInputChange('testimonials', newTestimonials)
                    }}
                  >
                    <FiX />
                  </Button>
                )}
              </div>
              {testimonial.type === 'screenshot' ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('File size must be less than 10MB')
                        return
                      }
                      const newTestimonials = [...arr(formData.testimonials)]
                      newTestimonials[index] = { ...newTestimonials[index], file }
                      handleInputChange('testimonials', newTestimonials)
                    }
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                />
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={(testimonial.platform || '').toLowerCase()}
                    onChange={(e) => {
                      const newTestimonials = [...arr(formData.testimonials)]
                      newTestimonials[index] = { ...newTestimonials[index], platform: e.target.value }
                      handleInputChange('testimonials', newTestimonials)
                    }}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                  >
                    <option value="">Select Platform</option>
                    {TESTIMONIAL_PLATFORMS.map(platform => (
                      <option key={platform} value={platform === 'X' ? 'twitter' : platform.toLowerCase()}>{platform}</option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={testimonial.url || ''}
                    onChange={(e) => {
                      const newUrl = e.target.value
                      const newTestimonials = [...arr(formData.testimonials)]
                      let detectedPlatform = newTestimonials[index].platform || ''
                      if (!detectedPlatform || detectedPlatform === 'other') {
                        const urlLower = newUrl.toLowerCase()
                        if (urlLower.includes('google.com') || urlLower.includes('goo.gl') || urlLower.includes('g.page')) {
                          detectedPlatform = 'google'
                        } else if (urlLower.includes('clutch.co')) {
                          detectedPlatform = 'clutch'
                        } else if (urlLower.includes('trustpilot.com')) {
                          detectedPlatform = 'trustpilot'
                        } else if (urlLower.includes('linkedin.com')) {
                          detectedPlatform = 'linkedin'
                        } else if (urlLower.includes('instagram.com')) {
                          detectedPlatform = 'instagram'
                        } else if (urlLower.includes('facebook.com')) {
                          detectedPlatform = 'facebook'
                        } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
                          detectedPlatform = 'youtube'
                        } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
                          detectedPlatform = 'twitter'
                        } else if (newUrl.trim()) {
                          detectedPlatform = 'other'
                        }
                      }
                      newTestimonials[index] = { ...newTestimonials[index], url: newUrl, platform: detectedPlatform }
                      handleInputChange('testimonials', newTestimonials)
                    }}
                    placeholder="Review/Rating Link"
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                  />
                </div>
              )}
              {testimonial.file && (
                <div style={{ marginTop: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px', display: 'inline-block' }}>
                  <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Screenshot Preview:</p>
                  <img
                    src={testimonial.file instanceof File ? URL.createObjectURL(testimonial.file) : testimonial.file}
                    alt="Testimonial"
                    style={{ maxWidth: '150px', maxHeight: '100px', borderRadius: '4px' }}
                  />
                </div>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleInputChange('testimonials', [...arr(formData.testimonials), { type: 'screenshot', file: null, url: '', platform: '' }])
            }}
            style={{ marginTop: '8px' }}
          >
            <FiPlus /> Add Testimonial
          </Button>
        </div>

        {showDashboardVerifiedSave ? (
          <div
            style={{
              marginTop: '28px',
              paddingTop: '24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <Button type="button" onClick={() => onDashboardSave?.()} disabled={!!dashboardSaving}>
              {dashboardSaving ? (
                <>
                  <FiLoader className={styles.spinner} style={{ marginRight: 8 }} /> Saving...
                </>
              ) : (
                <>Save portfolio changes</>
              )}
            </Button>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Updates here apply immediately to your profile; they are not submitted for admin approval.
            </span>
          </div>
        ) : null}

      </Card>
    </div>
  )
}

export default PortfolioStep
