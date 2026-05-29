# AI Sales Agent

A voice-based AI sales platform built for a hackathon. The agent (Alex) calls customers, pitches products, handles objections, and logs every conversation to a dashboard — all in real time.

**Live demo:** https://ai-sales-agent-delta.vercel.app  
**API:** https://ai-sales-agent-production-5a92.up.railway.app/docs

---

## What it does

- Holds a full voice conversation with a customer using the browser microphone
- Transcribes speech via Groq Whisper, generates replies via Llama 3.3 70B, speaks back via gTTS
- Detects when the customer wants to end the call and auto-generates a summary + outcome
- Tracks everything in a dashboard — revenue, conversion rates, call logs, transcripts
- Manage products, inventory, and a customer CRM from the same interface

## Stack

- **Backend** — Python, FastAPI, MongoDB Atlas, deployed on Railway
- **Frontend** — React, Tailwind CSS, Recharts, deployed on Vercel
- **AI** — Groq (Llama 3.3 70B for conversation, Whisper Large V3 for transcription)

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
    │   ├── agent.py             # Groq conversation logic
    │   ├── routes/
    │   │   ├── calls.py         # live session management
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