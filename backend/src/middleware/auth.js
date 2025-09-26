const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

// Authentication middleware with company validation
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
      include: { 
        department: true,
        company: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user not active.' 
      });
    }

    // Validate company exists and is active
    if (!user.company || !user.company.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Company not found or inactive.'
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

// Company validation middleware for explicit company_id in request
const validateCompany = async (req, res, next) => {
  try {
    const requestCompanyId = req.body.companyId || req.query.companyId || req.params.companyId;
    const userCompanyId = req.user.companyId;

    // If company_id is provided in request, validate it matches user's company
    if (requestCompanyId && requestCompanyId !== userCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Company mismatch.'
      });
    }

    // Auto-inject company_id if not provided
    if (!requestCompanyId) {
      req.body.companyId = userCompanyId;
      req.query.companyId = userCompanyId;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating company access.'
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
  canApprove,
  validateCompany 
};
