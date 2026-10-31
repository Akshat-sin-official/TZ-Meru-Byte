import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const highlights = [
  'Experts are verified before being visible to businesses',
  'Discovery is based on specialization, not ad spend',
  'No sponsored rankings or pay-to-win visibility',
  'Direct connection with relevant marketing professionals',
  'Structured service classification for accurate matching',
];

const DeliverBetterMatches: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="mt-section mt-section--white">
      <div className="mt-section__inner">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mt-section__header"
        >
          <span className="mt-eyebrow">Better Matches</span>
          <h2 className="mt-h2">
            Built to remove bias and<br />improve expert-business fit.
          </h2>
          <p className="mt-lede">
            How MarTechAdda delivers better matches — five principles that shape every interaction on the platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Highlights list */}
          <div className="lg:col-span-7">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {highlights.map((text, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '20px',
                    padding: '24px 0',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      fontFamily: '"Switzer", sans-serif',
                      fontSize: '13px',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      color: '#ff2e2e',
                      minWidth: '28px',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      fontFamily: '"Switzer", sans-serif',
                      fontSize: '19px',
                      fontWeight: 500,
                      letterSpacing: '-0.3px',
                      color: '#0a0a0a',
                      lineHeight: 1.45,
                    }}
                  >
                    {text}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Why this matters card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-5"
          >
            <div
              style={{
                background: '#0a0a0a',
                borderRadius: '10px',
                padding: '40px',
                color: '#fff',
                position: 'sticky',
                top: '120px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#ff7a3d',
                  marginBottom: '20px',
                  display: 'inline-block',
                }}
              >
                Why this matters
              </span>
              <p
                style={{
                  fontFamily: '"Switzer", sans-serif',
                  fontSize: '22px',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  letterSpacing: '-0.4px',
                  color: '#fff',
                  margin: 0,
                }}
              >
                Traditional marketplaces optimize for{' '}
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>volume and ad revenue</span>. We
                optimize for{' '}
                <span
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #ff2e2e 0%, #ee7b16 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700,
                  }}
                >
                  clarity and alignment
                </span>
                .
              </p>
              <div
                style={{
                  marginTop: '32px',
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                — Neutral Discovery Engine
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DeliverBetterMatches;
