import React from 'react'
import './Testimonials.css'

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Rajesh Kumar',
      designation: 'Authorized Partner, Mumbai',
      quote: 'Joining as an authorized partner has transformed my advisory business. The platform is intuitive, support is excellent, and my client base has grown significantly.',
      rating: 5
    },
    {
      name: 'Priya Sharma',
      designation: 'Authorized Partner, Delhi',
      quote: 'The training program was comprehensive and the ongoing support from the team is outstanding. I\'ve been able to build a sustainable advisory practice with their help.',
      rating: 5
    },
    {
      name: 'Amit Patel',
      designation: 'Authorized Partner, Bangalore',
      quote: 'The commission structure is competitive and the tools provided are top-notch. My clients appreciate the seamless experience and I appreciate the business growth.',
      rating: 5
    }
  ]

  return (
    <section id="testimonials" className="testimonials-section">
      <div className="testimonials-container">
        <div className="section-header">
          <h2 className="section-title">What Our Partners Say</h2>
          <p className="section-subtitle">
            Hear from successful authorized partners who have built thriving advisory businesses with us.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="star">★</span>
                ))}
              </div>
              <p className="testimonial-quote">"{testimonial.quote}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <span>{testimonial.name.charAt(0)}</span>
                </div>
                <div className="author-info">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-designation">{testimonial.designation}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
