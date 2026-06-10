# SalesBot AI

AI-powered sales automation agent. Enter a company name and target role — three AI agents research the company, write a hyper-personalised cold email, and build a full follow-up sequence in seconds.

---

## Tech Stack

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Frontend   | Next.js 14, TypeScript, Tailwind CSS    |
| Backend    | FastAPI (Python 3.10+)                  |
| Database   | Supabase (PostgreSQL)                   |
| AI         | LangChain + Google Gemini 1.5 Flash     |
| Search     | DuckDuckGo (real-time company research) |

---

## Architecture

```
User
 │
 ▼
Next.js Frontend  ──POST /api/generate-stream──▶  FastAPI Backend
                  ◀── SSE events ─────────────────
                                                    │
                                              ┌─────┴──────┐
                                              │            │
                                        Research      Email Writer
                                         Agent          Agent
                                              │            │
                                          Gemini       Gemini
                                              │            │
                                              └─────┬──────┘
                                                    │
                                              Follow-up Agent
                                                    │
                                                 Gemini
                                                    │
                                               Supabase
```

### Agent Pipeline
1. **Research Agent** — uses Gemini + DuckDuckGo to research the target company
2. **Email Writer Agent** — writes a personalised cold email from the research
3. **Follow-up Agent** — generates a 3-touch follow-up sequence (Days 3, 7, 14)

Progress is streamed to the frontend via **Server-Sent Events** so each agent's status updates in real time.

---

## Project Structure

```
salesbot-ai/
├── backend/
│   ├── agents/
│   │   ├── research_agent.py       # Research Agent (Gemini + DuckDuckGo)
│   │   ├── email_writer_agent.py   # Cold Email Writer Agent
│   │   └── followup_agent.py       # Follow-up Sequence Agent
│   ├── database/
│   │   └── supabase_client.py      # Supabase CRUD helpers
│   ├── models/
│   │   └── schemas.py              # Pydantic request/response models
│   ├── main.py                     # FastAPI app + SSE streaming endpoint
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── page.tsx                # Home — input form
    │   ├── results/page.tsx        # Results — agent progress + emails
    │   └── history/page.tsx        # History — saved campaigns
    ├── components/
    │   ├── Navbar.tsx
    │   ├── AgentProgress.tsx       # Live agent status tracker
    │   └── EmailCard.tsx           # Email viewer with inline edit + copy
    └── lib/
        ├── types.ts                # TypeScript interfaces
        └── api.ts                  # Fetch helpers + SSE consumer
```

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/) account (free Gemini API key)
- A [Supabase](https://supabase.com/) project (free tier is fine)

---

### 1. Supabase — Create the table

In your Supabase dashboard, open **SQL Editor** and run:

```sql
create table campaigns (
  id           uuid default gen_random_uuid() primary key,
  company_name text not null,
  target_role  text not null,
  sender_name  text not null,
  research_summary text,
  research_data    jsonb,
  emails           jsonb,
  created_at   timestamp with time zone default timezone('utc', now()) not null
);

-- Allow public access (adjust for production with RLS)
alter table campaigns enable row level security;
create policy "allow all" on campaigns for all using (true) with check (true);
```

---

### 2. Backend Setup

```bash
cd salesbot-ai/backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
```

Edit `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
```

Start the API server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd salesbot-ai/frontend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

Open `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint                      | Description                          |
| ------ | ----------------------------- | ------------------------------------ |
| GET    | `/`                           | Health check                         |
| GET    | `/health`                     | Detailed health status               |
| POST   | `/api/research`               | Run only the Research Agent          |
| POST   | `/api/generate-emails`        | Generate emails from existing research |
| POST   | `/api/generate-stream`        | **Main endpoint** — SSE stream, runs all 3 agents |
| GET    | `/api/campaigns`              | List all saved campaigns             |
| GET    | `/api/campaigns/{id}`         | Get a single campaign                |
| DELETE | `/api/campaigns/{id}`         | Delete a campaign                    |

### SSE Event Types (`/api/generate-stream`)

```json
// Agent starting
{"event": "agent_start", "agent": "research", "message": "Researching Stripe…"}

// Agent done
{"event": "agent_complete", "agent": "research", "data": { ... }}

// All agents done — full result
{"event": "complete", "campaign_id": "uuid", "research": { ... }, "emails": [ ... ]}

// Error
{"event": "error", "message": "Something went wrong"}
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable        | Description                     | Required |
| --------------- | ------------------------------- | -------- |
| `GEMINI_API_KEY` | Google Gemini API key           | Yes      |
| `SUPABASE_URL`  | Supabase project URL            | Yes      |
| `SUPABASE_KEY`  | Supabase anon/service role key  | Yes      |

### Frontend (`frontend/.env.local`)

| Variable              | Description          | Default                   |
| --------------------- | -------------------- | ------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000`   |

---

## Features

- **Real-time progress** — SSE streaming shows each agent's status as it runs
- **Inline email editing** — click Edit on any email card to modify subject/body
- **Copy to clipboard** — one-click copy of any email (subject + body)
- **Campaign history** — all generated campaigns saved to Supabase, viewable/deletable
- **Dark theme** — Linear-inspired minimal UI
- **Mobile responsive** — works on all screen sizes
- **Graceful errors** — handles API failures and missing env vars cleanly

---

## Deployment

### Backend (Railway / Render / Fly.io)
```bash
# Set environment variables in your hosting dashboard
# Start command:
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Vercel)
```bash
# Set NEXT_PUBLIC_API_URL to your deployed backend URL
# Push to GitHub and import to Vercel — it auto-detects Next.js
```

Don't forget to update the `allow_origins` list in `backend/main.py` with your production frontend URL.

---

## License

MIT
