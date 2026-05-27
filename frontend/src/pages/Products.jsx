import { useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

//default function
const EMPTY = { name: '', price: '', discount: '0', availability: '100', description: '', category: '' }

//popup component used for creating and editing. 
function Modal({ title, data, onSave, onClose }) {
    const [form, setForm] = useState(data)

    const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>

                <div className="space-y-3">
                    {[
                        ['name', 'Product Name', 'text'],
                        ['price', 'Price (₹)', 'number'],
                        ['discount', 'Discount (%)', 'number'],
                        ['availability', 'Stock', 'number'],
                        ['category', 'Category', 'text'],
                    ].map(([key, label, type]) => (
                        <div key={key}>
                            <label className="text-sm text-gray-600 block mb-1">{label}</label>
                            <input
                                type={type}
                                value={form[key]}
                                onChange={e => set(key, e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={3}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                        />
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


export default function Products() {
    const [products, setProducts] = useState([])
    const [modal, setModal] = useState(null)
    const [deleting, setDeleting] = useState(null)

    const load = () => getProducts().then(r => setProducts(r.data)).catch(() => { })
    useEffect(() => { load() }, [])

    const handleSave = async (form) => {
        const data = {
            ...form,
            price: parseFloat(form.price),
            discount: parseFloat(form.discount),
            availability: parseInt(form.availability)
        }
        if (modal.mode === 'create') await createProduct(data)
        else await updateProduct(modal.data.id, data)
        setModal(null)
        load()
    }

    const handleDelete = async (id) => {
        await deleteProduct(id)
        setDeleting(null)
        load()
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">Products</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{products.length} products in catalogue</p>
                </div>
                <button
                    onClick={() => setModal({ mode: 'create', data: { ...EMPTY } })}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                    <Plus size={16} /> Add Product
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {products.map(p => {
                    const discounted = p.price - (p.price * p.discount / 100)
                    return (
                        <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{p.category}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setModal({ mode: 'edit', data: p })} className="text-gray-400 hover:text-gray-600"><Pencil size={14} /></button>
                                    <button onClick={() => setDeleting(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h3 className="font-medium text-gray-800 mb-1">{p.name}</h3>
                            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{p.description}</p>
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-gray-800">₹{discounted.toFixed(0)}</span>
                                    {p.discount > 0 && (
                                        <>
                                            <span className="text-xs text-gray-400 line-through ml-1">₹{p.price}</span>
                                            <span className="text-xs text-emerald-500 ml-1">{p.discount}% off</span>
                                        </>
                                    )}
                                </div>
                                <span className={`text-xs ${p.availability > 10 ? 'text-emerald-500' : 'text-red-400'}`}>
                                    {p.availability} in stock
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {products.length === 0 && (
                <div className="text-center py-16 text-gray-400 text-sm">No products yet. Add your first product.</div>
            )}

            {modal && (
                <Modal
                    title={modal.mode === 'create' ? 'Add Product' : 'Edit Product'}
                    data={modal.data}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}

            {deleting && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-80 text-center">
                        <p className="text-gray-700 mb-4">Delete this product?</p>
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