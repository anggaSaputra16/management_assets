'use client'

import { useState, useRef, useEffect } from 'react'
// import { BrowserQRCodeReader } from '@zxing/library'
import { Camera, X, AlertCircle } from 'lucide-react'

const QRCodeScanner = ({ onScan, onClose, isOpen }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const videoRef = useRef(null)
  const codeReader = useRef(null)

  useEffect(() => {
    if (isOpen) {
      initializeScanner()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const initializeScanner = async () => {
    try {
      codeReader.current = new BrowserQRCodeReader()
      
      // Get available video devices
      const videoDevices = await codeReader.current.listVideoInputDevices()
      setDevices(videoDevices)
      
      if (videoDevices.length > 0) {
        const defaultDevice = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        ) || videoDevices[0]
        
        setSelectedDevice(defaultDevice.deviceId)
        await startScanning(defaultDevice.deviceId)
      } else {
        setError('No camera devices found')
      }
    } catch (err) {
      console.error('Failed to initialize scanner:', err)
      setError('Failed to access camera. Please check permissions.')
    }
  }

  const startScanning = async (deviceId) => {
    try {
      setIsScanning(true)
      setError(null)

      const result = await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            handleScanResult(result.getText())
          }
          if (err && !(err instanceof Error)) {
            console.error('Scanning error:', err)
          }
        }
      )
    } catch (err) {
      console.error('Failed to start scanning:', err)
      setError('Failed to start camera')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset()
    }
    setIsScanning(false)
  }

  const handleScanResult = (data) => {
    try {
      // Try to parse as JSON (our QR codes)
      const parsed = JSON.parse(data)
      if (parsed.assetId || parsed.assetTag) {
        onScan(parsed)
        onClose()
        return
      }
    } catch {
      // If not JSON, treat as plain text
    }
    
    // Handle plain text QR codes or asset tags
    onScan({ rawData: data, assetTag: data })
    onClose()
  }

  const switchCamera = async (deviceId) => {
    stopScanning()
    setSelectedDevice(deviceId)
    await startScanning(deviceId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Scan QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={initializeScanner}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-100 rounded-lg object-cover"
                playsInline
                muted
              />
            </div>

            {devices.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Camera:
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => switchCamera(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-center text-sm text-gray-600">
              Position the QR code within the camera view to scan
            </div>
          </>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default QRCodeScanner