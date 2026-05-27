# AI Sales Agent 

An AI-powered cold calling sales platform that holds real-time voice conversations with customers, handles objections, closes sales, and logs everything to a dashboard.

## Demo

The agent (Alex) calls customers, pitches products, listens to responses, handles objections, and detects when the call should end — all autonomously.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Conversation | Groq (Llama 3.3 70B) |
| Speech to Text | Groq (Whisper Large V3) |
| Text to Speech | gTTS (Google TTS) |
| Backend | Python FastAPI |
| Database | MongoDB |
| Frontend | React + Tailwind CSS |

## Features

- Real-time voice conversation with AI agent
- Auto call summary and outcome detection (positive / negative / neutral)
- Full call transcript saved to database
- Sales dashboard with revenue charts and conversion rates
- Product and inventory management
- Customer CRM with call history and acceptance rate tracking
- Call logs with transcript viewer

## Project Structure

    sales-ai/
    ├── backend/
    │   ├── main.py              # FastAPI entry point
    │   ├── database.py          # MongoDB connection
    │   ├── models.py            # Pydantic schemas
    │   ├── agent.py             # Groq conversation logic
    │   ├── seed.py              # Demo data seeder
    │   └── routes/
    │       ├── products.py      # Product CRUD
    │       ├── customers.py     # Customer CRUD
    │       ├── calls.py         # Call sessions + TTS + transcription
    │       └── analytics.py     # Dashboard data
    └── frontend/
        └── src/
            ├── App.jsx          # Router and layout
            ├── api.js           # API client
            ├── components/
            │   └── Sidebar.jsx
            └── pages/
                ├── Dashboard.jsx
                ├── Agent.jsx
                ├── Products.jsx
                ├── Customers.jsx
                └── CallLogs.jsx
## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB
- Groq API key (free at console.groq.com)

### 1. Start MongoDB
"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "C:\data\db"

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder:
GROQ_API_KEY=your_groq_key_here
MONGODB_URI=mongodb://localhost:27017/
DB_NAME=sales_agent

Seed demo data and start the server:

```bash
python seed.py
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in Chrome.

## Usage

1. Go to **Products** and add products you want to sell
2. Go to **Customers** and add customers, linking them to products they are interested in
3. Go to **Sales Agent**, select a customer and product, click **Start Call**
4. Allow microphone access when prompted
5. The agent will speak the opening pitch — respond naturally
6. Say **"not interested"** or **"bye"** to end the call
7. View call summary, transcript, and stats on the **Dashboard** and **Call Logs** pages

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products/ | List all products |
| POST | /products/ | Create product |
| GET | /customers/ | List all customers |
| POST | /customers/ | Create customer |
| POST | /calls/start | Start a call session |
| POST | /calls/chat | Send message, get reply |
| POST | /calls/transcribe | Transcribe audio via Whisper |
| GET | /calls/speak | Convert text to speech |
| GET | /analytics/summary | Dashboard KPIs |
| GET | /analytics/recent-calls | Recent call logs |
