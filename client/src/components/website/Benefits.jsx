import React from 'react'
import './Benefits.css'
import { MoneyIcon, ChartIcon, GraduationIcon, HandshakeIcon, LightningIcon, BarChartIcon } from './Icons'

const Benefits = () => {
  const benefits = [
    {
      icon: MoneyIcon,
      title: 'Higher Revenue Potential',
      description: 'Earn competitive commissions and unlock multiple income streams through our comprehensive partner program.'
    },
    {
      icon: ChartIcon,
      title: 'Advanced Trading Tools',
      description: 'Access cutting-edge trading platforms and analytical tools to serve your clients better.'
    },
    {
      icon: GraduationIcon,
      title: 'Training & Support',
      description: 'Get comprehensive training, marketing materials, and dedicated support to grow your business.'
    },
    {
      icon: HandshakeIcon,
      title: 'Brand Recognition',
      description: 'Leverage our trusted brand name and reputation to attract and retain clients.'
    },
    {
      icon: LightningIcon,
      title: 'Quick Onboarding',
      description: 'Fast-track your partnership with streamlined registration and verification process.'
    },
    {
      icon: BarChartIcon,
      title: 'Real-time Analytics',
      description: 'Track your performance, commissions, and client metrics with detailed dashboard insights.'
    }
  ]

  return (
    <section id="benefits" className="benefits-section">
      <div className="benefits-container">
        <div className="section-header">
          <h2 className="section-title">Why Partner With Us?</h2>
          <p className="section-subtitle">
            Discover the advantages of becoming an authorized partner and take your financial advisory business to the next level.
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon
            return (
              <div key={index} className="benefit-card">
                <div className="benefit-icon"><IconComponent /></div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Benefits
