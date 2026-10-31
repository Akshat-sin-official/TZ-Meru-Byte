import React from 'react'
import styles from './Card.module.css'

const Card = ({ 
  children, 
  variant = 'default',
  className = '',
  onClick,
  ...props 
}) => {
  const cardClasses = [
    styles.card,
    styles[variant],
    className,
    onClick ? styles.clickable : ''
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
