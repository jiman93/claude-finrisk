"""Retrieval strategy router.

Single entry point for retrieval that delegates to the configured
backend based on the ``RETRIEVAL_MODE`` setting.  All backends return
the same ``RetrievalResult`` so downstream consumers (task router,
LLM generation, frontend) are mode-agnostic.

Supported modes:
- ``local``     — ChromaDB vector search with local embeddings
- ``pageindex`` — PageIndex remote retrieval API
- ``tree``      — LLM-guided tree traversal (o3-mini navigation)
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.config import settings

if TYPE_CHECKING:
    from app.services.chroma_service import ChromaService
    from app.services.pageindex_service import PageIndexService, RetrievalResult
    from app.services.tree_service import TreeRetrievalService


class RetrievalError(RuntimeError):
    """Unified exception for any retrieval failure (local or remote)."""


class RetrievalService:
    """Delegates ``retrieve()`` to the configured backend.

    Backends are lazily initialised so their heavyweight dependencies
    (torch / sentence-transformers for local, httpx for PageIndex/tree)
    are only loaded when actually needed.
    """

    def __init__(self) -> None:
        self.mode: str = settings.retrieval_mode  # "local", "pageindex", or "tree"
        self._chroma: ChromaService | None = None
        self._pageindex: PageIndexService | None = None
        self._tree: TreeRetrievalService | None = None

    # -- lazy accessors ---------------------------------------------------

    def _get_chroma(self) -> ChromaService:
        if self._chroma is None:
            from app.services.chroma_service import ChromaService

            self._chroma = ChromaService()
        return self._chroma

    def _get_pageindex(self) -> PageIndexService:
        if self._pageindex is None:
            from app.services.pageindex_service import PageIndexService

            self._pageindex = PageIndexService()
        return self._pageindex

    def _get_tree(self) -> TreeRetrievalService:
        if self._tree is None:
            from app.services.tree_service import TreeRetrievalService

            self._tree = TreeRetrievalService()
        return self._tree

    # -- public API -------------------------------------------------------

    def retrieve(self, ticker: str, query: str) -> RetrievalResult:
        """Retrieve nodes for *ticker* / *query* using the configured mode.

        Raises ``RetrievalError`` on any failure.
        """
        if self.mode == "local":
            return self._retrieve_local(ticker, query)
        if self.mode == "pageindex":
            return self._retrieve_pageindex(ticker, query)
        if self.mode == "tree":
            return self._retrieve_tree(ticker, query)
        raise RetrievalError(
            f"Unknown RETRIEVAL_MODE: '{self.mode}'. "
            "Must be 'local', 'pageindex', or 'tree'."
        )

    # -- private delegates ------------------------------------------------

    def _retrieve_local(self, ticker: str, query: str) -> RetrievalResult:
        from app.services.chroma_service import ChromaServiceError

        try:
            return self._get_chroma().retrieve(ticker, query)
        except ChromaServiceError as exc:
            raise RetrievalError(str(exc)) from exc

    def _retrieve_pageindex(self, ticker: str, query: str) -> RetrievalResult:
        from app.services.pageindex_service import PageIndexError

        try:
            return self._get_pageindex().retrieve(ticker, query)
        except PageIndexError as exc:
            raise RetrievalError(str(exc)) from exc

    def _retrieve_tree(self, ticker: str, query: str) -> RetrievalResult:
        from app.services.tree_service import TreeServiceError

        try:
            return self._get_tree().retrieve(ticker, query)
        except TreeServiceError as exc:
            raise RetrievalError(str(exc)) from exc
