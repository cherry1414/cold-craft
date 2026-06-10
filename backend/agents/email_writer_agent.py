import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


def _parse_json_response(content: str) -> dict:
    """Extract a JSON object from LLM output, handling markdown fences."""
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


def write_cold_email(
    company_name: str,
    target_role: str,
    sender_name: str,
    research: dict,
) -> dict:
    """
    Write a highly personalized cold email based on research data.
    Returns {"subject": str, "body": str}.
    """
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    summary = research.get("summary", "")
    key_points = research.get("key_points", [])
    pain_points = research.get("pain_points", "")
    recent_news = research.get("recent_news", "")
    industry = research.get("industry", "")

    key_points_str = (
        "\n".join(f"- {p}" for p in key_points)
        if isinstance(key_points, list)
        else str(key_points)
    )

    prompt = f"""You are a world-class B2B sales copywriter. Write a cold outreach email that feels personal, not templated.

RESEARCH DATA:
- Company: {company_name}
- Industry: {industry}
- Target Role: {target_role}
- Overview: {summary}
- Key Facts:
{key_points_str}
- Recent News: {recent_news}
- Likely Pain Points: {pain_points}

SENDER: {sender_name}

RULES:
1. Subject line: Specific, curiosity-inducing, under 8 words. Not "Quick question" or "Following up".
2. Opening line: Reference something specific about the company (news, product, initiative) — no generic openers.
3. Value proposition: 1 crisp sentence on what you offer and why it matters to THEM.
4. Social proof: 1 brief data point or customer reference (you can invent a plausible one).
5. CTA: Soft ask — 15-min call, not "buy now". Make it easy to say yes.
6. Length: 150-180 words max (body only).
7. Tone: Confident, peer-to-peer, human. No fluff, no filler.
8. Do NOT start the body with "I".

Return raw JSON only (no markdown):
{{
  "subject": "...",
  "body": "Full email body with \\n for paragraph breaks"
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content.strip()
    data = _parse_json_response(content)

    if data.get("subject") and data.get("body"):
        return data

    # Fallback: return the raw content wrapped in a basic structure
    return {
        "subject": f"Question about {company_name}'s {target_role} strategy",
        "body": (
            f"Hi,\n\n"
            f"I came across {company_name} and was impressed by what you're building.\n\n"
            f"{content}\n\n"
            f"Would you be open to a 15-min call this week?\n\n"
            f"Best,\n{sender_name}"
        ),
    }
