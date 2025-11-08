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

    // Normalize role to uppercase to avoid case-sensitivity issues
    user.role = (user.role || '').toString().toUpperCase()
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
    // Currently NO ONE can access cross-company data (strict company isolation)
    // Future: Add SUPER_ADMIN role for multi-company access
    if (requestCompanyId && requestCompanyId !== userCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot access other company data.'
      });
    }

    // Auto-inject company_id if not provided (or leave provided companyId when override allowed)
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
  // Normalize expected roles once
  const allowedRoles = roles.map(r => r && r.toString().toUpperCase())
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. User not authenticated.' 
      });
    }

    const userRole = (req.user.role || '').toString().toUpperCase()

    if (!allowedRoles.includes(userRole)) {
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
  // Allow managers, company admins and asset admins, and top management to approve
  const approverRoles = ['MANAGER', 'ADMIN', 'ASSET_ADMIN', 'TOP_MANAGEMENT'];
  const userRole = (req.user.role || '').toString().toUpperCase()

  if (!approverRoles.includes(userRole)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Only managers, admins, or asset admins can approve requests.' 
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
