import { useEffect, useState, useRef } from 'react'
import { getCustomers, getProducts, startCall, sendMessage, endCall } from '../api'
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react'
import axios from 'axios'


export default function Agent() {
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState('')
    const [selectedProduct, setSelectedProduct] = useState('')

    const [status, setStatus] = useState('idle')
    const [messages, setMessages] = useState([])
    const [sessionId, setSessionId] = useState(null)
    const [callSummary, setCallSummary] = useState(null)
    const [duration, setDuration] = useState(0)
    const [error, setError] = useState(null)

    const timerRef = useRef(null)
    const startTimeRef = useRef(null)
    const sessionIdRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const messagesEndRef = useRef(null)

    useEffect(() => {
        getCustomers().then(r => setCustomers(r.data)).catch(() => { })
        getProducts().then(r => setProducts(r.data)).catch(() => { })
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const addMessage = (role, text) => {
        setMessages(prev => [...prev, { role, text, id: Date.now() }])
    }

    // Speak text using browser speechSynthesis
    const speak = async (text, onDone) => {
        setStatus('speaking')
        try {
            const res = await fetch(`http://localhost:8000/calls/speak?text=${encodeURIComponent(text)}`)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const audio = new Audio(url)
            audio.onended = onDone
            audio.onerror = onDone
            audio.play()
        } catch (e) {
            if (onDone) onDone()
        }
    }

    // Record audio and transcribe via Groq Whisper
    const listenAndTranscribe = async () => {
        setStatus('listening')

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        chunksRef.current = []

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop())
            setStatus('transcribing')

            const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
            const formData = new FormData()
            formData.append('audio', blob, 'recording.webm')

            try {
                const res = await axios.post('http://localhost:8000/calls/transcribe', formData)
                const text = res.data.text?.trim()

                if (!text) {
                    listenAndTranscribe()
                    return
                }

                await doTurn(sessionIdRef.current, text)
            } catch (e) {
                setError('Transcription failed. Please try again.')
                setStatus('idle')
            }
        }

        // Record for 5 seconds then stop
        mediaRecorder.start()
        setTimeout(() => {
            if (mediaRecorder.state === 'recording') mediaRecorder.stop()
        }, 5000)
    }

    const doTurn = async (sid, userText) => {
        addMessage('user', userText)
        setStatus('thinking')

        try {
            const res = await sendMessage({ session_id: sid, user_text: userText })
            const data = res.data
            addMessage('agent', data.reply)

            if (data.end_call) {
                setCallSummary({ outcome: data.outcome, summary: data.summary })
                speak(data.reply, () => {
                    setStatus('ended')
                    clearInterval(timerRef.current)
                })
                return
            }

            speak(data.reply, () => listenAndTranscribe())
        } catch (e) {
            setError('Something went wrong. Please try again.')
            setStatus('idle')
        }
    }

    const handleStartCall = async () => {
        setError(null)
        setMessages([])
        setCallSummary(null)
        setDuration(0)
        setStatus('starting')

        try {
            const res = await startCall({
                customer_id: selectedCustomer || null,
                product_id: selectedProduct || null
            })

            const data = res.data
            setSessionId(data.session_id)
            sessionIdRef.current = data.session_id
            addMessage('agent', data.opening)

            startTimeRef.current = Date.now()
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
            }, 1000)

            speak(data.opening, () => listenAndTranscribe())
        } catch (e) {
            setError('Failed to start call. Is the backend running?')
            setStatus('idle')
        }
    }

    const handleHangUp = async () => {
        window.speechSynthesis.cancel()
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
        clearInterval(timerRef.current)

        try {
            const res = await endCall({
                session_id: sessionIdRef.current,
                duration_seconds: duration
            })
            setCallSummary({ outcome: res.data.outcome, summary: res.data.summary })
        } catch { }

        setStatus('ended')
    }

    const formatDuration = (sec) => {
        const m = String(Math.floor(sec / 60)).padStart(2, '0')
        const s = String(sec % 60).padStart(2, '0')
        return `${m}:${s}`
    }

    const isActive = ['starting', 'listening', 'transcribing', 'thinking', 'speaking'].includes(status)

    const STATUS_INFO = {
        idle: { label: 'Ready', color: 'bg-gray-400' },
        starting: { label: 'Connecting...', color: 'bg-amber-400' },
        listening: { label: 'Listening...', color: 'bg-emerald-500' },
        transcribing: { label: 'Transcribing...', color: 'bg-blue-400' },
        thinking: { label: 'Thinking...', color: 'bg-indigo-500' },
        speaking: { label: 'Speaking...', color: 'bg-indigo-400' },
        ended: { label: 'Call Ended', color: 'bg-red-400' },
    }

    const st = STATUS_INFO[status]

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-xl font-semibold text-gray-800 mb-1">Sales Agent</h1>
            <p className="text-sm text-gray-500 mb-6">Start a voice conversation with a customer</p>

            {/* Config — only show before call starts */}
            {!isActive && status !== 'ended' && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
                    <h2 className="text-sm font-medium text-gray-700 mb-3">Configure Call</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Customer</label>
                            <select
                                value={selectedCustomer}
                                onChange={e => setSelectedCustomer(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                                <option value="">Demo customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Product</label>
                            <select
                                value={selectedProduct}
                                onChange={e => setSelectedProduct(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                                <option value="">Auto select</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Status bar */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full ${st.color} ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-gray-600">{st.label}</span>
                {isActive && (
                    <span className="ml-auto text-sm text-gray-400 font-mono">{formatDuration(duration)}</span>
                )}
            </div>

            {/* Call button */}
            <div className="flex gap-3 mb-6">
                {!isActive && status !== 'ended' ? (
                    <button
                        onClick={handleStartCall}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600"
                    >
                        <Phone size={17} /> Start Call
                    </button>
                ) : isActive ? (
                    <button
                        onClick={handleHangUp}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600"
                    >
                        <PhoneOff size={17} /> Hang Up
                    </button>
                ) : (
                    <button
                        onClick={() => { setStatus('idle'); setMessages([]); setCallSummary(null) }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                    >
                        <Phone size={17} /> New Call
                    </button>
                )}

                {status === 'listening' && (
                    <div className="flex items-center gap-2 text-emerald-500 text-sm">
                        <Mic size={16} className="animate-pulse" /> Recording for 5 seconds...
                    </div>
                )}
                {status === 'speaking' && (
                    <div className="flex items-center gap-2 text-indigo-500 text-sm">
                        <MicOff size={16} /> Agent speaking...
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {/* Transcript */}
            {messages.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
                    <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-500">
                        TRANSCRIPT
                    </div>
                    <div className="p-4 flex flex-col gap-3 max-h-96 overflow-y-auto">
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${m.role === 'agent'
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-indigo-600 text-white'
                                    }`}
                                >
                                    <div className={`text-xs font-semibold mb-1 
                    ${m.role === 'agent' ? 'text-gray-400' : 'text-indigo-200'}`}>
                                        {m.role === 'agent' ? 'Alex (Agent)' : 'You'}
                                    </div>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Call summary */}
            {callSummary && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Call Summary</h3>
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${callSummary.outcome === 'positive' ? 'bg-emerald-50 text-emerald-600' :
                                callSummary.outcome === 'negative' ? 'bg-red-50 text-red-500' :
                                    'bg-amber-50 text-amber-600'}`}>
                            {callSummary.outcome?.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">{formatDuration(duration)} duration</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{callSummary.summary}</p>
                </div>
            )}
        </div>
    )
}