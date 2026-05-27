import { useEffect, useState } from 'react'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getProducts } from '../api'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const EMPTY = { name: '', phone: '', email: '', notes: '', interested_product_ids: [] }

function Modal({ title, data, products, onSave, onClose }) {
    const [form, setForm] = useState(data)

    const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

    const toggleProduct = (id) => {
        const ids = form.interested_product_ids || []
        set('interested_product_ids', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>

                <div className="space-y-3">
                    {[
                        ['name', 'Name', 'text'],
                        ['phone', 'Phone', 'tel'],
                        ['email', 'Email', 'email'],
                    ].map(([key, label, type]) => (
                        <div key={key}>
                            <label className="text-sm text-gray-600 block mb-1">{label}</label>
                            <input
                                type={type}
                                value={form[key] || ''}
                                onChange={e => set(key, e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Notes</label>
                        <textarea
                            value={form.notes || ''}
                            onChange={e => set('notes', e.target.value)}
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 block mb-2">Interested Products</label>
                        <div className="space-y-2">
                            {products.map(p => (
                                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={(form.interested_product_ids || []).includes(p.id)}
                                        onChange={() => toggleProduct(p.id)}
                                        className="rounded"
                                    />
                                    <span className="text-gray-700">{p.name}</span>
                                    <span className="text-gray-400">₹{p.price}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
                    <button onClick={() => onSave(form)} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
                </div>
            </div>
        </div>
    )
}

export default function Customers() {
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])
    const [modal, setModal] = useState(null)
    const [deleting, setDeleting] = useState(null)

    const load = () => {
        getCustomers().then(r => setCustomers(r.data)).catch(() => { })
        getProducts().then(r => setProducts(r.data)).catch(() => { })
    }

    useEffect(() => { load() }, [])

    const handleSave = async (form) => {
        if (modal.mode === 'create') await createCustomer(form)
        else await updateCustomer(modal.data.id, form)
        setModal(null)
        load()
    }

    const handleDelete = async (id) => {
        await deleteCustomer(id)
        setDeleting(null)
        load()
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">Customers</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{customers.length} customers in CRM</p>
                </div>
                <button
                    onClick={() => setModal({ mode: 'create', data: { ...EMPTY } })}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                    <Plus size={16} /> Add Customer
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {['Name', 'Phone', 'Interested In', 'Total Calls', 'Acceptance Rate', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((c, i) => {
                            const interestedNames = (c.interested_product_ids || [])
                                .map(id => products.find(p => p.id === id)?.name)
                                .filter(Boolean)

                            return (
                                <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {interestedNames.slice(0, 2).map(n => (
                                                <span key={n} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{n}</span>
                                            ))}
                                            {interestedNames.length > 2 && (
                                                <span className="text-xs text-gray-400">+{interestedNames.length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{c.total_calls ?? 0}</td>
                                    <td className="px-4 py-3">
                                        <span className={((c.acceptance_rate ?? 0) > 0.3) ? 'text-emerald-500' : 'text-gray-400'}>
                                            {((c.acceptance_rate ?? 0) * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => setModal({ mode: 'edit', data: c })} className="text-gray-400 hover:text-gray-600"><Pencil size={14} /></button>
                                            <button onClick={() => setDeleting(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {customers.length === 0 && (
                    <div className="text-center py-16 text-gray-400 text-sm">No customers yet. Add your first customer.</div>
                )}
            </div>

            {modal && (
                <Modal
                    title={modal.mode === 'create' ? 'Add Customer' : 'Edit Customer'}
                    data={modal.data}
                    products={products}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}

            {deleting && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-80 text-center">
                        <p className="text-gray-700 mb-4">Delete this customer?</p>
                        <div className="flex justify-center gap-2">
                            <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={() => handleDelete(deleting)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}