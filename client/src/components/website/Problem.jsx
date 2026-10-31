import React from 'react'
import { FiSearch, FiClock, FiEye, FiArrowRight, FiFileText, FiTarget } from 'react-icons/fi'
import Card from './ui/Card'
import Button from './ui/Button'
import SectionWrapper from './SectionWrapper'
import styles from './Problem.module.css'

const Problem = () => {
  const problems = [
    {
      title: 'Relevant expertise gets buried behind visibility-driven discovery',
      description: 'Marketing specialists are buried inside generic platforms that weren\'t built for marketing discovery.',
      icon: FiSearch,
      gradient: 'gradient-1',
      number: '01'
    },
    {
      title: 'RFPs delay real conversations',
      description: 'Time is spent on pitches and paperwork before meaningful alignment even begins.',
      icon: FiFileText,
      gradient: 'gradient-2',
      number: '02'
    },
    {
      title: 'Clarity arrives too late',
      description: 'Capability, scope, and fit often become clear after commitments are already made.',
      icon: FiTarget,
      gradient: 'gradient-3',
      number: '03'
    }
  ]

  return (
    <SectionWrapper sectionType="problem-cards">
      <section className={styles.problem}>
        <div className={styles.problemBackgroundPattern}></div>
        <div className={styles.problemBackgroundGradient}></div>
        <div className={`container ${styles.container}`}>
        <div className={styles.titleSection}>
            <div className={styles.titleBadge}>
              <span>Problem</span>
          </div>
          <h2 className={styles.title}>Why finding the right marketing expertise still feels harder than it should.</h2>
            <p className={styles.subtitle}>
              Expertise is everywhere — but discovering the right fit still feels slow, fragmented, and uncertain.
            </p>
        </div>
          
        <div className={styles.grid}>
          {problems.map((problem, index) => {
            const IconComponent = problem.icon
            return (
                <div key={index} className={styles.problemCardWrapper}>
                  <Card variant="flat" className={`${styles.problemCard} ${styles[problem.gradient]}`}>
                    <div className={styles.cardNumber}>{problem.number}</div>
                    <div className={styles.cardGlow}></div>
                  <div className={styles.iconWrapper}>
                      <div className={styles.iconBackground}></div>
                    <IconComponent className={styles.problemIcon} />
                  </div>
                  <h3 className={styles.problemTitle}>{problem.title}</h3>
                  <p className={styles.problemDescription}>{problem.description}</p>
                    <div className={styles.cardAccent}></div>
                </Card>
                {index < problems.length - 1 && (
                    <div className={styles.gridConnector}>
                      <div className={styles.connectorLine}></div>
                      <div className={styles.connectorDot}></div>
                    </div>
                )}
                </div>
            )
          })}
        </div>
        
        <p className={styles.bridgeLine}>Together, these challenges create friction — and most hiring mistakes happen before work even begins.</p>
        
        <div className={styles.outcomeCardWrapper}>
          <Card variant="flat" className={styles.outcomeCard}>
            <p className={styles.outcomeText}>
            The result? Wasted time, unclear expectations, and mismatched partnerships.
            </p>
            <Button 
              as="a"
              href="/why-this-works"
              variant="primary"
              size="lg"
              className={styles.ctaButton}
            >
              See how we approach this differently
              <FiArrowRight className={styles.ctaArrow} />
            </Button>
          </Card>
        </div>
      </div>
      </section>
    </SectionWrapper>
  )
}

export default Problem
