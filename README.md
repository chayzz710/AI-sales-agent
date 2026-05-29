# AI Sales Agent

A voice-based AI sales platform built for a hackathon. The agent (Alex) calls customers, pitches products, handles objections, and logs every conversation to a dashboard — all in real time.

**Live demo:** https://ai-sales-agent-delta.vercel.app  
**API:** https://ai-sales-agent-production-5a92.up.railway.app/docs

---

## Pipeline

```
Customer speaks → Groq Whisper (ASR) → Llama 3.3 70B (LLM) → gTTS (TTS) → Agent speaks
```

Every turn of the conversation goes through this pipeline in under 3 seconds. The LLM receives the full conversation history on each turn so the agent maintains context throughout the call.

For phone calls, the same LLM pipeline runs through Twilio — Twilio handles ASR and TTS natively, and our backend drives the conversation logic via webhooks.

## What it does

- Holds a full voice conversation with a customer using the browser microphone
- Transcribes speech via Groq Whisper, generates replies via Llama 3.3 70B, speaks back via gTTS
- Detects when the customer wants to end the call and auto-generates a summary and outcome classification
- Architected for Twilio outbound calling — webhook routes built, same LLM pipeline runs over phone via Twilio ASR/TTS
- Tracks everything in a dashboard — revenue, conversion rates, call logs, full transcripts
- Manage products, inventory, and a customer CRM from the same interface

## Stack

- **Backend** — Python, FastAPI, MongoDB Atlas, deployed on Railway
- **Frontend** — React, Tailwind CSS, Recharts, deployed on Vercel
- **ASR** — Groq Whisper Large V3 (web) / Twilio Speech Recognition (phone)
- **LLM** — Groq Llama 3.3 70B
- **TTS** — gTTS (web) / Twilio Polly (phone)
- **Phone calls** — Twilio (outbound calling via webhooks)

## Running locally

You need Python 3.12+, Node.js 18+, MongoDB, and a free Groq API key from console.groq.com.

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # add your GROQ_API_KEY and MONGODB_URI
python seed.py
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in Chrome (Web Speech API requires Chrome).

## Project structure

    sales-ai/
    ├── backend/
    │   ├── agent.py             # Groq conversation + summarization logic
    │   ├── routes/
    │   │   ├── calls.py         # live session management, ASR, TTS
    │   │   ├── twilio_routes.py # outbound phone call webhooks
    │   │   ├── analytics.py     # dashboard data
    │   │   ├── products.py
    │   │   └── customers.py
    │   └── seed.py
    └── frontend/
        └── src/
            ├── pages/
            │   ├── Agent.jsx    # voice call interface
            │   ├── Dashboard.jsx
            │   ├── CallLogs.jsx
            │   ├── Products.jsx
            │   └── Customers.jsx
            └── hooks/
                └── useVoiceAgent.js