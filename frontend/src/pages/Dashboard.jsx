import { useEffect, useState } from 'react'
import { getSummary, getMonthlyRevenue, getMonthlyCalls, getTopProducts } from '../api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { PhoneCall, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={22} className="text-white" />
            </div>
            <div>
                <div className="text-sm text-gray-500">{label}</div>
                <div className="text-2xl font-semibold text-gray-800">{value}</div>
            </div>
        </div>
    )
}

export default function Dashboard() {
    const [summary, setSummary] = useState(null)
    const [revenue, setRevenue] = useState([])
    const [calls, setCalls] = useState([])
    const [topProducts, setTopProducts] = useState([])

    useEffect(() => {
        getSummary().then(r => setSummary(r.data)).catch(() => { })
        getMonthlyRevenue().then(r => setRevenue(r.data)).catch(() => { })
        getMonthlyCalls().then(r => setCalls(r.data)).catch(() => { })
        getTopProducts().then(r => setTopProducts(r.data)).catch(() => { })
    }, [])

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-xl font-semibold text-gray-800 mb-1">Dashboard</h1>
            <p className="text-sm text-gray-500 mb-6">Your sales performance at a glance</p>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <StatCard icon={PhoneCall} label="Total Calls" value={summary?.total_calls ?? '—'} color="bg-indigo-500" />
                <StatCard icon={ShoppingCart} label="Total Sales" value={summary?.total_sales ?? '—'} color="bg-emerald-500" />
                <StatCard icon={TrendingUp} label="Conversion Rate" value={summary ? summary.conversion_rate + '%' : '—'} color="bg-amber-500" />
                <StatCard icon={DollarSign} label="Total Revenue" value={summary ? '₹' + summary.total_revenue.toLocaleString() : '—'} color="bg-blue-500" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-medium text-gray-700 mb-4">Monthly Revenue</h2>
                    {revenue.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={revenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={v => '₹' + v.toLocaleString()} />
                                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-medium text-gray-700 mb-4">Calls vs Conversions</h2>
                    {calls.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={calls}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="total" fill="#e0e7ff" name="Total Calls" />
                                <Bar dataKey="positive" fill="#6366f1" name="Converted" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Outcomes + Top Products */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-medium text-gray-700 mb-4">Call Outcomes</h2>
                    {!summary ? (
                        <div className="text-sm text-gray-400">Loading...</div>
                    ) : (
                        ['positive', 'negative', 'neutral'].map(outcome => {
                            const count = summary.outcomes?.[outcome] ?? 0
                            const pct = summary.total_calls > 0 ? Math.round((count / summary.total_calls) * 100) : 0
                            const colors = { positive: 'bg-emerald-500', negative: 'bg-red-400', neutral: 'bg-amber-400' }
                            return (
                                <div key={outcome} className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="capitalize text-gray-600">{outcome}</span>
                                        <span className="text-gray-400">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full">
                                        <div className={`h-2 rounded-full ${colors[outcome]}`} style={{ width: pct + '%' }} />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-medium text-gray-700 mb-4">Top Products</h2>
                    {topProducts.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-sm text-gray-400">No sales yet</div>
                    ) : (
                        topProducts.map((p, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                <div>
                                    <div className="text-sm font-medium text-gray-800">{p.name}</div>
                                    <div className="text-xs text-gray-400">{p.units} units sold</div>
                                </div>
                                <div className="text-sm font-semibold text-emerald-600">₹{p.revenue.toLocaleString()}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}