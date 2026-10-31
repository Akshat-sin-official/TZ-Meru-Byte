import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';

const principles = [
  {
    title: 'Requirement-First',
    desc: 'Start with your guided business requirements, discovering marketing specialists aligned with your specific goals.',
  },
  {
    title: 'Compare & Evaluate',
    desc: 'Assess verified capabilities and compare experts on a neutral platform with no paid rankings or placement bias.',
  },
  {
    title: 'Hire with Confidence',
    desc: 'Align on scope and clear expectations through structured communication before any commitment begins.',
  },
];

const Solution: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} id="solution" className="mt-section mt-section--cream">
      <div className="mt-section__inner">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          {/* Left — Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6"
          >
            <span className="mt-eyebrow">The Solution</span>
            <h2 className="mt-h2">
              A clearer way to discover and hire marketing expertise.
            </h2>
            <p className="mt-lede" style={{ marginLeft: 0, marginRight: 0 }}>
              MarTechAdda is designed for{' '}
              <span style={{ color: '#0a0a0a', fontWeight: 600 }}>
                clarity before commitment
              </span>
              .
            </p>
          </motion.div>

          {/* Right — Principles + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-6"
            style={{ paddingTop: '8px' }}
          >
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px' }}>
              {principles.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '20px 0',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: '4px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#0a0a0a',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span
                      style={{
                        fontFamily: '"Switzer", sans-serif',
                        fontSize: '18px',
                        fontWeight: 700,
                        letterSpacing: '-0.3px',
                        color: '#0a0a0a',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14.5px',
                        color: '#6a6a6a',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.desc}
                    </span>
                  </div>
                </motion.li>
              ))}
            </ul>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                lineHeight: 1.7,
                color: '#6a6a6a',
                marginBottom: '32px',
              }}
            >
              While most platforms optimise for volume and speed, we optimise for alignment and confidence.{' '}
              <span style={{ color: '#0a0a0a', fontWeight: 500 }}>
                No paid rankings. No featured listings. Discovery stays neutral.
              </span>
            </p>

            <Link to="/experts" className="mt-btn mt-btn--primary">
              See how we approach this differently
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Solution;
