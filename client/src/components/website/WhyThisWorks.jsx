import React from 'react'
import { FiPackage, FiClock, FiEye, FiFlag, FiTarget, FiFileText, FiBriefcase, FiUsers, FiAlertCircle } from 'react-icons/fi'
import { MegaphoneIcon } from './Icons'
import Card from './ui/Card'
import Button from './ui/Button'
import Chip from './ui/Chip'
import SectionWrapper from './SectionWrapper'
import SEO from './SEO'
import SchemaMarkup from './SchemaMarkup'
import styles from './WhyThisWorks.module.css'

const WhyThisWorks = () => {
  const structuralIssues = [
    {
      title: "Marketing isn't a commodity",
      description: 'Treating it like one leads to poor outcomes.',
      icon: FiPackage
    },
    {
      title: "Alignment doesn't come from RFPs",
      description: 'It comes from real conversation.',
      icon: FiClock
    },
    {
      title: "Transparency shouldn't come last",
      description: 'It should come before commitment.',
      icon: FiEye
    }
  ]

  const whoItsFor = {
    businesses: [
      'Businesses seeking specific marketing expertise',
      'Teams tired of generic marketplace experiences',
      'Organizations wanting clarity before commitment'
    ],
    experts: [
      'Marketing professionals seeking quality clients',
      'Experts tired of competing on price alone',
      'Professionals wanting meaningful conversations'
    ]
  }

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Why This Works', path: '/why-this-works' }
  ]

  return (
    <div className={styles.whyThisWorks}>
      <SEO
        title="Why MarTechAdda Works - Better Marketing Hiring"
        description="Discover why MarTechAdda's neutral, transparent approach to marketing expert discovery works better than traditional marketplaces. No paid rankings, no RFPs, just clarity."
        canonical="https://martechadda.com/why-this-works"
      />
      <SchemaMarkup
        type="WebPage"
        breadcrumbs={breadcrumbs}
      />

      {/* 1️⃣ Problem - Three Structural Issues */}
      <SectionWrapper sectionType="structural-issues">
        <section className={styles.issuesSection}>
          <div className={`container ${styles.container}`}>
            <h2 className={styles.sectionTitle}>WHY THE CURRENT HIRING MODEL FAILS</h2>
            <h3 className={styles.sectionSubtitle}>Our Observation</h3>
            <p className={styles.expertiseDescription}>Three structural issues repeat across the industry:</p>
            <div className={styles.issuesGrid}>
              {structuralIssues.map((issue, index) => {
                const IconComponent = issue.icon
                return (
                  <Card
                    key={index}
                    className={styles.issueCard}
                    variant="default"
                  >
                    <div className={styles.issueWarningIcon}>
                      <FiAlertCircle className={styles.warningIcon} />
                    </div>
                    <div className={styles.issueIconWrapper}>
                      <IconComponent className={styles.issueIcon} />
                    </div>
                    <div className={styles.issueLabel}>{issue.title}</div>
                    <p className={styles.issueDescription}>
                      {issue.description}
                    </p>
                  </Card>
                )
              })}
            </div>
            <Card className={styles.observationCard}>
              <p className={styles.observationCardText}>
                We built MarTechAdda to fix the process, not promote providers.
              </p>
            </Card>
          </div>
        </section>
      </SectionWrapper>

      {/* 2️⃣ Insight - Hero Block */}
      <SectionWrapper sectionType="why-this-works-hero">
        <section className={styles.hero}>
          <div className={styles.heroBackground}>
            <svg className={styles.decisionFlow} viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-orange)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--color-orange)" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <circle cx="200" cy="100" r="6" fill="var(--color-grey-300)" opacity="0.3" />
              <circle cx="400" cy="80" r="6" fill="var(--color-grey-300)" opacity="0.3" />
              <circle cx="600" cy="120" r="8" fill="var(--color-orange)" opacity="0.25" />
              <circle cx="800" cy="90" r="6" fill="var(--color-grey-300)" opacity="0.3" />
              <circle cx="1000" cy="110" r="6" fill="var(--color-grey-300)" opacity="0.3" />
              <circle cx="300" cy="250" r="8" fill="var(--color-orange)" opacity="0.25" />
              <circle cx="500" cy="280" r="6" fill="var(--color-grey-300)" opacity="0.3" />
              <circle cx="700" cy="260" r="8" fill="var(--color-orange)" opacity="0.25" />
              <circle cx="900" cy="270" r="6" fill="var(--color-grey-300)" opacity="0.3" />
              <line x1="200" y1="100" x2="300" y2="250" stroke="var(--color-grey-300)" strokeWidth="1.5" opacity="0.15" />
              <line x1="400" y1="80" x2="500" y2="280" stroke="var(--color-grey-300)" strokeWidth="1.5" opacity="0.15" />
              <line x1="600" y1="120" x2="700" y2="260" stroke="var(--color-orange)" strokeWidth="2" opacity="0.25" />
              <line x1="800" y1="90" x2="900" y2="270" stroke="var(--color-grey-300)" strokeWidth="1.5" opacity="0.15" />
              <line x1="200" y1="100" x2="400" y2="80" stroke="var(--color-grey-300)" strokeWidth="1.5" opacity="0.15" />
              <line x1="400" y1="80" x2="600" y2="120" stroke="var(--color-grey-300)" strokeWidth="1.5" opacity="0.15" />
              <line x1="600" y1="120" x2="800" y2="90" stroke="var(--color-orange)" strokeWidth="2" opacity="0.25" />
              <line x1="800" y1="90" x2="1000" y2="110" stroke="var(--color-grey-300)" strokeWidth="1.5" opacity="0.15" />
              <line x1="300" y1="250" x2="500" y2="280" stroke="var(--color-orange)" strokeWidth="2" opacity="0.25" />
              <line x1="500" y1="280" x2="700" y2="260" stroke="var(--color-grey-300)" strokeWidth="1.5" opacity="0.15" />
              <line x1="700" y1="260" x2="900" y2="270" stroke="var(--color-grey-300)" strokeWidth="1.5" opacity="0.15" />
            </svg>
          </div>
          <div className={`container ${styles.container}`}>
            <h2 className={styles.heroSubtitle}>The Core Insight</h2>
            <h1 className={styles.heroTitle}>
              The problem isn't marketing talent. It's <span className={styles.heroAccent}>how hiring decisions are made</span>.
            </h1>
          </div>
        </section>
      </SectionWrapper>

      {/* 3️⃣ Comparison - Platform Comparison Cards */}
      <SectionWrapper sectionType="platform-comparison">
        <section className={styles.comparisonSection}>
          <div className={`container ${styles.container}`}>
            <div className={styles.comparisonHeader}>
              From Profile-Led Discovery to Requirement-Led Matching
            </div>
            <div className={styles.comparisonGrid}>
              {/* How Existing Platforms Work */}
              <Card className={styles.comparisonCard}>
                <h3 className={styles.comparisonCardTitle}>How Existing Platforms Work</h3>
                <ul className={styles.comparisonList}>
                  <li className={styles.comparisonListItem}>Profiles before needs</li>
                  <li className={styles.comparisonListItem}>Volume over relevance</li>
                  <li className={styles.comparisonListItem}>Promotion over fit</li>
                  <li className={styles.comparisonListItem}>Commitments before clarity</li>
                </ul>
                <p className={styles.comparisonCardText}>
                  Profile-led discovery — businesses must search for the right provider.
                </p>
              </Card>

              {/* How MarTechAdda Is Designed */}
              <Card className={`${styles.comparisonCard} ${styles.comparisonCardHighlight}`}>
                <h3 className={styles.comparisonCardTitle}>How MarTechAdda Is Designed</h3>
                <ul className={styles.comparisonList}>
                  <li className={styles.comparisonListItem}>Requirements before reach</li>
                  <li className={styles.comparisonListItem}>Conversation before commitment</li>
                  <li className={styles.comparisonListItem}>Clarity before cost</li>
                  <li className={styles.comparisonListItem}>Fit before execution</li>
                </ul>
                <p className={styles.comparisonCardText}>
                  Requirement-led matching — businesses find the right expertise faster.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/* 4️⃣ Audience - Who It's For */}
      <SectionWrapper sectionType="who-its-for">
        <section className={styles.whoSection}>
          <div className={`container ${styles.container}`}>
            <h2 className={styles.sectionTitle}>WHO THIS APPROACH IS FOR</h2>
            <h3 className={styles.sectionSubtitle}>Who It’s For</h3>
            <p className={styles.expertiseDescription}>This approach is built for people who value clarity over speed.</p>
            <div className={styles.whoGrid}>
              <Card className={styles.whoCard}>
                <div className={styles.whoIconWrapper}>
                  <FiBriefcase className={styles.whoIcon} />
                </div>
                <h3 className={styles.whoTitle}>For businesses seeking clarity</h3>
                <Button variant="primary" size="lg" className={styles.whoCardButtonCentered}>
                  Explore experts
                </Button>
              </Card>
              <Card className={styles.whoCard}>
                <div className={styles.whoIconWrapper}>
                  <FiUsers className={styles.whoIcon} />
                </div>
                <h3 className={styles.whoTitle}>For experts seeking fair discovery</h3>
                <Button variant="secondary" size="lg" className={styles.whoCardButton}>
                  Join As Marketing Expert
                </Button>
              </Card>
            </div>
            <Card className={styles.whoMessageCard}>
              <div className={styles.whoMessageContent}>
                <div className={styles.whoMessageQuote}>"</div>
                <p className={styles.whoMessageText}>
                  If you value transparency over tactics and fit over force-selling, you'll feel at home here.
                </p>
              </div>
            </Card>
          </div>
        </section>
      </SectionWrapper>

    </div>
  )
}

export default WhyThisWorks
