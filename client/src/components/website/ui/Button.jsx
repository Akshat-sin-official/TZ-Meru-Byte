import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Button.module.css'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  as,
  to,
  href,
  ...props 
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ')

  const Component = as || (to ? Link : (href ? 'a' : 'button'))

  const commonProps = {
    className: buttonClasses,
    onClick,
    ...props
  }

  if (Component === 'button') {
    return (
      <button
        type={type}
        disabled={disabled}
        {...commonProps}
      >
        {children}
      </button>
    )
  }

  if (Component === 'a') {
    return (
      <a
        href={href}
        {...commonProps}
      >
        {children}
      </a>
    )
  }

  if (Component === Link) {
    return (
      <Link
        to={to}
        {...commonProps}
      >
        {children}
      </Link>
    )
  }

  return (
    <Component
      {...commonProps}
    >
      {children}
    </Component>
  )
}

export default Button
