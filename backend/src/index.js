require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const positionRoutes = require('./routes/positions');
const categoryRoutes = require('./routes/categories');
const locationRoutes = require('./routes/locations');
const vendorRoutes = require('./routes/vendors');
const assetRoutes = require('./routes/assets');
const requestRoutes = require('./routes/requests');
const maintenanceRoutes = require('./routes/maintenance');
const auditRoutes = require('./routes/audit');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const inventoryRoutes = require('./routes/inventory');
// const sparePartsRoutes = require('./routes/spareParts');
// const componentsRoutes = require('./routes/components');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - Very generous limits for dashboard functionality
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5000 : 10000, // Very high limits to prevent dashboard issues
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks and stats endpoints in development
    if (process.env.NODE_ENV !== 'production' && (req.path.includes('/health') || req.path.includes('/stats'))) {
      return true;
    }
    return false;
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/inventory', inventoryRoutes);
// app.use('/api/spare-parts', sparePartsRoutes);
// app.use('/api/components', componentsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Asset Management System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Asset Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      departments: '/api/departments',
      categories: '/api/categories',
      locations: '/api/locations',
      vendors: '/api/vendors',
      assets: '/api/assets',
      requests: '/api/requests',
      maintenance: '/api/maintenance',
      audit: '/api/audit',
      notifications: '/api/notifications',
      spareParts: '/api/spare-parts',
      components: '/api/components'
    },
    documentation: '/api/docs' // For future API documentation
  });
});

// Dashboard stats endpoint (summary for all authorized users)
app.get('/api/dashboard/stats', async (req, res, next) => {
  try {
    // This would be protected by authentication middleware in individual routes
    res.json({
      success: true,
      message: 'Dashboard stats endpoint - implement specific stats based on user role',
      suggestion: 'Use individual endpoint statistics from each module'
    });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
🚀 Asset Management System API Server is running!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📚 API Documentation: http://localhost:${PORT}/api
🏥 Health Check: http://localhost:${PORT}/api/health
⏰ Started at: ${new Date().toISOString()}
  `);
});

module.exports = app;
