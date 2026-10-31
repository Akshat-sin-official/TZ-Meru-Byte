import React from 'react'
import { Link } from 'react-router-dom'
import logoImage from '/logo.png'
import styles from './Logo.module.css'

const Logo = ({ showTagline = false, className = '', linkTo = '/', variant = 'default' }) => {
  const variantClassName = variant === 'compact'
    ? styles.compact
    : variant === 'footer'
      ? styles.footer
      : ''

  const LogoContent = () => (
    <div className={`${styles.logo} ${variantClassName} ${className}`.trim()}>
      <img
        src={logoImage}
        alt="MarTechAdda Logo"
        className={styles.logoImage}
        loading="eager"
        decoding="async"
      />

      {/* Tagline (optional) */}
      {showTagline && (
        <div className={styles.logoTagline}>
          <span className={styles.taglineFind}>Find</span>
          <span className={styles.taglineSeparator}>-</span>
          <span className={styles.taglineHire}>Hire</span>
          <span className={styles.taglineSeparator}>-</span>
          <span className={styles.taglineManage}>Manage</span>
        </div>
      )}
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className={styles.logoLink}>
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}

export default Logo
