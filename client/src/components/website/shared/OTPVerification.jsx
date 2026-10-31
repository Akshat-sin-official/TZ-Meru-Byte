import React from 'react'
import Button from '../ui/Button'
import { FiLoader, FiCheckCircle } from 'react-icons/fi'
import styles from '../ServiceExpert.module.css'

const OTPVerification = ({
  showOTP,
  otp,
  setOtp,
  otpChannel,
  formData,
  isLoading,
  onVerify,
  onResend,
  isEmailVerified
}) => {
  if (!showOTP && !isEmailVerified) return null

  if (isEmailVerified) {
    return (
      <div className={styles.verifiedBadge}>
        <FiCheckCircle /> Email verified
      </div>
    )
  }

  return (
    <div className={styles.otpBlock}>
      <label htmlFor="otp">Enter 6-digit code</label>
      <p className={styles.helperText} style={{ marginBottom: '8px' }}>
        OTP sent to: <strong>{otpChannel === 'email' ? formData.email : formData.mobile}</strong>
      </p>
      <input
        type="text"
        id="otp"
        maxLength="6"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        className={styles.otpInput}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <Button
          variant="primary"
          size="sm"
          onClick={onVerify}
          disabled={otp.length !== 6 || isLoading}
        >
          {isLoading ? <FiLoader className={styles.spinner} /> : 'Verify & Continue'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onResend}
          disabled={isLoading}
        >
          Resend Code
        </Button>
      </div>
    </div>
  )
}

export default OTPVerification
