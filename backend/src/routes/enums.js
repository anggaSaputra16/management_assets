const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Asset Status enum values
router.get('/asset-status', authenticate, (req, res) => {
  const assetStatuses = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'IN_USE', label: 'In Use' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'RETIRED', label: 'Retired' },
    { value: 'DISPOSED', label: 'Disposed' }
  ];

  res.json({
    success: true,
    data: assetStatuses
  });
});

// Request Status enum values
router.get('/request-status', authenticate, (req, res) => {
  const requestStatuses = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  res.json({
    success: true,
    data: requestStatuses
  });
});

// Maintenance Type enum values
router.get('/maintenance-type', authenticate, (req, res) => {
  const maintenanceTypes = [
    { value: 'PREVENTIVE', label: 'Preventive' },
    { value: 'CORRECTIVE', label: 'Corrective' },
    { value: 'PREDICTIVE', label: 'Predictive' },
    { value: 'CONDITION_BASED', label: 'Condition Based' }
  ];

  res.json({
    success: true,
    data: maintenanceTypes
  });
});

// Maintenance Status enum values
router.get('/maintenance-status', authenticate, (req, res) => {
  const maintenanceStatuses = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'OVERDUE', label: 'Overdue' }
  ];

  res.json({
    success: true,
    data: maintenanceStatuses
  });
});

// Audit Status enum values
router.get('/audit-status', authenticate, (req, res) => {
  const auditStatuses = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'OVERDUE', label: 'Overdue' }
  ];

  res.json({
    success: true,
    data: auditStatuses
  });
});

// Spare Part Category enum values
router.get('/spare-part-category', authenticate, (req, res) => {
  const sparePartCategories = [
    { value: 'HARDWARE', label: 'Hardware' },
    { value: 'SOFTWARE', label: 'Software' },
    { value: 'ACCESSORY', label: 'Accessory' },
    { value: 'CONSUMABLE', label: 'Consumable' }
  ];

  res.json({
    success: true,
    data: sparePartCategories
  });
});

// Spare Part Type enum values
router.get('/spare-part-type', authenticate, (req, res) => {
  const sparePartTypes = [
    { value: 'COMPONENT', label: 'Component' },
    { value: 'ACCESSORY', label: 'Accessory' },
    { value: 'CONSUMABLE', label: 'Consumable' },
    { value: 'TOOL', label: 'Tool' },
    { value: 'SOFTWARE', label: 'Software' }
  ];

  res.json({
    success: true,
    data: sparePartTypes
  });
});

// Spare Part Status enum values
router.get('/spare-part-status', authenticate, (req, res) => {
  const sparePartStatuses = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'IN_USE', label: 'In Use' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
    { value: 'DISCONTINUED', label: 'Discontinued' }
  ];

  res.json({
    success: true,
    data: sparePartStatuses
  });
});

// Procurement Status enum values
router.get('/procurement-status', authenticate, (req, res) => {
  const procurementStatuses = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ORDERED', label: 'Ordered' },
    { value: 'RECEIVED', label: 'Received' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  res.json({
    success: true,
    data: procurementStatuses
  });
});

// Part Usage Type enum values
router.get('/part-usage-type', authenticate, (req, res) => {
  const partUsageTypes = [
    { value: 'REPLACEMENT', label: 'Replacement' },
    { value: 'UPGRADE', label: 'Upgrade' },
    { value: 'REPAIR', label: 'Repair' },
    { value: 'MAINTENANCE', label: 'Maintenance' }
  ];

  res.json({
    success: true,
    data: partUsageTypes
  });
});

// Replacement Status enum values
router.get('/replacement-status', authenticate, (req, res) => {
  const replacementStatuses = [
    { value: 'PLANNED', label: 'Planned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  res.json({
    success: true,
    data: replacementStatuses
  });
});

// Registration Status enum values
router.get('/registration-status', authenticate, (req, res) => {
  const registrationStatuses = [
    { value: 'REGISTERED', label: 'Registered' },
    { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  res.json({
    success: true,
    data: registrationStatuses
  });
});

// Component Status enum values
router.get('/component-status', authenticate, (req, res) => {
  const componentStatuses = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'REPLACED', label: 'Replaced' }
  ];

  res.json({
    success: true,
    data: componentStatuses
  });
});

// Location Type enum values
router.get('/location-type', authenticate, (req, res) => {
  const locationTypes = [
    { value: 'WAREHOUSE', label: 'Warehouse' },
    { value: 'OFFICE', label: 'Office' },
    { value: 'FACTORY', label: 'Factory' },
    { value: 'STORE', label: 'Store' },
    { value: 'REMOTE', label: 'Remote' }
  ];

  res.json({
    success: true,
    data: locationTypes
  });
});

// User Role enum values
router.get('/user-role', authenticate, (req, res) => {
  const userRoles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'ASSET_ADMIN', label: 'Asset Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'DEPARTMENT_USER', label: 'Department User' },
    { value: 'TECHNICIAN', label: 'Technician' },
    { value: 'AUDITOR', label: 'Auditor' },
    { value: 'TOP_MANAGEMENT', label: 'Top Management' }
  ];

  res.json({
    success: true,
    data: userRoles
  });
});

// Request Type enum values
router.get('/request-type', authenticate, (req, res) => {
  const requestTypes = [
    { value: 'NEW_ASSET', label: 'New Asset' },
    { value: 'TRANSFER', label: 'Transfer' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'DISPOSAL', label: 'Disposal' },
    { value: 'UPGRADE', label: 'Upgrade' }
  ];

  res.json({
    success: true,
    data: requestTypes
  });
});

