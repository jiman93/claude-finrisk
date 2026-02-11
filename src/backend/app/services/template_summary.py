"""Offline template-based summary fallback.

Used when the LLM service is unavailable (no OpenAI API key configured).
Produces a structured summary from retrieved nodes without calling any
external API.
"""

from app.schemas.task import RetrievalNode


def template_summary(ticker: str, query: str, nodes: list[RetrievalNode]) -> str:
    """Build a template-based summary from retrieved nodes.

    Returns a structured risk summary with citations drawn from the
    provided nodes.  This is a deterministic, zero-cost fallback for
    development and offline testing.
    """
    citations: list[str] = []
    for node in nodes:
        citation = f"[{node.title}, Page {node.page_index}]"
        if citation not in citations:
            citations.append(citation)

    key_points: list[str] = []
    for node in nodes[:5]:
        key_points.append(f"- {node.relevant_content} [{node.title}, Page {node.page_index}]")

    citations_line = " ".join(citations[:8]) if citations else "[No sources]"
    key_points_text = "\n".join(key_points) if key_points else "- No retrieved evidence available."

    return (
        f"Executive overview: For {ticker}, disclosures relevant to '{query}' indicate a multi-factor risk "
        "profile spanning operations, regulation, technology resilience, and external dependencies.\n\n"
        "Key disclosed risk signals:\n"
        f"{key_points_text}\n\n"
        "Potential impact:\n"
        "- Margin pressure from compliance and remediation costs.\n"
        "- Revenue and retention sensitivity if service reliability weakens.\n"
        "- Execution delays when supplier, regulatory, or macro conditions deteriorate.\n\n"
        f"Source attribution: {citations_line}"
    )
