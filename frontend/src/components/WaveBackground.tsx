'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Lazy load Lottie component untuk performance
const LottieBackground = dynamic(() => import('./LottieBackground'), {
  ssr: false,
  loading: () => null
})

const WaveBackground = ({
  opacity = 0.8,
  speed = 0.5,
  className = ''
}) => {
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        console.log('🌊 Loading wave animation from /wave.json...')
        
        // Coba beberapa path yang mungkin
        const paths = ['/wave.json', '/public/wave.json', './wave.json']
        let data = null
        let lastError = null
        
        for (const path of paths) {
          try {
            console.log(`Trying path: ${path}`)
            const response = await fetch(path)
            if (response.ok) {
              data = await response.json()
              console.log(`✅ Wave animation loaded from ${path}`)
              break
            }
            lastError = new Error(`HTTP ${response.status} for ${path}`)
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err))
            console.log(`❌ Failed to load from ${path}:`, lastError.message)
          }
        }
        
        if (!data) {
          throw lastError || new Error('No valid animation data found')
        }
        
        setAnimationData(data)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('🚫 Error loading wave animation:', error)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnimation()
  }, [])

  if (isLoading) {
    return (
      <div className={`wave-background ${className}`} style={{ opacity: 0.1 }}>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.3)'
        }}>
          Loading wave animation...
        </div>
      </div>
    )
  }

  if (error || !animationData) {
    console.warn('⚠️ Wave background fallback - no animation available')
    // Fallback dengan CSS animation sederhana
    return (
      <div 
        className={`wave-background ${className}`}
        style={{
          background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
          animation: 'wave-pulse 4s ease-in-out infinite',
          opacity: opacity * 0.5
        }}
      />
    )
  }

  console.log('🎬 Rendering wave background with Lottie animation')
  return (
    <LottieBackground
      animationData={animationData}
      speed={speed}
      loop={true}
      autoplay={true}
      className={`wave-background ${className}`}
      style={{
        opacity: opacity,
        background: 'transparent',
        filter: 'blur(0.8px) saturate(0.7)',
        transform: 'scale(1.05)',
        willChange: 'transform',
      }}
    />
  )
}

export default React.memo(WaveBackground)