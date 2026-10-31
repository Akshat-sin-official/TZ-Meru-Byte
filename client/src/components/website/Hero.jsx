import React from 'react'
import { Link } from 'react-router-dom'
import Button from './ui/Button'
import SectionWrapper from './SectionWrapper'
import styles from './Hero.module.css'

const Hero = () => {
  return (
    <SectionWrapper sectionType="hero-dashboard">
      <section className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          <div className={styles.heroContent}>
            <h1 className={styles.headline}>
              Hire marketing experts — without RFPs, pitches, or guesswork.
            </h1>
            <p className={styles.subheadline}>
              Tell us what you need. <span className={styles.orangeText}>We help you discover, evaluate, and align with relevant expertise — before commitments begin.</span>
            </p>

            {/* <div className={styles.ctaGroup}>
              <Button
                as={Link}
                to="/experts"
                variant="primary"
                size="lg"
              >
                Find Marketing Experts
              </Button>
              <Button
                as={Link}
                to="/service-expert-register"
                variant="outline"
                size="lg"
              >
                Join As Marketing Expert
              </Button>
            </div> */}

            <p className={styles.trustCue}>
              Built for businesses seeking relevant expertise — and experts seeking relevant opportunities.
            </p>
          </div>
        </div>
      </section>
    </SectionWrapper>
  )
}

export default Hero
