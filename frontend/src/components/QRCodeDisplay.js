'use client'

import { useState, useEffect } from 'react'
import { QrCode, Printer, X } from 'lucide-react'
import Image from 'next/image'

const QRCodeDisplay = ({ asset, isOpen, onClose }) => {
  const [qrCodeImage, setQRCodeImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateQRCode = async () => {
    if (!asset) return

    setLoading(true)
    setError('')

    try {
      // Get high-quality QR code from backend for display
      const assetService = await import('@/lib/services/assetService').then(m => m.assetService);
      // Use high resolution for better quality (300px will be resized for print)
      const response = await assetService.generateQRCode(asset.id, 'png', 300);
      
      // Convert blob to data URL
      const blob = new Blob([response.data], { type: 'image/png' })
      const dataURL = URL.createObjectURL(blob)
      setQRCodeImage(dataURL)
    } catch (err) {
      console.error('Failed to generate QR code:', err)
      setError('Failed to generate QR code: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && asset) {
      generateQRCode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, asset])

  const printQRCode = async () => {
    if (!asset) return
    
    try {
      // Get a specific print-quality QR code (150px for better quality)
      const assetService = await import('@/lib/services/assetService').then(m => m.assetService);
      const printResponse = await assetService.generateQRCode(asset.id, 'png', 150);
      const printBlob = new Blob([printResponse.data], { type: 'image/png' })
      const printDataURL = URL.createObjectURL(printBlob)
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      
      // Create HTML content for the business card style print
      const printContent = `
        <html>
          <head>
            <title>Asset Card - ${asset?.assetTag || 'Asset'}</title>
            <style>
              @page {
                size: A4;
                margin: 1cm;
              }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
              }
              .business-card {
                width: 8.5cm;
                height: 5.5cm;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                display: flex;
                padding: 10px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                margin-bottom: 1cm;
                box-sizing: border-box;
              }
              .left-section {
                flex: 1;
                padding-right: 10px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .right-section {
                width: 2.2cm;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }
              .asset-name {
                font-size: 16px;
                font-weight: bold;
                color: #333;
                margin-bottom: 4px;
                line-height: 1.2;
              }
              .asset-role {
                font-size: 11px;
                color: #666;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .contact-info {
                margin-top: auto;
              }
              .contact-item {
                display: flex;
                align-items: center;
                font-size: 9px;
                color: #555;
                margin-bottom: 3px;
                line-height: 1.3;
              }
              .contact-icon {
                width: 10px;
                height: 10px;
                margin-right: 5px;
                flex-shrink: 0;
              }
              .qr-code {
                width: 2cm;
                height: 2cm;
                border: 1px solid #eee;
                border-radius: 4px;
                image-rendering: -moz-crisp-edges;
                image-rendering: -webkit-crisp-edges;
                image-rendering: pixelated;
                image-rendering: crisp-edges;
              }
              .asset-tag {
                font-size: 8px;
                color: #666;
                margin-top: 5px;
                font-family: monospace;
                text-align: center;
              }
              .company-name {
                font-size: 12px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 2px;
              }
              @media print {
                body {
                  background: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .business-card {
                  border: 1px solid #000 !important;
                  box-shadow: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="business-card">
              <div class="left-section">
                <div>
                  <div class="company-name">ASSET MANAGEMENT SYSTEM</div>
                  <div class="asset-name">${asset?.name || 'Asset Name'}</div>
                  <div class="asset-role">${asset?.category?.name || 'Asset Category'}</div>
                </div>
                <div class="contact-info">
                  <div class="contact-item">
                    <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    ID: ${asset?.assetTag || 'N/A'}
                  </div>
                  <div class="contact-item">
                    <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    Serial: ${asset?.serialNumber || 'N/A'}
                  </div>
                  <div class="contact-item">
                    <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Location: ${asset?.location?.name || 'N/A'}
                  </div>
                  <div class="contact-item">
                    <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 16H9V7h9v14z"/>
                    </svg>
                    ${asset?.assignedTo ? `Assigned: ${asset.assignedTo.firstName} ${asset.assignedTo.lastName}` : 'Department: ' + (asset?.department?.name || 'N/A')}
                  </div>
                </div>
              </div>
              <div class="right-section">
                <img src="${printDataURL}" alt="QR Code" class="qr-code" />
                <div class="asset-tag">${asset?.assetTag || 'NO-TAG'}</div>
              </div>
            </div>
            <script>
              // Auto print when loaded
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 1000);
                }, 500);
              };
            </script>
          </body>
        </html>
      `
      
      // Write the content to the new window and trigger print
      printWindow.document.open()
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(printDataURL)
      }, 5000)
      
    } catch (error) {
      console.error('Print error:', error)
      setError('Failed to prepare print version')
    }
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
            {asset?.assignedTo && (
              <p className="text-xs text-gray-500 mt-1">
                Assigned to: {asset.assignedTo.firstName} {asset.assignedTo.lastName}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
              {error}
            </div>
          )}          <div className="mb-6">
            {loading ? (
              <div className="w-full h-64 glass-button rounded-lg flex items-center justify-center mx-auto">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
              </div>
            ) : qrCodeImage ? (
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-4">High Resolution QR Code:</p>
                <div className="border-2 border-gray-300 p-4 rounded-lg shadow-lg bg-white">
                  <Image
                    src={qrCodeImage}
                    alt="QR Code Preview"
                    width={280}
                    height={280}
                    className="mx-auto"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center max-w-sm">
                  This QR code contains asset information including tag, name, and assigned user. 
                  When printed, it will be exactly 2cm x 2cm for optimal scanning.
                </p>
              </div>
            ) : (
              <div className="w-full h-64 glass-button rounded-lg flex items-center justify-center mx-auto">
                <button
                  onClick={generateQRCode}
                  className="glass-button px-6 py-3 text-gray-700 rounded-lg hover:scale-105 transition-transform"
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
              onClick={printQRCode}
              className="glass-button px-4 py-2 text-gray-700 rounded-lg hover:scale-105 transition-transform flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
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
