'use client'

import React from 'react'

// FIX: High contrast modal wrapper for consistent high-contrast UI across modals
export default function HighContrastModal({ isOpen, title, onClose, children, className }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className={`w-full max-w-3xl bg-white text-[#111] rounded-lg shadow-2xl ring-1 ring-black/10 ${className || ''}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-white/60 hover:bg-gray-200 text-[#111] text-sm"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6">{children}</div>
      </div>

      {/* backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
    </div>
  )
}
