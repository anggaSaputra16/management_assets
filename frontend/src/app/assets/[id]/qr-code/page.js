'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import QRCodeDisplayHD from '@/components/QRCodeDisplayHD'
import QRCodeScanner from '@/components/QRCodeScanner'
import { useAssetStore } from '@/stores'
import { useToast } from '@/contexts/ToastContext'
import { 
  ArrowLeft, 
  QrCode, 
  Camera, 
  Download,
  Printer,
  RefreshCw
} from 'lucide-react'

export default function AssetQRCodePage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [showScanner, setShowScanner] = useState(false)
  const [qrCodeData, setQrCodeData] = useState(null)
  const [generatingQR, setGeneratingQR] = useState(false)
  
  const { 
    currentAsset, 
    loading: assetLoading, 
    fetchAsset 
  } = useAssetStore()

  useEffect(() => {
    if (params.id) {
      fetchAsset(params.id)
    }
  }, [params.id, fetchAsset])

  useEffect(() => {
    if (currentAsset && currentAsset.qrCode) {
      try {
        setQrCodeData(JSON.parse(currentAsset.qrCode))
      } catch (error) {
        console.error('Failed to parse QR code data:', error)
        // If QR code exists but can't be parsed, show empty state
        setQrCodeData(null)
      }
    }
  }, [currentAsset])

  const handleGenerateQR = async () => {
    setGeneratingQR(true)
    try {
      const response = await fetch(`/api/qr-codes/generate/${params.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }

      const data = await response.json()
      if (data.success) {
        setQrCodeData(data.data.qrData)
        // Refresh asset data to get updated QR code
        await fetchAsset(params.id)
        showToast('QR Code generated successfully', 'success')
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      showToast('Failed to generate QR code', 'error')
    } finally {
      setGeneratingQR(false)
    }
  }

  const handleDownloadQR = async () => {
    if (!qrCodeData) return

    try {
      const response = await fetch(`/api/qr-codes/download/${params.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download QR code')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `asset-${currentAsset.assetTag}-qr.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast('QR Code downloaded successfully', 'success')
    } catch (error) {
      console.error('Failed to download QR code:', error)
      showToast('Failed to download QR code', 'error')
    }
  }

  const handlePrintQR = () => {
    if (!qrCodeData) return

    const printWindow = window.open('', '_blank')
    const qrCodeElement = document.getElementById('qr-code-display')
    
    if (qrCodeElement && printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Asset QR Code - ${currentAsset.assetTag}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .qr-container {
              width: 26cm;
              height: 12cm;
              border: 4px solid #000;
              padding: 2cm;
              display: flex;
              background: white;
              box-sizing: border-box;
              align-items: center;
              justify-content: space-between;
            }
            .left-section {
              flex: 1;
              padding-right: 3cm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              height: 100%;
            }
            .right-section {
              width: 8cm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .company-header {
              font-size: 32px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 1.5cm;
              text-transform: uppercase;
              letter-spacing: 3px;
            }
            .asset-name {
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 0.5cm;
              line-height: 1.2;
            }
            .asset-category {
              font-size: 18px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 1.5cm;
            }
            .asset-details {
              margin-top: auto;
            }
            .detail-item {
              display: flex;
              margin-bottom: 0.6cm;
              font-size: 16px;
              align-items: center;
            }
            .detail-label {
              font-weight: bold;
              color: #374151;
              width: 5cm;
              display: inline-block;
            }
            .detail-value {
              color: #4b5563;
              flex: 1;
            }
            .qr-code-section {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .qr-code-img {
              width: 7cm;
              height: 7cm;
              border: 3px solid #e5e7eb;
              border-radius: 8px;
              image-rendering: -moz-crisp-edges;
              image-rendering: -webkit-crisp-edges;
              image-rendering: pixelated;
              image-rendering: crisp-edges;
              background: white;
              padding: 3mm;
              box-sizing: border-box;
            }
            .asset-tag {
              font-size: 14px;
              color: #6b7280;
              margin-top: 0.5cm;
              font-family: 'Courier New', monospace;
              font-weight: bold;
              text-align: center;
              letter-spacing: 2px;
            }
            .scan-instruction {
              font-size: 11px;
              color: #9ca3af;
              margin-top: 0.3cm;
              text-align: center;
              line-height: 1.4;
              font-weight: 500;
            }
            @media print {
              body { 
                margin: 0 !important; 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .qr-container { 
                page-break-inside: avoid;
                border: 3px solid #000 !important;
                box-shadow: none !important;
              }
              .qr-code-img {
                border: 2px solid #000 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="left-section">
              <div class="company-header">Asset Management System</div>
              <div class="asset-name">${currentAsset.name}</div>
              <div class="asset-category">${currentAsset.category?.name || 'Equipment'}</div>
              
              <div class="asset-details">
                <div class="detail-item">
                  <span class="detail-label">Asset ID:</span>
                  <span class="detail-value">${currentAsset.assetTag}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Serial Number:</span>
                  <span class="detail-value">${currentAsset.serialNumber || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">${currentAsset.location?.name || 'Not assigned'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Department:</span>
                  <span class="detail-value">${currentAsset.department?.name || 'Not assigned'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value">${currentAsset.status}</span>
                </div>
                ${currentAsset.poNumber ? `
                <div class="detail-item">
                  <span class="detail-label">PO Number:</span>
                  <span class="detail-value">${currentAsset.poNumber}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="right-section">
              <div class="qr-code-section">
                ${qrCodeElement.innerHTML.replace(/width="[^"]*"/g, '').replace(/height="[^"]*"/g, '').replace(/<svg/, '<svg class="qr-code-img" width="113.385826771654" height="113.385826771654"')}
                <div class="asset-tag">${currentAsset.assetTag}</div>
                <div class="scan-instruction">
                  Scan QR code for<br>
                  asset details
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleScanResult = (result) => {
    console.log('QR Code scanned:', result)
    if (result.success && result.asset) {
      showToast(`Scanned asset: ${result.asset.name}`, 'success')
    } else if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('QR Code scanned successfully', 'success')
    }
  }

  if (assetLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentAsset) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Asset Not Found</h2>
          <p className="text-gray-600">The asset you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Asset QR Code</h1>
              <p className="text-gray-600">{currentAsset.name} - {currentAsset.assetTag}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan QR Code
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Display */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Asset QR Code
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleGenerateQR}
                  disabled={generatingQR}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${generatingQR ? 'animate-spin' : ''}`} />
                  {generatingQR ? 'Generating...' : 'Regenerate'}
                </button>
              </div>
            </div>

            {qrCodeData ? (
              <div className="text-center space-y-4">
                <div id="qr-code-display">
                  <QRCodeDisplayHD
                    data={qrCodeData}
                    size={400}
                    showLabel={true}
                  />
                </div>
                
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={handlePrintQR}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Code Generated</h3>
                <p className="text-gray-600 mb-4">Generate a QR code for this asset to enable quick scanning and identification.</p>
                <button
                  onClick={handleGenerateQR}
                  disabled={generatingQR}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mx-auto"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {generatingQR ? 'Generating...' : 'Generate QR Code'}
                </button>
              </div>
            )}
          </div>

          {/* Asset Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Asset Tag:</span>
                <span className="text-sm text-gray-900">{currentAsset.assetTag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <span className="text-sm text-gray-900">{currentAsset.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Category:</span>
                <span className="text-sm text-gray-900">{currentAsset.category?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  currentAsset.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                  currentAsset.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                  currentAsset.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentAsset.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Location:</span>
                <span className="text-sm text-gray-900">{currentAsset.location?.name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Department:</span>
                <span className="text-sm text-gray-900">{currentAsset.department?.name || 'Not assigned'}</span>
              </div>
              {currentAsset.serialNumber && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Serial Number:</span>
                  <span className="text-sm text-gray-900">{currentAsset.serialNumber}</span>
                </div>
              )}
              {currentAsset.poNumber && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">PO Number:</span>
                  <span className="text-sm text-gray-900">{currentAsset.poNumber}</span>
                </div>
              )}
            </div>

            {qrCodeData && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">QR Code Data</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(qrCodeData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">QR Code Usage Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use the &quot;Download&quot; button to save the QR code as an image file</li>
            <li>• Use the &quot;Print&quot; button to print a label with the QR code and asset information</li>
            <li>• Scan QR codes with the &quot;Scan QR Code&quot; button to quickly access asset information</li>
            <li>• The QR code contains asset ID, tag, and basic information for quick identification</li>
            <li>• Print and attach QR code labels to physical assets for easy tracking</li>
          </ul>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        isOpen={showScanner}
        onScan={handleScanResult}
        onClose={() => setShowScanner(false)}
      />
    </DashboardLayout>
  )
}