import { create } from 'zustand';
import { enumService } from '../lib/services/enumService';

const useEnumStore = create((set, get) => ({
  // State
  assetStatuses: [],
  requestStatuses: [],
  maintenanceTypes: [],
  maintenanceStatuses: [],
  auditStatuses: [],
  sparePartCategories: [],
  sparePartTypes: [],
  sparePartStatuses: [],
  procurementStatuses: [],
  partUsageTypes: [],
  replacementStatuses: [],
  registrationStatuses: [],
  componentStatuses: [],
  locationTypes: [],
  userRoles: [],
  requestTypes: [],
  notificationTypes: [],
  softwareTypes: [],
  licenseTypes: [],
  licenseStatuses: [],
  attachmentTypes: [],
  assetConditions: [],
  decompositionReasons: [],
  decompositionActions: [],
  priorityLevels: [],
  transferReasons: [],
  depreciationMethods: [],
  specificationCategories: [],

  // Loading states
  loading: {
    assetStatuses: false,
    requestStatuses: false,
    maintenanceTypes: false,
    maintenanceStatuses: false,
    auditStatuses: false,
    sparePartCategories: false,
    sparePartTypes: false,
    sparePartStatuses: false,
    procurementStatuses: false,
    partUsageTypes: false,
    replacementStatuses: false,
    registrationStatuses: false,
    componentStatuses: false,
    locationTypes: false,
    userRoles: false,
    requestTypes: false,
    notificationTypes: false,
    softwareTypes: false,
    licenseTypes: false,
    licenseStatuses: false,
    attachmentTypes: false,
    assetConditions: false,
    decompositionReasons: false,
    decompositionActions: false,
    priorityLevels: false,
    transferReasons: false,
    depreciationMethods: false,
    specificationCategories: false,
  },

  // Error states
  errors: {
    assetStatuses: null,
    requestStatuses: null,
    maintenanceTypes: null,
    maintenanceStatuses: null,
    auditStatuses: null,
    sparePartCategories: null,
    sparePartTypes: null,
    sparePartStatuses: null,
    procurementStatuses: null,
    partUsageTypes: null,
    replacementStatuses: null,
    registrationStatuses: null,
    componentStatuses: null,
    locationTypes: null,
    userRoles: null,
    requestTypes: null,
    notificationTypes: null,
    softwareTypes: null,
    licenseTypes: null,
    licenseStatuses: null,
    attachmentTypes: null,
    assetConditions: null,
    decompositionReasons: null,
    decompositionActions: null,
    priorityLevels: null,
    transferReasons: null,
    depreciationMethods: null,
    specificationCategories: null,
  },

  // Actions
  fetchAssetStatuses: async () => {
    set(state => ({ loading: { ...state.loading, assetStatuses: true } }));
    try {
      const response = await enumService.getAssetStatuses();
      set({
        assetStatuses: response.data,
        loading: { ...get().loading, assetStatuses: false },
        errors: { ...get().errors, assetStatuses: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, assetStatuses: false },
        errors: { ...get().errors, assetStatuses: error.message }
      });
    }
  },

  fetchRequestStatuses: async () => {
    set(state => ({ loading: { ...state.loading, requestStatuses: true } }));
    try {
      const response = await enumService.getRequestStatuses();
      set({
        requestStatuses: response.data,
        loading: { ...get().loading, requestStatuses: false },
        errors: { ...get().errors, requestStatuses: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, requestStatuses: false },
        errors: { ...get().errors, requestStatuses: error.message }
      });
    }
  },

  fetchMaintenanceTypes: async () => {
    set(state => ({ loading: { ...state.loading, maintenanceTypes: true } }));
    try {
      const response = await enumService.getMaintenanceTypes();
      set({
        maintenanceTypes: response.data,
        loading: { ...get().loading, maintenanceTypes: false },
        errors: { ...get().errors, maintenanceTypes: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, maintenanceTypes: false },
        errors: { ...get().errors, maintenanceTypes: error.message }
      });
    }
  },

  fetchMaintenanceStatuses: async () => {
    set(state => ({ loading: { ...state.loading, maintenanceStatuses: true } }));
    try {
      const response = await enumService.getMaintenanceStatuses();
      set({
        maintenanceStatuses: response.data,
        loading: { ...get().loading, maintenanceStatuses: false },
        errors: { ...get().errors, maintenanceStatuses: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, maintenanceStatuses: false },
        errors: { ...get().errors, maintenanceStatuses: error.message }
      });
    }
  },

  fetchAuditStatuses: async () => {
    set(state => ({ loading: { ...state.loading, auditStatuses: true } }));
    try {
      const response = await enumService.getAuditStatuses();
      set({
        auditStatuses: response.data,
        loading: { ...get().loading, auditStatuses: false },
        errors: { ...get().errors, auditStatuses: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, auditStatuses: false },
        errors: { ...get().errors, auditStatuses: error.message }
      });
    }
  },

  fetchSparePartCategories: async () => {
    set(state => ({ loading: { ...state.loading, sparePartCategories: true } }));
    try {
      const response = await enumService.getSparePartCategories();
      set({
        sparePartCategories: response.data,
        loading: { ...get().loading, sparePartCategories: false },
        errors: { ...get().errors, sparePartCategories: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, sparePartCategories: false },
        errors: { ...get().errors, sparePartCategories: error.message }
      });
    }
  },

  fetchSparePartTypes: async () => {
    set(state => ({ loading: { ...state.loading, sparePartTypes: true } }));
    try {
      const response = await enumService.getSparePartTypes();
      set({
        sparePartTypes: response.data,
        loading: { ...get().loading, sparePartTypes: false },
        errors: { ...get().errors, sparePartTypes: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, sparePartTypes: false },
        errors: { ...get().errors, sparePartTypes: error.message }
      });
    }
  },

  fetchSparePartStatuses: async () => {
    set(state => ({ loading: { ...state.loading, sparePartStatuses: true } }));
    try {
      const response = await enumService.getSparePartStatuses();
      set({
        sparePartStatuses: response.data,
        loading: { ...get().loading, sparePartStatuses: false },
        errors: { ...get().errors, sparePartStatuses: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, sparePartStatuses: false },
        errors: { ...get().errors, sparePartStatuses: error.message }
      });
    }
  },

  fetchProcurementStatuses: async () => {
    set(state => ({ loading: { ...state.loading, procurementStatuses: true } }));
    try {
      const response = await enumService.getProcurementStatuses();
      set({
        procurementStatuses: response.data,
        loading: { ...get().loading, procurementStatuses: false },
        errors: { ...get().errors, procurementStatuses: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, procurementStatuses: false },
        errors: { ...get().errors, procurementStatuses: error.message }
      });
    }
  },

  fetchPartUsageTypes: async () => {
    set(state => ({ loading: { ...state.loading, partUsageTypes: true } }));
    try {
      const response = await enumService.getPartUsageTypes();
      set({
        partUsageTypes: response.data,
        loading: { ...get().loading, partUsageTypes: false },
        errors: { ...get().errors, partUsageTypes: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, partUsageTypes: false },
        errors: { ...get().errors, partUsageTypes: error.message }
      });
    }
  },

  fetchReplacementStatuses: async () => {
    set(state => ({ loading: { ...state.loading, replacementStatuses: true } }));
    try {
      const response = await enumService.getReplacementStatuses();
      set({
        replacementStatuses: response.data,
        loading: { ...get().loading, replacementStatuses: false },
        errors: { ...get().errors, replacementStatuses: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, replacementStatuses: false },
        errors: { ...get().errors, replacementStatuses: error.message }
      });
    }
  },

  fetchRegistrationStatuses: async () => {
    set(state => ({ loading: { ...state.loading, registrationStatuses: true } }));
    try {
      const response = await enumService.getRegistrationStatuses();
      set({
        registrationStatuses: response.data,
        loading: { ...get().loading, registrationStatuses: false },
        errors: { ...get().errors, registrationStatuses: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, registrationStatuses: false },
        errors: { ...get().errors, registrationStatuses: error.message }
      });
    }
  },

  fetchComponentStatuses: async () => {
    set(state => ({ loading: { ...state.loading, componentStatuses: true } }));
    try {
      const response = await enumService.getComponentStatuses();
      set({
        componentStatuses: response.data,
        loading: { ...get().loading, componentStatuses: false },
        errors: { ...get().errors, componentStatuses: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, componentStatuses: false },
        errors: { ...get().errors, componentStatuses: error.message }
      });
    }
  },

  fetchLocationTypes: async () => {
    set(state => ({ loading: { ...state.loading, locationTypes: true } }));
    try {
      const response = await enumService.getLocationTypes();
      set({
        locationTypes: response.data,
        loading: { ...get().loading, locationTypes: false },
        errors: { ...get().errors, locationTypes: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, locationTypes: false },
        errors: { ...get().errors, locationTypes: error.message }
      });
    }
  },

  fetchUserRoles: async () => {
    set(state => ({ loading: { ...state.loading, userRoles: true } }));
    try {
      const response = await enumService.getUserRoles();
      set({
        userRoles: response.data,
        loading: { ...get().loading, userRoles: false },
        errors: { ...get().errors, userRoles: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, userRoles: false },
        errors: { ...get().errors, userRoles: error.message }
      });
    }
  },

  fetchRequestTypes: async () => {
    set(state => ({ loading: { ...state.loading, requestTypes: true } }));
    try {
      const response = await enumService.getRequestTypes();
      set({
        requestTypes: response.data,
        loading: { ...get().loading, requestTypes: false },
        errors: { ...get().errors, requestTypes: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, requestTypes: false },
        errors: { ...get().errors, requestTypes: error.message }
      });
    }
  },

  fetchNotificationTypes: async () => {
    set(state => ({ loading: { ...state.loading, notificationTypes: true } }));
    try {
      const response = await enumService.getNotificationTypes();
      set({
        notificationTypes: response.data,
        loading: { ...get().loading, notificationTypes: false },
        errors: { ...get().errors, notificationTypes: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, notificationTypes: false },
        errors: { ...get().errors, notificationTypes: error.message }
      });
    }
  },

  fetchSoftwareTypes: async () => {
    set(state => ({ loading: { ...state.loading, softwareTypes: true } }));
    try {
      const response = await enumService.getSoftwareTypes();
      set({
        softwareTypes: response.data,
        loading: { ...get().loading, softwareTypes: false },
        errors: { ...get().errors, softwareTypes: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, softwareTypes: false },
        errors: { ...get().errors, softwareTypes: error.message }
      });
    }
  },

  fetchLicenseTypes: async () => {
    set(state => ({ loading: { ...state.loading, licenseTypes: true } }));
    try {
      const response = await enumService.getLicenseTypes();
      set({
        licenseTypes: response.data,
        loading: { ...get().loading, licenseTypes: false },
        errors: { ...get().errors, licenseTypes: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, licenseTypes: false },
        errors: { ...get().errors, licenseTypes: error.message }
      });
    }
  },

  fetchLicenseStatuses: async () => {
    set(state => ({ loading: { ...state.loading, licenseStatuses: true } }));
    try {
      const response = await enumService.getLicenseStatuses();
      set({
        licenseStatuses: response.data,
        loading: { ...get().loading, licenseStatuses: false },
        errors: { ...get().errors, licenseStatuses: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, licenseStatuses: false },
        errors: { ...get().errors, licenseStatuses: error.message }
      });
    }
  },

  fetchAttachmentTypes: async () => {
    set(state => ({ loading: { ...state.loading, attachmentTypes: true } }));
    try {
      const response = await enumService.getAttachmentTypes();
      set({
        attachmentTypes: response.data,
        loading: { ...get().loading, attachmentTypes: false },
        errors: { ...get().errors, attachmentTypes: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, attachmentTypes: false },
        errors: { ...get().errors, attachmentTypes: error.message }
      });
    }
  },

  fetchAssetConditions: async () => {
    set(state => ({ loading: { ...state.loading, assetConditions: true } }));
    try {
      const response = await enumService.getAssetConditions();
      set({
        assetConditions: response.data,
        loading: { ...get().loading, assetConditions: false },
        errors: { ...get().errors, assetConditions: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, assetConditions: false },
        errors: { ...get().errors, assetConditions: error.message }
      });
    }
  },

  fetchDecompositionReasons: async () => {
    set(state => ({ loading: { ...state.loading, decompositionReasons: true } }));
    try {
      const response = await enumService.getDecompositionReasons();
      set({
        decompositionReasons: response.data,
        loading: { ...get().loading, decompositionReasons: false },
        errors: { ...get().errors, decompositionReasons: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, decompositionReasons: false },
        errors: { ...get().errors, decompositionReasons: error.message }
      });
    }
  },

  fetchDecompositionActions: async () => {
    set(state => ({ loading: { ...state.loading, decompositionActions: true } }));
    try {
      const response = await enumService.getDecompositionActions();
      set({
        decompositionActions: response.data,
        loading: { ...get().loading, decompositionActions: false },
        errors: { ...get().errors, decompositionActions: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, decompositionActions: false },
        errors: { ...get().errors, decompositionActions: error.message }
      });
    }
  },

  fetchPriorityLevels: async () => {
    set(state => ({ loading: { ...state.loading, priorityLevels: true } }));
    try {
      const response = await enumService.getPriorityLevels();
      set({
        priorityLevels: response.data,
        loading: { ...get().loading, priorityLevels: false },
        errors: { ...get().errors, priorityLevels: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, priorityLevels: false },
        errors: { ...get().errors, priorityLevels: error.message }
      });
    }
  },

  fetchTransferReasons: async () => {
    set(state => ({ loading: { ...state.loading, transferReasons: true } }));
    try {
      const response = await enumService.getTransferReasons();
      set({
        transferReasons: response.data,
        loading: { ...get().loading, transferReasons: false },
        errors: { ...get().errors, transferReasons: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, transferReasons: false },
        errors: { ...get().errors, transferReasons: error.message }
      });
    }
  },

  fetchDepreciationMethods: async () => {
    set(state => ({ loading: { ...state.loading, depreciationMethods: true } }));
    try {
      const response = await enumService.getDepreciationMethods();
      set({
        depreciationMethods: response.data,
        loading: { ...get().loading, depreciationMethods: false },
        errors: { ...get().errors, depreciationMethods: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, depreciationMethods: false },
        errors: { ...get().errors, depreciationMethods: error.message }
      });
    }
  },

  fetchSpecificationCategories: async () => {
    set(state => ({ loading: { ...state.loading, specificationCategories: true } }));
    try {
      const response = await enumService.getSpecificationCategories();
      set({
        specificationCategories: response.data,
        loading: { ...get().loading, specificationCategories: false },
        errors: { ...get().errors, specificationCategories: null }
      });
    } catch (error) {
      set({
        loading: { ...get().loading, specificationCategories: false },
        errors: { ...get().errors, specificationCategories: error.message }
      });
    }
  },

  // Initialize all enums (call this on app start)
  initializeEnums: async () => {
    const enumFetchers = [
      'fetchAssetStatuses',
      'fetchRequestStatuses',
      'fetchMaintenanceTypes',
      'fetchMaintenanceStatuses',
      'fetchAuditStatuses',
      'fetchSparePartCategories',
      'fetchSparePartTypes',
      'fetchSparePartStatuses',
      'fetchProcurementStatuses',
      'fetchPartUsageTypes',
      'fetchReplacementStatuses',
      'fetchRegistrationStatuses',
      'fetchComponentStatuses',
      'fetchLocationTypes',
      'fetchUserRoles',
      'fetchRequestTypes',
      'fetchNotificationTypes',
      'fetchSoftwareTypes',
      'fetchLicenseTypes',
      'fetchLicenseStatuses',
      'fetchAttachmentTypes',
      'fetchAssetConditions',
      'fetchDecompositionReasons',
      'fetchDecompositionActions',
      'fetchPriorityLevels',
      'fetchTransferReasons',
      'fetchDepreciationMethods',
      'fetchSpecificationCategories'
    ];

    // Fetch all enums in parallel
    await Promise.allSettled(enumFetchers.map(fetcher => get()[fetcher]()));
  }
}));

export default useEnumStore;