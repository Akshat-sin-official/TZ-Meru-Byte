import React from 'react'
import Card from './ui/Card'
import SectionWrapper from './SectionWrapper'
import { ShieldCheck, Target, Zap, Users, Layout } from 'lucide-react'
import styles from './DeliverBetterMatches.module.css'

const DeliverBetterMatches = () => {
    const highlights = [
        {
            icon: <ShieldCheck className={styles.icon} />,
            text: "Experts are verified before being visible to businesses"
        },
        {
            icon: <Target className={styles.icon} />,
            text: "Discovery is based on specialization, not ad spend"
        },
        {
            icon: <Zap className={styles.icon} />,
            text: "No sponsored rankings or pay-to-win visibility"
        },
        {
            icon: <Users className={styles.icon} />,
            text: "Direct connection with relevant marketing professionals"
        },
        {
            icon: <Layout className={styles.icon} />,
            text: "Structured service classification for accurate matching"
        }
    ]

    return (
        <SectionWrapper sectionType="deliver-better-matches">
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h2 className={styles.sectionTitle}>How MarTechAdda Delivers Better Matches</h2>
                        <p className={styles.sectionSubtitle}>
                            Built to remove bias, reduce hiring risk, and improve expert-business fit.
                        </p>
                    </div>

                    <div className={styles.contentGrid}>
                        <div className={styles.featureList}>
                            {highlights.map((item, index) => (
                                <div key={index} className={styles.featureItem}>
                                    <div className={styles.iconWrapper}>
                                        {item.icon}
                                    </div>
                                    <span className={styles.featureText}>{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.cardContainer}>
                            <Card className={styles.highlightCard}>
                                <h3 className={styles.cardTitle}>Why This Matters</h3>
                                <p className={styles.cardText}>
                                    Traditional marketplaces optimize for volume and ad revenue. We optimize for <strong>clarity</strong> and <strong>alignment</strong>.
                                </p>
                                <div className={styles.cardBadge}>Neutral Discovery Engine</div>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </SectionWrapper>
    )
}

export default DeliverBetterMatches