// Notification Type enum values
router.get('/notification-type', authenticate, (req, res) => {
  const notificationTypes = [
    { value: 'REQUEST_APPROVAL', label: 'Request Approval' },
    { value: 'MAINTENANCE_DUE', label: 'Maintenance Due' },
    { value: 'AUDIT_SCHEDULED', label: 'Audit Scheduled' },
    { value: 'ASSET_RETIREMENT', label: 'Asset Retirement' },
    { value: 'WARRANTY_EXPIRING', label: 'Warranty Expiring' },
    { value: 'SYSTEM_ALERT', label: 'System Alert' }
  ];

  res.json({
    success: true,
    data: notificationTypes
  });
});

// Software Type enum values
router.get('/software-type', authenticate, (req, res) => {
  const softwareTypes = [
    { value: 'OPERATING_SYSTEM', label: 'Operating System' },
    { value: 'APPLICATION', label: 'Application' },
    { value: 'UTILITY', label: 'Utility' },
    { value: 'DRIVER', label: 'Driver' },
    { value: 'FIRMWARE', label: 'Firmware' }
  ];

  res.json({
    success: true,
    data: softwareTypes
  });
});

// License Type enum values
router.get('/license-type', authenticate, (req, res) => {
  const licenseTypes = [
    { value: 'PERPETUAL', label: 'Perpetual' },
    { value: 'SUBSCRIPTION', label: 'Subscription' },
    { value: 'OPEN_SOURCE', label: 'Open Source' },
    { value: 'FREEWARE', label: 'Freeware' }
  ];

  res.json({
    success: true,
    data: licenseTypes
  });
});

// License Status enum values
router.get('/license-status', authenticate, (req, res) => {
  const licenseStatuses = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'REVOKED', label: 'Revoked' }
  ];

  res.json({
    success: true,
    data: licenseStatuses
  });
});

// Attachment Type enum values
router.get('/attachment-type', authenticate, (req, res) => {
  const attachmentTypes = [
    { value: 'DOCUMENT', label: 'Document' },
    { value: 'IMAGE', label: 'Image' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'AUDIO', label: 'Audio' },
    { value: 'OTHER', label: 'Other' }
  ];

  res.json({
    success: true,
    data: attachmentTypes
  });
});

// Custom enums not in schema but used in frontend
router.get('/asset-condition', authenticate, (req, res) => {
  const assetConditions = [
    { value: 'EXCELLENT', label: 'Excellent' },
    { value: 'GOOD', label: 'Good' },
    { value: 'FAIR', label: 'Fair' },
    { value: 'POOR', label: 'Poor' },
    { value: 'DAMAGED', label: 'Damaged' }
  ];

  res.json({
    success: true,
    data: assetConditions
  });
});

router.get('/decomposition-reason', authenticate, (req, res) => {
  const decompositionReasons = [
    { value: 'END_OF_LIFE', label: 'End of Life' },
    { value: 'OBSOLETE', label: 'Obsolete' },
    { value: 'DAMAGED_IRREPARABLE', label: 'Damaged Irreparable' },
    { value: 'COST_INEFFECTIVE', label: 'Cost Ineffective' },
    { value: 'BUSINESS_NEEDS', label: 'Business Needs' },
    { value: 'TECHNOLOGY_UPGRADE', label: 'Technology Upgrade' }
  ];

  res.json({
    success: true,
    data: decompositionReasons
  });
});

router.get('/decomposition-action', authenticate, (req, res) => {
  const decompositionActions = [
    { value: 'RECYCLE', label: 'Recycle' },
    { value: 'DISPOSE', label: 'Dispose' },
    { value: 'SELL', label: 'Sell' },
    { value: 'DONATE', label: 'Donate' },
    { value: 'STORE', label: 'Store' },
    { value: 'REUSE', label: 'Reuse' }
  ];

  res.json({
    success: true,
    data: decompositionActions
  });
});

router.get('/priority-level', authenticate, (req, res) => {
  const priorityLevels = [
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' }
  ];

  res.json({
    success: true,
    data: priorityLevels
  });
});

router.get('/transfer-reason', authenticate, (req, res) => {
  const transferReasons = [
    { value: 'DEPARTMENT_CHANGE', label: 'Department Change' },
    { value: 'LOCATION_CHANGE', label: 'Location Change' },
    { value: 'PROJECT_REASSIGNMENT', label: 'Project Reassignment' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'OTHER', label: 'Other' }
  ];

  res.json({
    success: true,
    data: transferReasons
  });
});

// Depreciation Method enum values
router.get('/depreciation-method', authenticate, (req, res) => {
  const depreciationMethods = [
    { value: 'STRAIGHT_LINE', label: 'Straight Line' },
    { value: 'DECLINING_BALANCE', label: 'Declining Balance' },
    { value: 'DOUBLE_DECLINING_BALANCE', label: 'Double Declining Balance' }
  ];

  res.json({
    success: true,
    data: depreciationMethods
  });
});

// Specification Category enum values
router.get('/specification-category', authenticate, (req, res) => {
  const specificationCategories = [
    { value: 'HARDWARE', label: 'Hardware' },
    { value: 'SOFTWARE', label: 'Software' },
    { value: 'PERFORMANCE', label: 'Performance' },
    { value: 'DISPLAY', label: 'Display' },
    { value: 'NETWORK', label: 'Network' },
    { value: 'STORAGE', label: 'Storage' },
    { value: 'MEMORY', label: 'Memory' },
    { value: 'GENERAL', label: 'General' }
  ];

  res.json({
    success: true,
    data: specificationCategories
  });
});

module.exports = router;