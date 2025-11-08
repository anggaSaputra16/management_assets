'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export default function DataTable({ 
  data = [], 
  columns = [], 
  loading = false, 
  formatCellValue, 
  renderActions,
  searchable = true,
  sortable = true 
}) {
  const [sortKey, setSortKey] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSort = (key) => {
    if (!sortable) return
    
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  // Ensure data is always an array to prevent runtime errors
  const safeData = Array.isArray(data) ? data : [];
  if (!Array.isArray(data)) {
    console.warn('DataTable: data prop is not an array', data);
  }
  const sortedData = [...safeData].sort((a, b) => {
    if (!sortKey) return 0
    
    let aVal = a[sortKey] || ''
    let bVal = b[sortKey] || ''
    
    // Handle nested values (e.g., vendor.name)
    if (sortKey.includes('.')) {
      const keys = sortKey.split('.')
      aVal = keys.reduce((obj, key) => obj?.[key], a) || ''
      bVal = keys.reduce((obj, key) => obj?.[key], b) || ''
    }
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const filteredData = sortedData.filter(item => {
    if (!searchTerm) return true
    
    return columns.some(col => {
      if (col.isAction) return false
      
      let value = item[col.key] || ''
      
      // Handle nested values
      if (col.key.includes('.')) {
        const keys = col.key.split('.')
        value = keys.reduce((obj, key) => obj?.[key], item) || ''
      }
      
      return value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black/10"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6">
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full max-w-md px-4 py-2 rounded-lg"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/10">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left py-3 px-4 font-semibold text-[#111] ${
                    sortable && !col.isAction ? 'cursor-pointer hover:bg-white/60' : ''
                  }`}
                  onClick={() => !col.isAction && handleSort(col.key)}
                >
                  <div className="flex items-center">
                    {col.label}
                    {sortable && !col.isAction && sortKey === col.key && (
                      <div className="ml-1">
                        {sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="text-center py-8 text-[#333]"
                >
                  No data available
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr 
                  key={item.id || index} 
                  className="border-b border-black/10 hover:bg-white/60 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4">
                      {col.isAction ? (
                        renderActions ? renderActions(item) : null
                      ) : formatCellValue ? (
                        formatCellValue(item, col.key)
                      ) : (
                        item[col.key] || 'N/A'
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredData.length > 0 && (
        <div className="mt-4 text-sm text-[#333]">
          Showing {filteredData.length} of {data.length} entries
        </div>
      )}
    </div>
  )
}