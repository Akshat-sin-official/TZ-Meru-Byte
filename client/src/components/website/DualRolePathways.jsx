import React from 'react'
import { Link } from 'react-router-dom'
import { FiBriefcase, FiUser, FiArrowRight } from 'react-icons/fi'
import Button from './ui/Button'
import SectionWrapper from './SectionWrapper'
import styles from './DualRolePathways.module.css'

const DualRolePathways = () => {
  return (
    <SectionWrapper sectionType="dual-pathways">
      <section className={styles.dualPaths}>
        <div className={`container ${styles.container}`}>
          <div className={styles.titleSection}>
            <h2 className={styles.sectionTitle}>Choose your path</h2>
          </div>
          
          <div className={styles.grid}>
            {/* For Businesses Card */}
            <div className={`${styles.pathwayCard} ${styles.businessCard}`}>
              <div className={styles.cardIconWrapper}>
                <FiBriefcase className={styles.cardIcon} />
              </div>
              <h3 className={styles.cardTitle}>For Businesses</h3>
              <p className={styles.cardDescription}>
              Hire marketing experts with clarity and confidence
              </p>
              <Button 
                variant="primary" 
                size="md" 
                className={styles.ctaButton}
                as={Link}
                to="/experts"
              >
                Start expert discovery
                <FiArrowRight className={styles.arrowIcon} />
              </Button>
            </div>

            {/* For Marketing Professionals Card */}
            <div className={`${styles.pathwayCard} ${styles.expertCard}`}>
              <div className={styles.cardIconWrapper}>
                <FiUser className={styles.cardIcon} />
              </div>
              <h3 className={styles.cardTitle}>For Marketing Professionals</h3>
              <p className={styles.cardDescription}>
                Get discovered for capability, not ad spend
              </p>
              <Button 
                variant="secondary" 
                size="md" 
                className={styles.ctaButton}
                as={Link}
                to="/service-expert-register"
              >
                Create expert profile
                <FiArrowRight className={styles.arrowIcon} />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  )
}

export default DualRolePathways
