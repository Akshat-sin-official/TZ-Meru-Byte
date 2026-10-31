import React, { useState } from 'react'
import SectionWrapper from './SectionWrapper'
import styles from './ExpertConsent.module.css'

const ExpertConsent = () => {
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

  const sections = [
    {
      id: "section-1",
      number: "01",
      title: "Platform Role & Limitation of Responsibility",
      content: (
        <>
          <p className={styles.paragraph}>I acknowledge that:</p>
          <ul className={styles.list}>
            <li>MarTechAdda is a neutral discovery and facilitation platform.</li>
            <li>MarTechAdda is not an agency, employer, or service provider.</li>
            <li>MarTechAdda does not execute marketing services, negotiate deliverables, or manage projects.</li>
            <li>All services are delivered directly by me to the service seeker.</li>
            <li><strong>✔ I remain solely responsible for service execution, delivery quality, and outcomes.</strong></li>
          </ul>
        </>
      )
    },
    {
      id: "section-2",
      number: "02",
      title: "Profile Accuracy, Verification & KYC Consent",
      content: (
        <>
          <p className={styles.paragraph}>I confirm that:</p>
          <ul className={styles.list}>
            <li>All information submitted during onboarding is true, accurate, and complete.</li>
            <li>Uploaded documents (PAN, GST, incorporation, address proof, etc.) are valid and lawfully mine.</li>
            <li>MarTechAdda may verify my identity and business details for compliance and trust purposes.</li>
            <li>My profile may be suspended or deactivated if information is found to be misleading, incomplete, or fraudulent.</li>
            <li><strong>✔ I consent to electronic storage and verification of my submitted information.</strong></li>
          </ul>
        </>
      )
    },
    {
      id: "section-3",
      number: "03",
      title: "Discussions, Quotations & Engagement Flow",
      content: (
        <>
          <p className={styles.paragraph}>I understand and agree that:</p>
          <ul className={styles.list}>
            <li>Discussions are meant for requirement alignment, not sales pitches.</li>
            <li>A quotation can be created only after:
              <ul>
                <li>A discussion is marked Completed, or</li>
                <li>A business explicitly requests a quotation.</li>
              </ul>
            </li>
            <li>Quotations on MarTechAdda:
              <ul>
                <li>Define scope, milestones, timelines, and deposit structure</li>
                <li>Are not invoices</li>
                <li>Do not guarantee engagement or payment</li>
              </ul>
            </li>
            <li><strong>✔ Engagement begins only after the service seeker accepts the quotation and deposits funds.</strong></li>
          </ul>
        </>
      )
    },
    {
      id: "section-4",
      number: "04",
      title: "Deposit Structure & Handling (Core)",
      content: (
        <>
          <p className={styles.paragraph}>I clearly understand that:</p>
          <ul className={styles.list}>
            <li>All funds collected via MarTechAdda are treated as deposits, not advance payments.</li>
            <li>Deposits are held by MarTechAdda through its designated operating account.</li>
            <li>Deposits are released to me only after milestone approval by the service seeker.</li>
            <li>Milestones in MarTechAdda act as a deposit release reference, not a task tracker or project management tool.</li>
            <li><strong>✔ No milestone = no automatic release.</strong></li>
          </ul>
        </>
      )
    },
    {
      id: "section-5",
      number: "05",
      title: "Milestone Approval & Release Process",
      content: (
        <>
          <p className={styles.paragraph}>I acknowledge that:</p>
          <ul className={styles.list}>
            <li>I must formally request deposit release for a milestone.</li>
            <li>Deposit release occurs only if the service seeker:
              <ul>
                <li>Approves the milestone, or</li>
                <li>Confirms release explicitly on the platform.</li>
              </ul>
            </li>
            <li>If a milestone is:
              <ul>
                <li>Approved → deposit is released</li>
                <li>Revision requested → no release</li>
                <li>Flagged / disputed → deposit remains on hold</li>
              </ul>
            </li>
            <li><strong>✔ MarTechAdda does not judge scope disputes; it facilitates release based on platform actions.</strong></li>
          </ul>
        </>
      )
    },
    {
      id: "section-6",
      number: "06",
      title: "Platform Fees, Commission & Applicable Charges",
      content: (
        <>
          <p className={styles.paragraph}>I acknowledge and agree that:</p>
          <ul className={styles.list}>
            <li>MarTechAdda charges a platform commission on successful engagements, calculated and applied per approved milestone.</li>
            <li>Such commission, along with applicable payment processing or operational charges (if any), is deducted at the time of deposit release.</li>
            <li>The commission structure is disclosed on the platform and made visible before engagement confirmation and prior to any deduction.</li>
            <li>Deposit releases may reflect net amounts after applicable platform charges.</li>
          </ul>
          <h3 className={styles.subsectionTitle}>Important Clarification</h3>
          <p className={styles.paragraph}>MarTechAdda does not alter, negotiate, or influence the service value agreed between me and the service seeker. All deductions relate only to platform facilitation and processing, and not to service pricing or scope.</p>
        </>
      )
    },
    {
      id: "section-7",
      number: "07",
      title: "Refund, Reversal & Deposit Hold Policy",
      content: (
        <>
          <p className={styles.paragraph}>I understand and accept that:</p>
          <h3 className={styles.subsectionTitle}>A. Refund Scenarios</h3>
          <p className={styles.paragraph}>Deposits (full or partial) may be refunded to the service seeker if:</p>
          <ul className={styles.list}>
            <li>Engagement is cancelled before any milestone approval</li>
            <li>A milestone is rejected and engagement is terminated</li>
            <li>Fraud, misrepresentation, or policy violations are identified</li>
            <li>Legal, compliance, or risk requirements demand reversal</li>
          </ul>
          <h3 className={styles.subsectionTitle}>B. Expert Entitlement</h3>
          <p className={styles.paragraph}>I am entitled only to deposits tied to approved milestones. I have no entitlement to:</p>
          <ul className={styles.list}>
            <li>Unapproved milestones</li>
            <li>Partial work without approval</li>
            <li>Off-platform commitments or verbal assurances</li>
          </ul>
          <h3 className={styles.subsectionTitle}>C. Platform Safeguard</h3>
          <p className={styles.paragraph}>MarTechAdda may temporarily hold, delay, or reverse deposits in case of:</p>
          <ul className={styles.list}>
            <li>Active disputes</li>
            <li>Compliance reviews</li>
            <li>Legal or regulatory obligations</li>
            <li><strong>✔ This does not constitute arbitration or judgment by MarTechAdda.</strong></li>
          </ul>
        </>
      )
    },
    {
      id: "section-8",
      number: "08",
      title: "Taxation, Invoicing & Legal Compliance",
      content: (
        <>
          <p className={styles.paragraph}>I acknowledge that:</p>
          <p className={styles.paragraph}>I am solely responsible for:</p>
          <ul className={styles.list}>
            <li>Raising invoices (if applicable)</li>
            <li>GST compliance</li>
            <li>Income tax reporting</li>
            <li>Any other statutory obligations</li>
          </ul>
          <p className={styles.paragraph}>MarTechAdda does not raise invoices on my behalf. Tax obligations remain between me and the service seeker.</p>
          <p className={styles.paragraph}><strong>✔ MarTechAdda assumes no liability for my tax or legal compliance.</strong></p>
        </>
      )
    },
    {
      id: "section-9",
      number: "09",
      title: "Communication & Platform Traceability",
      content: (
        <>
          <p className={styles.paragraph}>I agree that:</p>
          <ul className={styles.list}>
            <li>All milestone approvals, revisions, or release-related communication must include <strong>support@martechadda.com</strong> in CC.</li>
            <li>This ensures accurate tracking, auditability, and timely deposit release.</li>
            <li>Off-platform agreements or payments are strongly discouraged and may void platform protections.</li>
          </ul>
        </>
      )
    },
    {
      id: "section-10",
      number: "10",
      title: "Suspension, Termination & Misuse",
      content: (
        <>
          <p className={styles.paragraph}>I acknowledge that MarTechAdda may suspend or terminate my access if:</p>
          <ul className={styles.list}>
            <li>Platform misuse, fraud, or misrepresentation is detected</li>
            <li>Policies or agreements are violated</li>
            <li>Legal or regulatory risks arise</li>
            <li><strong>✔ Any held deposits will be processed as per policy and applicable law.</strong></li>
          </ul>
        </>
      )
    },
    {
      id: "section-11",
      number: "11",
      title: "Final Consent & Acceptance",
      content: (
        <>
          <p className={styles.paragraph}>By clicking “I Agree & Continue”, I confirm that:</p>
          <ul className={styles.list}>
            <li>I have read and understood all terms</li>
            <li>I accept the deposit-based engagement model</li>
            <li>I understand commission, refund, and release conditions</li>
            <li>I agree to comply with MarTechAdda’s platform rules and policies</li>
          </ul>
        </>
      )
    }
  ]

  return (
    <SectionWrapper sectionType="privacy">
      <section className={styles.expertConsentSection}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <div className={styles.heroBackground}></div>
          <div className={styles.expertConsentContainer}>
            <div className={styles.heroContent}>
              <h1 className={styles.mainTitle}>Service Expert Consent & Agreements</h1>
              <p className={styles.lastUpdated}>Effective May 1, 2026</p>
            </div>
          </div>
        </div>

        <div className={styles.expertConsentContainer}>
          {/* Introduction Box */}
          <div className={styles.introBox}>
            <p className={styles.paragraph}>
              I confirm that I have read, understood, and agreed to the following Service Expert Consent & Agreements on MarTechAdda.
            </p>
          </div>

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
                {sections.map(section => (
                  <a key={section.id} href={`#${section.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(section.id); }}>
                    {section.number}. {section.title}
                  </a>
                ))}
              </nav>
            )}
          </div>

          <div className={styles.content}>
            {sections.map(section => (
              <section key={section.id} id={section.id} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionNumber}>{section.number}</span>
                  <h2 className={styles.sectionTitle}>{section.title}</h2>
                </div>
                {section.content}
              </section>
            ))}

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Contact Information</h2>
              </div>
              <p className={styles.paragraph}>
                If you have any questions about this Service Expert Consent & Agreements, please contact us:
              </p>
              <div className={styles.contactInfo}>
                <p><strong>Email:</strong> support@martechadda.com</p>
                <p><strong>Address:</strong> A-1702, 17th FLR, Parinee Crescenzo, Bandra Kurla Complex (BKC), Mumbai – 400051, Maharashtra, India</p>
                <p><strong>Phone:</strong> +91-81048-60682</p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </SectionWrapper>
  )
}

export default ExpertConsent
