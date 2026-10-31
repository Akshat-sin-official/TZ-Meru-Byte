import React from 'react'
import './Awards.css'

const Awards = () => {
  const awards = [
    {
      year: '2024',
      title: 'Best Fintech Platform',
      description: 'Recognized as the leading fintech platform for innovation and customer service.'
    },
    {
      year: '2023',
      title: 'Excellence in Trading Technology',
      description: 'Awarded for outstanding contribution to trading technology and user experience.'
    },
    {
      year: '2022',
      title: 'Partner Program of the Year',
      description: 'Honored for having the most comprehensive and successful partner program in the industry.'
    },
    {
      year: '2021',
      title: 'Customer Choice Award',
      description: 'Voted by customers as the most trusted and preferred trading platform.'
    }
  ]

  return (
    <section className="awards-section">
      <div className="awards-container">
        <div className="section-header">
          <h2 className="section-title">Awards & Accolades</h2>
          <p className="section-subtitle">
            Our commitment to excellence has been recognized by industry leaders and customers alike.
          </p>
        </div>

        <div className="awards-timeline">
          {awards.map((award, index) => (
            <div key={index} className="award-item">
              <div className="award-year">{award.year}</div>
              <div className="award-content">
                <h3 className="award-title">{award.title}</h3>
                <p className="award-description">{award.description}</p>
              </div>
              {index < awards.length - 1 && <div className="award-separator"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Awards
