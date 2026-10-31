import React from 'react'
import './AuthorizedPersonInfo.css'
import { TargetIcon, BriefcaseIcon, UserIcon } from './Icons'

const AuthorizedPersonInfo = () => {
  return (
    <section className="authorized-person-section">
      <div className="authorized-person-container">
        <div className="authorized-person-content">
          <div className="authorized-person-left">
            <div className="info-badge">Who Can Apply</div>
            <h2 className="section-title">Authorized Person - Your Path to Financial Advisory</h2>
            <p className="section-description">
              An Authorized Person (AP) is a registered individual authorized by MarTechAdda to provide investment advisory services,
              facilitate trading activities, and help clients make informed financial decisions. As an AP, you act as a bridge
              between investors and the stock market, offering personalized guidance and support.
            </p>

            <div className="info-cards">
              <div className="info-card">
                <div className="info-card-icon"><TargetIcon /></div>
                <div className="info-card-content">
                  <h3 className="info-card-title">Your Role</h3>
                  <p className="info-card-text">
                    Provide investment advice, assist clients with trading, and help them achieve their financial goals through
                    strategic planning and market insights.
                  </p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-icon"><BriefcaseIcon /></div>
                <div className="info-card-content">
                  <h3 className="info-card-title">Your Benefits</h3>
                  <p className="info-card-text">
                    Earn competitive commissions, access advanced tools, receive comprehensive training, and build a sustainable
                    advisory business with our support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="authorized-person-right">
            <div className="illustration-card">
              <div className="illustration-icon"><UserIcon /></div>
              <h3 className="illustration-title">Become an Authorized Person</h3>
              <p className="illustration-text">
                Join thousands of successful financial advisors who have transformed their careers through our partnership program.
              </p>
              <div className="illustration-stats">
                <div className="stat-item">
                  <div className="stat-number">50K+</div>
                  <div className="stat-label">Active APs</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">₹500Cr+</div>
                  <div className="stat-label">Monthly Volume</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AuthorizedPersonInfo
