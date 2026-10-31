import React from 'react'
import * as Illustrations from './IllustrationLibrary'
import styles from './SectionWrapper.module.css'

/**
 * SectionWrapper - Applies background illustrations to sections
 * Props:
 * - sectionType: string - Type of section (determines which illustration to use)
 * - children: ReactNode - Section content
 * - className: string - Additional CSS classes
 */

const illustrationMap = {
  // HOME PAGE
  'hero-dashboard': Illustrations.HeroDashboardPattern,
  'service-categories': Illustrations.ServiceCategoryPattern,
  'how-hiring-works': Illustrations.TimelineArrowsPattern,
  'problem-cards': Illustrations.WarningTrianglesPattern,
  'solution-cards': Illustrations.CheckmarksPattern,
  'dual-pathways': Illustrations.DualPathwaysPattern,
  'stats-strip': Illustrations.NumberCountersPattern,
  'closing-cta': Illustrations.DiagonalLinesPattern,
  'what-martechadda-is': Illustrations.HeroDashboardPattern,
  'deliver-better-matches': Illustrations.NodeNetworkPattern,

  // ABOUT PAGE
  'about-hero': Illustrations.BalanceScalePattern,
  'why-we-exist': Illustrations.ProblemFlowPattern,
  'what-were-building': Illustrations.BlueprintPattern,
  'principles': Illustrations.GeometricShapesPattern,
  'ecosystem-role': Illustrations.NodeNetworkPattern,
  'about-cta': Illustrations.DiagonalLinesPattern,

  // HOW IT WORKS PAGE
  'how-it-works-hero': Illustrations.ProcessFlowPattern,
  'businesses-stepper': Illustrations.FilterIconsPattern,
  'experts-stepper': Illustrations.ProfileTargetPattern,
  'what-we-dont-do': Illustrations.LockShieldPattern,
  'how-it-works-cta': Illustrations.DiagonalLinesPattern,

  // WHY THIS WORKS PAGE
  'why-this-works-hero': Illustrations.LightbulbChartsPattern,
  'core-insight': Illustrations.ProblemSolutionFlowPattern,
  'structural-issues': Illustrations.CrackedFoundationPattern,
  'expertise-areas': Illustrations.ServiceIconsFaintPattern,
  'who-its-for': Illustrations.PersonAvatarPattern,
  'why-this-works-cta': Illustrations.DiagonalLinesPattern,

  // CONTACT PAGE
  'contact-hero': Illustrations.ChatBubblesPattern,
  'step-progress': Illustrations.StepTimelinePattern,
  'role-cards': Illustrations.PersonAvatarPattern,
  'trust-block': Illustrations.TrustLockShieldPattern,
  'other-ways': Illustrations.ChatBubblesPattern,
}

const SectionWrapper = ({ sectionType, children, className = '' }) => {
  const IllustrationComponent = illustrationMap[sectionType]

  if (!IllustrationComponent) {
    console.warn(`No illustration found for sectionType: ${sectionType}`)
  }

  return (
    <div className={`${styles.sectionWrapper} ${className}`}>
      {IllustrationComponent && (
        <div className={styles.sectionBgIllustration}>
          <IllustrationComponent />
        </div>
      )}
      <div className={styles.sectionContent}>
        {children}
      </div>
    </div>
  )
}

export default SectionWrapper
