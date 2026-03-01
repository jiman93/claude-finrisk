import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

import app.models  # noqa: F401
from app.config import settings
from app.db.database import Base, engine
from app.routers.admin import router as admin_router
from app.routers.documents import router as documents_router
from app.routers.sessions import router as sessions_router
from app.routers.study_assignments import router as study_assignments_router
from app.routers.tasks import router as tasks_router

log = logging.getLogger(__name__)

app = FastAPI(
    title="FinRisk HITL API",
    version="0.1.0",
    description="Backend API for FinRisk retrieval, generation, and HITL workflows.",
    docs_url="/swagger",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    _apply_sqlite_compat_migrations()
    _validate_retrieval_mode()


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(admin_router)
app.include_router(sessions_router)
app.include_router(tasks_router)
app.include_router(study_assignments_router)
app.include_router(documents_router)


def _apply_sqlite_compat_migrations() -> None:
    if engine.dialect.name != "sqlite":
        return

    required_columns = {
        "tasks": {
            "pageindex_retrieval_id": "VARCHAR(100)",
            "rejected_node_ids": "JSON",
            "edited_summary": "TEXT",
            "flagged_spans": "JSON",
            "traversal_path": "JSON",
            "characters_edited": "INTEGER",
            "edit_completed_at": "TIMESTAMP",
            "feedback_responses": "JSON",
            "feedback_submitted_at": "TIMESTAMP",
            "llm_metrics": "JSON",
            "edit_distance": "INTEGER",
            "edit_similarity": "FLOAT",
            "first_edit_at": "TIMESTAMP",
        }
    }

    inspector = inspect(engine)
    with engine.begin() as connection:
        for table_name, columns in required_columns.items():
            existing = {column["name"] for column in inspector.get_columns(table_name)}
            for column_name, column_type in columns.items():
                if column_name in existing:
                    continue
                connection.execute(
                    text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
                )


def _validate_retrieval_mode() -> None:
    """Log startup info and warn about missing config for the chosen retrieval mode."""
    mode = settings.retrieval_mode
    log.info("Retrieval mode: %s", mode)

    if mode == "tree":
        if not settings.openai_api_key:
            log.warning(
                "RETRIEVAL_MODE=tree but OPENAI_API_KEY is not set. "
                "Tree traversal will fail at request time."
            )
        log.info(
            "Tree config: nav_model=%s, reasoning_effort=%s, "
            "max_branches=%d, max_depth=%d, max_leaves=%d",
            settings.tree_nav_model,
            settings.tree_nav_reasoning_effort,
            settings.tree_max_branches,
            settings.tree_max_depth,
            settings.tree_max_leaves,
        )
    elif mode == "pageindex":
        if not settings.pageindex_api_key:
            log.warning(
                "RETRIEVAL_MODE=pageindex but PAGEINDEX_API_KEY is not set."
            )
    elif mode == "local":
        log.info("Using local ChromaDB at %s", settings.chroma_db_path)
    else:
        log.error("Unknown RETRIEVAL_MODE: '%s'", mode)
