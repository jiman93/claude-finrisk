from datetime import datetime
from typing import Any

from pydantic import BaseModel


class QueryRequest(BaseModel):
    query: str | None = None


class RetrievalNode(BaseModel):
    node_id: str
    title: str
    page_index: int
    relevant_content: str


class TraversalStep(BaseModel):
    depth: int
    action: str
    options: list[str] | None = None
    selected: list[str] | None = None
    count: int | None = None


class QueryResponse(BaseModel):
    status: str
    task_id: str
    retrieved_nodes: list[RetrievalNode]
    retrieval_completed_at: datetime
    retrieval_mode: str = "local"
    traversal_path: list[TraversalStep] | None = None


class GenerateRequest(BaseModel):
    selected_node_ids: list[str] | None = None


class GenerateResponse(BaseModel):
    task_id: str
    summary: str
    used_node_ids: list[str]
    used_nodes: list[RetrievalNode]
    generation_completed_at: datetime


class SelectNodesRequest(BaseModel):
    selected_node_ids: list[str]
    rejected_node_ids: list[str]
    selection_order: list[str]


class SelectNodesResponse(BaseModel):
    task_id: str
    selected_node_ids: list[str]
    rejected_node_ids: list[str]


class FlaggedSpan(BaseModel):
    start: int
    end: int
    text: str
    reason: str


class EditSummaryRequest(BaseModel):
    edited_text: str
    flagged_spans: list[FlaggedSpan] = []


class EditSummaryResponse(BaseModel):
    task_id: str
    edited_summary: str
    characters_edited: int
    hallucinations_flagged: int
    edit_completed_at: datetime


class SubmitFeedbackRequest(BaseModel):
    definition_id: str
    responses: dict[str, Any]


class SubmitFeedbackResponse(BaseModel):
    task_id: str
    definition_id: str
    feedback_submitted_at: datetime


class CompleteTaskResponse(BaseModel):
    task_id: str
    completed_at: datetime
    time_on_task_seconds: int
