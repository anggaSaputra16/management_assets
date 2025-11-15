const express = require('express')
const { prisma } = require('../config/database')
const { authenticate, authorize, validateCompany } = require('../middleware/auth')
const QRCode = require('qrcode')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Jimp = require('jimp')
const QrCodeReader = require('qrcode-reader')

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/qrcodes')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

// Generate QR code data for asset
const generateAssetQRData = (asset) => {
  return JSON.stringify({
    id: asset.id,
    assetTag: asset.assetTag,
    name: asset.name,
    assignedEmployee: asset.assignedEmployee ? `${asset.assignedEmployee.firstName} ${asset.assignedEmployee.lastName}`.trim() : null,
    type: 'asset',
    timestamp: new Date().toISOString()
  })
}

// GET /api/qr-codes/asset/:id - Generate QR code for asset
router.get('/asset/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { format = 'png', size = 200 } = req.query

    // Find the asset
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
          categories: { select: { name: true } },
          assignedEmployee: { select: { firstName: true, lastName: true } }
        }
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      })
    }

    // Generate QR code data
    const qrData = generateAssetQRData(asset)

    // Generate QR code with high quality for print
    const qrCodeOptions = {
      width: parseInt(size),
      margin: 1, // Reduced margin for better use of space
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H', // High error correction for better scanning at small sizes
      type: 'png',
      quality: 1.0, // Maximum quality
      rendererOpts: {
        quality: 1.0 // Maximum quality
      }
    }

    if (format === 'svg') {
      const qrCodeSVG = await QRCode.toString(qrData, { ...qrCodeOptions, type: 'svg' })
      res.setHeader('Content-Type', 'image/svg+xml')
      res.send(qrCodeSVG)
    } else {
      // Generate at high resolution first, then resize if needed
      const highResSize = Math.max(parseInt(size), 300) // Minimum 300px for quality
      const highResOptions = { ...qrCodeOptions, width: highResSize }
      
      let qrCodeBuffer = await QRCode.toBuffer(qrData, highResOptions)
      
      // If requested size is smaller than high-res, resize using Jimp for better quality
      if (parseInt(size) < highResSize) {
        try {
          const image = await new Promise((resolve, reject) => {
            Jimp.read(qrCodeBuffer, (err, image) => {
              if (err) reject(err);
              else resolve(image);
            });
          });
          
          await new Promise((resolve, reject) => {
            image.resize(parseInt(size), parseInt(size), Jimp.RESIZE_NEAREST_NEIGHBOR, (err, resizedImage) => {
              if (err) reject(err);
              else resolve(resizedImage);
            });
          });
          
          qrCodeBuffer = await new Promise((resolve, reject) => {
            image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
              if (err) reject(err);
              else resolve(buffer);
            });
          });
        } catch (jimpError) {
          console.warn('Jimp resize failed, using original high-res buffer:', jimpError.message);
          // Continue with high-res buffer if Jimp fails
        }
      }
      
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
      res.send(qrCodeBuffer)
    }

    // Update asset with QR code generation info
    await prisma.asset.update({
      where: { id },
      data: {
        qrCode: qrData
      }
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code'
    })
  }
})

// POST /api/qr-codes/asset/:id/download - Generate downloadable QR code with asset info
router.post('/asset/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { 
      includeInfo = true, 
      size = 300, 
      format = 'png',
      title,
      subtitle 
    } = req.body

    // Find the asset
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        categories: { select: { name: true } },
        locations: { select: { name: true } },
        departments: { select: { name: true } }
      }
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      })
    }

    // Generate QR code data
    const qrData = generateAssetQRData(asset)

    if (!includeInfo) {
      // Simple QR code only
      const qrCodeBuffer = await QRCode.toBuffer(qrData, {
        width: parseInt(size),
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Disposition', `attachment; filename="qr-${asset.assetTag}.png"`)
      res.send(qrCodeBuffer)
      return
    }

    // Create QR code with asset information
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2
    })

    // Create a canvas-like structure with asset info
    const canvas = await new Promise((resolve, reject) => {
      Jimp.create(400, 500, '#ffffff', (err, image) => {
        if (err) reject(err);
        else resolve(image);
      });
    });
    
    // Load QR code
    const qrImage = await new Promise((resolve, reject) => {
      Jimp.read(Buffer.from(qrCodeDataURL.split(',')[1], 'base64'), (err, image) => {
        if (err) reject(err);
        else resolve(image);
      });
    });
    
    // Compose the image
    canvas.composite(qrImage, 100, 50)

    // Add text (simplified - in production you might want to use a proper image library with text support)
    const buffer = await new Promise((resolve, reject) => {
      canvas.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Disposition', `attachment; filename="qr-label-${asset.assetTag}.png"`)
    res.send(buffer)

    // Update asset with QR code generation info
    await prisma.asset.update({
      where: { id },
      data: {
        qrCode: qrData
      }
    })
  } catch (error) {
    console.error('Error generating downloadable QR code:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate downloadable QR code'
    })
  }
})

