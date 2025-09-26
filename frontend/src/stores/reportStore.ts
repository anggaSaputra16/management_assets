import { create } from 'zustand'
import { reportService } from '@/lib/services/reportService'

interface ReportFilters {
  startDate: string
  endDate: string
  department?: string
  category?: string
  location?: string
  status?: string
  priority?: string
  type?: string
}

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    fill?: boolean
  }>
}

interface ReportData {
  id?: string
  title: string
  data: unknown[]
  summary?: Record<string, unknown>
  chartData?: ChartData
  generatedAt: string
  filters: ReportFilters
}

interface ScheduledReport {
  id: string
  name: string
  type: string
  schedule: string
  enabled: boolean
  lastRun?: string
  nextRun: string
  recipients: string[]
  filters: ReportFilters
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: string
  defaultFilters: ReportFilters
  chartConfig?: Record<string, unknown>
}

interface ReportState {
  reports: Record<string, ReportData>
  scheduledReports: ScheduledReport[]
  templates: ReportTemplate[]
  loading: boolean
  error: string | null
  currentFilters: ReportFilters
  selectedPeriod: string
  activeReportType: string
  chartData: Record<string, ChartData>
  kpiMetrics: Record<string, unknown>
  executiveSummary: Record<string, unknown>
}

interface ReportActions {
  // Asset Reports
  generateAssetReport: (filters?: ReportFilters) => Promise<void>
  generateDepreciationReport: (filters?: ReportFilters) => Promise<void>
  generateUtilizationReport: (filters?: ReportFilters) => Promise<void>
  
  // Request Reports
  generateRequestReport: (filters?: ReportFilters) => Promise<void>
  generateRequestAnalytics: (period?: string) => Promise<void>
  
  // Maintenance Reports
  generateMaintenanceReport: (filters?: ReportFilters) => Promise<void>
  generateMaintenanceCostReport: (filters?: ReportFilters) => Promise<void>
  
  // Financial Reports
  generateFinancialSummary: (filters?: ReportFilters) => Promise<void>
  generateAssetValueReport: (filters?: ReportFilters) => Promise<void>
  
  // Department Reports
  generateDepartmentReport: (filters?: ReportFilters) => Promise<void>
  
  // Executive Reports
  fetchExecutiveSummary: (period?: string) => Promise<void>
  fetchKPIMetrics: (period?: string) => Promise<void>
  
  // Chart Data
  fetchAssetChartData: (type?: string, period?: string) => Promise<void>
  fetchRequestChartData: (type?: string, period?: string) => Promise<void>
  fetchMaintenanceChartData: (type?: string, period?: string) => Promise<void>
  fetchFinancialChartData: (type?: string, period?: string) => Promise<void>
  
  // Export Functions
  exportReport: (type: string, format?: string, filters?: ReportFilters) => Promise<void>
  
  // Scheduled Reports
  fetchScheduledReports: () => Promise<void>
  createScheduledReport: (reportData: Omit<ScheduledReport, 'id'>) => Promise<void>
  updateScheduledReport: (id: string, reportData: Partial<ScheduledReport>) => Promise<void>
  deleteScheduledReport: (id: string) => Promise<void>
  
  // Templates
  fetchReportTemplates: () => Promise<void>
  createReportTemplate: (templateData: Omit<ReportTemplate, 'id'>) => Promise<void>
  updateReportTemplate: (id: string, templateData: Partial<ReportTemplate>) => Promise<void>
  deleteReportTemplate: (id: string) => Promise<void>
  
  // State Management
  setFilters: (filters: ReportFilters) => void
  setPeriod: (period: string) => void
  setActiveReportType: (type: string) => void
  clearReports: () => void
  getReportByType: (type: string) => ReportData | null
  getFilteredReports: () => ReportData[]
}

