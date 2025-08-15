const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { department: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user not active.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. User not authenticated.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Check if user can approve requests
const canApprove = (req, res, next) => {
  const approverRoles = ['MANAGER', 'ADMIN', 'TOP_MANAGEMENT'];
  
  if (!approverRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Only managers can approve requests.' 
    });
  }
  
  next();
};

module.exports = { 
  authenticate, 
  authorize, 
  canApprove 
};
