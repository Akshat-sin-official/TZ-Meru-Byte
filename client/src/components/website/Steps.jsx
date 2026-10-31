import React from 'react'
import './Steps.css'

const Steps = () => {
  const steps = [
    {
      number: '01',
      title: 'Register & Apply',
      description: 'Fill out the registration form with your details and submit required documents for verification.'
    },
    {
      number: '02',
      title: 'Document Verification',
      description: 'Our team reviews your application and verifies all submitted documents and credentials.'
    },
    {
      number: '03',
      title: 'Training & Onboarding',
      description: 'Complete comprehensive training program to understand our platform, tools, and processes.'
    },
    {
      number: '04',
      title: 'Get Approved & Start',
      description: 'Receive your partner credentials and start building your advisory business with our support.'
    }
  ]

  return (
    <section id="steps" className="steps-section">
      <div className="steps-container">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Follow these simple steps to become an authorized partner and start your journey in financial advisory.
          </p>
        </div>

        <div className="steps-wrapper">
          {steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Steps
