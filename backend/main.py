import asyncio
import json
import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agents.email_writer_agent import write_cold_email
from agents.followup_agent import generate_followup_sequence
from agents.research_agent import research_company
from database.supabase_client import SupabaseDB
from models.schemas import EmailGenerationRequest, GenerateRequest, ResearchRequest

load_dotenv()

app = FastAPI(title="ColdCraft API", version="1.0.0", description="AI-powered sales automation backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = SupabaseDB()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"message": "ColdCraft API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ---------------------------------------------------------------------------
# Individual agent endpoints
# ---------------------------------------------------------------------------

@app.post("/api/research")
async def research_endpoint(request: ResearchRequest):
    """Run only the Research Agent for a company."""
    try:
        result = await asyncio.to_thread(
            research_company, request.company_name, request.target_role
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-emails")
async def generate_emails_endpoint(request: EmailGenerationRequest):
    """Generate the cold email + follow-up sequence from existing research."""
    try:
        research = {"summary": request.research_summary}

        cold_email = await asyncio.to_thread(
            write_cold_email,
            request.company_name,
            request.target_role,
            request.sender_name,
            research,
        )
        followups = await asyncio.to_thread(
            generate_followup_sequence,
            request.company_name,
            request.target_role,
            request.sender_name,
            cold_email,
            research,
        )

        emails = [{"type": "cold", **cold_email}]
        for i, fu in enumerate(followups, 1):
            emails.append({"type": f"followup_{i}", **fu})

        return {"success": True, "emails": emails}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Main streaming endpoint (SSE) — runs all 3 agents in sequence
# ---------------------------------------------------------------------------

@app.post("/api/generate-stream")
async def generate_stream(request: GenerateRequest):
    """
    Stream Server-Sent Events as each agent completes.
    Events: agent_start | agent_complete | complete | error
    """

    async def event_stream():
        try:
            # ── Agent 1: Research ──────────────────────────────────────────
            yield _sse({"event": "agent_start", "agent": "research",
                        "message": f"Researching {request.company_name}…"})

            research = await asyncio.to_thread(
                research_company, request.company_name, request.target_role
            )

            yield _sse({"event": "agent_complete", "agent": "research", "data": research})

            # ── Agent 2: Email Writer ──────────────────────────────────────
            yield _sse({"event": "agent_start", "agent": "email_writer",
                        "message": "Writing personalised cold email…"})

            cold_email = await asyncio.to_thread(
                write_cold_email,
                request.company_name,
                request.target_role,
                request.sender_name,
                research,
            )

            yield _sse({"event": "agent_complete", "agent": "email_writer", "data": cold_email})

            # ── Agent 3: Follow-up Sequence ────────────────────────────────
            yield _sse({"event": "agent_start", "agent": "followup",
                        "message": "Building 3-email follow-up sequence…"})

            followups = await asyncio.to_thread(
                generate_followup_sequence,
                request.company_name,
                request.target_role,
                request.sender_name,
                cold_email,
                research,
            )

            yield _sse({"event": "agent_complete", "agent": "followup", "data": followups})

            # ── Assemble & save ────────────────────────────────────────────
            emails = [{"type": "cold", **cold_email}]
            for i, fu in enumerate(followups, 1):
                emails.append({"type": f"followup_{i}", **fu})

            campaign_id = str(uuid.uuid4())
            campaign_data = {
                "id": campaign_id,
                "company_name": request.company_name,
                "target_role": request.target_role,
                "sender_name": request.sender_name,
                "research_summary": research.get("summary", ""),
                "research_data": research,   # stored as JSONB
                "emails": emails,            # stored as JSONB
                "created_at": datetime.utcnow().isoformat(),
            }

            try:
                saved = db.save_campaign(campaign_data)
                campaign_id = saved.get("id", campaign_id)
            except Exception as db_err:
                print(f"[DB] save error (non-fatal): {db_err}")

            yield _sse({
                "event": "complete",
                "campaign_id": campaign_id,
                "research": research,
                "emails": emails,
            })

        except Exception as exc:
            yield _sse({"event": "error", "message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Campaign CRUD
# ---------------------------------------------------------------------------

@app.get("/api/campaigns")
async def get_campaigns():
    """Fetch all saved campaigns, newest first."""
    try:
        campaigns = db.get_campaigns()
        return {"success": True, "data": campaigns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Fetch a single campaign by ID."""
    try:
        campaign = db.get_campaign_by_id(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return {"success": True, "data": campaign}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str):
    """Delete a campaign by ID."""
    try:
        db.delete_campaign(campaign_id)
        return {"success": True, "message": "Campaign deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sse(payload: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(payload, default=str)}\n\n"
