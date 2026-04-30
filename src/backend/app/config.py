from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ROOT_ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    database_url: str = "sqlite:///./finrisk.db"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    pageindex_api_key: str = ""
    pageindex_base_url: str = "https://api.pageindex.ai"
    pageindex_doc_map: str = ""
    pageindex_poll_interval_seconds: float = 1.0
    pageindex_poll_timeout_seconds: int = 45
    pageindex_enable_thinking: bool = False
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-5.2"
    retrieval_mode: str = "local"  # "local" (ChromaDB), "pageindex", or "tree"
    chroma_db_path: str = "./data/chroma_db"
    embedding_model: str = "all-MiniLM-L6-v2"
    # Tree traversal tuning (when RETRIEVAL_MODE=tree)
    navigation_model: str = "o3-mini"
    tree_nav_reasoning_effort: str = "low"
    # Admin auth
    admin_password: str = ""
    tree_max_branches: int = 3
    tree_max_depth: int = 4
    tree_max_leaves: int = 8

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_ENV_FILE), ".env"),
        extra="ignore",
    )


settings = Settings()
