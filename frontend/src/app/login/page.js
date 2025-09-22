'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Building2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
})


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login, user, isHydrated } = useAuthStore()

  // Redirect if already logged in
  useEffect(() => {
    if (isHydrated && user) {
      router.replace('/dashboard')
    }
  }, [isHydrated, user, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', data)
      
      if (response.data.success) {
        const { user, token } = response.data.data
        login(user, token)
        
        // Force navigation to dashboard
        window.location.href = '/dashboard'
      } else {
        setError('root', { message: response.data.message || 'Login gagal' })
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('root', { 
        message: error.response?.data?.message || 'Gagal terhubung ke server. Pastikan backend berjalan.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while hydrating or if already logged in
  if (!isHydrated || user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 glass-card rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-gray-700" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-800">
            Asset Management System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Masuk ke akun Anda
          </p>
        </div>

        {/* Form */}
        <div className="glass-card p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-300 px-4 py-3 rounded-md text-sm">
                {errors.root.message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="glass-input w-full px-3 py-2 rounded-md placeholder-gray-500"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="glass-input w-full px-3 py-2 rounded-md placeholder-gray-500 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="glass-button w-full py-2 px-4 rounded-md text-sm font-medium text-gray-700 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Masuk...' : 'Masuk'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2024 Asset Management System By Nuii. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
