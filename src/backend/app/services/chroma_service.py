"""Local ChromaDB retrieval service.

Provides retrieval against locally-embedded 10-K filings stored in a
ChromaDB persistent database.  Produces the same ``RetrievalResult``
output as ``PageIndexService`` so the rest of the pipeline is unaffected.

Dependencies (``chromadb``, ``sentence-transformers``) are imported lazily
so they are only loaded when ``RETRIEVAL_MODE=local``.
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from app.config import PROJECT_ROOT, settings
from app.schemas.task import RetrievalNode

if TYPE_CHECKING:
    import chromadb


class ChromaServiceError(RuntimeError):
    """Raised when local ChromaDB retrieval fails."""


class ChromaService:
    """ChromaDB-backed local retrieval.

    One collection per ticker (``10k_MSFT``, ``10k_AAPL``, ...).
    Each document in the collection stores metadata with ``node_id``,
    ``title``, and ``page_index`` fields so results can be mapped
    directly to ``RetrievalNode``.
    """

    def __init__(self) -> None:
        self._client: chromadb.ClientAPI | None = None
        self._embedding_fn: object | None = None

    def _ensure_client(self) -> chromadb.ClientAPI:
        if self._client is not None:
            return self._client

        try:
            import chromadb as _chromadb
            from chromadb.utils.embedding_functions import (
                SentenceTransformerEmbeddingFunction,
            )
        except ImportError as exc:
            raise ChromaServiceError(
                "chromadb and sentence-transformers are required for local "
                "retrieval mode.  Install them with:\n"
                "  pip install chromadb sentence-transformers"
            ) from exc

        db_path = str(PROJECT_ROOT / settings.chroma_db_path)
        self._client = _chromadb.PersistentClient(path=db_path)
        self._embedding_fn = SentenceTransformerEmbeddingFunction(
            model_name=settings.embedding_model,
        )
        return self._client

    @staticmethod
    def collection_name(ticker: str) -> str:
        return f"10k_{ticker.upper()}"

    def has_collection(self, ticker: str) -> bool:
        """Return True if a non-empty collection exists for *ticker*."""
        client = self._ensure_client()
        name = self.collection_name(ticker)
        try:
            col = client.get_collection(name=name, embedding_function=self._embedding_fn)
            return col.count() > 0
        except Exception:
            return False

    def retrieve(
        self,
        ticker: str,
        query: str,
        top_k: int = 8,
    ) -> "RetrievalResult":
        """Query the local ChromaDB collection for *ticker*.

        Returns a ``RetrievalResult`` (same dataclass used by
        ``PageIndexService``) so consumers are mode-agnostic.
        """
        from app.services.pageindex_service import RetrievalResult

        client = self._ensure_client()
        name = self.collection_name(ticker)

        try:
            collection = client.get_collection(
                name=name,
                embedding_function=self._embedding_fn,
            )
        except Exception as exc:
            raise ChromaServiceError(
                f"No ChromaDB collection found for ticker {ticker} "
                f"(expected '{name}').  Run the ingestion script first:\n"
                f"  python scripts/ingest_10k.py --tickers {ticker}"
            ) from exc

        if collection.count() == 0:
            raise ChromaServiceError(
                f"ChromaDB collection '{name}' is empty.  "
                f"Run: python scripts/ingest_10k.py --tickers {ticker}"
            )

        results = collection.query(
            query_texts=[query],
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas"],
        )

        nodes: list[RetrievalNode] = []
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        for doc, meta in zip(documents, metadatas):
            if not doc:
                continue
            nodes.append(
                RetrievalNode(
                    node_id=str(meta.get("node_id", f"{ticker}-{len(nodes)+1:03d}")),
                    title=str(meta.get("title", f"{ticker} 10-K")),
                    page_index=int(meta.get("page_index", 0)),
                    relevant_content=doc,
                )
            )

        retrieval_id = f"cr-local-{uuid.uuid4().hex[:18]}"
        return RetrievalResult(retrieval_id=retrieval_id, nodes=nodes)
