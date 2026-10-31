import React from 'react'

const RequiredLabel = ({ htmlFor, children, required = true, ...props }) => {
  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} {...props}>
        {children}
        {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
      </label>
    )
  }
  return (
    <label {...props}>
      {children}
      {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
    </label>
  )
}

export default RequiredLabel
