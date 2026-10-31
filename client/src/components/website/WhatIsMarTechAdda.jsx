import React from 'react'
import SectionWrapper from './SectionWrapper'
import styles from './WhatIsMarTechAdda.module.css'

const WhatIsMarTechAdda = () => {
    return (
        <SectionWrapper sectionType="what-martechadda-is">
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>What is MarTechAdda</h2>
                        <p className={styles.sectionSubheading}>
                            A neutral platform built to improve hiring decisions — not promote providers.
                        </p>
                        <p className={styles.sectionDescription}>
                            MarTechAdda is a neutral discovery platform that helps businesses find and connect with verified marketing professionals based on real expertise and specialization. We bring clarity before hiring — so you understand what expertise you need, and who is best suited to deliver it.
                        </p>
                    </div>
                </div>
            </section>
        </SectionWrapper>
    )
}

export default WhatIsMarTechAdda
