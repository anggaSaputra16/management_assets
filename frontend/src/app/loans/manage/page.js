'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useInventoryStore, useEmployeeStore } from '@/stores'
import { toast } from '@/hooks/useToast'

export default function ManageLoansPage() {
  const { loans, loansLoading, fetchLoans, createLoan, returnLoan } = useInventoryStore()
  const { inventories, fetchInventories } = useInventoryStore()
  const { employees, fetchEmployees } = useEmployeeStore()
  const [filterTerm, setFilterTerm] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ inventoryId: '', borrowerEmployeeId: '', responsibleEmployeeId: '', purpose: '', quantity: 1, expectedReturnDate: '' })

  useEffect(() => {
    fetchLoans()
    fetchInventories()
    fetchEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createLoan({
        inventoryId: form.inventoryId,
        borrowerEmployeeId: form.borrowerEmployeeId,
        responsibleEmployeeId: form.responsibleEmployeeId,
        purpose: form.purpose,
        quantity: Number(form.quantity || 1),
        expectedReturnDate: form.expectedReturnDate
      })
      toast.success('Loan created')
      setForm({ inventoryId: '', borrowerEmployeeId: '', responsibleEmployeeId: '', purpose: '', quantity: 1, expectedReturnDate: '' })
      setShowCreate(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to create loan')
    }
  }

  const handleReturn = async (id) => {
    const notes = window.prompt('Return notes (optional)') || ''
    try {
      await returnLoan(id, { notes })
      toast.success('Loan returned')
    } catch (err) {
      console.error(err)
      toast.error('Failed to return loan')
    }
  }

  return (
    <DashboardLayout title="Manage Loans">
      <div className="space-y-6">
        <div className="glass-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#111]">Manage Loans</h2>
            <button onClick={() => setShowCreate((s) => !s)} className="glass-button px-4 py-2 rounded-lg text-[#111] hover:scale-105 transition-transform">
              {showCreate ? 'Close' : 'Create Loan'}
            </button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">Inventory</label>
                <select name="inventoryId" value={form.inventoryId} onChange={handleChange} className="glass-input w-full px-3 py-2 rounded-lg text-[#111]" required>
                  <option value="">Select inventory</option>
                  {inventories
                    .filter((i) => !(i.loans && i.loans.some((l) => l.status === 'ACTIVE')))
                    .map((i) => (
                      <option key={i.id} value={i.id}>{i.inventoryTag} — {i.asset?.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">Borrower (Employee)</label>
                <select name="borrowerEmployeeId" value={form.borrowerEmployeeId} onChange={handleChange} className="glass-input w-full px-3 py-2 rounded-lg text-[#111]" required>
                  <option value="">Select borrower employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.npk} - {e.firstName} {e.lastName} {e.position ? `(${e.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">Responsible (Employee)</label>
                <select name="responsibleEmployeeId" value={form.responsibleEmployeeId} onChange={handleChange} className="glass-input w-full px-3 py-2 rounded-lg text-[#111]" required>
                  <option value="">Select responsible employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.npk} - {e.firstName} {e.lastName} {e.position ? `(${e.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">Purpose</label>
                <input name="purpose" value={form.purpose} onChange={handleChange} className="glass-input w-full px-3 py-2 rounded-lg text-[#111]" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">Quantity</label>
                  <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} className="glass-input w-full px-3 py-2 rounded-lg text-[#111]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">Expected Return</label>
                  <input name="expectedReturnDate" type="date" value={form.expectedReturnDate} onChange={handleChange} className="glass-input w-full px-3 py-2 rounded-lg text-[#111]" />
                </div>
              </div>
              <div>
                <button type="submit" className="glass-button px-6 py-2 rounded-lg text-[#111] hover:scale-105 transition-transform">Create Loan</button>
              </div>
            </form>
          )}
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">Loans</h3>
            <div className="w-1/3">
              <input
                type="text"
                placeholder="Search loans (loan#, inventory, borrower, requester, status...)"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-lg text-[#111]"
              />
            </div>
          </div>
          {loansLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
            </div>
          ) : (
            <div className="glass-table overflow-x-auto rounded-xl">
              <table className="min-w-full">
                <thead className="bg-white/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-[#111] font-semibold">Loan#</th>
                    <th className="px-4 py-3 text-left text-[#111] font-semibold">Inventory</th>
                    <th className="px-4 py-3 text-left text-[#111] font-semibold">Borrower</th>
                    <th className="px-4 py-3 text-left text-[#111] font-semibold">Requested By</th>
                    <th className="px-4 py-3 text-left text-[#111] font-semibold">Expected Return</th>
                    <th className="px-4 py-3 text-left text-[#111] font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-left text-[#111] font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-[#111] font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {(filterTerm ? loans.filter((l) => {
                    const ft = filterTerm.toLowerCase()
                    return (
                      (l.loanNumber || '').toLowerCase().includes(ft) ||
                      (l.inventory?.inventoryTag || '').toLowerCase().includes(ft) ||
                      (l.inventory?.asset?.name || '').toLowerCase().includes(ft) ||
                      (l.borrowerEmployee?.npk || '').toLowerCase().includes(ft) ||
                      (l.borrowerEmployee?.firstName || '').toLowerCase().includes(ft) ||
                      (l.borrowerEmployee?.lastName || '').toLowerCase().includes(ft) ||
                      (l.requestedBy?.firstName || '').toLowerCase().includes(ft) ||
                      (l.requestedBy?.lastName || '').toLowerCase().includes(ft) ||
                      (l.requestedBy?.email || '').toLowerCase().includes(ft) ||
                      (l.status || '').toLowerCase().includes(ft) ||
                      (l.expectedReturnDate ? new Date(l.expectedReturnDate).toLocaleDateString().toLowerCase().includes(ft) : false)
                    )
                  }) : loans).map((l) => (
                    <tr key={l.id} className="hover:bg-white/40">
                      <td className="px-4 py-3 text-[#111]">{l.loanNumber}</td>
                      <td className="px-4 py-3 text-[#111]">{l.inventory?.inventoryTag} — {l.inventory?.asset?.name}</td>
                      <td className="px-4 py-3 text-[#111]">
                        {l.borrowerEmployee ? `${l.borrowerEmployee.npk} - ${l.borrowerEmployee.firstName} ${l.borrowerEmployee.lastName}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-[#111]">
                        {l.requestedBy ? `${l.requestedBy.firstName} ${l.requestedBy.lastName} ${l.requestedBy.email ? `(${l.requestedBy.email})` : ''}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-[#111]">{l.expectedReturnDate ? new Date(l.expectedReturnDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-[#111]">{l.quantity}</td>
                      <td className="px-4 py-3 text-[#111]">{l.status}</td>
                      <td className="px-4 py-3">
                        {l.status === 'ACTIVE' && (
                          <button onClick={() => handleReturn(l.id)} className="glass-button px-3 py-1 rounded-lg text-[#111] hover:scale-105 transition-transform">Return</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
