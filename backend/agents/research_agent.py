import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


def _parse_json_response(content: str) -> dict:
    """Robustly extract a JSON object from an LLM response string."""
    # Try direct parse first
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Try to find a JSON block (possibly wrapped in markdown code fences)
    patterns = [
        r"```json\s*(\{.*?\})\s*```",
        r"```\s*(\{.*?\})\s*```",
        r"(\{.*\})",
    ]
    for pattern in patterns:
        match = re.search(pattern, content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                continue

    return {}


def research_company(company_name: str, target_role: str) -> dict:
    """
    Research a company using Gemini + optional DuckDuckGo search.
    Returns a structured dict with summary, key_points, recent_news, etc.
    """
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Attempt web search to enrich context; gracefully skip if unavailable
    search_context = ""
    try:
        from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            overview = list(ddgs.text(f"{company_name} company overview", max_results=3))
            news = list(ddgs.text(f"{company_name} latest news 2024 2025", max_results=3))

        overview_text = "\n".join(r.get("body", "") for r in overview)
        news_text = "\n".join(r.get("body", "") for r in news)
        search_context = f"""
Real-time search results for {company_name}:
COMPANY OVERVIEW:
{overview_text}

RECENT NEWS:
{news_text}
"""
    except Exception:
        search_context = ""

    prompt = f"""You are a senior business research analyst. Deeply research the company "{company_name}".
{search_context}
A sales professional is targeting the role of "{target_role}" at this company.

Produce a structured JSON response (no markdown fences, raw JSON only):
{{
  "summary": "2-3 paragraph overview: what the company does, market position, products/services, scale",
  "key_points": ["5 distinct bullet points about the company"],
  "recent_news": "Key recent news, product launches, funding rounds, or company milestones",
  "industry": "Primary industry / sector",
  "pain_points": "Challenges or pain points relevant to a {target_role} sale",
  "company_culture": "Culture, values, mission statement if known",
  "tech_stack": "Known technologies or tools the company uses (if applicable)"
}}

Be specific and accurate. Infer intelligently when direct data is unavailable."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content.strip()
    data = _parse_json_response(content)

    # Ensure required keys exist with sensible fallbacks
    fallback = {
        "summary": content if not data else data.get("summary", ""),
        "key_points": data.get("key_points", ["See summary for details"]),
        "recent_news": data.get("recent_news", "Check company website for latest news"),
        "industry": data.get("industry", "Technology"),
        "pain_points": data.get("pain_points", "Requires further research"),
        "company_culture": data.get("company_culture", ""),
        "tech_stack": data.get("tech_stack", ""),
    }
    return {**fallback, **data} if data else fallback
