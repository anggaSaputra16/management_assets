import axios from 'axios'
import { toast } from '@/hooks/useToast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export { API_BASE_URL }

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper function to get user data from localStorage
const getUserData = () => {
  if (typeof window !== 'undefined') {
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        return parsed.state?.user || null
      }
    } catch (error) {
      console.error('Error parsing auth storage:', error)
    }
  }
  return null
}

// Request interceptor to add auth token and company_id
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Auto-inject company_id for all requests
      const user = getUserData()
      if (user?.companyId) {
        // Add company_id to query params for GET requests
        if (config.method === 'get') {
          config.params = { ...config.params, companyId: user.companyId }
        }
        // Add company_id to request body for POST/PUT/PATCH requests
        else if (config.data && typeof config.data === 'object') {
          config.data = { ...config.data, companyId: user.companyId }
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data?.error) {
      toast.error(`Validation Error: ${error.response.data.error}`)
    }
    // Handle authentication errors
    else if (error.response?.status === 401) {
      toast.error('Authentication failed. Please login again.')
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    // Handle authorization errors
    else if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.')
    }
    // Handle not found errors
    else if (error.response?.status === 404) {
      toast.error('Resource not found')
    }
    // Handle server errors
    else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    // Handle network errors
    else if (error.code === 'NETWORK_ERROR' || !error.response) {
      toast.error('Network error. Please check your connection.')
    }
    // Handle other errors
    else if (error.response?.data?.message) {
      toast.error(error.response.data.message)
    }
    else {
      toast.error('An unexpected error occurred')
    }
    
    return Promise.reject(error)
  }
)

export default api
