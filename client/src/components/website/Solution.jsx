import React from 'react'
import { FiCheckCircle, FiSearch, FiMessageCircle, FiFileText } from 'react-icons/fi'
import SectionWrapper from './SectionWrapper'
import styles from './Solution.module.css'

const Solution = () => {
  const benefits = [
    'Marketing-only expert discovery',
    'Conversations before commitments',
    'Clear scope and expectations upfront'
  ]

  const benefitIcons = [FiSearch, FiMessageCircle, FiFileText]

  return (
    <SectionWrapper sectionType="solution-cards">
      <section className={styles.solution}>
        <div className={`container ${styles.container}`}>
          <div className={styles.titleSection}>
            <div className={styles.titleBadge}>
              <span>Solution</span>
            </div>
            <h2 className={styles.title}>A clearer way to discover and hire marketing expertise.</h2>
            <p className={styles.subtitle}>
              MarTechAdda is designed for clarity before commitment.
            </p>
          </div>

          <div className={styles.benefitsSection}>
            <ul className={styles.benefitsList}>
              {benefits.map((benefit, index) => {
                const IconComponent = benefitIcons[index] || FiCheckCircle
                return (
                  <li key={index} className={styles.benefitItem}>
                    <IconComponent className={styles.checkIcon} />
                    <span>{benefit}</span>
                  </li>
                )
              })}
            </ul>
            <p className={styles.note}>While most platforms optimise for volume and speed, we optimise for alignment and confidence.</p>
            <p className={styles.note}>
              No paid rankings. No featured listings. Discovery stays neutral.
            </p>
            <p className={styles.note}>
              This is how we help both sides align before work begins.
            </p>
          </div>
        </div>
      </section>
    </SectionWrapper>
  )
}

export default Solution
