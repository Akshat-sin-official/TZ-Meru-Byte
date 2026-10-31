import React, { useState } from 'react'
import { FiUser, FiBriefcase, FiArrowRight, FiShield } from 'react-icons/fi'
import Button from './ui/Button'
import Card from './ui/Card'
import SectionWrapper from './SectionWrapper'
import SEO from './SEO'
import SchemaMarkup from './SchemaMarkup'
import styles from './Feedback.module.css'

const Feedback = () => {
  const [selectedRole, setSelectedRole] = useState(null) // 'seeker' or 'expert'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showTestimonialConsent, setShowTestimonialConsent] = useState(false)

  // Service Seeker → Service Expert Form Data
  const [seekerFormData, setSeekerFormData] = useState({
    scopeAdherence: '',
    commercialClarity: '',
    qualityVsCommitment: '',
    timeliness: '',
    valueForMoney: '',
    reEngagementConfidence: '',
    professionalNote: '',
    testimonialConsent: ''
  })

  // Service Expert → Service Seeker Form Data
  const [expertFormData, setExpertFormData] = useState({
    requirementReadiness: '',
    decisionApproval: '',
    scopeQuotationRespect: '',
    communicationQuality: '',
    milestoneApproval: '',
    reEngagementWillingness: '',
    internalNote: ''
  })

  // Seeker questions
  const seekerQuestions = [
    {
      section: 'Scope & Commercial Discipline',
      question: 'How well did the expert adhere to the agreed scope?',
      field: 'scopeAdherence',
      options: [
        { value: 'fully', label: 'Fully within scope' },
        { value: 'minor', label: 'Minor deviations (discussed & agreed)' },
        { value: 'frequent', label: 'Frequent scope clarifications required' }
      ]
    },
    {
      section: 'Scope & Commercial Discipline',
      question: 'How clear were quotations, milestones, and revisions?',
      field: 'commercialClarity',
      options: [
        { value: 'very-clear', label: 'Very clear & structured' },
        { value: 'mostly-clear', label: 'Mostly clear' },
        { value: 'clarification', label: 'Required repeated clarification' }
      ]
    },
    {
      section: 'Quality & Delivery',
      question: 'How did the delivered output compare to what was agreed?',
      field: 'qualityVsCommitment',
      options: [
        { value: 'met', label: 'Met expectations' },
        { value: 'exceeded', label: 'Exceeded expectations' },
        { value: 'fell-short', label: 'Fell short of expectations' }
      ]
    },
    {
      section: 'Quality & Delivery',
      question: 'How reliable was delivery against agreed timelines?',
      field: 'timeliness',
      options: [
        { value: 'on-time', label: 'Delivered on time' },
        { value: 'minor-delays', label: 'Minor delays (communicated)' },
        { value: 'delays-impacted', label: 'Delays impacted milestones' }
      ]
    },
    {
      section: 'Value & Future Confidence',
      question: 'Considering outcomes and effort, how would you describe value delivered?',
      field: 'valueForMoney',
      options: [
        { value: 'fair', label: 'Fair value' },
        { value: 'high', label: 'High value' },
        { value: 'below', label: 'Below expected value' }
      ]
    },
    {
      section: 'Value & Future Confidence',
      question: 'Would you confidently engage this expert again under similar terms?',
      field: 'reEngagementConfidence',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'maybe', label: 'Maybe' },
        { value: 'no', label: 'No' }
      ]
    },
    {
      section: 'Optional Comment',
      question: 'Professional note (optional)',
      field: 'professionalNote',
      type: 'textarea',
      placeholder: 'Share a concise professional insight future clients may find helpful.',
      maxLength: 250
    }
  ]

  // Expert questions
  const expertQuestions = [
    {
      section: 'Requirement & Decision Maturity',
      question: "How clear and realistic were the client's requirements?",
      field: 'requirementReadiness',
      options: [
        { value: 'very-clear', label: 'Very clear' },
        { value: 'needed-structuring', label: 'Needed structuring' },
        { value: 'evolved', label: 'Evolved significantly mid-engagement' }
      ]
    },
    {
      section: 'Requirement & Decision Maturity',
      question: 'How timely were approvals and decisions?',
      field: 'decisionApproval',
      options: [
        { value: 'timely', label: 'Timely & predictable' },
        { value: 'occasional', label: 'Occasional delays' },
        { value: 'follow-ups', label: 'Required follow-ups' }
      ]
    },
    {
      section: 'Commercial Integrity',
      question: 'How well did the client respect the agreed scope and quotation?',
      field: 'scopeQuotationRespect',
      options: [
        { value: 'fully', label: 'Fully respected' },
        { value: 'minor', label: 'Minor renegotiations' },
        { value: 'frequent', label: 'Frequent scope/value pushback' }
      ]
    },
    {
      section: 'Commercial Integrity',
      question: 'How professional was communication overall?',
      field: 'communicationQuality',
      options: [
        { value: 'clear', label: 'Clear & decisive' },
        { value: 'adequate', label: 'Adequate' },
        { value: 'fragmented', label: 'Fragmented / reactive' }
      ]
    },
    {
      section: 'Payment Confidence',
      question: 'How confident did you feel about milestone approvals and deposit release?',
      field: 'milestoneApproval',
      options: [
        { value: 'very-confident', label: 'Very confident' },
        { value: 'mostly-confident', label: 'Mostly confident' },
        { value: 'uncertain', label: 'Uncertain' }
      ]
    },
    {
      section: 'Payment Confidence',
      question: 'Would you work with this client again under similar terms?',
      field: 'reEngagementWillingness',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'maybe', label: 'Maybe' },
        { value: 'no', label: 'No' }
      ]
    },
    {
      section: 'Optional Comment',
      question: 'Internal note for MarTechAdda (optional)',
      field: 'internalNote',
      type: 'textarea',
      placeholder: 'Share any commercial or process insight that may help improve the platform.',
      maxLength: 250
    }
  ]

  const handleSeekerChange = (field, value) => {
    setSeekerFormData({ ...seekerFormData, [field]: value })
  }

  const handleExpertChange = (field, value) => {
    setExpertFormData({ ...expertFormData, [field]: value })
  }

  const handleNext = () => {
    const questions = selectedRole === 'seeker' ? seekerQuestions : expertQuestions
    const currentQuestion = questions[currentQuestionIndex]

    // Check if current question is answered
    const formData = selectedRole === 'seeker' ? seekerFormData : expertFormData
    if (currentQuestion.type === 'textarea') {
      // Textarea is optional, can proceed
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        handleSubmit()
      }
    } else {
      if (!formData[currentQuestion.field]) {
        alert('Please select an option before proceeding')
        return
      }
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = () => {
    if (selectedRole === 'seeker') {
      console.log('Seeker Feedback Submitted:', seekerFormData)
      setShowTestimonialConsent(true)
    } else {
      console.log('Expert Feedback Submitted:', expertFormData)
      alert('Thank you for your feedback!')
      // Reset form
      setSelectedRole(null)
      setCurrentQuestionIndex(0)
      setExpertFormData({
        requirementReadiness: '',
        decisionApproval: '',
        scopeQuotationRespect: '',
        communicationQuality: '',
        milestoneApproval: '',
        reEngagementWillingness: '',
        internalNote: ''
      })
    }
  }

  const handleTestimonialSubmit = () => {
    console.log('Feedback with testimonial consent:', { ...seekerFormData, testimonialConsent: seekerFormData.testimonialConsent })
    alert('Thank you for your feedback!')
    setShowTestimonialConsent(false)
    // Reset form
    setSelectedRole(null)
    setCurrentQuestionIndex(0)
    setSeekerFormData({
      scopeAdherence: '',
      commercialClarity: '',
      qualityVsCommitment: '',
      timeliness: '',
      valueForMoney: '',
      reEngagementConfidence: '',
      professionalNote: '',
      testimonialConsent: ''
    })
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setCurrentQuestionIndex(0)
  }

  const renderQuestion = () => {
    const questions = selectedRole === 'seeker' ? seekerQuestions : expertQuestions
    const currentQuestion = questions[currentQuestionIndex]
    const formData = selectedRole === 'seeker' ? seekerFormData : expertFormData
    const handleChange = selectedRole === 'seeker' ? handleSeekerChange : handleExpertChange

    if (currentQuestion.type === 'textarea') {
      const value = formData[currentQuestion.field] || ''
      return (
        <div className={styles.questionContainer}>
          <div className={styles.questionHeader}>
            <span className={styles.sectionBadge}>{currentQuestion.section}</span>
            <h3 className={styles.questionTitle}>{currentQuestion.question}</h3>
          </div>
          <textarea
            value={value}
            onChange={(e) => {
              if (e.target.value.length <= currentQuestion.maxLength) {
                handleChange(currentQuestion.field, e.target.value)
              }
            }}
            placeholder={currentQuestion.placeholder}
            className={styles.textarea}
            rows="4"
            maxLength={currentQuestion.maxLength}
          />
          <p className={styles.characterCount}>
            {value.length}/{currentQuestion.maxLength} characters
          </p>
        </div>
      )
    }

    return (
      <div className={styles.questionContainer}>
        <div className={styles.questionHeader}>
          <span className={styles.sectionBadge}>{currentQuestion.section}</span>
          <h3 className={styles.questionTitle}>{currentQuestion.question}</h3>
        </div>
        <div className={styles.optionsContainer}>
          {currentQuestion.options.map((option) => (
            <label
              key={option.value}
              className={`${styles.optionLabel} ${formData[currentQuestion.field] === option.value ? styles.selected : ''}`}
            >
              <input
                type="radio"
                name={currentQuestion.field}
                value={option.value}
                checked={formData[currentQuestion.field] === option.value}
                onChange={(e) => handleChange(currentQuestion.field, e.target.value)}
                className={styles.radioInput}
              />
              <span className={styles.optionText}>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  const renderTestimonialConsent = () => (
    <div className={styles.testimonialConsent}>
      <h3 className={styles.consentTitle}>Allow testimonial use?</h3>
      <div className={styles.optionsContainer}>
        <label className={`${styles.optionLabel} ${seekerFormData.testimonialConsent === 'with-name' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="testimonialConsent"
            value="with-name"
            checked={seekerFormData.testimonialConsent === 'with-name'}
            onChange={(e) => handleSeekerChange('testimonialConsent', e.target.value)}
            className={styles.radioInput}
          />
          <span className={styles.optionText}>Yes, with my business name</span>
        </label>
        <label className={`${styles.optionLabel} ${seekerFormData.testimonialConsent === 'anonymous' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="testimonialConsent"
            value="anonymous"
            checked={seekerFormData.testimonialConsent === 'anonymous'}
            onChange={(e) => handleSeekerChange('testimonialConsent', e.target.value)}
            className={styles.radioInput}
          />
          <span className={styles.optionText}>Yes, anonymous</span>
        </label>
        <label className={`${styles.optionLabel} ${seekerFormData.testimonialConsent === 'no' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="testimonialConsent"
            value="no"
            checked={seekerFormData.testimonialConsent === 'no'}
            onChange={(e) => handleSeekerChange('testimonialConsent', e.target.value)}
            className={styles.radioInput}
          />
          <span className={styles.optionText}>No</span>
        </label>
      </div>
      <p className={styles.consentMicrocopy}>
        Only short professional excerpts may be displayed.
      </p>
    </div>
  )

  const questions = selectedRole === 'seeker' ? seekerQuestions : expertQuestions
  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Feedback', path: '/feedback' }
  ]

  return (
    <SectionWrapper sectionType="faq">
      <SEO
        title="Feedback - Share Your Experience with MarTechAdda"
        description="Share your feedback about your experience with MarTechAdda. Help us improve our platform for businesses and marketing experts."
        canonical="https://martechadda.com/feedback"
      />
      <SchemaMarkup
        type="WebPage"
        breadcrumbs={breadcrumbs}
      />
      <section className={styles.feedbackSection}>
        <div className={`container ${styles.container}`}>
          {/* Role Selection Cards */}
          {!selectedRole && (
            <div className={styles.roleSelection}>
              <Card className={styles.roleCard} onClick={() => handleRoleSelect('seeker')}>
                <div className={styles.roleCardContent}>
                  <div className={styles.roleCardBadge}>For businesses</div>
                  <div className={styles.roleCardIconWrapper}>
                    <FiUser className={styles.roleCardIcon} />
                  </div>
                  <h3 className={styles.roleCardTitle}>Service Seeker</h3>
                  <p className={styles.roleCardDescription}>I'm looking for marketing experts</p>
                </div>
              </Card>

              <Card className={styles.roleCard} onClick={() => handleRoleSelect('expert')}>
                <div className={styles.roleCardContent}>
                  <div className={styles.roleCardBadge}>For experts</div>
                  <div className={styles.roleCardIconWrapper}>
                    <FiBriefcase className={styles.roleCardIcon} />
                  </div>
                  <h3 className={styles.roleCardTitle}>Service Provider</h3>
                  <p className={styles.roleCardDescription}>I'm a marketing expert</p>
                </div>
              </Card>
            </div>
          )}

          {/* Feedback Form - Step by Step */}
          {selectedRole && !showTestimonialConsent && (
            <div className={styles.formWrapper}>
              {/* Header based on selected role */}
              <div className={styles.headerSection}>
                <div className={styles.headerBadge}>
                  {selectedRole === 'seeker' ? (
                    <>
                      <span className={styles.badgeText}>SERVICE SEEKER → SERVICE EXPERT</span>
                      <span className={styles.badgeSubtext}>(Professionalism · Quality · Commercial Alignment)</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.badgeText}>SERVICE EXPERT → SERVICE SEEKER</span>
                      <span className={styles.badgeSubtext}>(Client Maturity · Decision Quality · Payment Confidence)</span>
                    </>
                  )}
                </div>
                <h1 className={styles.mainTitle}>
                  {selectedRole === 'seeker' ? 'Share Professional Feedback' : 'Share Engagement Feedback'}
                </h1>
                <p className={styles.subtitle}>
                  {selectedRole === 'seeker'
                    ? 'Your feedback helps maintain professional standards on MarTechAdda. This is not a rating system and does not affect search visibility.'
                    : 'Your feedback helps improve how businesses engage on MarTechAdda. This feedback is private and not shown publicly.'}
                </p>
              </div>

              <Card className={styles.formCard}>
                <div className={styles.progressIndicator}>
                  <span className={styles.progressText}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {renderQuestion()}

                <div className={styles.formActions}>
                  {currentQuestionIndex > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handlePrevious}
                      className={styles.actionButton}
                    >
                      Previous
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleNext}
                    className={styles.actionButton}
                  >
                    {isLastQuestion ? 'Submit Feedback' : 'Next'}
                    {!isLastQuestion && <FiArrowRight className={styles.buttonIcon} />}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Testimonial Consent (Only for Seeker) */}
          {showTestimonialConsent && (
            <div className={styles.formWrapper}>
              <Card className={styles.formCard}>
                {renderTestimonialConsent()}
                <div className={styles.formActions}>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleTestimonialSubmit}
                    className={styles.actionButton}
                    disabled={!seekerFormData.testimonialConsent}
                  >
                    Complete
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Global Footer */}
          <div className={styles.globalFooter}>
            <FiShield className={styles.footerIcon} />
            <p className={styles.footerText}>
              MarTechAdda does not use feedback for rankings, promotions, or penalties.
              Feedback is used to improve professional standards and platform processes.
            </p>
          </div>
        </div>
      </section>
    </SectionWrapper>
  )
}

export default Feedback
