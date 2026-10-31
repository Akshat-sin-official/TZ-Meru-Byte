import React from 'react'
import styles from './Badge.module.css'

const Badge = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}) => {
  const badgeClasses = [
    styles.badge,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  )
}

export default Badge
