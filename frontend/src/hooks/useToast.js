'use client'

// Re-export from ToastContext for consistency
export { useToast } from '@/contexts/ToastContext'

// Global toast functions
let globalToastRef = null

export const setGlobalToastRef = (ref) => {
  globalToastRef = ref
}

export const toast = {
  success: (message, duration = 5000) => {
    if (globalToastRef) {
      globalToastRef.showSuccess(message, { duration })
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is in your app.')
    }
  },
  error: (message, duration = 7000) => {
    if (globalToastRef) {
      globalToastRef.showError(message, { duration })
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is in your app.')
    }
  },
  warning: (message, duration = 6000) => {
    if (globalToastRef) {
      globalToastRef.showWarning(message, { duration })
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is in your app.')
    }
  },
  info: (message, duration = 5000) => {
    if (globalToastRef) {
      globalToastRef.showInfo(message, { duration })
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is in your app.')
    }
  }
}