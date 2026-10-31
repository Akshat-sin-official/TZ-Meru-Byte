import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';

const steps = [
  {
    number: '01',
    title: 'Select Requirements',
  },
  {
    number: '02',
    title: 'Discover Relevant Services & Specialists',
  },
  {
    number: '03',
    title: 'Compare & Evaluate',
  },
  {
    number: '04',
    title: 'Connect & Discuss',
  },
  {
    number: '05',
    title: 'Review Quotation',
  },
  {
    number: '06',
    title: 'Engagement Activated',
  },
  {
    number: '07',
    title: 'Manage',
  },
];

const HowHiringWorks: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="mt-section mt-section--cream">
      <div className="mt-section__inner">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mt-section__header"
          style={{ marginBottom: '48px' }}
        >
          <span className="mt-eyebrow">YOUR JOURNEY</span>
          <h2 className="mt-h2" style={{ fontSize: '38px', letterSpacing: '-1.5px' }}>
            From Requirements to Engagement
          </h2>
        </motion.div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '48px 0',
          }}
          className="how-steps"
        >
          {/* Horizontal connector line for the first row */}
          <div
            style={{
              position: 'absolute',
              top: '32px',
              left: '12.5%',
              right: '12.5%',
              height: '1px',
              background: 'rgba(0,0,0,0.12)',
              zIndex: 0,
            }}
            className="how-line-row1"
          />

          {/* Horizontal connector line for the second row (centered 3 items) */}
          <div
            style={{
              position: 'absolute',
              top: '214px',
              left: '25%',
              right: '25%',
              height: '1px',
              background: 'rgba(0,0,0,0.12)',
              zIndex: 0,
            }}
            className="how-line-row2"
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="how-step-item"
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
              style={{
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
                padding: '0 16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 20px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Switzer", sans-serif',
                  fontSize: '20px',
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  color: '#0a0a0a',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                }}
              >
                {step.number}
              </div>
              <h3
                style={{
                  fontFamily: '"Switzer", sans-serif',
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  color: '#0a0a0a',
                  margin: 0,
                  lineHeight: 1.35,
                  maxWidth: '180px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                {step.title}
              </h3>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          style={{ textAlign: 'center', marginTop: '72px' }}
        >
          <Link to="/how-it-works" className="mt-btn mt-btn--primary">
            View Complete Process
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </motion.div>
      </div>

      <style>{`
        .how-step-item {
          width: 25%;
        }
        @media (max-width: 1024px) {
          .how-line-row1, .how-line-row2 { display: none !important; }
        }
        @media (max-width: 768px) {
          .how-step-item { width: 50% !important; }
          .how-steps { gap: 40px 0 !important; }
        }
        @media (max-width: 480px) {
          .how-step-item { width: 100% !important; }
        }
      `}</style>
    </section>
  );
};

export default HowHiringWorks;
