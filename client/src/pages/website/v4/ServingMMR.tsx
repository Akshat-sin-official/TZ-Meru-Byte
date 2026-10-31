import React from 'react';
import { motion } from 'framer-motion';

const ServingMMR: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        background: '#fcfbfa',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '28px 24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        style={{
          maxWidth: '1080px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#ff2e2e',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#ff2e2e',
              boxShadow: '0 0 0 3px rgba(255, 46, 46, 0.18)',
              animation: 'mtPulse 2s ease-in-out infinite',
            }}
          />
          Live
        </span>
        <span style={{ width: '1px', height: '14px', background: 'rgba(0,0,0,0.12)' }} />
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#4a4a4a',
            margin: 0,
            letterSpacing: '-0.1px',
          }}
        >
          Actively operating across the{' '}
          <span style={{ color: '#0a0a0a', fontWeight: 700 }}>
            Mumbai Metropolitan Region (MMR)
          </span>
        </p>
      </motion.div>

      <style>{`
        @keyframes mtPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ServingMMR;
