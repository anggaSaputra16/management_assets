import { api } from '@/lib/api'

export const reportService = {
  // KPI Metrics
  getKPIMetrics: async () => {
    const response = await api.get('/api/reports/kpi')
    return response.data
  },

  // Executive Summary
  getExecutiveSummary: async () => {
    const response = await api.get('/api/reports/executive-summary')
    return response.data
  },

  // Asset Reports
  generateAssetReport: async (filters = {}) => {
    const response = await api.post('/api/reports/generate/assets', filters)
    return response.data
  },

  generateDepreciationReport: async (filters = {}) => {
    const response = await api.post('/api/reports/generate/depreciation', filters)
    return response.data
  },

  getAssetUtilizationReport: async (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    
    const response = await api.get(`/api/reports/assets/utilization?${params}`)
    return response.data
  },

  // Request Reports
  generateRequestReport: async (filters = {}) => {
    const response = await api.post('/api/reports/generate/requests', filters)
    return response.data
  },

  getRequestAnalytics: async (period = 'month') => {
    const response = await api.get(`/api/reports/requests/analytics?period=${period}`)
    return response.data
  },

  // Maintenance Reports
  generateMaintenanceReport: async (filters = {}) => {
    const response = await api.post('/api/reports/generate/maintenance', filters)
    return response.data
  },

  getMaintenanceCostReport: async (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    
    const response = await api.get(`/api/reports/maintenance/costs?${params}`)
    return response.data
  },

  // Financial Reports
  generateFinancialSummary: async (filters = {}) => {
    const response = await api.post('/api/reports/generate/financial', filters)
    return response.data
  },

  getAssetValueReport: async (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    
    const response = await api.get(`/api/reports/financial/asset-value?${params}`)
    return response.data
  },

  // Department Reports
  getDepartmentReport: async (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    
    const response = await api.get(`/api/reports/departments?${params}`)
    return response.data
  },

  // Executive Dashboard
  getExecutiveSummary: async (period = 'month') => {
    const response = await api.get(`/api/reports/executive?period=${period}`)
    return response.data
  },

  getKPIMetrics: async (period = 'month') => {
    const response = await api.get(`/api/reports/kpi?period=${period}`)
    return response.data
  },

  // Export Functions
  exportAssetReport: async (format = 'csv', filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    params.append('format', format)
    
    const response = await api.get(`/api/reports/assets/export?${params}`, {
      responseType: 'blob'
    })
    return response.data
  },

  exportRequestReport: async (format = 'csv', filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    params.append('format', format)
    
    const response = await api.get(`/api/reports/requests/export?${params}`, {
      responseType: 'blob'
    })
    return response.data
  },

  exportMaintenanceReport: async (format = 'csv', filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    params.append('format', format)
    
    const response = await api.get(`/api/reports/maintenance/export?${params}`, {
      responseType: 'blob'
    })
    return response.data
  },

  exportFinancialReport: async (format = 'csv', filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    params.append('format', format)
    
    const response = await api.get(`/api/reports/financial/export?${params}`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Chart Data
  getAssetChartData: async (type = 'category', period = 'month') => {
    const response = await api.get(`/api/reports/charts/assets?type=${type}&period=${period}`)
    return response.data
  },

  getRequestChartData: async (type = 'status', period = 'month') => {
    const response = await api.get(`/api/reports/charts/requests?type=${type}&period=${period}`)
    return response.data
  },

  getMaintenanceChartData: async (type = 'cost', period = 'month') => {
    const response = await api.get(`/api/reports/charts/maintenance?type=${type}&period=${period}`)
    return response.data
  },

  getFinancialChartData: async (type = 'value', period = 'month') => {
    const response = await api.get(`/api/reports/charts/financial?type=${type}&period=${period}`)
    return response.data
  },

  // Scheduled Reports
  getScheduledReports: async () => {
    const response = await api.get('/api/reports/scheduled')
    return response.data
  },

  createScheduledReport: async (reportData) => {
    const response = await api.post('/api/reports/scheduled', reportData)
    return response.data
  },

  updateScheduledReport: async (id, reportData) => {
    const response = await api.put(`/api/reports/scheduled/${id}`, reportData)
    return response.data
  },

  deleteScheduledReport: async (id) => {
    const response = await api.delete(`/api/reports/scheduled/${id}`)
    return response.data
  },

  // Report Templates
  getReportTemplates: async () => {
    const response = await api.get('/api/reports/templates')
    return response.data
  },

  createReportTemplate: async (templateData) => {
    const response = await api.post('/api/reports/templates', templateData)
    return response.data
  },

  updateReportTemplate: async (id, templateData) => {
    const response = await api.put(`/api/reports/templates/${id}`, templateData)
    return response.data
  },

  deleteReportTemplate: async (id) => {
    const response = await api.delete(`/api/reports/templates/${id}`)
    return response.data
  }
}
