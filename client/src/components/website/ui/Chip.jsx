import React from 'react'
import styles from './Chip.module.css'

const Chip = ({ 
  children, 
  selected = false,
  onClick,
  className = '',
  ...props 
}) => {
  const chipClasses = [
    styles.chip,
    selected ? styles.selected : '',
    onClick ? styles.clickable : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <span
      className={chipClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </span>
  )
}

export default Chip
