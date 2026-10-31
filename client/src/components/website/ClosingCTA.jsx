import React from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiUser } from 'react-icons/fi'
import { HandshakeIcon } from './Icons'
import Button from './ui/Button'
import SectionWrapper from './SectionWrapper'
import styles from './ClosingCTA.module.css'

const ClosingCTA = () => {
  return (
    <SectionWrapper sectionType="closing-cta">
      <section className={styles.closingCTA}>
        <div className={styles.backgroundPattern}></div>
        <div className={styles.backgroundGradient}></div>
        <div className={styles.illustrationCard}>
          <HandshakeIcon className={styles.handshakeIcon} />
        </div>
        <div className={`container ${styles.container}`}>
          <h2 className={styles.ctaText}>Ready to hire — or be hired — with clarity? </h2>
          <div className={styles.buttonGroup}>
            <Button
              variant="primary"
              size="md"
              className={styles.ctaButton}
              as={Link}
              to="/experts"
            >
              <FiSearch className={styles.buttonIcon} />
              Find Marketing Experts
            </Button>
            <Button variant="outline" size="md" className={styles.ctaButton} to="/service-expert-register">
              <FiUser className={styles.buttonIcon} />
              Join As Marketing Expert
            </Button>
          </div>
        </div>
      </section>
    </SectionWrapper>
  )
}

export default ClosingCTA
