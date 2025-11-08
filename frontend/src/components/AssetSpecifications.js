'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'

const AssetSpecifications = ({ asset, onUpdate, readOnly = false }) => {
  const [specifications, setSpecifications] = useState(
    asset?.specifications || {}
  )
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [newSpec, setNewSpec] = useState({ key: '', value: '' })

  const handleAddSpec = () => {
    if (!newSpec.key.trim() || !newSpec.value.trim()) return

    const updatedSpecs = {
      ...specifications,
      [newSpec.key]: newSpec.value
    }

    setSpecifications(updatedSpecs)
    setNewSpec({ key: '', value: '' })
    setShowAddForm(false)

    if (onUpdate) {
      onUpdate({ specifications: updatedSpecs })
    }
  }

  const handleUpdateSpec = (key, value) => {
    const updatedSpecs = { ...specifications }
    delete updatedSpecs[key]
    updatedSpecs[editingKey || key] = value

    setSpecifications(updatedSpecs)
    setEditingKey(null)

    if (onUpdate) {
      onUpdate({ specifications: updatedSpecs })
    }
  }

  const handleDeleteSpec = (key) => {
    const updatedSpecs = { ...specifications }
    delete updatedSpecs[key]

    setSpecifications(updatedSpecs)

    if (onUpdate) {
      onUpdate({ specifications: updatedSpecs })
    }
  }

  const specEntries = Object.entries(specifications || {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[#111]">Specifications</h4>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-[#111] bg-white/60 rounded hover:bg-white/60"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </button>
        )}
      </div>

      {specEntries.length === 0 ? (
        <p className="text-sm text-[#333] italic">No specifications added</p>
      ) : (
        <div className="space-y-2">
          {specEntries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-white/60 rounded">
              {editingKey === key ? (
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    defaultValue={key}
                    onBlur={(e) => {
                      const newKey = e.target.value.trim()
                      if (newKey && newKey !== key) {
                        handleUpdateSpec(key, value)
                      }
                      setEditingKey(null)
                    }}
                    className="flex-1 text-xs border border-black/10 rounded px-2 py-1"
                    autoFocus
                  />
                  <input
                    type="text"
                    defaultValue={value}
                    onBlur={(e) => {
                      handleUpdateSpec(editingKey, e.target.value.trim())
                    }}
                    className="flex-1 text-xs border border-black/10 rounded px-2 py-1"
                  />
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-[#111]">{key}:</span>
                    <span className="text-xs text-[#333] ml-2">{value}</span>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setEditingKey(key)}
                        className="p-1 text-[#333] hover:text-[#111]"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSpec(key)}
                        className="p-1 text-[#333] hover:text-[#111]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="p-3 glass-input rounded-lg bg-white">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Specification name (e.g., CPU, RAM, Storage)"
              value={newSpec.key}
              onChange={(e) => setNewSpec({ ...newSpec, key: e.target.value })}
              className="w-full text-sm border border-black/10 rounded px-3 py-2 focus:ring-2 focus:ring-black/20 focus:border-black/30"
            />
            <input
              type="text"
              placeholder="Value (e.g., Intel i7, 16GB, 512GB SSD)"
              value={newSpec.value}
              onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
              className="w-full text-sm border border-black/10 rounded px-3 py-2 focus:ring-2 focus:ring-black/20 focus:border-black/30"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddSpec()
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewSpec({ key: '', value: '' })
                }}
                className="px-3 py-1 text-sm text-[#333] border border-black/10 rounded hover:bg-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSpec}
                disabled={!newSpec.key.trim() || !newSpec.value.trim()}
                className="px-3 py-1 text-sm glass-button text-white rounded hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetSpecifications