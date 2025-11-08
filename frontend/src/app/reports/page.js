'use client'

import { useState, useEffect } from 'react'
import { useReportStore, useDepartmentStore } from '@/stores'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import {
  FileText,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Wrench,
  Activity,
  RefreshCw,
  Clock,
  X
} from 'lucide-react'

const ReportsPage = () => {
  const {
    loading,
    error,
    currentFilters,
    selectedPeriod,
    kpiMetrics,
    executiveSummary,
    generateAssetReport,
    generateDepreciationReport,
    generateUtilizationReport,
    generateRequestReport,
    generateRequestAnalytics,
    generateMaintenanceReport,
    generateMaintenanceCostReport,
    generateFinancialSummary,
    generateAssetValueReport,
    generateDepartmentReport,
    fetchExecutiveSummary,
    fetchKPIMetrics,
    fetchScheduledReports,
    fetchReportTemplates,
    exportReport,
    setFilters,
    setPeriod,
    getReportByType
  } = useReportStore()

  const { departments, fetchDepartments } = useDepartmentStore()

  const [showFilters, setShowFilters] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState('overview')
  const [showScheduledReports, setShowScheduledReports] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    fetchExecutiveSummary()
    fetchKPIMetrics()
    fetchScheduledReports()
    fetchReportTemplates()
    fetchDepartments()
  }, [fetchExecutiveSummary, fetchKPIMetrics, fetchScheduledReports, fetchReportTemplates, fetchDepartments])

  const reportTypes = [
    {
      id: 'overview',
      name: 'Executive Overview',
      icon: TrendingUp,
      color: 'bg-white/600',
      description: 'High-level KPIs and executive summary'
    },
    {
      id: 'assets',
      name: 'Asset Reports',
      icon: Package,
      color: 'bg-white/600',
      description: 'Asset inventory, depreciation, and utilization'
    },
    {
      id: 'requests',
      name: 'Request Reports',
      icon: FileText,
      color: 'bg-white/600',
      description: 'Request analytics and tracking'
    },
    {
      id: 'maintenance',
      name: 'Maintenance Reports',
      icon: Wrench,
      color: 'bg-white/600',
      description: 'Maintenance schedules and costs'
    },
    {
      id: 'financial',
      name: 'Financial Reports',
      icon: DollarSign,
      color: 'bg-white/600',
      description: 'Financial summaries and asset values'
    },
    {
      id: 'department',
      name: 'Department Reports',
      icon: Users,
      color: 'bg-white/600',
      description: 'Department-wise asset allocation'
    }
  ]

  const generateReport = async (type) => {
    switch (type) {
      case 'asset':
        await generateAssetReport()
        break
      case 'depreciation':
        await generateDepreciationReport()
        break
      case 'utilization':
        await generateUtilizationReport()
        break
      case 'requests':
        await generateRequestReport()
        break
      case 'requestAnalytics':
        await generateRequestAnalytics(selectedPeriod)
        break
      case 'maintenance':
        await generateMaintenanceReport()
        break
      case 'maintenanceCost':
        await generateMaintenanceCostReport()
        break
      case 'financial':
        await generateFinancialSummary()
        break
      case 'assetValue':
        await generateAssetValueReport()
        break
      case 'department':
        await generateDepartmentReport()
        break
      default:
        break
    }
  }

  const handleExport = async (type, format = 'csv') => {
    try {
      await exportReport(type, format, currentFilters)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const renderFilters = () => (
    <div className="glass-card p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#111] mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={currentFilters.startDate}
            onChange={(e) => setFilters({ ...currentFilters, startDate: e.target.value })}
            className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111] mb-2">
            End Date
          </label>
          <input
            type="date"
            value={currentFilters.endDate}
            onChange={(e) => setFilters({ ...currentFilters, endDate: e.target.value })}
            className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111] mb-2">
            Department
          </label>
          <select
            value={currentFilters.department || ''}
            onChange={(e) => setFilters({ ...currentFilters, department: e.target.value })}
            className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
          >
            <option value="">All Departments</option>
            {Array.isArray(departments) && departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111] mb-2">
            Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(kpiMetrics).map(([key, value], index) => {
          const icons = [Package, FileText, Wrench, DollarSign]
          const colors = ['bg-white/600', 'bg-white/600', 'bg-white/600', 'bg-white/600']
          const IconComponent = icons[index % icons.length]
          
          return (
            <div key={key} className="glass-card p-6 border border-black/10">
              <div className="flex items-center">
                <div className={`${colors[index % colors.length]} rounded-lg p-3`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#333] capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-2xl font-bold text-[#111]">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Executive Summary */}
      {Object.keys(executiveSummary).length > 0 && (
        <div className="glass-card p-6 border border-black/10">
          <h3 className="text-lg font-semibold text-[#111] mb-4">Executive Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(executiveSummary).map(([key, value]) => (
              <div key={key}>
                <h4 className="text-sm font-medium text-[#333] capitalize mb-2">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm text-[#111]">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderAssetReports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Asset Inventory</h3>
            <Package className="h-5 w-5 text-[#333]" />
          </div>
          <p className="text-sm text-[#333] mb-4">
            Complete asset inventory report with current status and details.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('asset')}
              disabled={loading}
              className="flex-1 glass-button text-white px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate'}
            </button>
            <button
              onClick={() => handleExport('asset')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="glass-card p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Depreciation</h3>
            <TrendingUp className="h-5 w-5 text-[#333]" />
          </div>
          <p className="text-sm text-[#333] mb-4">
            Asset depreciation analysis and current book values.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('depreciation')}
              disabled={loading}
              className="flex-1 glass-button text-white px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate'}
            </button>
            <button
              onClick={() => handleExport('asset', 'xlsx')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="glass-card p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Utilization</h3>
            <Activity className="h-5 w-5 text-[#333]" />
          </div>
          <p className="text-sm text-[#333] mb-4">
            Asset utilization rates and efficiency metrics.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('utilization')}
              disabled={loading}
              className="flex-1 glass-button text-white px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate'}
            </button>
            <button
              onClick={() => handleExport('asset', 'pdf')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Display Generated Report */}
      {getReportByType('asset') && (
        <div className="glass-card p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">
              {getReportByType('asset').title}
            </h3>
            <span className="text-sm text-[#333]">
              Generated: {new Date(getReportByType('asset').generatedAt).toLocaleString()}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/10">
              <thead className="bg-white/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black/10">
                {getReportByType('asset').data.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {item.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {item.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {item.status || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {item.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      ${item.value?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderRequestReports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Request Report</h3>
            <FileText className="h-5 w-5 text-[#333]" />
          </div>
          <p className="text-sm text-[#333] mb-4">
            Detailed analysis of asset requests and approvals.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('requests')}
              disabled={loading}
              className="flex-1 glass-button text-white px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate'}
            </button>
            <button
              onClick={() => handleExport('request')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="glass-card p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Request Analytics</h3>
            <BarChart3 className="h-5 w-5 text-[#333]" />
          </div>
          <p className="text-sm text-[#333] mb-4">
            Advanced analytics and trends for asset requests.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('requestAnalytics')}
              disabled={loading}
              className="flex-1 glass-button text-white px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate'}
            </button>
            <button
              onClick={() => handleExport('request', 'xlsx')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMaintenanceReports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Maintenance Report</h3>
            <Wrench className="h-5 w-5 text-[#333]" />
          </div>
          <p className="text-sm text-[#333] mb-4">
            Comprehensive maintenance activities and schedules.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('maintenance')}
              disabled={loading}
              className="flex-1 glass-button text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate'}
            </button>
            <button
              onClick={() => handleExport('maintenance')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="glass-card p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Cost Analysis</h3>
            <DollarSign className="h-5 w-5 text-[#333]" />
          </div>
          <p className="text-sm text-[#333] mb-4">
            Maintenance cost breakdown and budget analysis.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('maintenanceCost')}
              disabled={loading}
              className="flex-1 glass-button text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate'}
            </button>
            <button
              onClick={() => handleExport('maintenance', 'xlsx')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFinancialReports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Financial Summary</h3>
            <DollarSign className="h-5 w-5 text-[#333]" />
          </div>
          <p className="text-sm text-[#333] mb-4">
            Complete financial overview of asset portfolio.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('financial')}
              disabled={loading}
              className="flex-1 glass-button text-white px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate'}
            </button>
            <button
              onClick={() => handleExport('financial')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="glass-card p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Asset Values</h3>
            <TrendingUp className="h-5 w-5 text-[#333]" />
          </div>
          <p className="text-sm text-[#333] mb-4">
            Current and historical asset value analysis.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('assetValue')}
              disabled={loading}
              className="flex-1 glass-button text-white px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate'}
            </button>
            <button
              onClick={() => handleExport('financial', 'xlsx')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDepartmentReports = () => (
    <div className="space-y-6">
      <div className="glass-card p-6 border border-black/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#111]">Department Analysis</h3>
          <Users className="h-5 w-5 text-[#333]" />
        </div>
        <p className="text-sm text-[#333] mb-4">
          Asset allocation and utilization by department.
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => generateReport('department')}
            disabled={loading}
            className="glass-button text-white px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate Report'}
          </button>
          <button
            onClick={() => handleExport('department')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (selectedReportType) {
      case 'overview':
        return renderOverview()
      case 'assets':
        return renderAssetReports()
      case 'requests':
        return renderRequestReports()
      case 'maintenance':
        return renderMaintenanceReports()
      case 'financial':
        return renderFinancialReports()
      case 'department':
        return renderDepartmentReports()
      default:
        return renderOverview()
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white/60 border border-black/10 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-[#111]" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-[#111]">Error</h3>
              <div className="mt-2 text-sm text-[#111]">
                {error}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Reports & Analytics</h1>
          <p className="text-[#333]">
            Generate comprehensive reports and analytics for asset management
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-black/10 rounded-lg text-sm font-medium text-[#111] bg-white hover:bg-white/60"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={() => setShowScheduledReports(!showScheduledReports)}
            className="inline-flex items-center px-4 py-2 border border-black/10 rounded-lg text-sm font-medium text-[#111] bg-white hover:bg-white/60"
          >
            <Clock className="h-4 w-4 mr-2" />
            Scheduled
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
          >
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && renderFilters()}

      {/* Report Type Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {reportTypes.map((type) => {
          const IconComponent = type.icon
          return (
            <button
              key={type.id}
              onClick={() => setSelectedReportType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedReportType === type.id
                  ? 'border-black/10 bg-white/60'
                  : 'border-black/10 bg-white hover:bg-white/40'
              }`}
            >
              <div className={`${type.color} rounded-lg p-3 mx-auto w-fit mb-2`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-[#111] mb-1">{type.name}</h3>
              <p className="text-xs text-[#333]">{type.description}</p>
            </button>
          )
        })}
      </div>

      {/* Report Content */}
      {renderContent()}
      </div>
    </DashboardLayout>
  )
}

export default ReportsPage
