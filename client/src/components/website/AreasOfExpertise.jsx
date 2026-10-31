import React from 'react'
import { FiFlag, FiFileText } from 'react-icons/fi'
import { MegaphoneIcon, TargetIcon } from './Icons'
import styles from './AreasOfExpertise.module.css'

const AreasOfExpertise = () => {
    const areas = [
        {
            icon: FiFlag,
            title: 'Branding',
            subtitle: 'Build identities that inspire trust',
        },
        {
            icon: TargetIcon,
            title: 'Strategic Marketing',
            subtitle: 'Turn insights into measurable growth.',
        },
        {
            icon: MegaphoneIcon,
            title: 'Advertising',
            subtitle: 'Targeted campaigns that convert.',
        },
        {
            icon: FiFileText,
            title: 'Marketing Collateral',
            subtitle: 'Persuasive assets that drive impact.',
        },
    ]

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleWrapper}>
                        <h2 className={styles.title}>Find Experts by Specialization</h2>
                        {/* Decorative element positioned relative to the header */}
                        <div className={styles.decorativeCircle}></div>                    </div>
                    <p className={styles.subtitle}>
                        MarTechAdda focuses exclusively on core marketing disciplines:
                    </p>
                </div>

                <div className={styles.grid}>
                    {areas.map((area, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.iconContainer}>
                                <area.icon className={styles.icon} />
                            </div>
                            <h3 className={styles.cardTitle}>{area.title}</h3>
                            <p className={styles.cardSubtitle}>{area.subtitle}</p>
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        These represent areas of expertise available on the platform — not services sold by MarTechAdda itself.
                    </p>
                </div>
            </div>
        </section>
    )
}

export default AreasOfExpertise
