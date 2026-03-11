"""AI-powered executive summary generation via Google Gemini."""
import json
import logging
from typing import Any

import google.generativeai as genai

from app.config import get_settings

logger = logging.getLogger(__name__)


def _build_prompt(data: dict[str, Any]) -> str:
    """Construct a detailed, structured prompt from the parsed data context."""
    sections = [
        "You are a senior sales analyst and business strategist. Analyze the following sales dataset and produce a concise, professional executive summary for C-suite leadership.",
        "",
        "## Dataset Overview",
        f"- File: {data['filename']}",
        f"- Rows: {data['rows']:,} | Columns: {data['columns']}",
        f"- Columns: {', '.join(data['column_names'])}",
        "",
    ]

    if data.get("date_range"):
        sections += [
            "## Time Range",
            f"- From: {data['date_range']['start']}  To: {data['date_range']['end']}",
            "",
        ]

    if data.get("numeric_summary"):
        sections.append("## Numeric Statistics")
        for col, stats in data["numeric_summary"].items():
            sections.append(
                f"- **{col}**: min={stats.get('min')}, max={stats.get('max')}, "
                f"mean={stats.get('mean')}, std={stats.get('std')}, count={stats.get('count')}"
            )
        sections.append("")

    if data.get("top_categories"):
        sections.append("## Top Categories")
        for col, counts in data["top_categories"].items():
            top = list(counts.items())[:5]
            sections.append(f"- **{col}**: " + ", ".join(f"{k} ({v})" for k, v in top))
        sections.append("")

    if data.get("period_trend"):
        sections.append("## Period Trend (Sample)")
        for row in data["period_trend"][:12]:  # cap at 12 periods
            sections.append(f"  {json.dumps(row)}")
        sections.append("")

    null_total = sum(v for v in data.get("null_counts", {}).values() if v > 0)
    if null_total > 0:
        sections.append(f"## Data Quality: {null_total:,} total null values detected across columns.")
        sections.append("")

    sections.append("## Sample Data (first 5 rows)")
    for row in data.get("sample_rows", []):
        sections.append(f"  {json.dumps(row)}")
    sections.append("")

    sections += [
        "---",
        "## Your Task",
        "Write a professional executive summary that includes:",
        "1. **Performance Overview** — Key metrics and overall performance verdict",
        "2. **Key Trends** — Growth patterns, seasonality, notable movements",
        "3. **Top Performers** — Best-performing products, regions, or categories",
        "4. **Anomalies & Risks** — Outliers, sudden drops, data quality concerns",
        "5. **Strategic Recommendations** — 3–5 actionable, data-driven recommendations",
        "",
        "Format using clear markdown with headers and bullet points.",
        "Be concise, executive-level, and data-backed. Do not invent data not present in the dataset.",
    ]

    return "\n".join(sections)


async def generate_summary(data_context: dict[str, Any]) -> str:
    """Call Gemini API and return the executive summary markdown string."""
    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=genai.GenerationConfig(
            temperature=0.3,
            max_output_tokens=2048,
        ),
    )

    prompt = _build_prompt(data_context)
    logger.info("Sending data context to Gemini (%d chars in prompt)", len(prompt))

    try:
        response = await model.generate_content_async(prompt)
        summary = response.text.strip()
        logger.info("Gemini returned summary (%d chars)", len(summary))
        return summary
    except Exception as exc:
        logger.exception("Gemini API call failed: %s", exc)
        raise RuntimeError(f"AI analysis failed: {exc}") from exc
