import asyncio
import pytest
from app.rag import (
    DocumentIndexer,
    DocumentPageInput,
    IndexingResult,
    IN_MEMORY_VECTOR_STORE,
)
from app.embeddings import MockEmbeddingProvider, EmbeddingProviderError, EmbeddingProviderBase


class FailingEmbeddingProvider(EmbeddingProviderBase):
    """Simulated provider that always raises EmbeddingProviderError to test failure recovery."""
    async def embed_text(self, text: str):
        raise EmbeddingProviderError("Simulated API rate limit / gateway timeout failure")

    async def embed_batch(self, texts):
        raise EmbeddingProviderError("Simulated API rate limit / gateway timeout failure")


class TestRAGIndexingPipeline:
    def test_full_indexing_pipeline(self):
        async def _test():
            indexer = DocumentIndexer(provider=MockEmbeddingProvider())

            pages = [
                DocumentPageInput(
                    page_id="page-geo-01",
                    page_number=1,
                    raw_text=(
                        "# EXECUTIVE SUMMARY & MINE LOCATION\n"
                        "The Rajmahal Coalfield is located in Jharkhand state. "
                        "Exploration carried out by CMPDI has delineated 1,250 MT of geological coal resources."
                    ),
                    document_id="doc-rajmahal-2026",
                    project_id="prj-rajmahal-001",
                    document_type="PDF"
                ),
                DocumentPageInput(
                    page_id="page-geo-02",
                    page_number=2,
                    raw_text=(
                        "## COAL SEAM CHARACTERISTICS\n"
                        "Primary seam identified is Seam III with average thickness of 14.2 meters. "
                        "Ash content ranges from 24.5% to 32.0% with gross calorific value of 4,800 kcal/kg."
                    ),
                    document_id="doc-rajmahal-2026",
                    project_id="prj-rajmahal-001",
                    document_type="PDF"
                )
            ]

            result = await indexer.index_document_pages(
                document_id="doc-rajmahal-2026",
                pages=pages,
                project_id="prj-rajmahal-001",
                document_type="PDF"
            )

            assert isinstance(result, IndexingResult)
            assert result.document_id == "doc-rajmahal-2026"
            assert result.status == "COMPLETED"
            assert result.total_pages_processed == 2
            assert result.total_chunks_indexed > 0
            assert result.replaced_old_chunks is True

            # Verify metadata attachment on chunks
            first_chunk = result.chunks[0]
            assert first_chunk.document_id == "doc-rajmahal-2026"
            assert first_chunk.project_id == "prj-rajmahal-001"
            assert first_chunk.document_type == "PDF"
            assert first_chunk.page_number in (1, 2)
            assert first_chunk.section_title in ("EXECUTIVE SUMMARY & MINE LOCATION", "COAL SEAM CHARACTERISTICS")
            assert len(first_chunk.embedding) == 1536

        asyncio.run(_test())

    def test_idempotent_chunk_replacement(self):
        async def _test():
            indexer = DocumentIndexer(provider=MockEmbeddingProvider())
            doc_id = "doc-idempotent-001"

            pages_initial = [
                DocumentPageInput(
                    page_id="p-1",
                    page_number=1,
                    raw_text="Initial version of document text for chunking.",
                    document_id=doc_id
                )
            ]

            # Initial indexing run
            res_1 = await indexer.index_document_pages(document_id=doc_id, pages=pages_initial)
            initial_chunk_count = res_1.total_chunks_indexed

            assert doc_id in IN_MEMORY_VECTOR_STORE
            assert len(IN_MEMORY_VECTOR_STORE[doc_id]) == initial_chunk_count

            # Second indexing run (reprocessing updated document text)
            pages_updated = [
                DocumentPageInput(
                    page_id="p-1",
                    page_number=1,
                    raw_text="Updated version of document text after re-scanning with OCR.",
                    document_id=doc_id
                )
            ]

            res_2 = await indexer.index_document_pages(document_id=doc_id, pages=pages_updated, idempotent_replace=True)

            # Ensure old chunks were replaced, not duplicated
            assert res_2.replaced_old_chunks is True
            assert len(IN_MEMORY_VECTOR_STORE[doc_id]) == res_2.total_chunks_indexed
            assert IN_MEMORY_VECTOR_STORE[doc_id][0].content.startswith("Updated version")

        asyncio.run(_test())

    def test_embedding_failure_handling(self):
        async def _test():
            failing_indexer = DocumentIndexer(provider=FailingEmbeddingProvider())

            pages = [
                DocumentPageInput(
                    page_id="p-fail-1",
                    page_number=1,
                    raw_text="Text to be embedded when provider fails.",
                    document_id="doc-fail-001"
                )
            ]

            with pytest.raises(EmbeddingProviderError):
                await failing_indexer.index_document_pages(document_id="doc-fail-001", pages=pages)

        asyncio.run(_test())
