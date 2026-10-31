import React, { useState, useEffect } from 'react'
import Card from './Card'
import { FiCalendar, FiTarget, FiDollarSign, FiCheckCircle } from 'react-icons/fi'
import styles from './WorkspaceMock.module.css'

const WorkspaceMock = () => {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 1000)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className={styles.workspaceCard}>
      <div className={styles.workspaceHeader}>
        <h3 className={styles.workspaceTitle}>Engagement Workspace Preview</h3>
        <p className={styles.workspaceSubtitle}>This is what your workspace will look like</p>
      </div>

      <div className={styles.workspaceContent}>
        <div className={`${styles.workspaceItem} ${pulse ? styles.pulsing : ''}`}>
          <div className={styles.workspaceItemIcon}>
            <FiCalendar />
          </div>
          <div className={styles.workspaceItemContent}>
            <h4 className={styles.workspaceItemTitle}>Call Scheduling</h4>
            <p className={styles.workspaceItemText}>Schedule discovery calls with potential clients</p>
            <div className={styles.workspaceMockData}>
              <div className={styles.mockBadge}>
                <span className={styles.mockDot}></span>
                3 upcoming calls
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.workspaceItem} ${pulse ? styles.pulsing : ''}`}>
          <div className={styles.workspaceItemIcon}>
            <FiTarget />
          </div>
          <div className={styles.workspaceItemContent}>
            <h4 className={styles.workspaceItemTitle}>Milestone Quotations</h4>
            <p className={styles.workspaceItemText}>Create and manage project milestones</p>
            <div className={styles.workspaceMockData}>
              <div className={styles.mockBadge}>
                <FiCheckCircle className={styles.mockCheck} />
                2 active projects
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.workspaceItem} ${pulse ? styles.pulsing : ''}`}>
          <div className={styles.workspaceItemIcon}>
            <FiDollarSign />
          </div>
          <div className={styles.workspaceItemContent}>
            <h4 className={styles.workspaceItemTitle}>Secure Deposits</h4>
            <p className={styles.workspaceItemText}>Receive upfront deposits for projects</p>
            <div className={styles.workspaceMockData}>
              <div className={styles.mockBadge}>
                <span className={styles.mockAmount}>₹25,000</span>
                pending
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.workspaceFooter}>
        <p className={styles.workspaceNote}>
          <FiCheckCircle className={styles.noteIcon} />
          Verified profiles get 3x more matches
        </p>
      </div>
    </Card>
  )
}

export default WorkspaceMock
