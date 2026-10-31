import React from 'react'
import { FiCheckCircle } from 'react-icons/fi'
import styles from './StepProgressBar.module.css'

const StepProgressBar = ({ steps, currentStep, onStepClick, onSaveDraft, className = '', hideTimeEstimate = false }) => {
  return (
    <div className={`${styles.progressBar} ${className}`}>
      <div className={styles.progressContainer}>
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const isUpcoming = index > currentStep

          return (
            <React.Fragment key={index}>
              <div className={styles.stepWrapper}>
                <button
                  type="button"
                  className={`${styles.stepButton} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''} ${isUpcoming ? styles.upcoming : ''}`}
                  onClick={() => onStepClick && onStepClick(index)}
                  disabled={!onStepClick}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                >
                  <div className={styles.stepCircle}>
                    {isCompleted ? (
                      <FiCheckCircle className={styles.checkIcon} />
                    ) : (
                      <span className={styles.stepNumber}>{index + 1}</span>
                    )}
                  </div>
                  <span className={styles.stepLabel}>{step.title}</span>
                </button>
              </div>
              {index < steps.length - 1 && (
                <div className={`${styles.connector} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}>
                  <div className={styles.connectorLine}></div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
      {!hideTimeEstimate && (
        <p className={styles.timeEstimate}>
          Takes ~5–10 minutes.
        </p>
      )}
    </div>
  )
}

export default StepProgressBar
