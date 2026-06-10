from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class ResearchRequest(BaseModel):
    company_name: str
    target_role: str


class EmailGenerationRequest(BaseModel):
    company_name: str
    target_role: str
    sender_name: str
    research_summary: str


class GenerateRequest(BaseModel):
    company_name: str
    target_role: str
    sender_name: str


class Email(BaseModel):
    type: str  # "cold", "followup_1", "followup_2", "followup_3"
    subject: str
    body: str
    send_day: Optional[int] = None
    strategy: Optional[str] = None


class Campaign(BaseModel):
    id: Optional[str] = None
    company_name: str
    target_role: str
    sender_name: str
    research_summary: Optional[str] = None
    research_data: Optional[Dict[str, Any]] = None
    emails: Optional[List[Dict[str, Any]]] = None
    created_at: Optional[datetime] = None
