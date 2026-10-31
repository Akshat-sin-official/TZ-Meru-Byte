import React from 'react'
import Card from './Card'
import Badge from './Badge'
import { FiBriefcase, FiMapPin, FiStar } from 'react-icons/fi'
import styles from './ProfilePreview.module.css'

const ProfilePreview = ({ formData, services, industries }) => {
  return (
    <Card className={styles.previewCard}>
      <h3 className={styles.previewTitle}>Your Profile Summary</h3>
      <p className={styles.previewSubtitle}>Live preview</p>
      
      <div className={styles.previewContent}>
        {formData.businessName && (
          <div className={styles.previewSection}>
            <div className={styles.previewHeader}>
              <FiBriefcase className={styles.previewIcon} />
              <strong>{formData.businessName}</strong>
            </div>
          </div>
        )}

        {formData.about && (
          <div className={styles.previewSection}>
            <p className={styles.previewText}>{formData.about}</p>
          </div>
        )}

        {formData.services && formData.services.length > 0 && (
          <div className={styles.previewSection}>
            <h4 className={styles.previewSectionTitle}>Services</h4>
            <div className={styles.previewChips}>
              {formData.services.slice(0, 5).map((service, idx) => (
                <Badge key={idx} variant="green" size="sm">{service}</Badge>
              ))}
              {formData.services.length > 5 && (
                <Badge variant="grey" size="sm">+{formData.services.length - 5} more</Badge>
              )}
            </div>
          </div>
        )}

        {formData.industries && formData.industries.length > 0 && (
          <div className={styles.previewSection}>
            <h4 className={styles.previewSectionTitle}>Industries</h4>
            <div className={styles.previewChips}>
              {formData.industries.slice(0, 3).map((industry, idx) => (
                <Badge key={idx} variant="orange" size="sm">{industry}</Badge>
              ))}
              {formData.industries.length > 3 && (
                <Badge variant="grey" size="sm">+{formData.industries.length - 3} more</Badge>
              )}
            </div>
          </div>
        )}

        {formData.engagementTypes && formData.engagementTypes.length > 0 && (
          <div className={styles.previewSection}>
            <h4 className={styles.previewSectionTitle}>Engagement Types</h4>
            <div className={styles.previewChips}>
              {formData.engagementTypes.map((type, idx) => (
                <Badge key={idx} variant="default" size="sm">{type}</Badge>
              ))}
            </div>
          </div>
        )}

        {(!formData.businessName && !formData.about) && (
          <div className={styles.previewEmpty}>
            <p>Start filling your profile to see the preview</p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default ProfilePreview
