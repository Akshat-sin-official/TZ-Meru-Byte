import React from 'react'
import Card from './Card'
import Button from './Button'
import { FiFileText, FiUpload, FiCheckCircle, FiInfo } from 'react-icons/fi'
import styles from './ComplianceChecklist.module.css'

const ComplianceChecklist = ({ entityType, documents, onDocumentUpload }) => {
  const getRequiredDocs = (entityType) => {
    const baseDocs = [
      { id: 'pan', label: 'PAN Card', required: true },
      { id: 'aadhaar', label: 'Aadhaar Card / Passport', required: true },
    ]
    
    if (entityType === 'individual') {
      return baseDocs
    }
    
    return [
      ...baseDocs,
      { id: 'gst', label: 'GST Certificate', required: entityType !== 'individual' },
      { id: 'registration', label: 'Business Registration Certificate', required: true },
      { id: 'bank', label: 'Cancelled Cheque / Bank Statement', required: true },
      ...(entityType !== 'llc' ? [{ id: 'incorporation', label: 'Incorporation Documents', required: true }] : [])
    ]
  }

  const requiredDocs = getRequiredDocs(entityType)

  return (
    <Card className={styles.checklistCard}>
      <div className={styles.checklistHeader}>
        <FiFileText className={styles.checklistIcon} />
        <h3 className={styles.checklistTitle}>Required Documents</h3>
      </div>
      
      <div className={styles.checklistInfo}>
        <FiInfo className={styles.infoIcon} />
        <p>Documents will be verified after submission. You can upload them now or later.</p>
      </div>

      <ul className={styles.checklist}>
        {requiredDocs.map((doc) => {
          const isUploaded = documents?.some(d => d.type === doc.id)
          
          return (
            <li key={doc.id} className={styles.checklistItem}>
              <div className={styles.checklistItemContent}>
                <div className={styles.checklistItemLeft}>
                  {isUploaded ? (
                    <FiCheckCircle className={styles.checkIcon} />
                  ) : (
                    <div className={styles.checkboxPlaceholder}></div>
                  )}
                  <span className={styles.checklistItemLabel}>
                    {doc.label}
                    {doc.required && <span className={styles.required}>*</span>}
                  </span>
                </div>
                <Button
                  variant={isUploaded ? "ghost" : "outline"}
                  size="sm"
                  onClick={() => onDocumentUpload && onDocumentUpload(doc.id)}
                  className={styles.uploadButton}
                >
                  <FiUpload />
                  {isUploaded ? 'Re-upload' : 'Upload'}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export default ComplianceChecklist
