'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useInventoryStore, useUserStore } from '@/stores'
import { toast } from '@/hooks/useToast'

export default function ManageLoansPage() {
  const { loans, loansLoading, fetchLoans, createLoan, returnLoan } = useInventoryStore()
  const { inventories, fetchInventories } = useInventoryStore()
  const { users, fetchUsers } = useUserStore()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ inventoryId: '', borrowerId: '', responsibleId: '', purpose: '', quantity: 1, expectedReturnDate: '' })

  useEffect(() => {
    fetchLoans()
    fetchInventories()
    fetchUsers()
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
        borrowerId: form.borrowerId,
        responsibleId: form.responsibleId,
        purpose: form.purpose,
        quantity: Number(form.quantity || 1),
        expectedReturnDate: form.expectedReturnDate
      })
      toast.success('Loan created')
      setForm({ inventoryId: '', borrowerId: '', responsibleId: '', purpose: '', quantity: 1, expectedReturnDate: '' })
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
        <div className="glass-card p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Manage Loans</h2>
            <button onClick={() => setShowCreate((s) => !s)} className="bg-blue-600 text-white px-3 py-1 rounded">{showCreate ? 'Close' : 'Create Loan'}</button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">Inventory</label>
                <select name="inventoryId" value={form.inventoryId} onChange={handleChange} className="mt-1 block w-full border rounded p-2" required>
                  <option value="">Select inventory</option>
                  {inventories.map((i) => (
                    <option key={i.id} value={i.id}>{i.inventoryTag} — {i.asset?.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Borrower</label>
                <select name="borrowerId" value={form.borrowerId} onChange={handleChange} className="mt-1 block w-full border rounded p-2" required>
                  <option value="">Select borrower</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Responsible</label>
                <select name="responsibleId" value={form.responsibleId} onChange={handleChange} className="mt-1 block w-full border rounded p-2" required>
                  <option value="">Select responsible</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Purpose</label>
                <input name="purpose" value={form.purpose} onChange={handleChange} className="mt-1 block w-full border rounded p-2" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Quantity</label>
                  <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Expected Return</label>
                  <input name="expectedReturnDate" type="date" value={form.expectedReturnDate} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
                </div>
              </div>
              <div>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create Loan</button>
              </div>
            </form>
          )}

        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-3">Loans</h3>
          {loansLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th>Loan#</th>
                    <th>Inventory</th>
                    <th>Borrower</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1">{l.loanNumber}</td>
                      <td className="px-2 py-1">{l.inventory?.inventoryTag} — {l.inventory?.asset?.name}</td>
                      <td className="px-2 py-1">{l.borrower?.firstName} {l.borrower?.lastName}</td>
                      <td className="px-2 py-1">{l.quantity}</td>
                      <td className="px-2 py-1">{l.status}</td>
                      <td className="px-2 py-1">
                        {l.status === 'ACTIVE' && (
                          <button onClick={() => handleReturn(l.id)} className="text-sm text-blue-600">Return</button>
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
