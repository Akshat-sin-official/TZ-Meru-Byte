import React from 'react'
import { ScaleIcon, LinkIcon, TargetIcon, ShieldIcon } from './Icons'
import SectionWrapper from './SectionWrapper'
import styles from './InnovationProof.module.css'

const InnovationProof = () => {
  const stats = [
    {
      icon: ScaleIcon,
      number: '',
      label: 'Neutral by Design',
      description: 'No paid rankings. Merit-based discovery. '
    },
    {
      icon: LinkIcon,
      label: 'A Neutral Facilitator',
      sublabel: 'Not an agency. ',
      description: "We don't sell services."
    },
    {
      icon: TargetIcon,
      label: 'Built Only for Marketing',
      sublabel: 'A platform focused exclusively ',
      description: 'on marketing expertise.'
    },
    {
      icon: ShieldIcon,
      label: 'Verified, Not Sponsored',
      sublabel: 'Experts are reviewed ',
      description: 'before visibility.'
    }
  ]

  return (
    <SectionWrapper sectionType="stats-strip">
      <section className={styles.innovationProof}>
        <div className={`container ${styles.container}`}>
          <h2 className={styles.title}>
            Built on clarity - not just speed
          </h2>
          <p className={styles.subtitle}>
            How MarTechAdda is designed at its core
          </p>
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className={styles.statCard}>
                  <div className={styles.iconWrapper}>
                    <IconComponent className={styles.icon} />
                  </div>
                  <div className={styles.content}>
                    {stat.number && (
                      <div className={styles.number}>{stat.number}</div>
                    )}
                    <div className={styles.labels}>
                      <h3 className={styles.label}>{stat.label}</h3>
                      {stat.sublabel && (
                        <p className={styles.sublabel}>{stat.sublabel}</p>
                      )}
                    </div>
                    <p className={styles.description}>{stat.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </SectionWrapper>
  )
}

export default InnovationProof
