'use client'

import React, { useRef, useEffect, useState } from 'react'
import Lottie from 'lottie-react'

const LottieBackground = ({
  animationData,
  speed = 0.8,
  loop = true,
  autoplay = true,
  className = '',
  style = {}
}) => {
  const lottieRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (lottieRef.current && speed !== 1) {
      lottieRef.current.setSpeed(speed)
    }
  }, [speed])

  const defaultStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 1,
    pointerEvents: 'none',
    opacity: 0.8,
    mixBlendMode: 'multiply',
    ...style
  }

  if (!animationData) {
    console.warn('🚫 LottieBackground: No animation data provided')
    return null
  }

  return (
    <div className={`lottie-background ${className}`} style={defaultStyle}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid slice',
          clearCanvas: false,
          progressiveLoad: true,
          hideOnTransparent: false
        }}
        onComplete={() => {
          console.log('🎬 Lottie animation completed')
        }}
        onLoopComplete={() => {
          console.log('🔄 Lottie loop completed')
        }}
        onDOMLoaded={() => {
          console.log('✅ Lottie DOM loaded')
          setIsReady(true)
        }}
        onDataReady={() => {
          console.log('📊 Lottie data ready')
        }}
        onDataFailed={() => {
          console.error('❌ Lottie data failed to load')
        }}
      />
      {/* Debug indicator */}
      {process.env.NODE_ENV === 'development' && !isReady && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          🌊 Loading Wave...
        </div>
      )}
    </div>
  )
}

export default React.memo(LottieBackground)