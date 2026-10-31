import React from 'react'
import { FiSearch, FiMessageCircle, FiFileText, FiBriefcase, FiArrowRight } from 'react-icons/fi'
import { FaHandshake } from 'react-icons/fa'
import Button from './ui/Button'
import SectionWrapper from './SectionWrapper'
import styles from './HowHiringWorks.module.css'

// Reusable ProcessStep component
export const ProcessStep = ({ stepNumber, title, description, icon: Icon, isActive = false, isFirst = false, isLast = false, showConnector = false }) => {
  return (
    <>
      <div className={styles.step}>
        <div className={`${styles.stepCircle} ${isActive ? styles.active : ''} ${isFirst ? styles.first : ''}`}>
          <Icon className={styles.stepIcon} />
        </div>
        <div className={styles.stepContent}>
          <h3 className={styles.stepTitle}>
            <span className={styles.stepBadge}>Step {stepNumber}</span>
            {title}
          </h3>
          <p className={styles.stepDescription}>{description}</p>
        </div>
      </div>
      {showConnector && <div className={styles.connector}></div>}
    </>
  )
}

const HowHiringWorks = () => {
  const steps = [
    {
      stepNumber: 1,
      title: 'Define',
      description: 'Search with guided, marketing-specific filters — designed for clarity, not volume.',
      icon: FiSearch,
      isActive: false
    },
    {
      stepNumber: 2,
      title: 'Match',
      description: 'Connect through structured conversations — before proposals and pressure.',
      icon: FiMessageCircle,
      isActive: false
    },
    {
      stepNumber: 3,
      title: 'Align',
      description: 'Align scope and expectations — before commitment.',
      icon: FiFileText,
      isActive: false
    },
    {
      stepNumber: 4,
      title: 'Hire',
      description: 'Hire with confidence — knowing the fit is already clear.',
      icon: FaHandshake,
      isActive: false
    }
  ]

  return (
    <SectionWrapper sectionType="how-hiring-works">
      <section className={styles.howHiringWorks}>
        <div className={styles.howHiringWorksGeometricBg}>
          <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {/* Left side - geometric shapes */}
            <g>
              {/* Diagonal lines */}
              <line x1="80" y1="120" x2="200" y2="80" stroke="#e5e7eb" strokeWidth="2" opacity="0.12" />
              <line x1="100" y1="180" x2="240" y2="140" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />

              {/* Arc shapes */}
              <path d="M 100 100 Q 180 60 260 100" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.12" />
              <path d="M 120 220 Q 200 180 280 220" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />

              {/* Large faint circles */}
              <circle cx="200" cy="150" r="50" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
              <circle cx="250" cy="200" r="40" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.08" />

              {/* Orange accent circles */}
              <circle cx="180" cy="150" r="35" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.12" />
              <circle cx="160" cy="200" r="25" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />

              {/* Triangle accents */}
              <path d="M 140 130 L 180 130 L 160 165 Z" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.12" />
            </g>

            {/* Center area - connecting elements between steps */}
            <g>
              {/* Subtle connecting lines */}
              <line x1="300" y1="300" x2="900" y2="300" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.08" strokeDasharray="6 6" />

              {/* Circles along the line */}
              <circle cx="400" cy="300" r="12" fill="#FF6B35" opacity="0.08" />
              <circle cx="600" cy="300" r="10" fill="#2D8659" opacity="0.08" />
              <circle cx="800" cy="300" r="12" fill="#FF6B35" opacity="0.08" />
            </g>

            {/* Right side - concentrated circular/target motif */}
            <g>
              {/* Large target circles */}
              <circle cx="1000" cy="250" r="70" fill="none" stroke="#2D8659" strokeWidth="2.5" opacity="0.14" />
              <circle cx="1000" cy="250" r="55" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.12" />
              <circle cx="1000" cy="250" r="40" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
              <circle cx="1000" cy="250" r="28" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.12" />
              <circle cx="1000" cy="250" r="16" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.14" />

              {/* Secondary circles */}
              <circle cx="920" cy="230" r="35" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
              <circle cx="1080" cy="270" r="30" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
              <circle cx="1040" cy="200" r="28" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />

              {/* Connecting lines */}
              <line x1="920" y1="230" x2="1000" y2="250" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
              <line x1="1080" y1="270" x2="1000" y2="250" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
              <line x1="1040" y1="200" x2="1000" y2="250" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />

              {/* Orange accent nodes */}
              <circle cx="960" cy="280" r="10" fill="#FF6B35" opacity="0.12" />
              <circle cx="1040" cy="220" r="8" fill="#FF6B35" opacity="0.12" />
            </g>

            {/* Additional accent shapes */}
            <circle cx="1100" cy="150" r="18" fill="#2D8659" opacity="0.1" />
            <path d="M 150 450 L 220 450 L 185 400 Z" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.1" />
            <path d="M 1050 350 L 1090 330 L 1090 290 L 1050 270 L 1010 290 L 1010 330 Z" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.12" />

            {/* Bottom connecting elements */}
            <line x1="200" y1="450" x2="1000" y2="400" stroke="#e5e7eb" strokeWidth="1" opacity="0.06" strokeDasharray="5 5" />
          </svg>
        </div>
        <div className={`container ${styles.container}`}>
          <div className={styles.header}>
            <div className={styles.titleSection}>
              <div className={styles.titleIcon}>
                <FiBriefcase className={styles.titleIconSvg} />
              </div>
              <h2 className={styles.sectionTitle}>How Hiring Works</h2>
            </div>
            <p className={styles.sectionSubtitle}>A simple 4-step process from discovery to decision</p>
            <p className={styles.sectionSubtitle}>We focus on alignment first — so hiring decisions feel calm, informed, and intentional.</p>
          </div>

          <div className={styles.stepsContainer}>
            {steps.map((step, index) => (
              <ProcessStep
                key={index}
                stepNumber={step.stepNumber}
                title={step.title}
                description={step.description}
                icon={step.icon}
                isActive={step.isActive}
                isFirst={index === 0}
                isLast={index === steps.length - 1}
                showConnector={index < steps.length - 1}
              />
            ))}
          </div>

          <div className={styles.ctaSection}>
            <Button
              as="a"
              href="/how-it-works"
              variant="primary"
              size="md"
              className={styles.ctaButton}
            >
              See how MarTechAdda works
              <FiArrowRight className={styles.ctaArrow} />
            </Button>
          </div>
        </div>
      </section>
    </SectionWrapper>
  )
}

export default HowHiringWorks
