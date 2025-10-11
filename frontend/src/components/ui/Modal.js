'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ 
  title, 
  onClose, 
  children, 
  size = 'lg',
  showCloseButton = true 
}) {
  useEffect(() => {
    // Disable scroll when modal is open
    document.body.style.overflow = 'hidden'
    
    // Handle ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEsc)
    
    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`
          relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}
          max-h-[90vh] overflow-hidden flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}