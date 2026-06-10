import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


def _parse_json_response(content: str) -> dict:
    """Extract a JSON object from LLM output."""
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    for pattern in [r"```json\s*(\{.*?\})\s*```", r"```\s*(\{.*?\})\s*```", r"(\{.*\})"]:
        match = re.search(pattern, content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                continue
    return {}


def generate_followup_sequence(
    company_name: str,
    target_role: str,
    sender_name: str,
    cold_email: dict,
    research: dict,
) -> list:
    """
    Generate a 3-email follow-up sequence after the cold email.
    Each email has: subject, body, send_day, strategy.
    """
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    original_subject = cold_email.get("subject", f"Re: {company_name} outreach")
    original_body = cold_email.get("body", "")
    summary = research.get("summary", "")
    pain_points = research.get("pain_points", "")

    prompt = f"""You are a B2B sales expert. A cold email was sent and got no response. Write a 3-email follow-up sequence.

ORIGINAL COLD EMAIL:
Subject: {original_subject}
---
{original_body}
---

CONTEXT:
- Company: {company_name}
- Target Role: {target_role}
- Sender: {sender_name}
- Company summary: {summary}
- Pain points: {pain_points}

FOLLOW-UP STRATEGY:
1. Day 3 — Gentle bump + add a NEW insight or stat about their industry. Don't say "just following up".
2. Day 7 — Share a specific result/case study (you can invent a plausible one). Make it feel relevant.
3. Day 14 — Break-up email. Low pressure, create mild FOMO, leave the door open.

RULES for each email:
- Under 100 words (body only)
- Each adds value; never just repeats the original
- Subject: use "Re: {original_subject}" for email 1; unique subject for 2 and 3
- Tone: human, no buzzwords

Return raw JSON only (no markdown):
{{
  "followups": [
    {{
      "subject": "...",
      "body": "email body with \\n breaks",
      "send_day": 3,
      "strategy": "one-line strategy description"
    }},
    {{
      "subject": "...",
      "body": "...",
      "send_day": 7,
      "strategy": "..."
    }},
    {{
      "subject": "...",
      "body": "...",
      "send_day": 14,
      "strategy": "Break-up email"
    }}
  ]
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content.strip()
    data = _parse_json_response(content)

    followups = data.get("followups", [])
    if isinstance(followups, list) and len(followups) == 3:
        return followups

    # Sensible fallback sequence
    return [
        {
            "subject": f"Re: {original_subject}",
            "body": (
                f"Hi,\n\n"
                f"Wanted to resurface this — companies in your space are seeing 30% faster {target_role.lower()} cycles "
                f"with the right tooling.\n\n"
                f"Worth a 15-min chat?\n\n"
                f"Best,\n{sender_name}"
            ),
            "send_day": 3,
            "strategy": "Gentle bump with industry stat",
        },
        {
            "subject": f"How [Similar Co] solved this at {company_name}'s scale",
            "body": (
                f"Hi,\n\n"
                f"Thought this might be useful — a company similar to {company_name} reduced their "
                f"operational overhead by 40% in 90 days using our platform.\n\n"
                f"Happy to share the full story. 15 mins?\n\n"
                f"{sender_name}"
            ),
            "send_day": 7,
            "strategy": "Case study / social proof",
        },
        {
            "subject": f"Closing the loop — {company_name}",
            "body": (
                f"Hi,\n\n"
                f"I'll keep this short — I'll stop reaching out after this.\n\n"
                f"If the timing ever becomes right for {company_name}, I'd love to connect. "
                f"Feel free to reply whenever.\n\n"
                f"Wishing you the best,\n{sender_name}"
            ),
            "send_day": 14,
            "strategy": "Break-up email — final touch",
        },
    ]