export const useReportStore = create<ReportState & ReportActions>((set, get) => ({
  reports: {},
  scheduledReports: [],
  templates: [],
  loading: false,
  error: null,
  currentFilters: {
    startDate: '',
    endDate: ''
  },
  selectedPeriod: 'month',
  activeReportType: 'asset',
  chartData: {},
  kpiMetrics: {},
  executiveSummary: {},

  // Asset Reports
  generateAssetReport: async (filters: Partial<ReportFilters> = {}) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = get().currentFilters
      const finalFilters: ReportFilters = {
        startDate: filters.startDate ?? currentFilters.startDate ?? '',
        endDate: filters.endDate ?? currentFilters.endDate ?? '',
        department: filters.department ?? currentFilters.department,
        category: filters.category ?? currentFilters.category,
        location: filters.location ?? currentFilters.location,
        status: filters.status ?? currentFilters.status,
        priority: filters.priority ?? currentFilters.priority,
        type: filters.type ?? currentFilters.type,
      }
      const response = await reportService.generateAssetReport(finalFilters)
      set(state => ({
        reports: {
          ...state.reports,
          asset: {
            title: 'Asset Report',
            data: response.data || [],
            summary: response.summary,
            generatedAt: new Date().toISOString(),
            filters: finalFilters
          }
        },
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate asset report'
      set({ error: message, loading: false })
    }
  },

  generateDepreciationReport: async (filters: Partial<ReportFilters> = {}) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = get().currentFilters
      const finalFilters: ReportFilters = {
        startDate: filters.startDate ?? currentFilters.startDate ?? '',
        endDate: filters.endDate ?? currentFilters.endDate ?? '',
        department: filters.department ?? currentFilters.department,
        category: filters.category ?? currentFilters.category,
        location: filters.location ?? currentFilters.location,
        status: filters.status ?? currentFilters.status,
        priority: filters.priority ?? currentFilters.priority,
        type: filters.type ?? currentFilters.type,
      }
      const response = await reportService.generateDepreciationReport(finalFilters)
      set(state => ({
        reports: {
          ...state.reports,
          depreciation: {
            title: 'Asset Depreciation Report',
            data: response.data || [],
            summary: response.summary,
            generatedAt: new Date().toISOString(),
            filters: finalFilters
          }
        },
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate depreciation report'
      set({ error: message, loading: false })
    }
  },

  generateUtilizationReport: async (filters: Partial<ReportFilters> = {}) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = get().currentFilters
      const finalFilters: ReportFilters = {
        startDate: filters.startDate ?? currentFilters.startDate ?? '',
        endDate: filters.endDate ?? currentFilters.endDate ?? '',
        department: filters.department ?? currentFilters.department,
        category: filters.category ?? currentFilters.category,
        location: filters.location ?? currentFilters.location,
        status: filters.status ?? currentFilters.status,
        priority: filters.priority ?? currentFilters.priority,
        type: filters.type ?? currentFilters.type,
      }
      const response = await reportService.getAssetUtilizationReport(finalFilters)
      set(state => ({
        reports: {
          ...state.reports,
          utilization: {
            title: 'Asset Utilization Report',
            data: response.data || [],
            summary: response.summary,
            generatedAt: new Date().toISOString(),
            filters: finalFilters
          }
        },
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate utilization report'
      set({ error: message, loading: false })
    }
  },

  // Request Reports
  generateRequestReport: async (filters: Partial<ReportFilters> = {}) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = get().currentFilters
      const finalFilters: ReportFilters = {
        startDate: filters.startDate ?? currentFilters.startDate ?? '',
        endDate: filters.endDate ?? currentFilters.endDate ?? '',
        department: filters.department ?? currentFilters.department,
        category: filters.category ?? currentFilters.category,
        location: filters.location ?? currentFilters.location,
        status: filters.status ?? currentFilters.status,
        priority: filters.priority ?? currentFilters.priority,
        type: filters.type ?? currentFilters.type,
      }
      const response = await reportService.generateRequestReport(finalFilters)
      set(state => ({
        reports: {
          ...state.reports,
          requests: {
            title: 'Request Report',
            data: response.data || [],
            summary: response.summary,
            generatedAt: new Date().toISOString(),
            filters: finalFilters
          }
        },
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate request report'
      set({ error: message, loading: false })
    }
  },

  generateRequestAnalytics: async (period = 'month') => {
    set({ loading: true, error: null })
    try {
      const response = await reportService.getRequestAnalytics(period)
      set(state => ({
        reports: {
          ...state.reports,
          requestAnalytics: {
            title: 'Request Analytics',
            data: response.data || [],
            summary: response.summary,
            chartData: response.chartData,
            generatedAt: new Date().toISOString(),
            filters: { startDate: '', endDate: '', type: 'analytics' }
          }
        },
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate request analytics'
      set({ error: message, loading: false })
    }
  },

  // Maintenance Reports
  generateMaintenanceReport: async (filters: Partial<ReportFilters> = {}) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = get().currentFilters
      const finalFilters: ReportFilters = {
        startDate: filters.startDate ?? currentFilters.startDate ?? '',
        endDate: filters.endDate ?? currentFilters.endDate ?? '',
        department: filters.department ?? currentFilters.department,
        category: filters.category ?? currentFilters.category,
        location: filters.location ?? currentFilters.location,
        status: filters.status ?? currentFilters.status,
        priority: filters.priority ?? currentFilters.priority,
        type: filters.type ?? currentFilters.type,
      }
      const response = await reportService.generateMaintenanceReport(finalFilters)
      set(state => ({
        reports: {
          ...state.reports,
          maintenance: {
            title: 'Maintenance Report',
            data: response.data || [],
            summary: response.summary,
            generatedAt: new Date().toISOString(),
            filters: finalFilters
          }
        },
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate maintenance report'
      set({ error: message, loading: false })
    }
  },

  generateMaintenanceCostReport: async (filters: Partial<ReportFilters> = {}) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = get().currentFilters
      const finalFilters: ReportFilters = {
        startDate: filters.startDate ?? currentFilters.startDate ?? '',
        endDate: filters.endDate ?? currentFilters.endDate ?? '',
        department: filters.department ?? currentFilters.department,
        category: filters.category ?? currentFilters.category,
        location: filters.location ?? currentFilters.location,
        status: filters.status ?? currentFilters.status,
        priority: filters.priority ?? currentFilters.priority,
        type: filters.type ?? currentFilters.type,
      }
      const response = await reportService.getMaintenanceCostReport(finalFilters)
      set(state => ({
        reports: {
          ...state.reports,
          maintenanceCost: {
            title: 'Maintenance Cost Report',
            data: response.data || [],
            summary: response.summary,
            generatedAt: new Date().toISOString(),
            filters: finalFilters
          }
        },
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate maintenance cost report'
      set({ error: message, loading: false })
    }
  },

  // Financial Reports
  generateFinancialSummary: async (filters: Partial<ReportFilters> = {}) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = get().currentFilters
      const finalFilters: ReportFilters = {
        startDate: filters.startDate ?? currentFilters.startDate ?? '',
        endDate: filters.endDate ?? currentFilters.endDate ?? '',
        department: filters.department ?? currentFilters.department,
        category: filters.category ?? currentFilters.category,
        location: filters.location ?? currentFilters.location,
        status: filters.status ?? currentFilters.status,
        priority: filters.priority ?? currentFilters.priority,
        type: filters.type ?? currentFilters.type,
      }
      const response = await reportService.generateFinancialSummary(finalFilters)
      set(state => ({
        reports: {
          ...state.reports,
          financial: {
            title: 'Financial Summary',
            data: response.data || [],
            summary: response.summary,
            generatedAt: new Date().toISOString(),
            filters: finalFilters
          }
        },
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate financial summary'
      set({ error: message, loading: false })
    }
  },

  generateAssetValueReport: async (filters: Partial<ReportFilters> = {}) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = get().currentFilters
      const finalFilters: ReportFilters = {
        startDate: filters.startDate ?? currentFilters.startDate ?? '',
        endDate: filters.endDate ?? currentFilters.endDate ?? '',
        department: filters.department ?? currentFilters.department,
        category: filters.category ?? currentFilters.category,
        location: filters.location ?? currentFilters.location,
        status: filters.status ?? currentFilters.status,
        priority: filters.priority ?? currentFilters.priority,
        type: filters.type ?? currentFilters.type,
      }
      const response = await reportService.getAssetValueReport(finalFilters)
      set(state => ({
        reports: {
          ...state.reports,
          assetValue: {
            title: 'Asset Value Report',
            data: response.data || [],
            summary: response.summary,
            generatedAt: new Date().toISOString(),
            filters: finalFilters
          }
        },
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate asset value report'
      set({ error: message, loading: false })
    }
  },

  // Department Reports
  generateDepartmentReport: async (filters: Partial<ReportFilters> = {}) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = get().currentFilters
      const finalFilters: ReportFilters = {
        startDate: filters.startDate ?? currentFilters.startDate ?? '',
        endDate: filters.endDate ?? currentFilters.endDate ?? '',
        department: filters.department ?? currentFilters.department,
        category: filters.category ?? currentFilters.category,
        location: filters.location ?? currentFilters.location,
        status: filters.status ?? currentFilters.status,
        priority: filters.priority ?? currentFilters.priority,
        type: filters.type ?? currentFilters.type,
      }
      const response = await reportService.getDepartmentReport(finalFilters)
      set(state => ({
        reports: {
          ...state.reports,
          department: {
            title: 'Department Report',
            data: response.data || [],
            summary: response.summary,
            generatedAt: new Date().toISOString(),
            filters: finalFilters
          }
        },
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate department report'
      set({ error: message, loading: false })
    }
  },

  // Executive Reports
  fetchExecutiveSummary: async (period = 'month') => {
    set({ loading: true, error: null })
    try {
      const response = await reportService.getExecutiveSummary(period)
      set({ executiveSummary: response.data || {}, loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch executive summary'
      set({ error: message, loading: false })
    }
  },

  fetchKPIMetrics: async (period = 'month') => {
    set({ loading: true, error: null })
    try {
      const response = await reportService.getKPIMetrics(period)
      set({ kpiMetrics: response.data || {}, loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch KPI metrics'
      set({ error: message, loading: false })
    }
  },

  // Chart Data
  fetchAssetChartData: async (type = 'category', period = 'month') => {
    try {
      const response = await reportService.getAssetChartData(type, period)
      set(state => ({
        chartData: {
          ...state.chartData,
          [`asset_${type}`]: response.data
        }
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch asset chart data'
      set({ error: message })
    }
  },

  fetchRequestChartData: async (type = 'status', period = 'month') => {
    try {
      const response = await reportService.getRequestChartData(type, period)
      set(state => ({
        chartData: {
          ...state.chartData,
          [`request_${type}`]: response.data
        }
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch request chart data'
      set({ error: message })
    }
  },

  fetchMaintenanceChartData: async (type = 'cost', period = 'month') => {
    try {
      const response = await reportService.getMaintenanceChartData(type, period)
      set(state => ({
        chartData: {
          ...state.chartData,
          [`maintenance_${type}`]: response.data
        }
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch maintenance chart data'
      set({ error: message })
    }
  },

  fetchFinancialChartData: async (type = 'value', period = 'month') => {
    try {
      const response = await reportService.getFinancialChartData(type, period)
      set(state => ({
        chartData: {
          ...state.chartData,
          [`financial_${type}`]: response.data
        }
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch financial chart data'
      set({ error: message })
    }
  },

  // Export Functions
  exportReport: async (type: string, format = 'csv', filters: Partial<ReportFilters> = {}) => {
    try {
      let blob
      const currentFilters = get().currentFilters
      const finalFilters: ReportFilters = {
        startDate: filters.startDate ?? currentFilters.startDate ?? '',
        endDate: filters.endDate ?? currentFilters.endDate ?? '',
        department: filters.department ?? currentFilters.department,
        category: filters.category ?? currentFilters.category,
        location: filters.location ?? currentFilters.location,
        status: filters.status ?? currentFilters.status,
        priority: filters.priority ?? currentFilters.priority,
        type: filters.type ?? currentFilters.type,
      }
      
      switch (type) {
        case 'asset':
          blob = await reportService.exportAssetReport(format, finalFilters)
          break
        case 'request':
          blob = await reportService.exportRequestReport(format, finalFilters)
          break
        case 'maintenance':
          blob = await reportService.exportMaintenanceReport(format, finalFilters)
          break
        case 'financial':
          blob = await reportService.exportFinancialReport(format, finalFilters)
          break
        default:
          throw new Error('Unknown report type')
      }
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export report'
      set({ error: message })
    }
  },

  // Scheduled Reports
  fetchScheduledReports: async () => {
    set({ loading: true, error: null })
    try {
      const response = await reportService.getScheduledReports()
      set({ scheduledReports: response.data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch scheduled reports'
      set({ error: message, loading: false })
    }
  },

  createScheduledReport: async (reportData) => {
    set({ loading: true, error: null })
    try {
      const response = await reportService.createScheduledReport(reportData)
      set(state => ({
        scheduledReports: [...state.scheduledReports, response.data],
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create scheduled report'
      set({ error: message, loading: false })
    }
  },

  updateScheduledReport: async (id, reportData) => {
    set({ loading: true, error: null })
    try {
      const response = await reportService.updateScheduledReport(id, reportData)
      set(state => ({
        scheduledReports: state.scheduledReports.map(report =>
          report.id === id ? response.data : report
        ),
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update scheduled report'
      set({ error: message, loading: false })
    }
  },

  deleteScheduledReport: async (id) => {
    set({ loading: true, error: null })
    try {
      await reportService.deleteScheduledReport(id)
      set(state => ({
        scheduledReports: state.scheduledReports.filter(report => report.id !== id),
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete scheduled report'
      set({ error: message, loading: false })
    }
  },

  // Templates
  fetchReportTemplates: async () => {
    set({ loading: true, error: null })
    try {
      const response = await reportService.getReportTemplates()
      set({ templates: response.data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch report templates'
      set({ error: message, loading: false })
    }
  },

  createReportTemplate: async (templateData) => {
    set({ loading: true, error: null })
    try {
      const response = await reportService.createReportTemplate(templateData)
      set(state => ({
        templates: [...state.templates, response.data],
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create report template'
      set({ error: message, loading: false })
    }
  },

  updateReportTemplate: async (id, templateData) => {
    set({ loading: true, error: null })
    try {
      const response = await reportService.updateReportTemplate(id, templateData)
      set(state => ({
        templates: state.templates.map(template =>
          template.id === id ? response.data : template
        ),
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update report template'
      set({ error: message, loading: false })
    }
  },

  deleteReportTemplate: async (id) => {
    set({ loading: true, error: null })
    try {
      await reportService.deleteReportTemplate(id)
      set(state => ({
        templates: state.templates.filter(template => template.id !== id),
        loading: false
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete report template'
      set({ error: message, loading: false })
    }
  },

  // State Management
  setFilters: (filters) => set({ currentFilters: filters }),
  setPeriod: (period) => set({ selectedPeriod: period }),
  setActiveReportType: (type) => set({ activeReportType: type }),
  clearReports: () => set({ reports: {}, chartData: {} }),

  getReportByType: (type) => {
    const { reports } = get()
    return reports[type] || null
  },

  getFilteredReports: () => {
    const { reports } = get()
    return Object.values(reports)
  }
}))
