import { api } from '../api'

export const enumService = {
  // Asset Status
  getAssetStatuses: async () => {
    const response = await api.get('/enums/asset-status');
    return response.data;
  },

  // Request Status
  getRequestStatuses: async () => {
    const response = await api.get('/enums/request-status');
    return response.data;
  },

  // Maintenance Type
  getMaintenanceTypes: async () => {
    const response = await api.get('/enums/maintenance-type');
    return response.data;
  },

  // Maintenance Status
  getMaintenanceStatuses: async () => {
    const response = await api.get('/enums/maintenance-status');
    return response.data;
  },

  // Audit Status
  getAuditStatuses: async () => {
    const response = await api.get('/enums/audit-status');
    return response.data;
  },

  // Spare Part Category
  getSparePartCategories: async () => {
    const response = await api.get('/enums/spare-part-category');
    return response.data;
  },

  // Spare Part Type
  getSparePartTypes: async () => {
    const response = await api.get('/enums/spare-part-type');
    return response.data;
  },

  // Spare Part Status
  getSparePartStatuses: async () => {
    const response = await api.get('/enums/spare-part-status');
    return response.data;
  },

  // Procurement Status
  getProcurementStatuses: async () => {
    const response = await api.get('/enums/procurement-status');
    return response.data;
  },

  // Part Usage Type
  getPartUsageTypes: async () => {
    const response = await api.get('/enums/part-usage-type');
    return response.data;
  },

  // Replacement Status
  getReplacementStatuses: async () => {
    const response = await api.get('/enums/replacement-status');
    return response.data;
  },

  // Registration Status
  getRegistrationStatuses: async () => {
    const response = await api.get('/enums/registration-status');
    return response.data;
  },

  // Component Status
  getComponentStatuses: async () => {
    const response = await api.get('/enums/component-status');
    return response.data;
  },

  // Location Type
  getLocationTypes: async () => {
    const response = await api.get('/enums/location-type');
    return response.data;
  },

  // User Role
  getUserRoles: async () => {
    const response = await api.get('/enums/user-role');
    return response.data;
  },

  // Request Type
  getRequestTypes: async () => {
    const response = await api.get('/enums/request-type');
    return response.data;
  },

  // Notification Type
  getNotificationTypes: async () => {
    const response = await api.get('/enums/notification-type');
    return response.data;
  },

  // Software Type
  getSoftwareTypes: async () => {
    const response = await api.get('/enums/software-type');
    return response.data;
  },

  // License Type
  getLicenseTypes: async () => {
    const response = await api.get('/enums/license-type');
    return response.data;
  },

  // License Status
  getLicenseStatuses: async () => {
    const response = await api.get('/enums/license-status');
    return response.data;
  },

  // Attachment Type
  getAttachmentTypes: async () => {
    const response = await api.get('/enums/attachment-type');
    return response.data;
  },

  // Custom enums not in schema but used in frontend
  getAssetConditions: async () => {
    const response = await api.get('/enums/asset-condition');
    return response.data;
  },

  getDecompositionReasons: async () => {
    const response = await api.get('/enums/decomposition-reason');
    return response.data;
  },

  getDecompositionActions: async () => {
    const response = await api.get('/enums/decomposition-action');
    return response.data;
  },

  getPriorityLevels: async () => {
    const response = await api.get('/enums/priority-level');
    return response.data;
  },

  // Transfer Reason
  getTransferReasons: async () => {
    const response = await api.get('/enums/transfer-reason');
    return response.data;
  },

  // Depreciation Method
  getDepreciationMethods: async () => {
    const response = await api.get('/enums/depreciation-method');
    return response.data;
  },

  // Specification Category
  getSpecificationCategories: async () => {
    const response = await api.get('/enums/specification-category');
    return response.data;
  }
};