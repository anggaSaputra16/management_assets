'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

const QRCodeDisplayHD = ({ data, size = 300, showLabel = false, className = "" }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!data || !canvasRef.current) return

    const generateQRCode = async () => {
      try {
        // Convert data to JSON string if it's an object
        const qrString = typeof data === 'string' ? data : JSON.stringify(data)
        
        // Generate QR Code with high quality settings
        await QRCode.toCanvas(canvasRef.current, qrString, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H', // High error correction for better scanning
          type: 'image/png',
          quality: 1.0,
          rendererOpts: {
            quality: 1.0
          }
        })
      } catch (err) {
        console.error('Failed to generate QR code:', err)
      }
    }

    generateQRCode()
  }, [data, size])

  if (!data) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-sm">No QR Data</span>
      </div>
    )
  }

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg shadow-sm"
        style={{
          width: size,
          height: size,
          imageRendering: 'crisp-edges',
          imageRendering: '-moz-crisp-edges',
          imageRendering: '-webkit-crisp-edges',
          imageRendering: 'pixelated'
        }}
      />
      {showLabel && data && (
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-600 font-mono break-all max-w-[300px]">
            {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
          </div>
        </div>
      )}
    </div>
  )
}

export default QRCodeDisplayHD