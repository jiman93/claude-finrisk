"""Retrieval strategy router.

Single entry point for retrieval that delegates to either the local
ChromaDB backend or the remote PageIndex API based on the
``RETRIEVAL_MODE`` setting.  Both backends return the same
``RetrievalResult`` so downstream consumers (task router, LLM
generation, frontend) are mode-agnostic.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.config import settings

if TYPE_CHECKING:
    from app.services.chroma_service import ChromaService
    from app.services.pageindex_service import PageIndexService, RetrievalResult


class RetrievalError(RuntimeError):
    """Unified exception for any retrieval failure (local or remote)."""


class RetrievalService:
    """Delegates ``retrieve()`` to the configured backend.

    Backends are lazily initialised so their heavyweight dependencies
    (torch / sentence-transformers for local, httpx for PageIndex) are
    only loaded when actually needed.
    """

    def __init__(self) -> None:
        self.mode: str = settings.retrieval_mode  # "local" or "pageindex"
        self._chroma: ChromaService | None = None
        self._pageindex: PageIndexService | None = None

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

    # -- public API -------------------------------------------------------

    def retrieve(self, ticker: str, query: str) -> RetrievalResult:
        """Retrieve nodes for *ticker* / *query* using the configured mode.

        Raises ``RetrievalError`` on any failure.
        """
        if self.mode == "local":
            return self._retrieve_local(ticker, query)
        if self.mode == "pageindex":
            return self._retrieve_pageindex(ticker, query)
        raise RetrievalError(
            f"Unknown RETRIEVAL_MODE: '{self.mode}'. "
            "Must be 'local' or 'pageindex'."
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
