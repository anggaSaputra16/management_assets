'use client'

import { useState, useEffect, useCallback } from 'react'
import { QrCode, Download, X } from 'lucide-react'
import QRCode from 'qrcode'
import Image from 'next/image'

const QRCodeDisplay = ({ asset, isOpen, onClose }) => {
  const [qrCodeImage, setQRCodeImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && asset) {
      generateQRCode()
    }
  }, [isOpen, asset, generateQRCode])

  const generateQRCode = useCallback(async () => {
    if (!asset) return

    setLoading(true)
    setError('')

    try {
      const qrData = {
        assetId: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        serialNumber: asset.serialNumber,
        type: 'ASSET',
        timestamp: new Date().toISOString(),
        scanUrl: `${window.location.origin}/assets/${asset.id}`
      }

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      setQRCodeImage(qrCodeDataURL)
    } catch (err) {
      console.error('Failed to generate QR code:', err)
      setError('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }, [asset])

  const downloadQRCode = () => {
    if (!qrCodeImage) return

    const link = document.createElement('a')
    link.download = `qr-code-${asset.assetTag}.png`
    link.href = qrCodeImage
    link.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Asset QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center">
          <div className="mb-4">
            <h4 className="font-medium text-gray-800">{asset?.name}</h4>
            <p className="text-sm text-gray-600">{asset?.assetTag}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            {loading ? (
              <div className="w-64 h-64 glass-button rounded-lg flex items-center justify-center mx-auto">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
              </div>
            ) : qrCodeImage ? (
              <Image
                src={qrCodeImage}
                alt="QR Code"
                width={256}
                height={256}
                className="mx-auto border border-gray-200 rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-64 h-64 glass-button rounded-lg flex items-center justify-center mx-auto">
                <button
                  onClick={generateQRCode}
                  className="glass-button px-4 py-2 text-gray-700 rounded-lg hover:scale-105 transition-transform"
                >
                  Generate QR Code
                </button>
              </div>
            )}
          </div>

          {qrCodeImage && (
            <div className="text-xs text-gray-500 mb-4">
              Scan this QR code to quickly view asset details
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          {qrCodeImage && (
            <button
              onClick={downloadQRCode}
              className="glass-button px-4 py-2 text-gray-700 rounded-lg hover:scale-105 transition-transform flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          )}
          <button
            onClick={onClose}
            className="glass-button px-4 py-2 text-gray-700 rounded-lg hover:scale-105 transition-transform"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default QRCodeDisplay
