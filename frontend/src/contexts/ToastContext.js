'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const ToastIcon = ({ type }) => {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  }
  
  return (
    <span className={`text-lg font-bold mr-3 flex-shrink-0 ${
      type === 'success' ? 'text-green-600' :
      type === 'error' ? 'text-red-600' :
      type === 'warning' ? 'text-yellow-600' :
      'text-blue-600'
    }`}>
      {icons[type]}
    </span>
  )
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    }

    setToasts(prevToasts => [...prevToasts, newToast])

    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id)
    }, newToast.duration)

    return id
  }, [removeToast])

  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options
    })
  }, [addToast])

  const showError = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      duration: 7000, // Errors stay longer
      ...options
    })
  }, [addToast])

  const showWarning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      ...options
    })
  }, [addToast])

  const showInfo = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options
    })
  }, [addToast])

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  const getToastStyles = (type) => {
    const baseStyles = 'flex items-center p-4 mb-3 text-sm rounded-lg shadow-lg border max-w-sm w-full'
    
    switch (type) {
      case 'success':
        return `${baseStyles} text-green-800 bg-green-100 border-green-200`
      case 'error':
        return `${baseStyles} text-red-800 bg-red-100 border-red-200`
      case 'warning':
        return `${baseStyles} text-yellow-800 bg-yellow-100 border-yellow-200`
      case 'info':
        return `${baseStyles} text-blue-800 bg-blue-100 border-blue-200`
      default:
        return `${baseStyles} text-gray-800 bg-gray-100 border-gray-200`
    }
  }

  const getToastIcon = (type) => {
    return <ToastIcon type={type} />
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastStyles(toast.type)} animate-slide-in-right`}
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          {getToastIcon(toast.type)}
          <div className="flex-1">
            {toast.title && (
              <div className="font-medium mb-1">{toast.title}</div>
            )}
            <div className="text-sm">{toast.message}</div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-3 p-1 rounded-lg hover:bg-black hover:bg-opacity-10 transition-colors"
          >
            <span className="text-lg font-bold">×</span>
          </button>
        </div>
      ))}
    </div>
  )
}

// Add CSS for animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .animate-slide-in-right {
      animation: slideInRight 0.3s ease-out;
    }
  `
  document.head.appendChild(style)
}
