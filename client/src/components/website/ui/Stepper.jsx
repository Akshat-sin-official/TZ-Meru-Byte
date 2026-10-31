import React from 'react'
import styles from './Stepper.module.css'

const Stepper = ({ 
  steps, 
  currentStep = 0,
  orientation = 'horizontal',
  className = '' 
}) => {
  const stepperClasses = [
    styles.stepper,
    styles[orientation],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={stepperClasses}>
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep
        const isUpcoming = index > currentStep
        const IconComponent = step.icon

        return (
          <React.Fragment key={index}>
            <div className={styles.step}>
              <div
                className={[
                  styles.stepCircle,
                  isActive ? styles.active : '',
                  isCompleted ? styles.completed : '',
                  isUpcoming ? styles.upcoming : ''
                ].filter(Boolean).join(' ')}
              >
                {isCompleted ? (
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className={styles.checkIcon}>
                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : IconComponent ? (
                  <IconComponent className={styles.stepIcon} />
                ) : (
                  <span className={styles.stepNumber}>{index + 1}</span>
                )}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepHeader}>
                  <div className={styles.stepTitle}>{step.title}</div>
                  {step.label && (
                    <span className={styles.stepLabel}>{step.label}</span>
                  )}
                </div>
                {step.description && (
                  <div className={styles.stepDescription}>{step.description}</div>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={[
                  styles.connector,
                  isCompleted ? styles.completed : ''
                ].filter(Boolean).join(' ')}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default Stepper