// POST /api/qr-codes/scan - Scan and decode QR code
router.post('/scan', authenticate, upload.single('qrImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      })
    }

    // Read the uploaded image
    const image = await new Promise((resolve, reject) => {
      Jimp.read(req.file.path, (err, image) => {
        if (err) reject(err);
        else resolve(image);
      });
    });
    
    // Create QR code reader
    const qr = new QrCodeReader()
    
    // Convert image to the format expected by qrcode-reader
    const imageData = {
      data: new Uint8ClampedArray(image.bitmap.data),
      width: image.bitmap.width,
      height: image.bitmap.height
    }

    // Scan QR code
    const result = await new Promise((resolve, reject) => {
      qr.callback = (err, value) => {
        if (err) {
          reject(err)
        } else {
          resolve(value)
        }
      }
      qr.decode(imageData)
    })

    // Clean up uploaded file
    fs.unlinkSync(req.file.path)

    // Parse QR code data
    let qrData
    try {
      qrData = JSON.parse(result.result)
    } catch (parseError) {
      // If not JSON, treat as plain text
      qrData = { data: result.result, type: 'unknown' }
    }

    // If it's an asset QR code, fetch additional asset information
    if (qrData.type === 'asset' && qrData.id) {
      const asset = await prisma.asset.findUnique({
        where: { id: qrData.id },
        include: {
          categories: { select: { name: true } },
          locations: { select: { name: true } },
          departments: { select: { name: true } },
          assignedEmployee: { select: { firstName: true, lastName: true } },
          vendors: { select: { name: true } }
        }
      })

      if (asset) {
        res.json({
          success: true,
          data: {
            qrData,
            asset,
            scanResult: 'asset_found'
          },
          message: 'QR code scanned successfully - Asset found'
        })
      } else {
        res.json({
          success: true,
          data: {
            qrData,
            scanResult: 'asset_not_found'
          },
          message: 'QR code scanned successfully - Asset not found in system'
        })
      }
    } else {
      res.json({
        success: true,
        data: {
          qrData,
          scanResult: 'generic'
        },
        message: 'QR code scanned successfully'
      })
    }
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    console.error('Error scanning QR code:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to scan QR code. Please ensure the image contains a valid QR code.'
    })
  }
})

// POST /api/qr-codes/verify - Verify QR code data against asset
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { qrData, assetId } = req.body

    if (!qrData || !assetId) {
      return res.status(400).json({
        success: false,
        message: 'QR data and asset ID are required'
      })
    }

    // Parse QR data if it's a string
    let parsedQRData
    try {
      parsedQRData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR data format'
      })
    }

    // Find the asset
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        categories: { select: { name: true } }
      }
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      })
    }

    // Verify QR data matches asset
    const isValid = (
      parsedQRData.id === asset.id &&
      parsedQRData.assetTag === asset.assetTag &&
      parsedQRData.type === 'asset'
    )

    res.json({
      success: true,
      data: {
        isValid,
        asset: isValid ? asset : null,
        qrData: parsedQRData
      },
      message: isValid ? 'QR code is valid for this asset' : 'QR code does not match this asset'
    })
  } catch (error) {
    console.error('Error verifying QR code:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to verify QR code'
    })
  }
})

// GET /api/qr-codes/batch/assets - Generate QR codes for multiple assets
router.get('/batch/assets', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { assetIds, categoryId, status } = req.query

    let where = {}
    if (assetIds) {
      where.id = { in: assetIds.split(',') }
    }
    if (categoryId) {
      where.categoryId = categoryId
    }
    if (status) {
      where.status = status
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        categories: { select: { name: true } }
      },
      take: 100 // Limit to prevent overload
    })

    const qrCodes = await Promise.all(
      assets.map(async (asset) => {
        const qrData = generateAssetQRData(asset)
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 150,
          margin: 1
        })

        // Update asset with QR code
        await prisma.asset.update({
          where: { id: asset.id },
          data: { qrCode: qrData }
        })

        return {
          assetId: asset.id,
          assetTag: asset.assetTag,
          name: asset.name,
          qrCodeDataURL,
          qrData
        }
      })
    )

    res.json({
      success: true,
      data: { qrCodes },
      message: `Generated QR codes for ${qrCodes.length} assets`
    })
  } catch (error) {
    console.error('Error generating batch QR codes:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate batch QR codes'
    })
  }
})

module.exports = router



