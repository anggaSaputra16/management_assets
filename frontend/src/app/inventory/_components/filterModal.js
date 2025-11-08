import { useEffect } from 'react'
import { Search, X, Filter } from 'lucide-react'
export default function FilterModal({
  open,
  onClose,
  companies = [],
  departments = [],
  assetStatuses = [],
  assetConditions = [],
  selectedCompany,
  setSelectedCompany,
  selectedDepartment,
  setSelectedDepartment,
  selectedStatus,
  setSelectedStatus,
  selectedCondition,
  setSelectedCondition,
  searchTerm,
  setSearchTerm,
  onGenerate,
  onClearAll,
  loading
}) {
  // Close on ESC
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleApply = async () => {
    try {
      const maybePromise = onGenerate?.()
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise
      }
    } finally {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-4 py-10 sm:py-0">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl glass-card p-4 sm:p-6 rounded-2xl shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-[#111] flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Inventory Filters
          </h2>
          <button onClick={onClose} className="glass-button p-2 rounded-lg hover:scale-105 transition-transform" aria-label="Close">
            <X className="h-4 w-4 text-[#111]" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Company */}
          <div>
            <label className="block text-xs font-medium mb-1 text-[#333]">Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-lg text-[#111]"
            >
              <option value="">Select Company</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

            {/* Department */}
          <div>
            <label className="block text-xs font-medium mb-1 text-[#333]">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={!selectedCompany}
              className="glass-input w-full px-3 py-2 rounded-lg text-[#111] disabled:opacity-50"
            >
              <option value="">{selectedCompany ? 'Select Department' : 'Select Company First'}</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium mb-1 text-[#333]">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#333]" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-[#111]"
              />
            </div>
          </div>

          {/* Status & Condition Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-[#333]">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-lg text-[#111]"
              >
                <option value="">All Status</option>
                {assetStatuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[#333]">Condition</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-lg text-[#111]"
              >
                <option value="">All Conditions</option>
                {assetConditions.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex space-x-2">
              <button
                onClick={handleApply}
                disabled={loading}
                className="glass-button px-4 py-2 rounded-lg text-[#111] font-medium hover:scale-105 transition-transform disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Apply'}
              </button>
              <button
                onClick={() => { if (onClearAll) onClearAll(); if (onClose) onClose(); }}
                className="glass-button px-4 py-2 rounded-lg text-[#111] font-medium hover:scale-105 transition-transform"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-[#333]">Tip: Pilih Company & Department lalu tekan Apply untuk memuat data.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
