import { api } from '../api';

export const assetSoftwareService = {
  // Install software on asset
  installSoftware: async (installationData) => {
    try {
      const response = await api.post('/asset-software/install', installationData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to install software'
      );
    }
  },

  // Uninstall software from asset
  uninstallSoftware: async (installationId, notes = '') => {
    try {
      const response = await api.post('/asset-software/uninstall', {
        installationId,
        notes
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to uninstall software'
      );
    }
  },

  // Get installed software for specific asset
  getAssetSoftware: async (assetId) => {
    try {
      const response = await api.get(`/asset-software/asset/${assetId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch asset software'
      );
    }
  },

  // Get installations for specific software
  getSoftwareInstallations: async (softwareId) => {
    try {
      const response = await api.get(`/asset-software/software/${softwareId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch software installations'
      );
    }
  },

  // Get available software for asset (with available licenses)
  getAvailableSoftware: async (assetId) => {
    try {
      const response = await api.get(`/asset-software/available/${assetId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch available software'
      );
    }
  },

  // Get installation statistics
  getInstallationStats: async () => {
    try {
      const response = await api.get('/asset-software/stats');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch installation statistics'
      );
    }
  }
};