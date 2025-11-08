import { useEffect } from 'react'
import { Search, X, Filter } from 'lucide-react'

// Requests Filter Modal
// Props: open, onClose, searchTerm, setSearchTerm, typeFilter, setTypeFilter,
// statusFilter, setStatusFilter, priorityFilter, setPriorityFilter,
// requestTypes, requestStatuses, priorityLevels, onClearAll
export default function FilterModal({
  open,
  onClose,
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  requestTypes = [],
  requestStatuses = [],
  priorityLevels = [],
  onClearAll
}) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null

  const handleApply = () => {
    onClose?.()
  }

  const handleClear = () => {
    if (onClearAll) onClearAll()
    else {
      setSearchTerm?.('')
      setTypeFilter?.('')
      setStatusFilter?.('')
      setPriorityFilter?.('')
    }
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-4 py-10 sm:py-0">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl glass-card p-4 sm:p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-[#111] flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Request Filters
          </h2>
          <button onClick={onClose} className="glass-button p-2 rounded-lg hover:scale-105 transition-transform" aria-label="Close">
            <X className="h-4 w-4 text-[#111]" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium mb-1 text-[#333]">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#333]" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-[#111]"
              />
            </div>
          </div>

          {/* Type, Status, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-[#333]">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-lg text-[#111]"
              >
                <option value="">All Types</option>
                {requestTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[#333]">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-lg text-[#111]"
              >
                <option value="">All Status</option>
                {requestStatuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1 text-[#333]">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-lg text-[#111]"
              >
                <option value="">All Priorities</option>
                {priorityLevels.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex space-x-2">
              <button
                onClick={handleApply}
                className="glass-button px-4 py-2 rounded-lg text-[#111] font-medium hover:scale-105 transition-transform"
              >
                Apply
              </button>
              <button
                onClick={handleClear}
                className="glass-button px-4 py-2 rounded-lg text-[#111] font-medium hover:scale-105 transition-transform"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-[#333]">Tip: Isi filter lalu tekan Apply untuk menerapkan.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
