import React from 'react'
import './Eligibility.css'
import { GraduationIcon, DocumentIcon, BriefcaseIcon, CheckIcon } from './Icons'

const Eligibility = () => {
  const eligibilityCriteria = [
    {
      icon: GraduationIcon,
      title: 'Educational Qualification',
      description: 'Graduate or equivalent from a recognized university. Additional certifications in finance or related fields are preferred.'
    },
    {
      icon: DocumentIcon,
      title: 'Required Documents',
      description: 'PAN card, Aadhaar card, bank statements, educational certificates, and passport-size photographs.'
    },
    {
      icon: BriefcaseIcon,
      title: 'Experience',
      description: 'Prior experience in financial services, trading, or advisory is beneficial but not mandatory. We provide comprehensive training.'
    },
    {
      icon: CheckIcon,
      title: 'Registration',
      description: 'Must complete SEBI registration requirements and comply with all regulatory guidelines for authorized persons.'
    }
  ]

  return (
    <section id="eligibility" className="eligibility-section">
      <div className="eligibility-container">
        <div className="section-header">
          <h2 className="section-title">Eligibility Criteria</h2>
          <p className="section-subtitle">
            Check if you meet the requirements to become an authorized partner and start your journey in financial advisory.
          </p>
        </div>

        <div className="eligibility-grid">
          {eligibilityCriteria.map((criteria, index) => {
            const IconComponent = criteria.icon
            return (
              <div key={index} className="eligibility-card">
                <div className="eligibility-avatar">
                  <span className="avatar-icon"><IconComponent /></span>
                </div>
                <h3 className="eligibility-title">{criteria.title}</h3>
                <p className="eligibility-description">{criteria.description}</p>
              </div>
            )
          })}
        </div>

        <div className="eligibility-cta">
          <p className="cta-text">Not sure if you're eligible?</p>
          <button className="cta-button">Contact Our Team</button>
        </div>
      </div>
    </section>
  )
}

export default Eligibility
