'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, X, AlertCircle, Camera, Smartphone, FileUp, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

const QRCodeScanner = ({ onScan, onClose, isOpen }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [useCamera, setUseCamera] = useState(true) // Default to camera
  const [hasCamera, setHasCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [availableCameras, setAvailableCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)

  // Check for camera availability when component mounts
  useEffect(() => {
    if (isOpen) {
      checkCameraAvailability();
    }
    
    return () => {
      // Clean up camera stream when component unmounts
      stopCameraStream();
    };
  }, [isOpen, checkCameraAvailability, stopCameraStream]);
  
  const stopCameraStream = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);
  
  const checkCameraAvailability = useCallback(async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setHasCamera(false);
        setUseCamera(false);
        return;
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      setAvailableCameras(cameras);
      setHasCamera(cameras.length > 0);
      
      if (cameras.length > 0) {
        setSelectedCamera(cameras[0].deviceId);
        // Don't call startCamera here to avoid circular dependency
      } else {
        setUseCamera(false);
      }
    } catch (err) {
      console.error('Error checking camera:', err);
      setHasCamera(false);
      setUseCamera(false);
    }
  }, []);

  const startCamera = async (deviceId = null) => {
    try {
      stopCameraStream(); // Stop any existing streams
      
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning for QR codes
        startQRScanning();
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Could not access camera. Please check permissions or try uploading an image instead.');
      setUseCamera(false);
    }
  };
  
  const switchCamera = () => {
    if (selectedCamera && availableCameras.length > 1) {
      const currentIndex = availableCameras.findIndex(cam => cam.deviceId === selectedCamera);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextIndex].deviceId;
      
      setSelectedCamera(nextCamera);
      startCamera(nextCamera);
    }
  };
  
  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    
    const scanInterval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) {
        clearInterval(scanInterval);
        return;
      }
      
      try {
        // Capture video frame to canvas
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get image data from canvas
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            
            try {
              // Send to backend for QR processing
              const formData = new FormData();
              formData.append('qrImage', blob, 'qr-scan.png');
              
              const response = await api.post('/qr-codes/scan', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              });
              
              if (response.data.success) {
                clearInterval(scanInterval);
                setIsScanning(false);
                
                const { qrData, asset, scanResult } = response.data.data;
                
                if (scanResult === 'asset_found' && asset) {
                  onScan({ 
                    ...qrData, 
                    asset,
                    success: true 
                  });
                  onClose();
                } else if (scanResult === 'asset_not_found') {
                  setError('Asset not found in system');
                }
              }
            } catch {
              // Ignore errors during scanning - will retry
            }
          }, 'image/jpeg', 0.8);
        }
      } catch {
        // Continue scanning
      }
    }, 1000); // Scan every second
    
    return () => clearInterval(scanInterval);
  };

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('qrImage', file)

      const response = await api.post('/qr-codes/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const { qrData, asset, scanResult } = response.data.data
        
        if (scanResult === 'asset_found' && asset) {
          onScan({ 
            ...qrData, 
            asset,
            success: true 
          })
        } else if (scanResult === 'asset_not_found') {
          onScan({ 
            ...qrData, 
            error: 'Asset not found in system',
            success: false 
          })
        } else {
          onScan({ 
            ...qrData, 
            success: true 
          })
        }
        onClose()
      }
    } catch (err) {
      console.error('Failed to scan QR code:', err)
      setError(err.response?.data?.message || 'Failed to scan QR code')
    } finally {
      setIsScanning(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleCameraChange = (e) => {
    const deviceId = e.target.value;
    setSelectedCamera(deviceId);
    startCamera(deviceId);
  };

  const stopCamera = () => {
    setIsScanning(false);
    stopCameraStream();
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 glass-button rounded-lg">
              <Camera className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Scan QR Code
              </h2>
              <p className="text-sm text-white/70 mt-1">Scan asset QR code to view details</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="glass-button p-2 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 glass-card border border-red-300 bg-red-50/50 text-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Scan Method Toggle */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-white/90 mb-3">Scan Method</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setUseCamera(true)}
                disabled={!hasCamera}
                className={`flex-1 p-3 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                  useCamera 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                    : hasCamera 
                      ? 'glass-button text-white/70 hover:text-white hover:scale-105' 
                      : 'glass-button opacity-50 cursor-not-allowed text-white/50'
                }`}
              >
                <Camera className="w-5 h-5" />
                <span>Camera</span>
              </button>
              <button
                onClick={() => setUseCamera(false)}
                className={`flex-1 p-3 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                  !useCamera 
                    ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white' 
                    : 'glass-button text-white/70 hover:text-white hover:scale-105'
                }`}
              >
                <FileUp className="w-5 h-5" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {/* Camera Selection */}
          {useCamera && hasCamera && availableCameras.length > 1 && (
            <div className="glass-card p-4">
              <label className="block text-sm font-medium text-white/90 mb-2">Camera</label>
              <select
                value={selectedCamera || ''}
                onChange={handleCameraChange}
                className="glass-input w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                {availableCameras.map((camera, index) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanner Content */}
          <div className="glass-card p-4">
            {useCamera ? (
              <div className="space-y-4">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-square">
                  {isScanning && cameraStream ? (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
                      {/* Scan overlay */}
                      <div className="absolute inset-4 border-2 border-blue-400 rounded-lg">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="animate-pulse w-4 h-4 bg-blue-400 rounded-full"></div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-white/30 mx-auto mb-3" />
                        <p className="text-white/60">
                          {hasCamera ? 'Starting camera...' : 'No camera available'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {hasCamera && (
                  <div className="flex space-x-2">
                    <button
                      onClick={isScanning ? stopCamera : () => startCamera(selectedCamera)}
                      className={`flex-1 glass-button px-4 py-3 rounded-lg font-medium transition-all hover:scale-105 ${
                        isScanning 
                          ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      }`}
                    >
                      {isScanning ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Stop Scanning</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Camera className="w-5 h-5" />
                          <span>Start Scanning</span>
                        </div>
                      )}
                    </button>
                    {availableCameras.length > 1 && (
                      <button
                        onClick={switchCamera}
                        className="glass-button p-3 rounded-lg text-white/70 hover:text-white transition-all hover:scale-105"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-50/50' 
                    : 'border-white/30 bg-white/5'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-white/50 mx-auto mb-4" />
                <p className="text-white/70 mb-2">
                  {isScanning ? 'Scanning QR Code...' : 'Drag and drop QR code image here'}
                </p>
                <p className="text-white/50 text-sm mb-4">or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="glass-button px-6 py-2 rounded-lg text-white/90 hover:text-white transition-all hover:scale-105 disabled:opacity-50"
                >
                  {isScanning ? 'Scanning...' : 'Browse Files'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center">
              <Smartphone className="w-4 h-4 mr-2 text-blue-400" />
              Instructions
            </h3>
            <div className="text-sm text-white/70 space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>{useCamera ? 'Point camera at QR code within the frame' : 'Upload a clear image of the QR code'}</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Ensure good lighting and focus</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Hold the device steady while scanning</p>
              </div>
              {!useCamera && (
                <div className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Supported formats: JPG, PNG, GIF</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="glass-button px-6 py-2 rounded-lg text-white/90 hover:text-white transition-all hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default QRCodeScanner