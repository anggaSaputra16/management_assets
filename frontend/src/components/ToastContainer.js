'use client'

import { useToast } from '@/contexts/ToastContext'
import { setGlobalToastRef } from '@/hooks/useToast'
import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContainer = () => {
  const toastContext = useToast()
  const { toasts, removeToast } = toastContext

  // Set global reference for toast functions
  useEffect(() => {
    setGlobalToastRef(toastContext)
  }, [toastContext])

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-[#111]" />
      case 'error':
        return <XCircle className="h-5 w-5 text-[#111]" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-[#111]" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-[#111]" />
    }
  }

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-white border-black/10 text-[#111] shadow-lg'
      case 'error':
        return 'bg-white border-black/10 text-[#111] shadow-lg'
      case 'warning':
        return 'bg-white border-yellow-200 text-[#111] shadow-lg'
      case 'info':
      default:
        return 'bg-white border-black/10 text-[#111] shadow-lg'
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center p-4 rounded-lg border-2 max-w-sm w-full ${getToastStyles(toast.type)} animate-in slide-in-from-right duration-300`}
        >
          <div className="flex-shrink-0">
            {getToastIcon(toast.type)}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">
              {toast.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => removeToast(toast.id)}
              className="inline-flex text-[#333] hover:text-[#333] focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer