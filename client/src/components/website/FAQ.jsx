import React, { useState } from 'react'
import { FiInfo, FiSearch, FiUsers, FiMessageCircle, FiFileText, FiCreditCard, FiCheckCircle, FiShield, FiTarget, FiMail } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import SectionWrapper from './SectionWrapper'
import SEO from './SEO'
import SchemaMarkup from './SchemaMarkup'
import styles from './FAQ.module.css'

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const faqSections = [
    {
      title: 'About MarTechAdda',
      icon: FiInfo,
      questions: [
        {
          question: 'What is MarTechAdda?',
          answer: 'MarTechAdda is a neutral platform that helps businesses discover, connect, and engage marketing experts in a structured and transparent way.',
          details: [
            'We do not sell services, rank experts, or influence outcomes.',
            'We facilitate discovery, engagement, and deposit handling, nothing more.'
          ]
        },
        {
          question: 'Is MarTechAdda a marketing agency?',
          answer: 'No.',
          details: [
            'MarTechAdda is not an agency, employer, or service provider.',
            'All marketing services are delivered directly by independent experts or agencies you choose.'
          ]
        }
      ]
    },
    {
      title: 'Search & Discovery',
      icon: FiSearch,
      questions: [
        {
          question: 'How are experts shown in search results?',
          answer: 'Search results are:',
          details: [
            'Not AI-ranked',
            'Not sponsored',
            'Not boosted',
            'Results appear only based on your selected filters.',
            'Sorting options simply reorder results; they never change who appears.'
          ]
        },
        {
          question: 'Can experts pay to appear on top?',
          answer: 'No.',
          details: [
            'Experts cannot buy visibility, promotions, or featured listings, ever.',
            'This keeps discovery fair, predictable, and bias-free.'
          ]
        }
      ]
    },
    {
      title: 'Discussions & Hiring',
      icon: FiMessageCircle,
      questions: [
        {
          question: 'Is connecting with an expert a commitment?',
          answer: 'No.',
          details: [
            'Discussions are for clarity and alignment only.',
            'There is:',
            '• No obligation to hire',
            '• No payment',
            '• No pressure',
            'You decide when (and if) to proceed.'
          ]
        },
        {
          question: 'Why is a discussion required before quotation?',
          answer: 'Because clear alignment prevents:',
          details: [
            '• Misunderstood scope',
            '• Pricing disputes',
            '• Failed engagements',
            'A quotation can be created only after:',
            '• A discussion is completed, or',
            '• You explicitly request one'
          ]
        }
      ]
    },
    {
      title: 'Platform Neutrality & Safety',
      icon: FiShield,
      questions: [
        {
          question: 'Does MarTechAdda judge work quality or disputes?',
          answer: 'No.',
          details: [
            'MarTechAdda does not judge quality, scope, or outcomes.',
            'Our role is limited to:',
            '• Process verification',
            '• Compliance checks',
            '• Deposit execution',
            'Dispute resolution remains between the two parties.'
          ]
        },
        {
          question: 'Does MarTechAdda share my contact details?',
          answer: 'No contact details are shared without consent.',
          details: [
            'All sensitive information is encrypted and used only for:',
            '• Engagement',
            '• Compliance',
            '• Deposit handling'
          ]
        }
      ]
    },
    {
      title: 'Milestones & Approvals',
      icon: FiCheckCircle,
      questions: [
        {
          question: 'What are milestones used for?',
          answer: 'Milestones are used only as references for deposit release.',
          details: [
            'They are not:',
            '• Task trackers',
            '• Project management tools',
            '• Work progress indicators'
          ]
        },
        {
          question: 'Who controls deposit release?',
          answer: 'You do.',
          details: [
            'For each milestone, you can:',
            '• Approve & release',
            '• Request revision',
            '• Reject or raise a concern',
            'No approval = no release.'
          ]
        },
        {
          question: "What if I don't respond to a milestone submission?",
          answer: 'If there is no response within two business days, MarTechAdda may release the deposit on your behalf, provided:',
          details: [
            '• An invoice is submitted',
            '• Compliance checks are satisfied',
            'This prevents process deadlocks and protects both parties.'
          ]
        }
      ]
    },
    {
      title: 'Quotations & Deposits',
      icon: FiFileText,
      questions: [
        {
          question: 'Is a quotation the same as an invoice?',
          answer: 'No.',
          details: [
            'A quotation defines:',
            '• Scope',
            '• Milestones',
            '• Timelines',
            '• Deposit structure',
            'It does not create a payment obligation until you accept it.'
          ]
        },
        {
          question: 'Why does MarTechAdda collect a deposit instead of paying the expert directly?',
          answer: 'Deposits protect both sides.',
          details: [
            '• You retain control over fund release',
            '• Experts are protected against non-payment',
            '• Funds move only after milestone approval',
            'MarTechAdda holds deposits securely and releases them only when you approve.'
          ]
        },
        {
          question: 'Is the deposit refundable?',
          answer: 'Deposits may be refunded (fully or partially) if:',
          details: [
            '• Engagement is cancelled before milestone approval',
            '• A milestone is rejected and work is terminated',
            '• Fraud, misrepresentation, or policy violations occur',
            'Refunds depend on approved milestones and applicable policies.'
          ]
        }
      ]
    },
    {
      title: 'Fees & Payments',
      icon: FaRupeeSign,
      questions: [
        {
          question: 'Does MarTechAdda charge any fees?',
          answer: 'MarTechAdda may charge:',
          details: [
            '• Platform facilitation fees',
            '• Payment processing charges',
            'All fees (if applicable) are:',
            '• Clearly disclosed',
            '• Never hidden',
            '• Never added without visibility',
            'All payments on MarTechAdda are processed in Indian Rupees (INR).'
          ]
        },
        {
          question: 'Who handles invoicing and taxes?',
          answer: 'Invoices are raised directly by the service expert.',
          details: [
            'MarTechAdda:',
            '• Does not issue invoices',
            '• Does not collect GST on behalf of parties',
            '• Does not assume tax liability',
            'Tax compliance remains between the service seeker and expert.'
          ]
        }
      ]
    },
    {
      title: 'After Engagement',
      icon: FiTarget,
      questions: [
        {
          question: 'What happens after all milestones are completed?',
          answer: 'Once the final milestone is approved:',
          details: [
            '• Engagement is marked Completed',
            '• Deposits are fully released',
            '• Platform facilitation ends',
            'Both parties may optionally share feedback.'
          ]
        },
        {
          question: 'Is feedback mandatory?',
          answer: 'No.',
          details: [
            'Feedback is optional, neutral, and collected only after engagement completion.',
            'There are:',
            '• No ratings pressure',
            '• No public scoring',
            '• No retaliation risk'
          ]
        }
      ]
    }
  ]

  const trustPoints = [
    'No paid visibility',
    'Clear separation of roles',
    'Deposit protection',
    'Milestone-based control',
    'Transparent processes',
    'Neutral facilitation'
  ]

  const toggleFAQ = (sectionIndex, questionIndex) => {
    const key = `${sectionIndex}-${questionIndex}`
    setOpenIndex(openIndex === key ? null : key)
  }

  // Extract all FAQ questions for Schema markup
  const allFAQQuestions = faqSections.flatMap(section =>
    section.questions.map(q => ({
      question: q.question,
      answer: q.answer + (q.details ? ' ' + q.details.join(' ') : '')
    }))
  )

  return (
    <>
      <SEO
        title="Frequently Asked Questions - MarTechAdda"
        description="Find answers to common questions about MarTechAdda - how we work, pricing, deposits, expert verification, and more. Get clarity before you engage."
        canonical="https://martechadda.com/faqs"
      />
      <SchemaMarkup
        type="FAQPage"
        faq={{ questions: allFAQQuestions }}
      />
      <SectionWrapper sectionType="faq">
        <section className={styles.faqSection}>
          <div className={styles.faqContainer}>
            <div className={styles.sectionHeader}>
              <h1 className={styles.mainTitle}>MarTechAdda: Frequently Asked Questions</h1>
            </div>

            <div className={styles.faqSections}>
              {faqSections.map((section, sectionIndex) => {
                const SectionIcon = section.icon
                return (
                  <div key={sectionIndex} className={styles.faqSectionGroup}>
                    <div className={styles.sectionHeaderGroup}>
                      <SectionIcon className={styles.sectionIcon} />
                      <h2 className={styles.sectionTitle}>{section.title}</h2>
                    </div>
                    <div className={styles.faqList}>
                      {section.questions.map((faq, questionIndex) => {
                        const key = `${sectionIndex}-${questionIndex}`
                        const isOpen = openIndex === key
                        return (
                          <div
                            key={questionIndex}
                            className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}
                          >
                            <button
                              className={styles.faqQuestion}
                              onClick={() => toggleFAQ(sectionIndex, questionIndex)}
                              aria-expanded={isOpen}
                              aria-controls={`faq-answer-${key}`}
                            >
                              <span className={styles.faqQuestionText}>{faq.question}</span>
                              <span className={styles.faqIcon}>{isOpen ? '−' : '+'}</span>
                            </button>
                            <div
                              id={`faq-answer-${key}`}
                              className={styles.faqAnswer}
                              style={{
                                maxHeight: isOpen ? '1000px' : '0',
                                opacity: isOpen ? 1 : 0
                              }}
                            >
                              <p className={styles.faqAnswerText}>{faq.answer}</p>
                              {faq.details && faq.details.length > 0 && (
                                <ul className={styles.faqDetailsList}>
                                  {faq.details.map((detail, detailIndex) => (
                                    <li key={detailIndex} className={styles.faqDetailItem}>
                                      {detail}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className={styles.trustSection}>
              <div className={styles.trustHeader}>
                <FiShield className={styles.trustIcon} />
                <h2 className={styles.trustTitle}>Why Businesses Trust MarTechAdda</h2>
              </div>
              <div className={styles.trustPoints}>
                {trustPoints.map((point, index) => (
                  <div key={index} className={styles.trustPoint}>
                    <FiCheckCircle className={styles.checkIcon} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.contactSection}>
              <h3 className={styles.contactTitle}>Still have questions?</h3>
              <p className={styles.contactText}>
                Contact us at{' '}
                <a href="mailto:support@martechadda.com" className={styles.contactLink}>
                  <FiMail className={styles.mailIcon} />
                  support@martechadda.com
                </a>
              </p>
              <p className={styles.contactSubtext}>We're here to clarify, never to push.</p>
            </div>
          </div>
        </section>
      </SectionWrapper>
    </>
  )
}

export default FAQ
