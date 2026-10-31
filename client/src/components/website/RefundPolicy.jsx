import React, { useState } from 'react'
import SectionWrapper from './SectionWrapper'
import SEO from './SEO'
import SchemaMarkup from './SchemaMarkup'
import styles from './RefundPolicy.module.css'

const RefundPolicy = () => {
    const [tocOpen, setTocOpen] = useState(false)

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId)
        if (element) {
            const headerOffset = 100
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
            setTocOpen(false)
        }
    }

    const breadcrumbs = [
        { name: 'Home', path: '/' },
        { name: 'Refund & Cancellation Policy', path: '/refund-policy' }
    ]

    const sections = [
        {
            id: 'section-1',
            number: '01',
            title: 'Milestone Deposits',
            content: (
                <ul className={styles.bulletList}>
                    <li>Each milestone is treated separately.</li>
                    <li>Funds are held until the milestone is completed and approved.</li>
                </ul>
            )
        },
        {
            id: 'section-2',
            number: '02',
            title: 'Service Receiver Cancellation',
            content: (
                <ul className={styles.bulletList}>
                    <li>Cancel before the next milestone starts.</li>
                    <li>10% cancellation charge applies.</li>
                    <li>Remaining eligible amount is refunded.</li>
                    <li>Refunds are subject to the applicable payment terms.</li>
                </ul>
            )
        },
        {
            id: 'section-3',
            number: '03',
            title: 'Service Provider Cancellation',
            content: (
                <ul className={styles.bulletList}>
                    <li>No cancellation charge is applied to the Service Receiver.</li>
                    <li>Eligible held funds are refunded.</li>
                    <li>10% cancellation/platform charge may apply to the Service Provider under the applicable Provider Terms.</li>
                </ul>
            )
        },
        {
            id: 'section-4',
            number: '04',
            title: 'Delay or Non-Delivery',
            content: (
                <ul className={styles.bulletList}>
                    <li>Raise a dispute if the Service Provider delays, abandons or materially fails to deliver.</li>
                    <li>Applicable funds remain held during review.</li>
                    <li>Eligible undelivered/unearned amounts may be refunded.</li>
                    <li>Provider-side charges may apply where applicable.</li>
                </ul>
            )
        },
        {
            id: 'section-5',
            number: '05',
            title: 'Approved Milestones',
            content: (
                <ul className={styles.bulletList}>
                    <li>Once a milestone is approved and released, it is generally non-refundable.</li>
                    <li>Exceptions may apply where required by law or through the applicable dispute process.</li>
                </ul>
            )
        },
        {
            id: 'section-6',
            number: '06',
            title: 'Refund Requests',
            content: (
                <div>
                    <p className={styles.paragraph}>For cancellation, refund or dispute:</p>
                    <p className={styles.paragraph} style={{ marginTop: '0.5rem' }}>
                        <a href="mailto:finance@martechadda.com" style={{ color: '#2563eb', fontWeight: '600' }}>
                            finance@martechadda.com
                        </a>
                    </p>
                    <p className={styles.paragraph} style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Include your engagement and milestone reference.
                    </p>
                </div>
            )
        }
    ]

    return (
        <SectionWrapper sectionType="privacy">
            <SEO
                title="Refund & Cancellation Policy - MarTechAdda"
                description="Read MarTechAdda's Refund & Cancellation Policy to understand your rights regarding cancellations, payments, and refunds."
                canonical="https://martechadda.com/refund-policy"
            />
            <SchemaMarkup
                type="WebPage"
                breadcrumbs={breadcrumbs}
            />
            <section className={styles.refundSection}>
                {/* Hero Section */}
                <div className={styles.hero}>
                    <div className={styles.heroBackground}></div>
                    <div className={styles.refundContainer}>
                        <div className={styles.heroContent}>
                            <h1 className={styles.mainTitle}>Refund & Cancellation Policy</h1>
                            <p className={styles.lastUpdated}>Effective: May 1, 2026</p>
                        </div>
                    </div>
                </div>

                <div className={styles.refundContainer}>
                    {/* Table of Contents */}
                    <div className={styles.tocWrapper}>
                        <button
                            className={styles.tocToggle}
                            onClick={() => setTocOpen(!tocOpen)}
                            aria-expanded={tocOpen}
                        >
                            <span>Table of Contents</span>
                            <span className={styles.tocIcon}>{tocOpen ? '−' : '+'}</span>
                        </button>
                        {tocOpen && (
                            <nav className={styles.tableOfContents}>
                                {sections.map((s) => (
                                    <a
                                        key={s.id}
                                        href={`#${s.id}`}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            scrollToSection(s.id)
                                        }}
                                    >
                                        {s.number}. {s.title}
                                    </a>
                                ))}
                            </nav>
                        )}
                    </div>

                    <div className={styles.content}>
                        {sections.map((s) => (
                            <section key={s.id} id={s.id} className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <span className={styles.sectionNumber}>{s.number}</span>
                                    <h2 className={styles.sectionTitle}>{s.number} — {s.title}</h2>
                                </div>
                                {s.content}
                            </section>
                        ))}
                    </div>
                </div>
            </section>
        </SectionWrapper>
    )
}

export default RefundPolicy
