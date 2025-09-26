import { api } from '../api';

export interface DepreciationData {
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';
  usefulLife: number;
  salvageValue: number;
  depreciationRate?: number;
  notes?: string;
}

export interface DepreciationCalculation {
  originalValue: number;
  currentValue: number;
  accumulatedDepreciation: number;
  salvageValue: number;
  usefulLife: number;
  yearsInService: number;
  lastCalculated: string;
  depreciationMethod: string;
}

/**
 * Set up or update depreciation settings for an asset
 */
export const setAssetDepreciation = async (assetId: string, data: DepreciationData) => {
  try {
    const response = await api.post(`/assets/${assetId}/depreciation`, data);
    return response.data;
  } catch (error) {
    console.error('Error setting asset depreciation:', error);
    throw error;
  }
};

/**
 * Get current depreciation calculation for an asset
 */
export const getAssetDepreciation = async (assetId: string) => {
  try {
    const response = await api.get(`/assets/${assetId}/depreciation`);
    return response.data;
  } catch (error) {
    console.error('Error getting asset depreciation:', error);
    throw error;
  }
};