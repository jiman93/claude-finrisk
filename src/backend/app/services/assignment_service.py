from datetime import datetime

from app.models.enums import ModeType
from app.services.study_setup import (
    QUERIES,
    get_group,
    get_phase_modes,
    get_ticker_sequence,
)

NUM_PARTICIPANTS = 8

# ---------------------------------------------------------------------------
# Canonical checkpoint definitions — mirrors SEED_DEFINITIONS on the frontend.
# In a future iteration these would come from a checkpoint_definitions table.
# ---------------------------------------------------------------------------

DEFAULT_CHECKPOINTS = [
    {
        "definition_id": "seed-chunk-selector",
        "control_type": "chunk_selector",
        "label": "Chunk Selector (HITL-R)",
        "pipeline_position": "after_retrieval",
        "sort_order": 0,
        "applicable_modes": ["hitl_r", "hitl_full"],
    },
    {
        "definition_id": "seed-summary-editor",
        "control_type": "summary_editor",
        "label": "Summary Editor (HITL-G)",
        "pipeline_position": "after_generation",
        "sort_order": 0,
        "applicable_modes": ["hitl_g", "hitl_full"],
    },
    {
        "definition_id": "seed-questionnaire",
        "control_type": "questionnaire",
        "label": "Post-Generation Questionnaire",
        "pipeline_position": "post_generation",
        "sort_order": 0,
        "applicable_modes": ["baseline", "hitl_r", "hitl_g", "hitl_full"],
    },
]


def get_checkpoints_for_mode(mode: ModeType) -> list[dict]:
    """Return checkpoint refs applicable to the given HITL mode."""
    return [
        {
            "definition_id": cp["definition_id"],
            "control_type": cp["control_type"],
            "label": cp["label"],
            "pipeline_position": cp["pipeline_position"],
            "sort_order": cp["sort_order"],
        }
        for cp in DEFAULT_CHECKPOINTS
        if mode.value in cp["applicable_modes"]
    ]


def generate_default_assignment(participant_id: str) -> dict:
    """Build a fully-resolved default assignment for one participant."""
    group = get_group(participant_id)
    modes = get_phase_modes(participant_id)
    tickers = get_ticker_sequence(participant_id)

    phases = []
    for i in range(len(modes)):
        mode = modes[i]
        ticker = tickers[i]
        query = QUERIES[ticker]
        checkpoints = get_checkpoints_for_mode(mode)
        phases.append(
            {
                "phase": i + 1,
                "mode": mode.value,
                "ticker": ticker,
                "query": query,
                "checkpoints": checkpoints,
            }
        )

    return {
        "participant_id": participant_id,
        "group": group.value,
        "phases": phases,
        "status": "not_started",
        "override": False,
        "updated_at": datetime.utcnow().isoformat(),
    }


def generate_all_defaults(count: int = NUM_PARTICIPANTS) -> list[dict]:
    """Generate default assignments for P00 (tutorial) and P01 through P{count}."""
    return [
        generate_default_assignment(f"P{str(i).zfill(2)}")
        for i in range(0, count + 1)
    ]
