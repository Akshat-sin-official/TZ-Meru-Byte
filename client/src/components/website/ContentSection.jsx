import React from 'react'
import SectionWrapper from './SectionWrapper'
import styles from './ContentSection.module.css'

const ContentSection = ({ heading, content = [], children, className = '', sectionType = 'content' }) => {
  return (
    <SectionWrapper sectionType={sectionType}>
      <section className={`${styles.contentSection} ${className}`} data-section-type={sectionType}>
        <div className={`container ${styles.container}`}>
          {heading && (
            <h2 className={styles.heading}>{heading}</h2>
          )}
          
          {content && content.length > 0 && (
            <div className={styles.contentText}>
              {content.map((paragraph, index) => (
                <p key={index} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          
          {children && (
            <div className={styles.childrenContent}>
              {children}
            </div>
          )}
        </div>
      </section>
    </SectionWrapper>
  )
}

export default ContentSection
