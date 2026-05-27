import { useEffect, useState } from 'react'
import { getRecentCalls, getCallDetail } from '../api'

const OUTCOME_STYLES = {
    positive: 'bg-emerald-50 text-emerald-600',
    negative: 'bg-red-50 text-red-500',
    neutral: 'bg-amber-50 text-amber-600'
}

export default function CallLogs() {
    const [calls, setCalls] = useState([])
    const [selected, setSelected] = useState(null)
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getRecentCalls()
            .then(r => { setCalls(r.data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const openCall = async (call) => {
        setSelected(call)
        setDetail(null)
        const res = await getCallDetail(call.session_id)
        setDetail(res.data)
    }

    return (
        <div className="flex h-full">

            {/* Left panel - call list */}
            <div className="w-80 border-r border-gray-200 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">Call Logs</h1>
                    <p className="text-xs text-gray-400 mt-0.5">{calls.length} calls recorded</p>
                </div>

                {loading && <div className="p-4 text-sm text-gray-400">Loading...</div>}

                {calls.map(call => (
                    <div
                        key={call.session_id}
                        onClick={() => openCall(call)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
              ${selected?.session_id === call.session_id ? 'bg-indigo-50' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium text-gray-800">{call.customer_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OUTCOME_STYLES[call.outcome] || OUTCOME_STYLES.neutral}`}>
                                {call.outcome}
                            </span>
                        </div>
                        <div className="text-xs text-gray-400">{call.product_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                            {call.timestamp ? new Date(call.timestamp).toLocaleString() : ''}
                        </div>
                    </div>
                ))}

                {!loading && calls.length === 0 && (
                    <div className="p-8 text-center text-sm text-gray-400">
                        No calls yet. Start a call from the Sales Agent page.
                    </div>
                )}
            </div>

            {/* Right panel - transcript */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
                {!selected ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                        Select a call to view the transcript
                    </div>
                ) : (
                    <div className="p-6 max-w-2xl">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">{selected.customer_name}</h2>
                            <div className="text-sm text-gray-400 mt-0.5">
                                {selected.product_name} · {selected.timestamp ? new Date(selected.timestamp).toLocaleString() : ''}
                            </div>
                        </div>

                        {detail?.summary && (
                            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
                                <div className="text-xs font-semibold text-gray-400 mb-2">SUMMARY</div>
                                <p className="text-sm text-gray-700 leading-relaxed">{detail.summary}</p>
                            </div>
                        )}

                        {!detail && (
                            <div className="text-sm text-gray-400">Loading transcript...</div>
                        )}

                        {detail?.history?.filter(m => m.content !== '__START__').map((m, i) => (
                            <div
                                key={i}
                                className={`flex mb-3 ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${m.role === 'assistant'
                                        ? 'bg-white border border-gray-200 text-gray-800'
                                        : 'bg-indigo-600 text-white'
                                    }`}
                                >
                                    <div className={`text-xs font-semibold mb-1 
                    ${m.role === 'assistant' ? 'text-gray-400' : 'text-indigo-200'}`}>
                                        {m.role === 'assistant' ? 'Alex (Agent)' : 'Customer'}
                                    </div>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}